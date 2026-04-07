import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, User as UserIcon, Banknote, CreditCard, ArrowUpRight, History, Wallet, RotateCcw, FileText } from 'lucide-react';
import { formatCurrency, cn } from '../../lib/utils';
import ClientSelect from './ClientSelect';

interface PaymentModalProps {
  isOpen: boolean;
  onClose: () => void;
  total: number;
  store: any;
  selectedClient: any;
  setSelectedClient: (client: any) => void;
  paymentStep: 'method' | 'details';
  setPaymentStep: (step: 'method' | 'details') => void;
  selectedMethod: string | null;
  setSelectedMethod: (method: string | null) => void;
  amountReceived: string;
  setAmountReceived: (amount: string) => void;
  cashAmount: string;
  setCashAmount: (amount: string) => void;
  cardAmount: string;
  setCardAmount: (amount: string) => void;
  transferAmount: string;
  setTransferAmount: (amount: string) => void;
  otherAmount: string;
  setOtherAmount: (amount: string) => void;
  creditAmount: string;
  setCreditAmount: (amount: string) => void;
  balanceAmount: string;
  setBalanceAmount: (amount: string) => void;
  totalWithoutTax: number;
  totalTax: number;
  totalDiscount: number;
  loading: boolean;
  onFinalize: (method: any, receivedAmount?: number) => void;
}

const PaymentModal: React.FC<PaymentModalProps> = ({
  isOpen,
  onClose,
  total,
  store,
  selectedClient,
  setSelectedClient,
  paymentStep,
  setPaymentStep,
  selectedMethod,
  setSelectedMethod,
  amountReceived,
  setAmountReceived,
  cashAmount,
  setCashAmount,
  cardAmount,
  setCardAmount,
  transferAmount,
  setTransferAmount,
  otherAmount,
  setOtherAmount,
  creditAmount,
  setCreditAmount,
  balanceAmount,
  setBalanceAmount,
  totalWithoutTax,
  totalTax,
  totalDiscount,
  loading,
  onFinalize
}) => {
  if (!isOpen) return null;

  const mixedTotalPaid = (parseFloat(cashAmount) || 0) + (parseFloat(cardAmount) || 0) + (parseFloat(transferAmount) || 0) + (parseFloat(balanceAmount) || 0) + (parseFloat(creditAmount) || 0);

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <motion.div 
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        exit={{ y: 20, opacity: 0 }}
        className="bg-white w-full max-w-4xl rounded-[2.5rem] p-10 shadow-2xl relative"
      >
        <button 
          onClick={onClose}
          className="absolute right-8 top-8 p-2 hover:bg-[#f5f5f5] rounded-full transition-colors"
        >
          <X size={24} />
        </button>

        <h2 className="text-3xl font-black mb-8 tracking-tight">
          {paymentStep === 'method' ? 'Finalizar Venda' : 'Detalhes do Pagamento'}
        </h2>

        <div className="grid grid-cols-1 gap-8">
          <div className="p-6 bg-[#f9f9f9] rounded-3xl border border-[#e5e5e5]  ">
            <div className="flex items-start justify-end gap-12">
            {!selectedClient && (
              <div className="flex-1 min-w-50 flex flex-col">
                
                <p className="text-xs font-bold text-muted-foreground uppercase tracking-widest mb-1">Selecionar Cliente (Opcional)</p>
                <ClientSelect 
                    selectedClient={selectedClient}
                    onSelect={setSelectedClient}
                />
              </div>)}
              <div className="flex flex-col justify-end ">
              <p className="text-xs font-bold text-muted-foreground uppercase tracking-widest mb-1">Total a Pagar</p>
              <p className="text-4xl font-black text-[#1a1a1a]">{formatCurrency(total, store?.currency)}</p>
              </div>
              
            </div>
            {selectedMethod && (
              <div className="text-right">
                <p className="text-xs font-bold text-muted-foreground uppercase tracking-widest mb-1">Método</p>
                <p className="text-xl font-bold text-[#1a1a1a]">
                  {selectedMethod === 'cash' ? 'Dinheiro' : 
                   selectedMethod === 'card' ? 'TPA / Cartão' :
                   selectedMethod === 'transfer' ? 'Transferência' :
                   selectedMethod === 'credit' ? 'Crédito (Fiado)' : 
                   selectedMethod === 'balance' ? 'Saldo' : 'Misto'}
                </p>
              </div>
            )}
          </div>

          {paymentStep === 'method' ? (
            <div className="space-y-2">
              <div className="space-y-4">
                
                {selectedClient && (
                  <div className="p-4 bg-blue-50/50 rounded-3xl border border-blue-100 flex items-center gap-4 relative group">
                    <div className="w-12 h-12 bg-blue-100 rounded-2xl flex items-center justify-center text-blue-600">
                      <UserIcon size={24} />
                    </div>
                    <div className="flex-1">
                      <p className="font-bold text-[#1a1a1a]">{selectedClient.name}</p>
                      <div className="flex gap-4 text-xs font-bold uppercase tracking-widest mt-1">
                        <span className='text-blue-600/80'>Saldo: {formatCurrency(selectedClient.balance)}</span>
                        <span className='text-red-600/80'>Dívida: {formatCurrency(selectedClient.debt)}</span>
                        <span className='text-green-600/80'>Limite: {formatCurrency(selectedClient.credit_limit)}</span>
                      </div>
                    </div>
                    <button 
                      onClick={() => setSelectedClient(null)}
                      className="absolute -top-2 -right-1 bg-white border border-[#e5e5e5] rounded-full p-1 shadow-sm opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      <X size={15} />
                    </button>
                  </div>
                )}
              </div>

              <div className="space-y-4">
                <p className="text-sm font-bold uppercase tracking-widest text-muted-foreground">Forma de Pagamento</p>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                  <button onClick={() => { setSelectedMethod('cash'); setPaymentStep('details'); }} className="flex flex-col items-center justify-center gap-3 p-6 rounded-3xl border-2 border-[#f0f0f0] hover:border-[#1a1a1a] hover:bg-[#fcfcfc] transition-all group">
                    <div className="p-3 bg-green-50 rounded-2xl text-green-600 group-hover:scale-110 transition-transform"><Banknote size={28} /></div>
                    <span className="font-bold">Dinheiro</span>
                  </button>
                  <button onClick={() => { setSelectedMethod('card'); setPaymentStep('details'); }} className="flex flex-col items-center justify-center gap-3 p-6 rounded-3xl border-2 border-[#f0f0f0] hover:border-[#1a1a1a] hover:bg-[#fcfcfc] transition-all group">
                    <div className="p-3 bg-blue-50 rounded-2xl text-blue-600 group-hover:scale-110 transition-transform"><CreditCard size={28} /></div>
                    <span className="font-bold">TPA / Cartão</span>
                  </button>
                  <button onClick={() => { setSelectedMethod('transfer'); setPaymentStep('details'); }} className="flex flex-col items-center justify-center gap-3 p-6 rounded-3xl border-2 border-[#f0f0f0] hover:border-[#1a1a1a] hover:bg-[#fcfcfc] transition-all group">
                    <div className="p-3 bg-indigo-50 rounded-2xl text-indigo-600 group-hover:scale-110 transition-transform"><ArrowUpRight size={28} /></div>
                    <span className="font-bold">Transferência</span>
                  </button>
                  <button 
                    onClick={() => { if (!selectedClient) return; setSelectedMethod('credit'); setPaymentStep('details'); }}
                    className={cn("flex flex-col items-center justify-center gap-3 p-6 rounded-3xl border-2 transition-all group", !selectedClient ? "opacity-50 cursor-not-allowed border-[#f0f0f0] bg-gray-50" : "border-[#f0f0f0] hover:border-[#1a1a1a] hover:bg-[#fcfcfc]")}
                  >
                    <div className={cn("p-3 rounded-2xl transition-transform group-hover:scale-110", !selectedClient ? "bg-gray-100 text-gray-400" : "bg-orange-50 text-orange-600")}><History size={28} /></div>
                    <span className="font-bold">Crédito (Fiado)</span>
                  </button>
                  <button 
                    onClick={() => { if (!selectedClient) return; setSelectedMethod('balance'); setPaymentStep('details'); }}
                    className={cn("flex flex-col items-center justify-center gap-3 p-6 rounded-3xl border-2 transition-all group", !selectedClient ? "opacity-50 cursor-not-allowed border-[#f0f0f0] bg-gray-50" : "border-[#f0f0f0] hover:border-[#1a1a1a] hover:bg-[#fcfcfc]")}
                  >
                    <div className={cn("p-3 rounded-2xl transition-transform group-hover:scale-110", !selectedClient ? "bg-gray-100 text-gray-400" : "bg-teal-50 text-teal-600")}><Wallet size={28} /></div>
                    <span className="font-bold">Usar Saldo</span>
                  </button>
                  <button onClick={() => { setSelectedMethod('mixed'); setPaymentStep('details'); }} className="flex flex-col items-center justify-center gap-3 p-6 rounded-3xl border-2 border-[#f0f0f0] hover:border-[#1a1a1a] hover:bg-[#fcfcfc] transition-all group">
                    <div className="p-3 bg-gray-50 rounded-2xl text-gray-600 group-hover:scale-110 transition-transform"><RotateCcw size={28} /></div>
                    <span className="font-bold">Misto</span>
                  </button>
                </div>
              </div>

              <div className="flex gap-3">
                <button onClick={() => onFinalize('proforma')} className="flex-1 flex items-center justify-center gap-2 p-4 rounded-2xl border-2 border-indigo-100 text-indigo-600 hover:bg-indigo-50 transition-all font-bold">
                  <FileText size={20} /> Fatura Proforma
                </button>
              </div>
            </div>
          ) : (
            <div className="space-y-8">
              {selectedMethod === 'cash' && (
                <div className="space-y-6">
                  <div className="grid grid-cols-2 gap-6">
                    <div>
                      <label className="block text-sm font-bold mb-2 uppercase tracking-widest text-muted-foreground">Valor Recebido</label>
                      <div className="relative">
                        <Banknote className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground" size={24} />
                        <input
                          type="number"
                          step="0.01"
                          className="w-full pl-12 pr-4 py-4 bg-[#f5f5f5] border-none rounded-2xl text-2xl font-black outline-none focus:ring-2 focus:ring-[#1a1a1a]/10"
                          placeholder="0.00"
                          value={amountReceived}
                          onChange={(e) => setAmountReceived(e.target.value)}
                          autoFocus
                        />
                      </div>
                    </div>
                    <div className="p-6 bg-green-50 rounded-3xl border border-green-100 flex flex-col justify-center">
                      <p className="text-xs font-bold text-green-600 uppercase tracking-widest mb-1">Troco a Devolver</p>
                      <p className="text-3xl font-black text-green-700">
                        {formatCurrency(Math.max(0, (parseFloat(amountReceived) || 0) - total), store?.currency)}
                      </p>
                    </div>
                  </div>
                  <div className="grid grid-cols-3 gap-4">
                    <div className="p-4 bg-white border border-[#e5e5e5] rounded-2xl">
                      <p className="text-[10px] font-bold text-muted-foreground uppercase mb-1">Subtotal</p>
                      <p className="font-bold">{formatCurrency(totalWithoutTax, store?.currency)}</p>
                    </div>
                    <div className="p-4 bg-white border border-[#e5e5e5] rounded-2xl">
                      <p className="text-[10px] font-bold text-muted-foreground uppercase mb-1">IVA</p>
                      <p className="font-bold">{formatCurrency(totalTax, store?.currency)}</p>
                    </div>
                    <div className="p-4 bg-white border border-[#e5e5e5] rounded-2xl">
                      <p className="text-[10px] font-bold text-muted-foreground uppercase mb-1">Desconto</p>
                      <p className="font-bold text-red-600">-{formatCurrency(totalDiscount, store?.currency)}</p>
                    </div>
                  </div>
                </div>
              )}

              {(selectedMethod === 'credit' || selectedMethod === 'balance') && selectedClient && (
                <div className="p-8 bg-blue-50 rounded-[2rem] border border-blue-100 space-y-6">
                  <div className="flex items-center gap-4">
                    <div className="w-16 h-16 bg-blue-100 rounded-2xl flex items-center justify-center text-blue-600"><UserIcon size={32} /></div>
                    <div>
                      <h4 className="text-xl font-black text-[#1a1a1a]">{selectedClient.name}</h4>
                      <p className="text-sm text-blue-600 font-medium">{selectedMethod === 'balance' ? 'Pagamento via Saldo em Conta' : 'Venda a Crédito (Fiado)'}</p>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4 pt-4 border-t border-blue-200/50">
                    <div>
                      <p className="text-[10px] font-bold text-blue-600/60 uppercase tracking-widest mb-1">{selectedMethod === 'balance' ? 'Saldo Atual' : 'Dívida Atual'}</p>
                      <p className="text-xl font-bold text-[#1a1a1a]">{selectedMethod === 'balance' ? formatCurrency(selectedClient.balance, store?.currency) : formatCurrency(selectedClient.debt, store?.currency)}</p>
                    </div>
                    <div>
                      <p className="text-[10px] font-bold text-blue-600/60 uppercase tracking-widest mb-1">Após Venda</p>
                      <p className={cn("text-xl font-bold", selectedMethod === 'balance' ? (selectedClient.balance - total >= 0 ? "text-green-600" : "text-red-600") : (selectedClient.debt + total > selectedClient.credit_limit ? "text-red-600" : "text-orange-600"))}>
                        {selectedMethod === 'balance' ? formatCurrency(selectedClient.balance - total, store?.currency) : formatCurrency(selectedClient.debt + total, store?.currency)}
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {selectedMethod === 'mixed' && (
                <div className="space-y-6">
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                    <div><label className="block text-[10px] font-black mb-1 text-muted-foreground uppercase tracking-widest">Numerário</label><input type="number" className="w-full p-4 bg-[#f5f5f5] border-none rounded-2xl font-bold outline-none" placeholder="0.00" value={cashAmount} onChange={(e) => setCashAmount(e.target.value)} /></div>
                    <div><label className="block text-[10px] font-black mb-1 text-muted-foreground uppercase tracking-widest">TPA (Cartão)</label><input type="number" className="w-full p-4 bg-[#f5f5f5] border-none rounded-2xl font-bold outline-none" placeholder="0.00" value={cardAmount} onChange={(e) => setCardAmount(e.target.value)} /></div>
                    <div><label className="block text-[10px] font-black mb-1 text-muted-foreground uppercase tracking-widest">Transferência</label><input type="number" className="w-full p-4 bg-[#f5f5f5] border-none rounded-2xl font-bold outline-none" placeholder="0.00" value={transferAmount} onChange={(e) => setTransferAmount(e.target.value)} /></div>
                    {selectedClient && (
                      <>
                        <div><label className="block text-[10px] font-black mb-1 text-muted-foreground uppercase tracking-widest">Saldo Conta</label><input type="number" className="w-full p-4 bg-[#f5f5f5] border-none rounded-2xl font-bold outline-none" placeholder="0.00" value={balanceAmount} onChange={(e) => setBalanceAmount(e.target.value)} /></div>
                        <div><label className="block text-[10px] font-black mb-1 text-muted-foreground uppercase tracking-widest">Crédito (Fiado)</label><input type="number" className="w-full p-4 bg-[#f5f5f5] border-none rounded-2xl font-bold outline-none" placeholder="0.00" value={creditAmount} onChange={(e) => setCreditAmount(e.target.value)} /></div>
                      </>
                    )}
                  </div>
                  <div className="p-6 bg-slate-50 rounded-3xl border border-slate-100 flex items-center justify-between">
                    <div><p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1">Total Pago</p><p className={cn("text-3xl font-black", mixedTotalPaid >= total ? "text-green-600" : "text-red-600")}>{formatCurrency(mixedTotalPaid, store?.currency)}</p></div>
                    <div className="text-right"><p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1">Faltam</p><p className="text-xl font-bold text-[#1a1a1a]">{formatCurrency(Math.max(0, total - mixedTotalPaid), store?.currency)}</p></div>
                  </div>
                </div>
              )}

              {(selectedMethod === 'card' || selectedMethod === 'transfer') && (
                <div className="p-12 text-center space-y-6">
                  <div className="w-24 h-24 bg-indigo-50 rounded-full flex items-center justify-center mx-auto text-indigo-600 animate-pulse">{selectedMethod === 'card' ? <CreditCard size={48} /> : <ArrowUpRight size={48} />}</div>
                  <div className="space-y-2">
                    <h4 className="text-2xl font-black text-[#1a1a1a]">{selectedMethod === 'card' ? 'Faça as Suas Operações no TPA' : 'Aguardando Transferência'}</h4>
                    <p className="text-muted-foreground font-medium max-w-xs mx-auto">{selectedMethod === 'card' ? 'Por favor, processe o pagamento no terminal de cartões e confirme quando terminar.' : 'Por favor, realize a transferência bancária e confirme após a conclusão.'}</p>
                  </div>
                  <div className="p-4 bg-[#f9f9f9] rounded-2xl border border-[#e5e5e5] inline-block">
                    <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest mb-1">Valor a Confirmar</p>
                    <p className="text-2xl font-black text-[#1a1a1a]">{formatCurrency(total, store?.currency)}</p>
                  </div>
                </div>
              )}

              <div className="flex gap-4">
                <button onClick={() => setPaymentStep('method')} className="flex-1 py-4 rounded-2xl border-2 border-[#e5e5e5] font-bold hover:bg-[#f5f5f5] transition-all">Voltar</button>
                <button 
                  onClick={() => onFinalize(selectedMethod)}
                  disabled={loading}
                  className="flex-[2] bg-[#1a1a1a] text-white py-4 rounded-2xl font-black text-lg shadow-xl shadow-black/10 hover:scale-[1.02] active:scale-[0.98] transition-all disabled:opacity-50"
                >
                  {loading ? "Processando..." : "Confirmar e Finalizar"}
                </button>
              </div>
            </div>
          )}
        </div>
      </motion.div>
    </div>
  );
};

export default PaymentModal;
