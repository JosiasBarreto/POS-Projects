import React, { useState, useEffect } from 'react';
import { Client, ClientTransaction } from '../../types';
import Modal from '../ui/Modal';
import { formatCurrency } from '../../lib/utils';
import { useAuth } from '../../contexts/AuthContext';
import { toast } from 'sonner';
import { ArrowDownLeft, ArrowUpRight, History, Wallet, CreditCard } from 'lucide-react';
import { format } from 'date-fns';

interface ClientAccountModalProps {
  isOpen: boolean;
  onClose: () => void;
  client: Client;
  onUpdate: () => void;
}

const ClientAccountModal: React.FC<ClientAccountModalProps> = ({ isOpen, onClose, client, onUpdate }) => {
  const { store, user } = useAuth();
  const [activeTab, setActiveTab] = useState<'resumo' | 'operacao' | 'historico'>('resumo');
  const [transactions, setTransactions] = useState<ClientTransaction[]>([]);
  const [loading, setLoading] = useState(false);

  // Operation state
  const [opType, setOpType] = useState<'deposit' | 'debt_payment'>('deposit');
  const [amount, setAmount] = useState('');
  const [description, setDescription] = useState('');

  useEffect(() => {
    if (isOpen && client) {
      fetchTransactions();
      setActiveTab('resumo');
      setAmount('');
      setDescription('');
    }
  }, [isOpen, client]);

  const fetchTransactions = async () => {
    try {
      const res = await fetch(`/api/clients/${client.id}/transactions`);
      const data = await res.json();
      setTransactions(data);
    } catch (error) {
      toast.error('Erro ao carregar histórico');
    }
  };

  const handleOperation = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!amount || parseFloat(amount) <= 0) {
      toast.error('Insira um valor válido');
      return;
    }

    if (opType === 'debt_payment' && parseFloat(amount) > client.debt) {
      toast.error('O valor do pagamento é superior à dívida atual');
      return;
    }

    setLoading(true);
    try {
      const res = await fetch(`/api/clients/${client.id}/transactions`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: opType,
          amount: parseFloat(amount),
          description,
          user_id: user?.id
        })
      });

      if (res.ok) {
        toast.success('Operação realizada com sucesso!');
        setAmount('');
        setDescription('');
        fetchTransactions();
        onUpdate(); // Refresh client data in parent
        setActiveTab('resumo');
      } else {
        const data = await res.json();
        toast.error(data.error || 'Erro ao realizar operação');
      }
    } catch (error) {
      toast.error('Erro ao realizar operação');
    } finally {
      setLoading(false);
    }
  };

  const getTransactionIcon = (type: string) => {
    switch (type) {
      case 'deposit': return <ArrowDownLeft className="text-green-500" size={20} />;
      case 'debt_payment': return <ArrowDownLeft className="text-blue-500" size={20} />;
      case 'purchase_balance': return <ArrowUpRight className="text-orange-500" size={20} />;
      case 'purchase_credit': return <ArrowUpRight className="text-red-500" size={20} />;
      default: return <History className="text-gray-500" size={20} />;
    }
  };

  const getTransactionLabel = (type: string) => {
    switch (type) {
      case 'deposit': return 'Depósito (Saldo)';
      case 'debt_payment': return 'Pagamento de Dívida';
      case 'purchase_balance': return 'Compra com Saldo';
      case 'purchase_credit': return 'Compra a Crédito (Fiado)';
      default: return type;
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={`Conta Corrente: ${client?.name}`}
      maxWidth="2xl"
      icon={<Wallet size={20} />}
    >
      <div className="flex gap-4 mb-6 border-b border-slate-200 pb-4">
        <button
          onClick={() => setActiveTab('resumo')}
          className={`px-4 py-2 font-bold rounded-xl transition-all ${activeTab === 'resumo' ? 'bg-indigo-50 text-indigo-600' : 'text-slate-500 hover:bg-slate-50'}`}
        >
          Resumo
        </button>
        <button
          onClick={() => setActiveTab('operacao')}
          className={`px-4 py-2 font-bold rounded-xl transition-all ${activeTab === 'operacao' ? 'bg-indigo-50 text-indigo-600' : 'text-slate-500 hover:bg-slate-50'}`}
        >
          Nova Operação
        </button>
        <button
          onClick={() => setActiveTab('historico')}
          className={`px-4 py-2 font-bold rounded-xl transition-all ${activeTab === 'historico' ? 'bg-indigo-50 text-indigo-600' : 'text-slate-500 hover:bg-slate-50'}`}
        >
          Histórico
        </button>
      </div>

      {activeTab === 'resumo' && (
        <div className="space-y-6">
          <div className="grid grid-cols-2 gap-6">
            <div className="bg-green-50 p-6 rounded-3xl border border-green-100">
              <div className="flex items-center gap-3 mb-2">
                <div className="p-2 bg-green-100 text-green-600 rounded-xl">
                  <Wallet size={20} />
                </div>
                <h3 className="font-bold text-green-800">Saldo Disponível</h3>
              </div>
              <p className="text-3xl font-black text-green-600">{formatCurrency(client?.balance || 0, store?.currency)}</p>
              <p className="text-xs text-green-700 mt-2 font-medium">Crédito pré-pago para compras</p>
            </div>
            
            <div className="bg-red-50 p-6 rounded-3xl border border-red-100">
              <div className="flex items-center gap-3 mb-2">
                <div className="p-2 bg-red-100 text-red-600 rounded-xl">
                  <CreditCard size={20} />
                </div>
                <h3 className="font-bold text-red-800">Dívida Atual</h3>
              </div>
              <p className="text-3xl font-black text-red-600">{formatCurrency(client?.debt || 0, store?.currency)}</p>
              <p className="text-xs text-red-700 mt-2 font-medium">
                Plafond: {formatCurrency(client?.credit_limit || 0, store?.currency)}
                <span className="ml-2 opacity-75">
                  (Disponível: {formatCurrency(Math.max(0, (client?.credit_limit || 0) - (client?.debt || 0)), store?.currency)})
                </span>
              </p>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'operacao' && (
        <form onSubmit={handleOperation} className="space-y-6">
          <div className="grid grid-cols-2 gap-4">
            <button
              type="button"
              onClick={() => setOpType('deposit')}
              className={`p-4 rounded-2xl border-2 text-left transition-all ${opType === 'deposit' ? 'border-green-500 bg-green-50' : 'border-slate-200 hover:border-green-200'}`}
            >
              <div className="flex items-center gap-2 mb-2 text-green-600">
                <ArrowDownLeft size={20} />
                <span className="font-bold">Depósito</span>
              </div>
              <p className="text-xs text-slate-500 font-medium">Adicionar saldo pré-pago à conta do cliente.</p>
            </button>
            <button
              type="button"
              onClick={() => setOpType('debt_payment')}
              className={`p-4 rounded-2xl border-2 text-left transition-all ${opType === 'debt_payment' ? 'border-blue-500 bg-blue-50' : 'border-slate-200 hover:border-blue-200'}`}
            >
              <div className="flex items-center gap-2 mb-2 text-blue-600">
                <ArrowDownLeft size={20} />
                <span className="font-bold">Pagamento de Dívida</span>
              </div>
              <p className="text-xs text-slate-500 font-medium">Liquidar valor em aberto (Dívida atual: {formatCurrency(client?.debt || 0, store?.currency)}).</p>
            </button>
          </div>

          <div className="group">
            <label className="block text-xs font-bold text-slate-500 mb-2 uppercase tracking-wider">Valor ({store?.currency})</label>
            <input
              required
              type="number"
              step="0.01"
              min="0.01"
              max={opType === 'debt_payment' ? client?.debt : undefined}
              className="w-full px-4 py-4 bg-slate-50 border border-slate-200 rounded-2xl outline-none font-bold text-slate-900 focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 transition-all text-xl"
              value={amount}
              onChange={e => setAmount(e.target.value)}
              placeholder="0.00"
            />
          </div>

          <div className="group">
            <label className="block text-xs font-bold text-slate-500 mb-2 uppercase tracking-wider">Descrição (Opcional)</label>
            <input
              type="text"
              className="w-full px-4 py-4 bg-slate-50 border border-slate-200 rounded-2xl outline-none font-bold text-slate-900 focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 transition-all"
              value={description}
              onChange={e => setDescription(e.target.value)}
              placeholder="Ex: Pagamento em dinheiro, Transferência bancária..."
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-indigo-600 text-white py-4 rounded-2xl font-bold shadow-lg shadow-indigo-200 hover:bg-indigo-700 hover:scale-[1.02] active:scale-[0.98] transition-all disabled:opacity-50"
          >
            {loading ? 'A processar...' : 'Confirmar Operação'}
          </button>
        </form>
      )}

      {activeTab === 'historico' && (
        <div className="space-y-4 max-h-[400px] overflow-y-auto pr-2">
          {transactions.length === 0 ? (
            <div className="text-center py-10 text-slate-500 font-medium">
              Nenhuma transação encontrada.
            </div>
          ) : (
            transactions.map(tx => (
              <div key={tx.id} className="flex items-center justify-between p-4 bg-slate-50 rounded-2xl border border-slate-100">
                <div className="flex items-center gap-4">
                  <div className="p-2 bg-white rounded-xl shadow-sm">
                    {getTransactionIcon(tx.type)}
                  </div>
                  <div>
                    <p className="font-bold text-sm">{getTransactionLabel(tx.type)}</p>
                    <p className="text-xs text-slate-500">{format(new Date(tx.created_at), 'dd/MM/yyyy HH:mm')} • {tx.user_name}</p>
                    {tx.description && <p className="text-xs text-slate-600 mt-1">{tx.description}</p>}
                    {tx.sale_id && <p className="text-xs text-indigo-600 font-medium mt-1">Venda #{tx.sale_id}</p>}
                  </div>
                </div>
                <div className={`font-black ${['deposit', 'debt_payment'].includes(tx.type) ? 'text-green-600' : 'text-red-600'}`}>
                  {['deposit', 'debt_payment'].includes(tx.type) ? '+' : '-'}{formatCurrency(tx.amount, store?.currency)}
                </div>
              </div>
            ))
          )}
        </div>
      )}
    </Modal>
  );
};

export default ClientAccountModal;
