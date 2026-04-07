import React, { useState, useEffect } from 'react';
import { 
  History, 
  User, 
  Calendar, 
  Search, 
  Trash2, 
  Filter,
  ArrowDownRight,
  Package,
  Database,
  RefreshCw
} from 'lucide-react';
import { format } from 'date-fns';
import { toast } from 'sonner';
import { useAuth } from '../contexts/AuthContext';
import { cn } from '../lib/utils';

interface AuditLog {
  id: number;
  user_id: number;
  user_name: string;
  action: string;
  entity_type: string;
  entity_id: string;
  details: string;
  created_at: string;
}

const AuditLogs: React.FC = () => {
  const { user } = useAuth();
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filterAction, setFilterAction] = useState('all');

  const fetchLogs = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/audit-logs');
      if (res.ok) {
        const data = await res.json();
        setLogs(data);
      }
    } catch (error) {
      console.error("Erro ao carregar logs:", error);
      toast.error("Erro ao carregar histórico");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLogs();
  }, []);

  const handleClearLogs = async () => {
    if (!window.confirm("Tem certeza que deseja limpar todo o histórico? Esta ação não pode ser desfeita.")) return;

    try {
      const res = await fetch('/api/audit-logs/clear', { method: 'POST' });
      if (res.ok) {
        toast.success("Histórico limpo com sucesso");
        fetchLogs();
      }
    } catch (error) {
      toast.error("Erro ao limpar histórico");
    }
  };

  const filteredLogs = logs.filter(log => {
    const matchesSearch = 
      (log.details || '').toLowerCase().includes((search || '').toLowerCase()) ||
      (log.user_name || '').toLowerCase().includes((search || '').toLowerCase());
    
    const matchesAction = filterAction === 'all' || log.action === filterAction;

    return matchesSearch && matchesAction;
  });

  const getActionBadge = (action: string) => {
    switch (action) {
      case 'create': return <span className="px-2 py-1 bg-green-100 text-green-700 rounded-full text-xs font-medium">Criação</span>;
      case 'update': return <span className="px-2 py-1 bg-blue-100 text-blue-700 rounded-full text-xs font-medium">Atualização</span>;
      case 'delete': return <span className="px-2 py-1 bg-red-100 text-red-700 rounded-full text-xs font-medium">Eliminação</span>;
      case 'import': return <span className="px-2 py-1 bg-purple-100 text-purple-700 rounded-full text-xs font-medium">Importação</span>;
      case 'backup_import': return <span className="px-2 py-1 bg-orange-100 text-orange-700 rounded-full text-xs font-medium">Backup</span>;
      case 'stock_adjustment': return <span className="px-2 py-1 bg-yellow-100 text-yellow-700 rounded-full text-xs font-medium">Stock</span>;
      default: return <span className="px-2 py-1 bg-gray-100 text-gray-700 rounded-full text-xs font-medium">{action}</span>;
    }
  };

  const getEntityIcon = (type: string) => {
    switch (type) {
      case 'product': return <Package size={16} className="text-blue-500" />;
      case 'system': return <Database size={16} className="text-purple-500" />;
      default: return <History size={16} className="text-gray-500" />;
    }
  };

  return (
    <div className="p-8 max-w-7xl mx-auto">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold text-[#1a1a1a]">Consola de Auditoria</h1>
          <p className="text-gray-500 mt-1">Histórico completo de manipulações no sistema</p>
        </div>
        <div className="flex gap-3">
          <button 
            onClick={fetchLogs}
            className="p-3 bg-white border border-gray-200 rounded-xl hover:bg-gray-50 transition-colors"
            title="Atualizar"
          >
            <RefreshCw size={20} className={cn(loading && "animate-spin")} />
          </button>
          {user?.role === 'admin' && (
            <button 
              onClick={handleClearLogs}
              className="bg-red-50 text-red-600 px-6 py-3 rounded-xl font-bold flex items-center gap-2 hover:bg-red-100 transition-colors"
            >
              <Trash2 size={20} /> Limpar Histórico
            </button>
          )}
        </div>
      </div>

      <div className="bg-white rounded-3xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="p-6 border-b border-gray-100 flex flex-wrap gap-4 items-center justify-between bg-gray-50/50">
          <div className="relative flex-1 min-w-[300px]">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
            <input
              type="text"
              placeholder="Pesquisar por detalhes ou utilizador..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-12 pr-4 py-3 bg-white border border-gray-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-[#1a1a1a]/5 transition-all"
            />
          </div>
          <div className="flex gap-3">
            <div className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-200 rounded-2xl">
              <Filter size={18} className="text-gray-400" />
              <select 
                value={filterAction}
                onChange={(e) => setFilterAction(e.target.value)}
                className="bg-transparent focus:outline-none text-sm font-medium"
              >
                <option value="all">Todas as Ações</option>
                <option value="create">Criação</option>
                <option value="update">Atualização</option>
                <option value="delete">Eliminação</option>
                <option value="import">Importação</option>
                <option value="backup_import">Backup</option>
                <option value="stock_adjustment">Stock</option>
              </select>
            </div>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="bg-gray-50/50 text-gray-500 text-sm uppercase tracking-wider">
                <th className="px-6 py-4 font-semibold">Data/Hora</th>
                <th className="px-6 py-4 font-semibold">Utilizador</th>
                <th className="px-6 py-4 font-semibold">Ação</th>
                <th className="px-6 py-4 font-semibold">Entidade</th>
                <th className="px-6 py-4 font-semibold">Detalhes</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {loading ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <tr key={i} className="animate-pulse">
                    <td colSpan={5} className="px-6 py-8 bg-gray-50/20"></td>
                  </tr>
                ))
              ) : filteredLogs.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-6 py-12 text-center text-gray-500">
                    Nenhum registo encontrado.
                  </td>
                </tr>
              ) : (
                filteredLogs.map((log) => (
                  <tr key={log.id} className="hover:bg-gray-50/50 transition-colors group">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2 text-gray-600">
                        <Calendar size={14} className="text-gray-400" />
                        <span className="text-sm">{format(new Date(log.created_at), "dd/MM/yyyy HH:mm:ss")}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <div className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center text-gray-500">
                          <User size={14} />
                        </div>
                        <span className="font-medium text-gray-900">{log.user_name || 'Sistema'}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      {getActionBadge(log.action)}
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2 text-sm text-gray-600">
                        {getEntityIcon(log.entity_type)}
                        <span className="capitalize">{log.entity_type}</span>
                        {log.entity_id && <span className="text-xs text-gray-400">#{log.entity_id}</span>}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2 text-gray-700">
                        <ArrowDownRight size={14} className="text-gray-300 group-hover:text-gray-400 transition-colors" />
                        <span className="text-sm">{log.details}</span>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default AuditLogs;
