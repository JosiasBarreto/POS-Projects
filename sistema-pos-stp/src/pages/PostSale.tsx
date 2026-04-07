import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { 
  Search, 
  RotateCcw, 
  ArrowRight, 
  Calendar, 
  User as UserIcon, 
  Receipt, 
  AlertCircle,
  CheckCircle2,
  X,
  Plus,
  Minus,
  MessageSquare
} from 'lucide-react';
import { format } from 'date-fns';
import { pt } from 'date-fns/locale';
import { toast } from 'sonner';
import { Sale, SaleItem, Return } from '../types';

interface PostSaleProps {
  setActiveTab: (tab: string) => void;
}

const PostSale: React.FC<PostSaleProps> = ({ setActiveTab }) => {
  const { user, session, store, setPendingExchange } = useAuth();
  const [searchId, setSearchId] = useState('');
  const [search, setSearch] = useState('');
  const [sales, setSales] = useState<Sale[]>([]);
  const [returns, setReturns] = useState<Return[]>([]);
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTabLocal] = useState<'sales' | 'returns'>('sales');
  
  // Modal state
  const [selectedSale, setSelectedSale] = useState<any>(null);
  const [returnItems, setReturnItems] = useState<any[]>([]);
  const [returnReason, setReturnReason] = useState('');
  const [isReturnModalOpen, setIsReturnModalOpen] = useState(false);

  useEffect(() => {
    fetchSales();
    fetchReturns();
  }, []);

  const fetchSales = async () => {
    try {
      const res = await fetch('/api/sales/history');
      const data = await res.json();
      setSales(Array.isArray(data) ? data : []);
    } catch (err) {
      toast.error('Erro ao carregar vendas');
      setSales([]);
    }
  };

  const fetchReturns = async () => {
    try {
      const res = await fetch('/api/returns');
      const data = await res.json();
      setReturns(Array.isArray(data) ? data : []);
    } catch (err) {
      toast.error('Erro ao carregar devoluções');
      setReturns([]);
    }
  };

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchId) return;
    
    setLoading(true);
    try {
      const res = await fetch(`/api/sales/${searchId}`);
      if (res.ok) {
        const data = await res.json();
        openReturnModal(data);
      } else {
        toast.error('Venda não encontrada');
      }
    } catch (err) {
      toast.error('Erro ao procurar venda');
    } finally {
      setLoading(false);
    }
  };

  const openReturnModal = (sale: any) => {
    setSelectedSale(sale);
    // Initialize return items with 0 quantity
    const items = sale.items.map((item: any) => ({
      ...item,
      returnQuantity: 0,
      maxReturn: item.quantity - (sale.returnedMap[item.product_id] || 0)
    }));
    setReturnItems(items);
    setReturnReason('');
    setIsReturnModalOpen(true);
  };

  const updateReturnQuantity = (productId: number, delta: number) => {
    setReturnItems(prev => prev.map(item => {
      if (item.product_id === productId) {
        const newQty = Math.max(0, Math.min(item.maxReturn, item.returnQuantity + delta));
        return { ...item, returnQuantity: newQty };
      }
      return item;
    }));
  };

  const handleProcessReturn = async (isExchange: boolean = false) => {
    const itemsToReturn = returnItems.filter(item => item.returnQuantity > 0);
    
    if (itemsToReturn.length === 0) {
      toast.error('Selecione pelo menos um item para devolver');
      return;
    }

    if (!returnReason.trim()) {
      toast.error('O motivo da devolução é obrigatório');
      return;
    }

    if (!session) {
      toast.error('É necessário ter um caixa aberto para processar devoluções');
      return;
    }

    setLoading(true);
    try {
      const totalReturn = calculateTotalReturn();
      const res = await fetch('/api/returns', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sale_id: selectedSale.id,
          user_id: user?.id,
          session_id: session.id,
          reason: isExchange ? `Troca: ${returnReason}` : returnReason,
          items: itemsToReturn.map(item => ({
            product_id: item.product_id,
            quantity: item.returnQuantity,
            price: item.price
          }))
        })
      });

      if (res.ok) {
        toast.success(isExchange ? 'Devolução para troca processada!' : 'Devolução processada com sucesso');
        setIsReturnModalOpen(false);
        
        if (isExchange) {
          setPendingExchange({
            sale_id: selectedSale.id,
            total_credit: totalReturn
          });
          setActiveTab('pos');
        } else {
          fetchReturns();
          fetchSales();
        }
      } else {
        const data = await res.json();
        toast.error(data.error || 'Erro ao processar devolução');
      }
    } catch (err) {
      toast.error('Erro ao conectar ao servidor');
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-ST', {
      style: 'currency',
      currency: store?.currency || 'STN'
    }).format(value);
  };

  const calculateTotalReturn = () => {
    return returnItems.reduce((sum, item) => sum + (item.returnQuantity * item.price), 0);
  };

  const filteredSales = sales.filter(sale => 
    sale.id.toString().includes(search) || 
    (sale.client_name || '').toLowerCase().includes(search.toLowerCase()) ||
    (sale.user_name || '').toLowerCase().includes(search.toLowerCase())
  );

  const filteredReturns = returns.filter(ret => 
    ret.id.toString().includes(search) || 
    ret.sale_id.toString().includes(search) ||
    (ret.user_name || '').toLowerCase().includes(search.toLowerCase()) ||
    (ret.reason || '').toLowerCase().includes(search.toLowerCase())
  );

  if (!user) return null;

  return (
    <div className="space-y-8">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-black tracking-tight">Módulo Pós-Venda</h1>
          <p className="text-muted-foreground mt-1">Gestão de devoluções, trocas e anulações</p>
        </div>
        
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" size={18} />
            <input
              type="text"
              placeholder="Pesquisar na lista..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-10 pr-4 py-3 bg-white border border-[#e5e5e5] rounded-xl outline-none focus:ring-2 focus:ring-[#1a1a1a]/10 w-full sm:w-64 transition-all"
            />
          </div>

          <form onSubmit={handleSearch} className="flex gap-2">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" size={18} />
              <input
                type="text"
                placeholder="Nº da Venda (ID)..."
                value={searchId}
                onChange={(e) => setSearchId(e.target.value)}
                className="pl-10 pr-4 py-3 bg-white border border-[#e5e5e5] rounded-xl outline-none focus:ring-2 focus:ring-[#1a1a1a]/10 w-full sm:w-48 transition-all"
              />
            </div>
            <button 
              type="submit"
              disabled={loading}
              className="bg-[#1a1a1a] text-white px-6 py-3 rounded-xl font-bold hover:scale-[1.02] active:scale-[0.98] transition-all disabled:opacity-50 whitespace-nowrap"
            >
              Localizar
            </button>
          </form>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 p-1 bg-[#e5e5e5]/50 rounded-2xl w-fit">
        <button
          onClick={() => setActiveTabLocal('sales')}
          className={`px-6 py-2.5 rounded-xl font-bold transition-all ${
            activeTab === 'sales' ? 'bg-white shadow-sm' : 'text-muted-foreground hover:text-[#1a1a1a]'
          }`}
        >
          Vendas Recentes
        </button>
        <button
          onClick={() => setActiveTabLocal('returns')}
          className={`px-6 py-2.5 rounded-xl font-bold transition-all ${
            activeTab === 'returns' ? 'bg-white shadow-sm' : 'text-muted-foreground hover:text-[#1a1a1a]'
          }`}
        >
          Histórico de Devoluções
        </button>
      </div>

      {activeTab === 'sales' ? (
        <div className="bg-white rounded-[2rem] border border-[#e5e5e5] overflow-hidden shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-[#f9f9f9] border-b border-[#e5e5e5]">
                  <th className="px-6 py-4 font-bold text-sm">ID</th>
                  <th className="px-6 py-4 font-bold text-sm">Data</th>
                  <th className="px-6 py-4 font-bold text-sm">Cliente</th>
                  <th className="px-6 py-4 font-bold text-sm">Total</th>
                  <th className="px-6 py-4 font-bold text-sm">Pagamento</th>
                  <th className="px-6 py-4 font-bold text-sm text-right">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#e5e5e5]">
                {filteredSales.map((sale) => (
                  <tr key={sale.id} className="hover:bg-[#fcfcfc] transition-colors">
                    <td className="px-6 py-4 font-mono font-bold text-sm">#{sale.id}</td>
                    <td className="px-6 py-4 text-sm text-muted-foreground">
                      {sale.created_at ? format(new Date(sale.created_at), 'dd MMM yyyy, HH:mm', { locale: pt }) : '-'}
                    </td>
                    <td className="px-6 py-4 text-sm font-medium">{sale.client_name || 'Consumidor Final'}</td>
                    <td className="px-6 py-4 font-bold">{formatCurrency(sale.total)}</td>
                    <td className="px-6 py-4">
                      <span className="px-3 py-1 bg-[#f0f0f0] rounded-full text-[10px] font-black uppercase tracking-wider">
                        {sale.payment_method}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <button 
                        onClick={() => {
                          setLoading(true);
                          fetch(`/api/sales/${sale.id}`)
                            .then(res => res.json())
                            .then(data => {
                              openReturnModal(data);
                              setLoading(false);
                            })
                            .catch(() => {
                              toast.error('Erro ao carregar detalhes da venda');
                              setLoading(false);
                            });
                        }}
                        className="p-2 text-[#1a1a1a] hover:bg-[#f0f0f0] rounded-lg transition-colors inline-flex items-center gap-2 font-bold text-sm"
                      >
                        <RotateCcw size={16} />
                        Devolver
                      </button>
                    </td>
                  </tr>
                ))}
                {sales.length === 0 && (
                  <tr>
                    <td colSpan={6} className="px-6 py-12 text-center text-muted-foreground">
                      Nenhuma venda encontrada.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        <div className="bg-white rounded-[2rem] border border-[#e5e5e5] overflow-hidden shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-[#f9f9f9] border-b border-[#e5e5e5]">
                  <th className="px-6 py-4 font-bold text-sm">ID</th>
                  <th className="px-6 py-4 font-bold text-sm">Data</th>
                  <th className="px-6 py-4 font-bold text-sm">Venda Orig.</th>
                  <th className="px-6 py-4 font-bold text-sm">Operador</th>
                  <th className="px-6 py-4 font-bold text-sm">Valor Devolvido</th>
                  <th className="px-6 py-4 font-bold text-sm">Motivo</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#e5e5e5]">
                {filteredReturns.map((ret) => (
                  <tr key={ret.id} className="hover:bg-[#fcfcfc] transition-colors">
                    <td className="px-6 py-4 font-mono font-bold text-sm">#{ret.id}</td>
                    <td className="px-6 py-4 text-sm text-muted-foreground">
                      {ret.created_at ? format(new Date(ret.created_at), 'dd MMM yyyy, HH:mm', { locale: pt }) : '-'}
                    </td>
                    <td className="px-6 py-4 font-mono font-bold text-sm text-muted-foreground">#{ret.sale_id}</td>
                    <td className="px-6 py-4 text-sm font-medium">{ret.user_name}</td>
                    <td className="px-6 py-4 font-bold text-red-600">
                      -{formatCurrency(ret.total_amount)}
                    </td>
                    <td className="px-6 py-4 text-sm text-muted-foreground italic">
                      "{ret.reason}"
                    </td>
                  </tr>
                ))}
                {returns.length === 0 && (
                  <tr>
                    <td colSpan={6} className="px-6 py-12 text-center text-muted-foreground">
                      Nenhuma devolução registada.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Return Modal */}
      {isReturnModalOpen && selectedSale && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-[2.5rem] w-full max-w-3xl max-h-[90vh] overflow-hidden flex flex-col shadow-2xl">
            <div className="p-8 border-b border-[#e5e5e5] flex items-center justify-between bg-[#fcfcfc]">
              <div>
                <h2 className="text-2xl font-black tracking-tight">Processar Devolução</h2>
                <p className="text-muted-foreground text-sm">Venda #{selectedSale.id} • {selectedSale.client_name || 'Consumidor Final'}</p>
              </div>
              <button 
                onClick={() => setIsReturnModalOpen(false)}
                className="p-2 hover:bg-[#f0f0f0] rounded-full transition-colors"
              >
                <X size={24} />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-8 space-y-8">
              <div className="space-y-4">
                <h3 className="font-bold text-sm uppercase tracking-widest text-muted-foreground">Itens da Venda</h3>
                <div className="space-y-3">
                  {returnItems.map((item) => (
                    <div key={item.product_id} className="flex items-center justify-between p-4 bg-[#f9f9f9] rounded-2xl border border-[#e5e5e5]">
                      <div className="flex-1 min-w-0">
                        <p className="font-bold truncate">{item.product_name}</p>
                        <p className="text-xs text-muted-foreground">
                          {formatCurrency(item.price)} • 
                          Disponível para devolução: <span className="font-bold text-[#1a1a1a]">{item.maxReturn}</span>
                        </p>
                      </div>
                      
                      <div className="flex items-center gap-4 ml-4">
                        <div className="flex items-center gap-3 bg-white border border-[#e5e5e5] rounded-xl p-1">
                          <button 
                            onClick={() => updateReturnQuantity(item.product_id, -1)}
                            disabled={item.returnQuantity <= 0}
                            className="p-1.5 hover:bg-[#f0f0f0] rounded-lg transition-colors disabled:opacity-30"
                          >
                            <Minus size={16} />
                          </button>
                          <span className="w-8 text-center font-black text-lg">{item.returnQuantity}</span>
                          <button 
                            onClick={() => updateReturnQuantity(item.product_id, 1)}
                            disabled={item.returnQuantity >= item.maxReturn}
                            className="p-1.5 hover:bg-[#f0f0f0] rounded-lg transition-colors disabled:opacity-30"
                          >
                            <Plus size={16} />
                          </button>
                        </div>
                        <div className="w-24 text-right">
                          <p className="font-black">
                            {formatCurrency(item.returnQuantity * item.price)}
                          </p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="space-y-4">
                <h3 className="font-bold text-sm uppercase tracking-widest text-muted-foreground">Motivo da Devolução</h3>
                <div className="relative">
                  <MessageSquare className="absolute left-4 top-4 text-muted-foreground" size={20} />
                  <textarea
                    required
                    placeholder="Descreva o motivo da devolução..."
                    value={returnReason}
                    onChange={(e) => setReturnReason(e.target.value)}
                    className="w-full p-4 pl-12 bg-[#f9f9f9] border border-[#e5e5e5] rounded-2xl outline-none focus:ring-2 focus:ring-[#1a1a1a]/10 min-h-[100px] transition-all"
                  />
                </div>
              </div>
            </div>

            <div className="p-8 bg-[#fcfcfc] border-t border-[#e5e5e5] flex items-center justify-between">
              <div>
                <p className="text-xs text-muted-foreground uppercase font-bold tracking-widest">Total a Devolver</p>
                <p className="text-3xl font-black text-red-600">
                  {formatCurrency(calculateTotalReturn())}
                </p>
              </div>
              
              <div className="flex gap-3">
                <button 
                  onClick={() => setIsReturnModalOpen(false)}
                  className="px-8 py-4 rounded-2xl font-bold text-[#666] hover:bg-[#f0f0f0] transition-all"
                >
                  Cancelar
                </button>
                <button 
                  onClick={() => handleProcessReturn(true)}
                  disabled={loading || calculateTotalReturn() <= 0}
                  className="px-8 py-4 bg-white border-2 border-[#1a1a1a] text-[#1a1a1a] rounded-2xl font-bold hover:bg-[#f5f5f5] transition-all disabled:opacity-50 flex items-center gap-2"
                >
                  <ArrowRight size={20} />
                  Trocar
                </button>
                <button 
                  onClick={() => handleProcessReturn(false)}
                  disabled={loading || calculateTotalReturn() <= 0}
                  className="px-10 py-4 bg-[#1a1a1a] text-white rounded-2xl font-bold shadow-xl shadow-black/10 hover:scale-[1.02] active:scale-[0.98] transition-all disabled:opacity-50"
                >
                  Confirmar Devolução
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default PostSale;
