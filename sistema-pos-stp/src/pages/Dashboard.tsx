import React, { useState, useEffect } from 'react';
import { 
  TrendingUp, 
  Package, 
  AlertTriangle, 
  DollarSign,
  ArrowUpRight,
  ArrowDownRight
} from 'lucide-react';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  LineChart,
  Line
} from 'recharts';
import { formatCurrency } from '../lib/utils';
import { useAuth } from '../contexts/AuthContext';

const Dashboard: React.FC = () => {
  const { store } = useAuth();
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/reports/dashboard')
      .then(res => res.json())
      .then(d => {
        setData(d);
        setLoading(false);
      });
  }, []);

  if (loading) return <div className="animate-pulse space-y-8">
    <div className="grid grid-cols-4 gap-6">
      {[1,2,3,4].map(i => <div key={i} className="h-32 bg-white rounded-2xl border border-[#e5e5e5]" />)}
    </div>
    <div className="h-96 bg-white rounded-2xl border border-[#e5e5e5]" />
  </div>;

  const stats = [
    { label: 'Vendas Hoje', value: formatCurrency(data.todayTotal, store?.currency), icon: TrendingUp, color: 'text-blue-600', bg: 'bg-blue-50' },
    { label: 'Vendas Mês', value: formatCurrency(data.monthTotal, store?.currency), icon: DollarSign, color: 'text-green-600', bg: 'bg-green-50' },
    { label: 'Stock Baixo', value: data.lowStockCount, icon: AlertTriangle, color: 'text-orange-600', bg: 'bg-orange-50' },
    { label: 'Total Produtos', value: '---', icon: Package, color: 'text-purple-600', bg: 'bg-purple-50' },
  ];

  return (
    <div className="space-y-8">
      <header>
        <h1 className="text-3xl font-bold tracking-tight">Bem-vindo, {store?.name}</h1>
        <p className="text-muted-foreground">Resumo das operações de hoje.</p>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((stat, i) => (
          <div key={i} className="bg-white p-6 rounded-2xl border border-[#e5e5e5] shadow-sm hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between mb-4">
              <div className={cn("p-3 rounded-xl", stat.bg)}>
                <stat.icon className={stat.color} size={24} />
              </div>
              <span className="text-xs font-medium text-green-600 bg-green-50 px-2 py-1 rounded-full flex items-center gap-1">
                <ArrowUpRight size={12} /> 12%
              </span>
            </div>
            <p className="text-sm font-medium text-muted-foreground">{stat.label}</p>
            <h3 className="text-2xl font-bold mt-1">{stat.value}</h3>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 bg-white p-8 rounded-2xl border border-[#e5e5e5] shadow-sm">
          <div className="flex items-center justify-between mb-8">
            <h3 className="text-lg font-bold">Vendas nos Últimos 7 Dias</h3>
            <select className="text-sm border-none bg-[#f5f5f5] rounded-lg px-3 py-1 outline-none">
              <option>Esta Semana</option>
              <option>Semana Passada</option>
            </select>
          </div>
          <div className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={data.salesByDay}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0f0f0" />
                <XAxis dataKey="day" axisLine={false} tickLine={false} tick={{fontSize: 12, fill: '#999'}} dy={10} />
                <YAxis axisLine={false} tickLine={false} tick={{fontSize: 12, fill: '#999'}} tickFormatter={(v) => `STN ${v}`} />
                <Tooltip 
                  cursor={{fill: '#f8f8f8'}}
                  contentStyle={{borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)'}}
                />
                <Bar dataKey="total" fill="#1a1a1a" radius={[4, 4, 0, 0]} barSize={40} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="bg-white p-8 rounded-2xl border border-[#e5e5e5] shadow-sm">
          <h3 className="text-lg font-bold mb-6">Produtos Mais Vendidos</h3>
          <div className="space-y-6">
            {data.topProducts.map((product: any, i: number) => (
              <div key={i} className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 bg-[#f5f5f5] rounded-lg flex items-center justify-center text-xs font-bold">
                    {i + 1}
                  </div>
                  <div>
                    <p className="text-sm font-semibold">{product.name}</p>
                    <p className="text-xs text-muted-foreground">{product.qty} unidades</p>
                  </div>
                </div>
                <div className="w-24 h-2 bg-[#f5f5f5] rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-[#1a1a1a]" 
                    style={{ width: `${(product.qty / data.topProducts[0].qty) * 100}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

import { cn } from '../lib/utils';
export default Dashboard;
