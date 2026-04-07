import React, { useState, useEffect } from 'react';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell
} from 'recharts';
import { formatCurrency } from '../lib/utils';
import { useAuth } from '../contexts/AuthContext';
import { Sale } from '../types';
import { format } from 'date-fns';

const Reports: React.FC = () => {
  const { store } = useAuth();
  const [sales, setSales] = useState<Sale[]>([]);
  const [stats, setStats] = useState<any>(null);
  const [sessions, setSessions] = useState<any[]>([]);
  const [discrepancies, setDiscrepancies] = useState<any[]>([]);
  const [exposure, setExposure] = useState<any[]>([]);

  useEffect(() => {
    fetch('/api/sales/history')
      .then(res => res.json())
      .then(data => setSales(Array.isArray(data) ? data : []))
      .catch(() => setSales([]));
    fetch('/api/reports/dashboard').then(res => res.json()).then(setStats);
    fetch('/api/sessions/history').then(res => res.json()).then(data => setSessions(Array.isArray(data) ? data : []));
    fetch('/api/sessions/discrepancies').then(res => res.json()).then(data => setDiscrepancies(Array.isArray(data) ? data : []));
    fetch('/api/reports/clients-exposure').then(res => res.json()).then(data => setExposure(Array.isArray(data) ? data : []));
  }, []);

  const COLORS = ['#1a1a1a', '#4a4a4a', '#8a8a8a', '#cccccc', '#f0f0f0'];

  return (
    <div className="space-y-8">
      <header>
        <h1 className="text-3xl font-bold tracking-tight">Relatórios Detalhados</h1>
        <p className="text-muted-foreground">Analise o desempenho do seu negócio.</p>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="bg-white p-8 rounded-3xl border border-[#e5e5e5] shadow-sm">
          <h3 className="text-lg font-bold mb-6">Exposição Financeira de Clientes</h3>
          <div className="space-y-4">
            {exposure.length === 0 ? (
              <p className="text-center py-10 text-slate-500 font-medium">Nenhuma exposição financeira registada.</p>
            ) : (
              exposure.map((client, i) => (
                <div key={i} className="flex items-center justify-between p-4 bg-[#f9f9f9] rounded-2xl">
                  <div>
                    <p className="text-sm font-bold">{client.name}</p>
                    <p className="text-[10px] uppercase font-bold text-[#999]">Plafond: {formatCurrency(client.credit_limit, store?.currency)}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-bold text-red-600">Dívida: {formatCurrency(client.debt, store?.currency)}</p>
                    <p className="text-xs font-medium text-green-600">Saldo: {formatCurrency(client.balance, store?.currency)}</p>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        <div className="bg-white p-8 rounded-3xl border border-[#e5e5e5] shadow-sm">
          <h3 className="text-lg font-bold mb-6">Distribuição de Vendas por Produto</h3>
          <div className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={stats?.topProducts || []}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={100}
                  paddingAngle={5}
                  dataKey="qty"
                >
                  {(stats?.topProducts || []).map((entry: any, index: number) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="mt-4 grid grid-cols-2 gap-4">
            {(stats?.topProducts || []).map((p: any, i: number) => (
              <div key={i} className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full" style={{backgroundColor: COLORS[i % COLORS.length]}} />
                <span className="text-xs font-medium truncate">{p.name}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-white p-8 rounded-3xl border border-[#e5e5e5] shadow-sm">
          <h3 className="text-lg font-bold mb-6">Histórico Recente de Vendas</h3>
          <div className="space-y-4">
            {sales.slice(0, 5).map((sale) => (
              <div key={sale.id} className="flex items-center justify-between p-4 bg-[#f9f9f9] rounded-2xl">
                <div>
                  <p className="text-sm font-bold">Venda #{sale.id}</p>
                  <p className="text-xs text-muted-foreground">{format(new Date(sale.created_at), 'dd/MM/yyyy HH:mm')}</p>
                </div>
                <div className="text-right">
                  <p className="text-sm font-bold">{formatCurrency(sale.total, store?.currency)}</p>
                  <p className="text-[10px] uppercase font-bold text-[#999]">{sale.payment_method}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="bg-white rounded-3xl border border-[#e5e5e5] shadow-sm overflow-hidden">
        <div className="p-6 border-b border-[#e5e5e5]">
          <h3 className="font-bold">Todas as Transações</h3>
        </div>
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-[#f9f9f9] border-b border-[#e5e5e5]">
              <th className="px-6 py-4 text-xs font-bold text-muted-foreground uppercase">ID</th>
              <th className="px-6 py-4 text-xs font-bold text-muted-foreground uppercase">Data</th>
              <th className="px-6 py-4 text-xs font-bold text-muted-foreground uppercase">Operador</th>
              <th className="px-6 py-4 text-xs font-bold text-muted-foreground uppercase">Método</th>
              {store?.uses_tax && (
                <>
                  <th className="px-6 py-4 text-xs font-bold text-muted-foreground uppercase">Subtotal</th>
                  <th className="px-6 py-4 text-xs font-bold text-muted-foreground uppercase">IVA</th>
                </>
              )}
              <th className="px-6 py-4 text-xs font-bold text-muted-foreground uppercase">Total</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#e5e5e5]">
            {sales.map(sale => (
              <tr key={sale.id} className="hover:bg-[#fcfcfc]">
                <td className="px-6 py-4 text-sm font-medium">#{sale.id}</td>
                <td className="px-6 py-4 text-sm">{format(new Date(sale.created_at), 'dd/MM/yyyy HH:mm')}</td>
                <td className="px-6 py-4 text-sm">{sale.user_name}</td>
                <td className="px-6 py-4 text-sm capitalize">{sale.payment_method}</td>
                {store?.uses_tax && (
                  <>
                    <td className="px-6 py-4 text-sm">{formatCurrency(sale.total_without_tax || 0, store?.currency)}</td>
                    <td className="px-6 py-4 text-sm">{formatCurrency(sale.total_tax || 0, store?.currency)}</td>
                  </>
                )}
                <td className="px-6 py-4 text-sm font-bold">{formatCurrency(sale.total, store?.currency)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="bg-white rounded-3xl border border-[#e5e5e5] shadow-sm overflow-hidden">
        <div className="p-6 border-b border-[#e5e5e5]">
          <h3 className="font-bold">Histórico de Abertura e Fecho de Caixa</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-[#f9f9f9] border-b border-[#e5e5e5]">
                <th className="px-6 py-4 text-xs font-bold text-muted-foreground uppercase">ID</th>
                <th className="px-6 py-4 text-xs font-bold text-muted-foreground uppercase">Operador</th>
                <th className="px-6 py-4 text-xs font-bold text-muted-foreground uppercase">Abertura</th>
                <th className="px-6 py-4 text-xs font-bold text-muted-foreground uppercase">Fecho</th>
                <th className="px-6 py-4 text-xs font-bold text-muted-foreground uppercase">Saldo Inicial</th>
                <th className="px-6 py-4 text-xs font-bold text-muted-foreground uppercase">Saldo Final</th>
                <th className="px-6 py-4 text-xs font-bold text-muted-foreground uppercase">Diferença</th>
                <th className="px-6 py-4 text-xs font-bold text-muted-foreground uppercase">Tipo/Justificação</th>
                <th className="px-6 py-4 text-xs font-bold text-muted-foreground uppercase">Estado</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#e5e5e5]">
              {sessions.map(session => (
                <tr key={session.id} className="hover:bg-[#fcfcfc]">
                  <td className="px-6 py-4 text-sm font-medium">#{session.id}</td>
                  <td className="px-6 py-4 text-sm">{session.user_name}</td>
                  <td className="px-6 py-4 text-sm">{format(new Date(session.opening_time), 'dd/MM/yyyy HH:mm')}</td>
                  <td className="px-6 py-4 text-sm">
                    {session.closing_time ? format(new Date(session.closing_time), 'dd/MM/yyyy HH:mm') : '-'}
                  </td>
                  <td className="px-6 py-4 text-sm font-bold">{formatCurrency(session.opening_balance, store?.currency)}</td>
                  <td className="px-6 py-4 text-sm font-bold">
                    {session.counted_balance !== null ? formatCurrency(session.counted_balance, store?.currency) : '-'}
                  </td>
                  <td className={`px-6 py-4 text-sm font-bold ${session.difference < 0 ? 'text-red-500' : session.difference > 0 ? 'text-green-500' : ''}`}>
                    {session.difference !== null ? formatCurrency(session.difference, store?.currency) : '-'}
                  </td>
                  <td className="px-6 py-4 text-xs">
                    {session.difference_type && (
                      <div className="font-bold mb-1">{session.difference_type}</div>
                    )}
                    {session.justification && (
                      <div className="text-muted-foreground italic max-w-[200px] truncate" title={session.justification}>
                        "{session.justification}"
                      </div>
                    )}
                    {!session.difference_type && !session.justification && '-'}
                  </td>
                  <td className="px-6 py-4">
                    <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider ${
                      session.status === 'open' ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-700'
                    }`}>
                      {session.status === 'open' ? 'Aberto' : 'Fechado'}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
      <div className="bg-white rounded-3xl border border-[#e5e5e5] shadow-sm overflow-hidden">
        <div className="p-6 border-b border-[#e5e5e5] flex items-center justify-between">
          <h3 className="font-bold">Relatório de Divergências de Caixa</h3>
          <span className="bg-red-100 text-red-700 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider">
            {discrepancies.length} Ocorrências
          </span>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-[#f9f9f9] border-b border-[#e5e5e5]">
                <th className="px-6 py-4 text-xs font-bold text-muted-foreground uppercase">Data Fecho</th>
                <th className="px-6 py-4 text-xs font-bold text-muted-foreground uppercase">Operador</th>
                <th className="px-6 py-4 text-xs font-bold text-muted-foreground uppercase">Tipo</th>
                <th className="px-6 py-4 text-xs font-bold text-muted-foreground uppercase">Diferença</th>
                <th className="px-6 py-4 text-xs font-bold text-muted-foreground uppercase">Justificação</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#e5e5e5]">
              {discrepancies.map(session => (
                <tr key={session.id} className="hover:bg-red-50/30">
                  <td className="px-6 py-4 text-sm">{format(new Date(session.closing_time), 'dd/MM/yyyy HH:mm')}</td>
                  <td className="px-6 py-4 text-sm font-medium">{session.user_name}</td>
                  <td className="px-6 py-4 text-sm">
                    <span className={`font-bold ${session.difference < 0 ? 'text-red-600' : 'text-blue-600'}`}>
                      {session.difference_type}
                    </span>
                  </td>
                  <td className={`px-6 py-4 text-sm font-bold ${session.difference < 0 ? 'text-red-600' : 'text-blue-600'}`}>
                    {formatCurrency(session.difference, store?.currency)}
                  </td>
                  <td className="px-6 py-4 text-sm italic text-muted-foreground">
                    {session.justification}
                  </td>
                </tr>
              ))}
              {discrepancies.length === 0 && (
                <tr>
                  <td colSpan={5} className="px-6 py-10 text-center text-muted-foreground font-medium">
                    Nenhuma divergência de caixa registada.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default Reports;
