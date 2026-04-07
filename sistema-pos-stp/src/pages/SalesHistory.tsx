import React, { useState, useEffect } from 'react';
import { Search, Filter, Download, FileText, FileSpreadsheet, ChevronLeft, ChevronRight, Receipt, RotateCcw, X, AlertCircle } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { format } from 'date-fns';
import { pt } from 'date-fns/locale';
import { cn } from '../lib/utils';
import * as xlsx from 'xlsx';
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import { toast } from 'sonner';
import { motion, AnimatePresence } from 'motion/react';

const SalesHistory: React.FC = () => {
  const { store, user } = useAuth();
  const [sales, setSales] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState('');
  const [filterDate, setFilterDate] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedSale, setSelectedSale] = useState<any>(null);
  const [isReturnModalOpen, setIsReturnModalOpen] = useState(false);
  const [returnReason, setReturnReason] = useState('');
  const [returning, setReturning] = useState(false);
  const itemsPerPage = 10;

  useEffect(() => {
    fetchSales();
  }, []);

  const fetchSales = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/sales/history');
      if (res.ok) {
        const data = await res.json();
        console.log("[SalesHistory] Data received:", data);
        setSales(Array.isArray(data) ? data : []);
      } else {
        const errText = await res.text();
        console.error("[SalesHistory] API Error:", res.status, errText);
        setSales([]);
      }
    } catch (error) {
      console.error("[SalesHistory] Fetch Error:", error);
      setSales([]);
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (value: number) => {
    try {
      return new Intl.NumberFormat('pt-ST', {
        style: 'currency',
        currency: store?.currency || 'STN'
      }).format(value);
    } catch (err) {
      return (value || 0).toFixed(2) + ' ' + (store?.currency || 'STN');
    }
  };

  const formatDate = (dateString: string) => {
    if (!dateString) return '-';
    try {
      // Handle SQLite format YYYY-MM-DD HH:MM:SS
      const date = new Date(dateString.replace(' ', 'T'));
      if (isNaN(date.getTime())) return '-';
      return format(date, "dd/MM/yyyy HH:mm", { locale: pt });
    } catch (err) {
      return '-';
    }
  };

  const filteredSales = sales.filter(sale => {
    const matchesSearch = (sale.id?.toString() || '').includes(search) || 
                          (sale.user_name || '').toLowerCase().includes((search || '').toLowerCase()) ||
                          (sale.client_name || '').toLowerCase().includes((search || '').toLowerCase());
    const matchesDate = filterDate && sale.created_at ? sale.created_at.startsWith(filterDate) : true;
    return matchesSearch && matchesDate;
  });

  const totalPages = Math.ceil(filteredSales.length / itemsPerPage);
  const paginatedSales = filteredSales.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  const exportToExcel = () => {
    const dataToExport = filteredSales.map(sale => ({
      'Loja': store?.name || '',
      'NIF': store?.nif || '',
      'ID Venda': sale.id,
      'Data': format(new Date(sale.created_at), "dd/MM/yyyy HH:mm", { locale: pt }),
      'Cliente': sale.client_name || 'Consumidor Final',
      'Operador': sale.user_name,
      'Método Pagamento': 
        sale.payment_method === 'cash' ? 'Numerário' : 
        sale.payment_method === 'card' ? 'Cartão' : 
        sale.payment_method === 'transfer' ? 'Transferência' :
        sale.payment_method === 'credit' ? 'Crédito' :
        sale.payment_method === 'balance' ? 'Saldo' : 'Misto',
      'Total S/ IVA': sale.total_without_tax,
      'Total IVA': sale.total_tax,
      'Total': sale.total
    }));

    const ws = xlsx.utils.json_to_sheet(dataToExport);
    const wb = xlsx.utils.book_new();
    xlsx.utils.book_append_sheet(wb, ws, "Vendas");
    xlsx.writeFile(wb, `Relatorio_Vendas_${format(new Date(), 'yyyyMMdd')}.xlsx`);
  };

  const exportToPDF = () => {
    try {
      const doc = new jsPDF();
      
      doc.setFontSize(18);
      doc.text('Relatório de Vendas', 14, 22);
      
      doc.setFontSize(10);
      doc.text(`Empresa: ${store?.name || 'Loja'}`, 14, 30);
      doc.text(`NIF: ${store?.nif || 'N/A'} | Endereço: ${store?.address || 'N/A'}`, 14, 36);
      doc.text(`Data de exportação: ${format(new Date(), "dd/MM/yyyy HH:mm")}`, 14, 42);
  
      const tableColumn = ["ID", "Data", "Cliente", "Operador", "Método", "Total S/ IVA", "IVA", "Total"];
      const tableRows = filteredSales.map(sale => {
        try {
          return [
            sale.id,
            sale.created_at ? format(new Date(sale.created_at), "dd/MM/yyyy HH:mm") : '-',
            sale.client_name || 'Consumidor Final',
            sale.user_name || '-',
            sale.payment_method === 'cash' ? 'Numerário' : 
            sale.payment_method === 'card' ? 'Cartão' : 
            sale.payment_method === 'transfer' ? 'Transferência' :
            sale.payment_method === 'credit' ? 'Crédito' :
            sale.payment_method === 'balance' ? 'Saldo' : 'Misto',
            formatCurrency(sale.total_without_tax || 0),
            formatCurrency(sale.total_tax || 0),
            formatCurrency(sale.total || 0)
          ];
        } catch (err) {
          console.error("Erro ao formatar linha de venda para PDF:", sale, err);
          return [sale.id, '-', '-', '-', '-', '-', '-'];
        }
      });
  
      autoTable(doc, {
        head: [tableColumn],
        body: tableRows,
        startY: 50,
        theme: 'grid',
        styles: { fontSize: 8 },
        headStyles: { fillColor: [26, 26, 26] }
      });
  
      doc.save(`Relatorio_Vendas_${format(new Date(), 'yyyyMMdd')}.pdf`);
    } catch (error) {
      console.error("Erro ao gerar PDF de vendas:", error);
      alert("Ocorreu um erro ao gerar o PDF. Por favor, tente novamente.");
    }
  };

  const handleReturn = async () => {
    if (!selectedSale || !returnReason.trim()) {
      toast.error("Por favor, indique o motivo da devolução.");
      return;
    }

    setReturning(true);
    try {
      const res = await fetch('/api/returns', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sale_id: selectedSale.id,
          reason: returnReason,
          user_id: user?.id,
          items: selectedSale.items || [] // If we had items loaded, but for now we return the whole sale
        })
      });

      if (res.ok) {
        toast.success("Venda devolvida com sucesso!");
        setIsReturnModalOpen(false);
        setReturnReason('');
        fetchSales();
      } else {
        const err = await res.json();
        toast.error(err.error || "Erro ao processar devolução.");
      }
    } catch (error) {
      console.error("Return Error:", error);
      toast.error("Erro ao processar devolução.");
    } finally {
      setReturning(false);
    }
  };

  const openReturnModal = (sale: any) => {
    setSelectedSale(sale);
    setIsReturnModalOpen(true);
  };

  return (
    <div className="space-y-8">
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Histórico de Vendas</h1>
          <p className="text-muted-foreground">Consulte e exporte todas as vendas realizadas.</p>
        </div>
        <div className="flex items-center gap-3">
          <button 
            onClick={fetchSales}
            disabled={loading}
            className="p-3 rounded-xl border border-[#e5e5e5] bg-white text-muted-foreground hover:text-[#1a1a1a] hover:bg-[#f9f9f9] transition-all disabled:opacity-50"
            title="Atualizar"
          >
            <RotateCcw size={20} className={cn(loading && "animate-spin")} />
          </button>
          <button 
            onClick={exportToExcel}
            className="bg-emerald-50 text-emerald-600 px-4 py-2 rounded-xl font-bold flex items-center gap-2 hover:bg-emerald-100 transition-colors"
          >
            <FileSpreadsheet size={18} /> Excel
          </button>
          <button 
            onClick={exportToPDF}
            className="bg-red-50 text-red-600 px-4 py-2 rounded-xl font-bold flex items-center gap-2 hover:bg-red-100 transition-colors"
          >
            <FileText size={18} /> PDF
          </button>
        </div>
      </header>

      <div className="flex flex-col md:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground" size={20} />
          <input
            type="text"
            placeholder="Pesquisar por ID ou operador..."
            className="w-full pl-12 pr-4 py-3 bg-white border border-[#e5e5e5] rounded-xl outline-none focus:ring-2 focus:ring-[#1a1a1a]/10"
            value={search}
            onChange={(e) => { setSearch(e.target.value); setCurrentPage(1); }}
          />
        </div>
        <div className="relative w-full md:w-64">
          <Filter className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground" size={20} />
          <input
            type="date"
            className="w-full pl-12 pr-4 py-3 bg-white border border-[#e5e5e5] rounded-xl outline-none focus:ring-2 focus:ring-[#1a1a1a]/10"
            value={filterDate}
            onChange={(e) => { setFilterDate(e.target.value); setCurrentPage(1); }}
          />
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-[#e5e5e5] overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-[#f9f9f9] border-b border-[#e5e5e5]">
                <th className="p-4 font-semibold text-sm text-muted-foreground">ID Venda</th>
                <th className="p-4 font-semibold text-sm text-muted-foreground">Data</th>
                <th className="p-4 font-semibold text-sm text-muted-foreground">Cliente</th>
                <th className="p-4 font-semibold text-sm text-muted-foreground">Operador</th>
                <th className="p-4 font-semibold text-sm text-muted-foreground">Método</th>
                <th className="p-4 font-semibold text-sm text-muted-foreground text-right">Total S/ IVA</th>
                <th className="p-4 font-semibold text-sm text-muted-foreground text-right">IVA</th>
                <th className="p-4 font-semibold text-sm text-muted-foreground text-right">Total</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={8} className="p-12 text-center">
                    <div className="flex flex-col items-center gap-3">
                      <RotateCcw size={32} className="text-muted-foreground animate-spin" />
                      <p className="text-muted-foreground font-medium">Carregando vendas...</p>
                    </div>
                  </td>
                </tr>
              ) : paginatedSales.length === 0 ? (
                <tr>
                  <td colSpan={8} className="p-12 text-center">
                    <div className="flex flex-col items-center gap-3">
                      <div className="w-16 h-16 bg-muted/30 rounded-full flex items-center justify-center mx-auto">
                        <Receipt size={32} className="text-muted-foreground" />
                      </div>
                      <p className="text-muted-foreground font-medium">Nenhuma venda encontrada</p>
                      <p className="text-xs text-muted-foreground/60 max-w-[200px] mx-auto">
                        Tente ajustar os filtros ou pesquisar por outro termo.
                      </p>
                    </div>
                  </td>
                </tr>
              ) : (
                paginatedSales.map((sale) => (
                  <tr key={sale.id} className="border-b border-[#e5e5e5] hover:bg-[#f9f9f9] transition-colors">
                    <td className="p-4 font-medium">#{sale.id}</td>
                    <td className="p-4 text-sm text-muted-foreground">
                      {formatDate(sale.created_at)}
                    </td>
                    <td className="p-4 text-sm font-medium">{sale.client_name || 'Consumidor Final'}</td>
                    <td className="p-4 text-sm">{sale.user_name}</td>
                    <td className="p-4">
                      <span className={cn(
                        "px-2 py-1 rounded-md text-xs font-bold uppercase",
                        sale.payment_method === 'cash' ? "bg-emerald-50 text-emerald-600" :
                        sale.payment_method === 'card' ? "bg-blue-50 text-blue-600" :
                        "bg-purple-50 text-purple-600"
                      )}>
                        {sale.payment_method === 'cash' ? 'Numerário' : 
                         sale.payment_method === 'card' ? 'Cartão' : 
                         sale.payment_method === 'transfer' ? 'Transferência' :
                         sale.payment_method === 'credit' ? 'Crédito' :
                         sale.payment_method === 'balance' ? 'Saldo' : 'Misto'}
                      </span>
                    </td>
                    <td className="p-4 text-right text-sm text-muted-foreground">
                      {formatCurrency(sale.total_without_tax || 0)}
                    </td>
                    <td className="p-4 text-right text-sm text-muted-foreground">
                      {formatCurrency(sale.total_tax || 0)}
                    </td>
                    <td className="p-4 text-right font-bold text-[#1a1a1a]">
                      {formatCurrency(sale.total)}
                    </td>
                    <td className="p-4 text-right">
                      <button 
                        onClick={() => openReturnModal(sale)}
                        className="p-2 text-orange-600 hover:bg-orange-50 rounded-xl transition-colors"
                        title="Devolver Venda"
                      >
                        <RotateCcw size={18} />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
        
        {/* Pagination */}
        {totalPages > 1 && (
          <div className="p-4 border-t border-[#e5e5e5] flex items-center justify-between bg-[#f9f9f9]">
            <span className="text-sm text-muted-foreground">
              Página {currentPage} de {totalPages}
            </span>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                disabled={currentPage === 1}
                className="p-2 rounded-lg border border-[#e5e5e5] bg-white text-[#1a1a1a] hover:bg-[#f0f0f0] disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                <ChevronLeft size={18} />
              </button>
              <button
                onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                disabled={currentPage === totalPages}
                className="p-2 rounded-lg border border-[#e5e5e5] bg-white text-[#1a1a1a] hover:bg-[#f0f0f0] disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                <ChevronRight size={18} />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Return Modal */}
      <AnimatePresence>
        {isReturnModalOpen && (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <motion.div 
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-white w-full max-w-md rounded-3xl p-8 shadow-2xl"
            >
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-bold">Devolução de Venda</h2>
                <button onClick={() => setIsReturnModalOpen(false)} className="p-2 hover:bg-[#f5f5f5] rounded-full"><X size={24} /></button>
              </div>

              <div className="space-y-6">
                <div className="p-4 bg-orange-50 border border-orange-100 rounded-2xl flex gap-3">
                  <AlertCircle className="text-orange-600 shrink-0" size={20} />
                  <p className="text-sm text-orange-700">
                    A devolução irá anular a venda <strong>#{selectedSale?.id}</strong>, devolver os produtos ao stock e estornar o valor pago.
                  </p>
                </div>

                <div>
                  <label className="block text-sm font-bold mb-2">Motivo da Devolução</label>
                  <textarea 
                    className="w-full p-4 bg-[#f5f5f5] border-none rounded-2xl outline-none h-32 resize-none"
                    placeholder="Ex: Produto com defeito, erro do operador..."
                    value={returnReason}
                    onChange={(e) => setReturnReason(e.target.value)}
                  />
                </div>

                <div className="flex gap-3">
                  <button 
                    onClick={() => setIsReturnModalOpen(false)}
                    className="flex-1 py-4 rounded-2xl border-2 border-[#e5e5e5] font-bold hover:bg-[#f5f5f5] transition-all"
                  >
                    Cancelar
                  </button>
                  <button 
                    onClick={handleReturn}
                    disabled={returning || !returnReason.trim()}
                    className="flex-[2] bg-orange-600 text-white py-4 rounded-2xl font-bold hover:bg-orange-700 transition-all disabled:opacity-50"
                  >
                    {returning ? "A processar..." : "Confirmar Devolução"}
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default SalesHistory;
