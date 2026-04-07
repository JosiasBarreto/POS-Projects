import React, { useState, useEffect } from 'react';
import { Search, FileText, Printer, Eye, Calendar, User, ShoppingCart } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { formatCurrency } from '../lib/utils';
import { format } from 'date-fns';
import Modal from '../components/ui/Modal';
import { generateReceiptHTML, generateReceiptPDF } from '../lib/print';

interface Proforma {
  id: number;
  client_id: number | null;
  client_name: string | null;
  total: number;
  total_without_tax: number;
  total_tax: number;
  user_id: number;
  user_name: string;
  created_at: string;
}

const Proformas: React.FC = () => {
  const { store, user } = useAuth();
  const [proformas, setProformas] = useState<Proforma[]>([]);
  const [search, setSearch] = useState('');
  const [selectedProforma, setSelectedProforma] = useState<any>(null);
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);

  useEffect(() => {
    fetchProformas();
  }, []);

  const fetchProformas = () => {
    fetch('/api/proformas')
      .then(res => res.json())
      .then(setProformas);
  };

  const handleView = async (id: number) => {
    const res = await fetch(`/api/proformas/${id}`);
    if (res.ok) {
      const data = await res.json();
      setSelectedProforma(data);
      setIsViewModalOpen(true);
    }
  };

  const handlePrint = (type: 'thermal' | 'pdf') => {
    if (!selectedProforma) return;

    const receiptData = {
      store,
      user: { name: selectedProforma.user_name },
      client: selectedProforma.client_id ? {
        name: selectedProforma.client_name,
        nif: selectedProforma.client_nif,
        phone: selectedProforma.client_phone,
        email: selectedProforma.client_email,
        address: selectedProforma.client_address
      } : null,
      items: selectedProforma.items.map((item: any) => ({
        product: { name: item.product_name },
        quantity: item.quantity,
        price: item.price,
        tax_rate: item.tax_rate,
        tax_amount: item.tax_amount,
        subtotal_without_tax: item.subtotal_without_tax,
        subtotal: item.quantity * item.price
      })),
      total: selectedProforma.total,
      totalWithoutTax: selectedProforma.total_without_tax,
      totalTax: selectedProforma.total_tax,
      date: format(new Date(selectedProforma.created_at), 'dd/MM/yyyy HH:mm'),
      isProforma: true,
      proformaId: selectedProforma.id
    };

    if (type === 'thermal') {
      const html = generateReceiptHTML(receiptData as any, '80mm');
      const win = window.open('', '_blank');
      if (win) {
        win.document.write(html);
        win.document.close();
        win.print();
      }
    } else {
      generateReceiptPDF(receiptData as any);
    }
  };

  const filteredProformas = proformas.filter(p => 
    p.id.toString().includes(search) || 
    (p.client_name || 'Consumidor Final').toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-8">
      <header className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Faturas Proforma</h1>
          <p className="text-muted-foreground">Consulte e imprima faturas proforma emitidas.</p>
        </div>
      </header>

      <div className="relative">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground" size={20} />
        <input
          type="text"
          placeholder="Pesquisar por número ou cliente..."
          className="w-full pl-12 pr-4 py-3 bg-white border border-slate-200 rounded-xl outline-none font-medium text-slate-900 focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 transition-all shadow-sm"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-slate-50 border-b border-slate-200">
              <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Número</th>
              <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Data</th>
              <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Cliente</th>
              <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Total</th>
              <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Operador</th>
              <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider text-right">Ações</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {filteredProformas.map(proforma => (
              <tr key={proforma.id} className="hover:bg-slate-50 transition-colors">
                <td className="px-6 py-4 font-bold text-indigo-600">PF-{proforma.id.toString().padStart(4, '0')}</td>
                <td className="px-6 py-4 text-sm text-slate-600">
                  <div className="flex items-center gap-2">
                    <Calendar size={14} className="text-slate-400" />
                    {format(new Date(proforma.created_at), 'dd/MM/yyyy HH:mm')}
                  </div>
                </td>
                <td className="px-6 py-4">
                  <div className="flex items-center gap-2">
                    <User size={14} className="text-slate-400" />
                    <span className="font-medium">{proforma.client_name || 'Consumidor Final'}</span>
                  </div>
                </td>
                <td className="px-6 py-4 font-black text-slate-900">{formatCurrency(proforma.total, store?.currency)}</td>
                <td className="px-6 py-4 text-sm text-slate-500">{proforma.user_name}</td>
                <td className="px-6 py-4 text-right">
                  <button 
                    onClick={() => handleView(proforma.id)}
                    className="p-2 hover:bg-indigo-50 rounded-xl text-indigo-600 transition-colors"
                    title="Visualizar"
                  >
                    <Eye size={18} />
                  </button>
                </td>
              </tr>
            ))}
            {filteredProformas.length === 0 && (
              <tr>
                <td colSpan={6} className="px-6 py-10 text-center text-slate-500 font-medium">
                  Nenhuma fatura proforma encontrada.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <Modal
        isOpen={isViewModalOpen}
        onClose={() => setIsViewModalOpen(false)}
        title={`Fatura Proforma PF-${selectedProforma?.id.toString().padStart(4, '0')}`}
        maxWidth="3xl"
        icon={<FileText size={20} />}
        footer={
          <div className="flex gap-3">
            <button onClick={() => setIsViewModalOpen(false)} className="flex-1 py-4 rounded-2xl font-bold text-slate-500 hover:bg-slate-100 transition-all">Fechar</button>
            <button onClick={() => handlePrint('thermal')} className="flex-1 bg-slate-800 text-white py-4 rounded-2xl font-bold shadow-lg hover:bg-slate-900 transition-all flex items-center justify-center gap-2">
              <Printer size={20} /> Talão (80mm)
            </button>
            <button onClick={() => handlePrint('pdf')} className="flex-1 bg-indigo-600 text-white py-4 rounded-2xl font-bold shadow-lg shadow-indigo-200 hover:bg-indigo-700 transition-all flex items-center justify-center gap-2">
              <FileText size={20} /> PDF (A4)
            </button>
          </div>
        }
      >
        {selectedProforma && (
          <div className="space-y-6">
            <div className="grid grid-cols-2 gap-8 bg-slate-50 p-6 rounded-3xl border border-slate-100">
              <div>
                <p className="text-[10px] uppercase font-bold text-slate-400 mb-2">Cliente</p>
                <p className="font-bold text-slate-900">{selectedProforma.client_name || 'Consumidor Final'}</p>
                {selectedProforma.client_nif && <p className="text-sm text-slate-500">NIF: {selectedProforma.client_nif}</p>}
                {selectedProforma.client_phone && <p className="text-sm text-slate-500">Tel: {selectedProforma.client_phone}</p>}
              </div>
              <div className="text-right">
                <p className="text-[10px] uppercase font-bold text-slate-400 mb-2">Detalhes</p>
                <p className="text-sm text-slate-600">Data: {format(new Date(selectedProforma.created_at), 'dd/MM/yyyy HH:mm')}</p>
                <p className="text-sm text-slate-600">Operador: {selectedProforma.user_name}</p>
              </div>
            </div>

            <div className="overflow-hidden rounded-2xl border border-slate-100">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-50">
                    <th className="px-4 py-3 text-[10px] font-bold text-slate-500 uppercase tracking-wider">Produto</th>
                    <th className="px-4 py-3 text-[10px] font-bold text-slate-500 uppercase tracking-wider text-center">Qtd</th>
                    <th className="px-4 py-3 text-[10px] font-bold text-slate-500 uppercase tracking-wider text-right">Preço</th>
                    <th className="px-4 py-3 text-[10px] font-bold text-slate-500 uppercase tracking-wider text-right">Subtotal</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {selectedProforma.items.map((item: any, idx: number) => (
                    <tr key={idx}>
                      <td className="px-4 py-3 text-sm font-medium text-slate-900">{item.product_name}</td>
                      <td className="px-4 py-3 text-sm text-slate-600 text-center">{item.quantity}</td>
                      <td className="px-4 py-3 text-sm text-slate-600 text-right">{formatCurrency(item.price, store?.currency)}</td>
                      <td className="px-4 py-3 text-sm font-bold text-slate-900 text-right">{formatCurrency(item.quantity * item.price, store?.currency)}</td>
                    </tr>
                  ))}
                </tbody>
                <tfoot>
                  <tr className="bg-slate-50/50">
                    <td colSpan={3} className="px-4 py-4 text-right font-bold text-slate-500">Total</td>
                    <td className="px-4 py-4 text-right font-black text-indigo-600 text-lg">{formatCurrency(selectedProforma.total, store?.currency)}</td>
                  </tr>
                </tfoot>
              </table>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
};

export default Proformas;
