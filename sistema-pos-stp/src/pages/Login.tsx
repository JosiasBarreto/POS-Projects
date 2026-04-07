import React, { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { Store as StoreIcon, Lock, ShieldCheck, AlertCircle } from 'lucide-react';

const Login: React.FC = () => {
  const { login } = useAuth();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    
    try {
      const res = await fetch('/api/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password })
      });
      
      if (res.ok) {
        const user = await res.json();
        login(user);
      } else {
        setError('Credenciais inválidas. Tente novamente.');
      }
    } catch (err) {
      setError('Erro ao conectar ao servidor.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#f5f5f5] flex items-center justify-center p-6 font-sans">
      <div className="w-full max-w-md">
        <div className="text-center mb-10">
          <div className="w-20 h-20 bg-[#1a1a1a] rounded-3xl flex items-center justify-center text-white mx-auto mb-6 shadow-2xl shadow-black/20">
            <StoreIcon size={40} />
          </div>
          <h1 className="text-3xl font-black tracking-tight text-[#1a1a1a]">Sistema POS STP</h1>
          <p className="text-muted-foreground mt-2">Gestão de Vendas Inteligente</p>
        </div>

        <div className="bg-white p-10 rounded-[2.5rem] shadow-xl border border-[#e5e5e5]">
          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label className="block text-sm font-bold text-[#1a1a1a] mb-2">Utilizador</label>
              <div className="relative">
                <input
                  type="text"
                  required
                  className="w-full p-4 bg-[#f9f9f9] border-none rounded-2xl outline-none focus:ring-2 focus:ring-[#1a1a1a]/10 transition-all"
                  placeholder="Seu nome de utilizador"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-bold text-[#1a1a1a] mb-2">Palavra-passe</label>
              <div className="relative">
                <input
                  type="password"
                  required
                  className="w-full p-4 bg-[#f9f9f9] border-none rounded-2xl outline-none focus:ring-2 focus:ring-[#1a1a1a]/10 transition-all"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
                <Lock className="absolute right-4 top-1/2 -translate-y-1/2 text-[#ccc]" size={20} />
              </div>
            </div>

            {error && (
              <div className="p-4 bg-red-50 text-red-600 rounded-2xl text-sm font-medium flex items-center gap-2">
                <AlertCircle size={18} />
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-[#1a1a1a] text-white py-4 rounded-2xl font-bold text-lg shadow-lg shadow-black/10 hover:scale-[1.02] active:scale-[0.98] transition-all disabled:opacity-50"
            >
              {loading ? 'A entrar...' : 'Entrar no Sistema'}
            </button>
          </form>
        </div>

        <div className="mt-8 flex items-center justify-center gap-2 text-muted-foreground">
          <ShieldCheck size={16} />
          <span className="text-xs font-medium uppercase tracking-widest">Acesso Seguro</span>
        </div>
      </div>
    </div>
  );
};

export default Login;
