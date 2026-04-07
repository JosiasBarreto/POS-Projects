import React, { useState, useEffect } from 'react';
import { 
  Plus, 
  Search, 
  Edit2, 
  Trash2, 
  User as UserIcon,
  X,
  Shield,
  Key
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { cn } from '../lib/utils';
import { toast } from 'sonner';
import Modal from '../components/ui/Modal';
import DeleteConfirmationModal from '../components/inventory/DeleteConfirmationModal';

const Users: React.FC = () => {
  const { user: currentUser } = useAuth();
  const [users, setUsers] = useState<any[]>([]);
  const [search, setSearch] = useState('');
  const [isUserModalOpen, setIsUserModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<any | null>(null);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [userToDelete, setUserToDelete] = useState<number | null>(null);

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = () => fetch('/api/users').then(res => res.json()).then(setUsers);

  const handleSaveUser = async (e: React.FormEvent) => {
    e.preventDefault();
    const method = editingUser?.id ? 'PUT' : 'POST';
    const url = editingUser?.id ? `/api/users/${editingUser.id}` : '/api/users';
    
    const res = await fetch(url, {
      method,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(editingUser)
    });

    if (res.ok) {
      setIsUserModalOpen(false);
      setEditingUser(null);
      fetchUsers();
      toast.success(editingUser?.id ? 'Funcionário atualizado!' : 'Funcionário criado!');
    } else {
      const data = await res.json();
      toast.error(data.error || 'Erro ao guardar funcionário.');
    }
  };

  const deleteUser = async (id: number) => {
    const res = await fetch(`/api/users/${id}`, { method: 'DELETE' });
    if (res.ok) {
      fetchUsers();
      toast.success('Funcionário eliminado!');
    } else {
      toast.error('Erro ao eliminar funcionário.');
    }
    setIsDeleteModalOpen(false);
    setUserToDelete(null);
  };

  const filteredUsers = users.filter(u => {
    const matchesSearch = (u.name || '').toLowerCase().includes((search || '').toLowerCase()) ||
                          (u.username || '').toLowerCase().includes((search || '').toLowerCase());
    
    // Supervisors cannot see admins
    if (currentUser?.role === 'supervisor' && u.role === 'admin') return false;
    
    return matchesSearch;
  });

  return (
    <div className="space-y-8">
      <header className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Gestão de Funcionários</h1>
          <p className="text-muted-foreground">Gerencie os acessos e permissões da sua equipa.</p>
        </div>
        <button 
          onClick={() => { setEditingUser({ role: 'cashier' }); setIsUserModalOpen(true); }}
          className="bg-[#1a1a1a] text-white px-6 py-3 rounded-xl font-bold flex items-center gap-2 hover:scale-[1.02] transition-transform shadow-lg shadow-black/10"
        >
          <Plus size={20} /> Novo Funcionário
        </button>
      </header>

      <div className="relative">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground" size={20} />
        <input
          type="text"
          placeholder="Pesquisar por nome ou utilizador..."
          className="w-full pl-12 pr-4 py-4 bg-white border border-[#e5e5e5] rounded-2xl outline-none focus:ring-2 focus:ring-[#1a1a1a]/10 shadow-sm"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredUsers.map(user => (
          <div key={user.id} className="bg-white p-6 rounded-[2rem] border border-[#e5e5e5] shadow-sm hover:shadow-md transition-all group">
            <div className="flex items-start justify-between mb-6">
              <div className="w-14 h-14 bg-[#f5f5f5] rounded-2xl flex items-center justify-center text-[#1a1a1a] group-hover:bg-[#1a1a1a] group-hover:text-white transition-colors">
                <UserIcon size={28} />
              </div>
              <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                <button 
                  onClick={() => { setEditingUser(user); setIsUserModalOpen(true); }}
                  className="p-2 hover:bg-gray-100 rounded-xl text-[#1a1a1a]"
                >
                  <Edit2 size={18} />
                </button>
                {user.id !== currentUser?.id && (
                  <button 
                    onClick={() => { setUserToDelete(user.id); setIsDeleteModalOpen(true); }}
                    className="p-2 hover:bg-red-50 rounded-xl text-red-500"
                  >
                    <Trash2 size={18} />
                  </button>
                )}
              </div>
            </div>
            
            <div className="space-y-1">
              <h3 className="font-bold text-lg">{user.name}</h3>
              <p className="text-sm text-muted-foreground flex items-center gap-2">
                <Key size={14} /> @{user.username}
              </p>
            </div>

            <div className="mt-6 pt-6 border-t border-[#f5f5f5] flex items-center justify-between">
              <div className={cn(
                "px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider",
                user.role === 'admin' ? "bg-indigo-50 text-indigo-600" : 
                user.role === 'supervisor' ? "bg-amber-50 text-amber-600" :
                "bg-emerald-50 text-emerald-600"
              )}>
                {user.role === 'admin' ? 'Administrador' : 
                 user.role === 'supervisor' ? 'Supervisor' : 
                 'Operador de Caixa'}
              </div>
              {user.role === 'admin' && <Shield size={16} className="text-indigo-600" />}
            </div>
          </div>
        ))}
      </div>

      {/* User Modal */}
      <Modal
        isOpen={isUserModalOpen}
        onClose={() => setIsUserModalOpen(false)}
        title={editingUser?.id ? 'Editar Funcionário' : 'Novo Funcionário'}
        maxWidth="lg"
        icon={<UserIcon size={20} />}
        footer={
          <div className="flex gap-3">
            <button type="button" onClick={() => setIsUserModalOpen(false)} className="flex-1 py-4 rounded-2xl font-bold text-slate-500 hover:bg-slate-100 transition-all">Cancelar</button>
            <button onClick={handleSaveUser} className="flex-[2] bg-indigo-600 text-white py-4 rounded-2xl font-bold shadow-lg shadow-indigo-200 hover:bg-indigo-700 transition-all">Guardar Funcionário</button>
          </div>
        }
      >
        <form onSubmit={handleSaveUser} className="space-y-6">
          <div className="group">
            <label className="block text-xs font-bold text-slate-500 mb-2 uppercase tracking-wider group-focus-within:text-indigo-600 transition-colors">Nome Completo</label>
            <input
              required
              type="text"
              placeholder="Nome do funcionário..."
              className="w-full px-4 py-4 bg-slate-50 border border-slate-200 rounded-2xl outline-none font-bold text-slate-900 focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 transition-all"
              value={editingUser?.name || ''}
              onChange={e => setEditingUser({...editingUser, name: e.target.value})}
            />
          </div>
          <div className="grid grid-cols-2 gap-6">
            <div className="group">
              <label className="block text-xs font-bold text-slate-500 mb-2 uppercase tracking-wider group-focus-within:text-indigo-600 transition-colors">Utilizador</label>
              <input
                required
                type="text"
                placeholder="username"
                className="w-full px-4 py-4 bg-slate-50 border border-slate-200 rounded-2xl outline-none font-bold text-slate-900 focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 transition-all disabled:opacity-50"
                value={editingUser?.username || ''}
                onChange={e => setEditingUser({...editingUser, username: e.target.value})}
                disabled={!!editingUser?.id}
              />
            </div>
            <div className="group">
              <label className="block text-xs font-bold text-slate-500 mb-2 uppercase tracking-wider group-focus-within:text-indigo-600 transition-colors">Cargo</label>
                <select
                  className="w-full px-4 py-4 bg-slate-50 border border-slate-200 rounded-2xl outline-none font-bold text-slate-900 focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 transition-all appearance-none cursor-pointer"
                  value={editingUser?.role || 'cashier'}
                  onChange={e => setEditingUser({...editingUser, role: e.target.value})}
                >
                  <option value="cashier">Operador de Caixa</option>
                  <option value="supervisor">Supervisor</option>
                  {currentUser?.role === 'admin' && <option value="admin">Administrador</option>}
                </select>
            </div>
          </div>
          <div className="group">
            <label className="block text-xs font-bold text-slate-500 mb-2 uppercase tracking-wider group-focus-within:text-indigo-600 transition-colors">Palavra-passe {editingUser?.id && '(Opcional)'}</label>
            <input
              required={!editingUser?.id}
              type="password"
              placeholder={editingUser?.id ? "Deixe em branco para manter..." : "Defina uma senha..."}
              className="w-full px-4 py-4 bg-slate-50 border border-slate-200 rounded-2xl outline-none font-bold text-slate-900 focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 transition-all"
              value={editingUser?.password || ''}
              onChange={e => setEditingUser({...editingUser, password: e.target.value})}
            />
          </div>
        </form>
      </Modal>

      <DeleteConfirmationModal 
        isOpen={isDeleteModalOpen}
        onClose={() => { setIsDeleteModalOpen(false); setUserToDelete(null); }}
        onConfirm={() => userToDelete && deleteUser(userToDelete)}
        title="Eliminar Funcionário"
        description="Tem a certeza que deseja eliminar este funcionário? Esta ação não pode ser revertida."
      />
    </div>
  );
};

export default Users;
