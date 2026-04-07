import React, { useState, useRef, useEffect } from 'react';
import { 
  Search, 
  Barcode,
  Wallet,
  CheckCircle2,
  FileText
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { formatCurrency } from '../lib/utils';
import { Toaster } from 'sonner';

// Hooks
import { usePOS } from '../hooks/usePOS';
import { usePOSSession } from '../hooks/usePOSSession';
import { usePOSSale } from '../hooks/usePOSSale';

// Components
import ProductGrid from '../components/pos/ProductGrid';
import Cart from '../components/pos/Cart';
import PaymentModal from '../components/pos/PaymentModal';
import SuccessModal from '../components/pos/SuccessModal';
import { OpeningSessionModal, ClosingSessionModal, CashMovementModal } from '../components/pos/SessionModals';

interface POSProps {
  setActiveTab: (tab: string) => void;
}

const POS: React.FC<POSProps> = ({ setActiveTab }) => {
  const { session, user, store, setSession, pendingExchange, setPendingExchange } = useAuth();
  
  // Core POS Logic Hook
  const pos = usePOS(store);
  
  // Session Logic Hook
  const sessionLogic = usePOSSession(user, store, session, setSession);
  
  // Sale Logic Hook
  const saleLogic = usePOSSale(
    session,
    user,
    store,
    pos.cart,
    pos.selectedClient,
    pos.cartTotal - (pendingExchange?.total_credit || 0),
    pos.totalWithoutTax,
    pos.totalTax,
    pos.totalDiscount,
    pendingExchange,
    setPendingExchange,
    pos.setCart,
    pos.setSelectedClient,
    pos.refreshProducts
  );

  // Local UI State
  const [paymentModalOpen,  setPaymentModalOpen] = useState(false);
  const [paymentStep, setPaymentStep] = useState<'method' | 'details'>('method');
  const [selectedMethod, setSelectedMethod] = useState<string | null>(null);
  const [amountReceived, setAmountReceived] = useState('');
  const [cashAmount, setCashAmount] = useState('');
  const [cardAmount, setCardAmount] = useState('');
  const [transferAmount, setTransferAmount] = useState('');
  const [otherAmount, setOtherAmount] = useState('');
  const [creditAmount, setCreditAmount] = useState('');
  const [balanceAmount, setBalanceAmount] = useState('');
  
  const [openingModal, setOpeningModal] = useState(false);
  const [closingModal, setClosingModal] = useState(false);
  const [movementModal, setMovementModal] = useState(false);

  const searchInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!session) setOpeningModal(true);
  }, [session]);

  const handleFinalize = (method: any) => {
    saleLogic.finalizeSale(method, {
      receivedAmount: parseFloat(amountReceived),
      cashAmount,
      cardAmount,
      transferAmount,
      otherAmount,
      creditAmount,
      balanceAmount
    }).then(() => {
      // Reset local payment state on success (handled inside finalizeSale mostly, but UI state here)
      if (!saleLogic.loading) {
        setPaymentStep('method');
        setSelectedMethod(null);
        setAmountReceived('');
        setCashAmount('');
        setCardAmount('');
        setTransferAmount('');
        setOtherAmount('');
        setCreditAmount('');
        setBalanceAmount('');
      }
    });
  };

  const filteredProducts = pos.products.filter(p => {
    if (!pos.search) return p.is_favorite === 1;
    return (p.name || '').toLowerCase().includes(pos.search.toLowerCase()) || p.barcode?.includes(pos.search);
  });

  if (!session && !openingModal) {
    return (
      <div className="h-full flex items-center justify-center bg-[#f5f5f5]">
        <div className="flex flex-col items-center gap-4">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#1a1a1a]"></div>
          <p className="text-muted-foreground font-medium">A carregar sessão...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-[calc(100vh-3rem)] flex flex-col gap-6 ">
      <Toaster position="top-right" richColors />

      {/* Área Principal: Produtos e Carrinho */}
      <div className="flex-1 flex gap-6 overflow-hidden">
        
        {/* Coluna Esquerda: Seleção de Produtos */}
        <div className="flex-1 flex flex-col gap-6 overflow-hidden">
          <div className="flex items-center gap-4 shrink-0">
            <div className="relative flex-1">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground" size={20} />
              <input
                ref={searchInputRef}
                type="text"
                placeholder="Pesquisar produto ou ler código de barras..."
                className="w-full pl-12 pr-4 py-4 bg-white border border-[#e5e5e5] rounded-2xl shadow-sm outline-none focus:ring-2 focus:ring-[#1a1a1a]/10 transition-all"
                value={pos.search}
                onChange={(e) => pos.setSearch(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') pos.handleBarcodeSearch(pos.search);
                  if (e.key === 'F1') { e.preventDefault(); searchInputRef.current?.focus(); }
                }}
              />
              <div className="absolute right-4 top-1/2 -translate-y-1/2 flex items-center gap-2 text-xs font-medium text-muted-foreground bg-[#f5f5f5] px-2 py-1 rounded-lg">
                <Barcode size={14} /> F1
              </div>
            </div>
            
            <div className="flex items-center gap-2">
              <button 
                onClick={() => setMovementModal(true)}
                className="p-4 bg-white border border-[#e5e5e5] rounded-2xl shadow-sm hover:bg-[#f9f9f9] transition-all flex items-center gap-2 font-bold text-sm"
              >
                <Wallet size={20} className="text-blue-600" />
                <span className="hidden xl:inline">Movimentos</span>
              </button>
              <button 
                onClick={() => sessionLogic.fetchSessionSummary().then(() => setClosingModal(true))}
                className="p-4 bg-white border border-[#e5e5e5] rounded-2xl shadow-sm hover:bg-[#f9f9f9] transition-all flex items-center gap-2 font-bold text-sm"
              >
                <CheckCircle2 size={20} className="text-red-600" />
                <span className="hidden xl:inline">Fechar Caixa</span>
              </button>
            </div>
          </div>

          <ProductGrid 
            products={filteredProducts}
            taxes={pos.taxes}
            store={store}
            onAddToCart={pos.addToCart}
          />
        </div>

        {/* Coluna Direita: Carrinho */}
        <div className="w-[400px] flex flex-col shrink-0 overflow-hidden ">
          <Cart 
            cart={pos.cart}
            selectedClient={pos.selectedClient}
            setSelectedClient={pos.setSelectedClient}
            pendingExchange={pendingExchange}
            setPendingExchange={setPendingExchange}
            updateQuantity={pos.updateQuantity}
            updateUnit={pos.updateUnit}
            updateDiscount={pos.updateDiscount}
            setCart={pos.setCart}
            productUnits={pos.productUnits}
            units={pos.units}
            store={store}
          />
        </div>
      </div>

      {/* Rodapé: Totais e Finalização */}
      <div className="p-6 flex flex-col md:flex-row items-center justify-between bg-white border border-[#e5e5e5] rounded-3xl shadow-xl gap-6 shrink-0">
        <div className="flex flex-wrap items-center gap-8 flex-1">
          <div className="flex flex-col">
            <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Subtotal Bruto</span>
            <span className="font-bold text-sm">{formatCurrency(pos.cartTotal + pos.totalDiscount, store?.currency)}</span>
          </div>
          
          {pos.totalDiscount > 0 && (
            <div className="flex flex-col">
              <span className="text-[10px] font-bold text-red-500 uppercase tracking-widest">Desconto Total</span>
              <span className="font-bold text-sm text-red-500">-{formatCurrency(pos.totalDiscount, store?.currency)}</span>
            </div>
          )}

          {store?.uses_tax && (
            <div className="flex flex-col">
              <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Impostos (IVA)</span>
              <span className="font-bold text-sm">{formatCurrency(pos.totalTax, store?.currency)}</span>
            </div>
          )}

          <div className="h-10 w-px bg-gray-200 hidden md:block" />

          <div className="flex flex-col">
            <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Total Líquido</span>
            <span className="font-black text-3xl text-[#1a1a1a]">
              {formatCurrency(Math.max(0, pos.cartTotal - (pendingExchange?.total_credit || 0)), store?.currency)}
            </span>
          </div>
          
        </div>

        <button
          disabled={pos.cart.length === 0}
          onClick={() => setPaymentModalOpen(true)}
          className="w-full md:w-[300px] bg-[#1a1a1a] text-white py-5 rounded-2xl font-bold text-xl shadow-lg hover:scale-[1.02] active:scale-[0.98] transition-all disabled:opacity-50"
        >
          Finalizar Venda
        </button>
      </div>

      {/* Modals */}
      <OpeningSessionModal 
        isOpen={openingModal}
         
          
        openingBalance={sessionLogic.openingBalance}
        setOpeningBalance={sessionLogic.setOpeningBalance}
        onOpen={(e) => sessionLogic.handleOpenSession(e).then(success => success && setOpeningModal(false))}
        onClose={() => setActiveTab('dashboard')}
      />

      <ClosingSessionModal 
        isOpen={closingModal}
        onClose={() => setClosingModal(false)}
        sessionSummary={sessionLogic.sessionSummary}
        countedBalance={sessionLogic.countedBalance}
        setCountedBalance={sessionLogic.setCountedBalance}
        justification={sessionLogic.justification}
        setJustification={sessionLogic.setJustification}
        onCloseSession={(e) => sessionLogic.handleCloseSession(e).then(success => {
          if (success) {
            setClosingModal(false);
            setActiveTab('sales');
          }
        })}
        store={store}
      />

      <CashMovementModal 
        isOpen={movementModal}
        onClose={() => setMovementModal(false)}
        type={sessionLogic.movementType}
        setType={sessionLogic.setMovementType}
        amount={sessionLogic.movementAmount}
        setAmount={sessionLogic.setMovementAmount}
        description={sessionLogic.movementDescription}
        setDescription={sessionLogic.setMovementDescription}
        onAdd={(e) => sessionLogic.handleAddMovement(e).then(success => success && setMovementModal(false))}
      />

      <PaymentModal 
      
        isOpen={paymentModalOpen}
        onClose={() => { setPaymentModalOpen(false); setPaymentStep('method'); setSelectedMethod(null); }}
        total={Math.max(0, pos.cartTotal - (pendingExchange?.total_credit || 0))}
        store={store}
        selectedClient={pos.selectedClient}
        setSelectedClient={pos.setSelectedClient}
        paymentStep={paymentStep}
        setPaymentStep={setPaymentStep}
        selectedMethod={selectedMethod}
        setSelectedMethod={setSelectedMethod}
        amountReceived={amountReceived}
        setAmountReceived={setAmountReceived}
        cashAmount={cashAmount}
        setCashAmount={setCashAmount}
        cardAmount={cardAmount}
        setCardAmount={setCardAmount}
        transferAmount={transferAmount}
        setTransferAmount={setTransferAmount}
        otherAmount={otherAmount}
        setOtherAmount={setOtherAmount}
        creditAmount={creditAmount}
        setCreditAmount={setCreditAmount}
        balanceAmount={balanceAmount}
        setBalanceAmount={setBalanceAmount}
        totalWithoutTax={pos.totalWithoutTax}
        totalTax={pos.totalTax}
        totalDiscount={pos.totalDiscount}
        loading={saleLogic.loading}
        onFinalize={handleFinalize}
      />

      <SuccessModal 
        isOpen={saleLogic.successModal}
        onClose={() => saleLogic.setSuccessModal(false)}
        lastSaleData={saleLogic.lastSaleData}
      />
    </div>
  );
};

export default POS;
