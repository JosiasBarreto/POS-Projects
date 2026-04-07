import React, { useState, useEffect } from 'react';
import { Plus, Search, User, Phone, CreditCard, History, Edit2, Trash2, Mail, MessageCircle, FileText, Building2, Wallet } from 'lucide-react';
import { Client, PriceList } from '../types';
import { formatCurrency } from '../lib/utils';
import { useAuth } from '../contexts/AuthContext';
import Modal from '../components/ui/Modal';
import DeleteConfirmationModal from '../components/inventory/DeleteConfirmationModal';
import ClientAccountModal from '../components/clients/ClientAccountModal';
import { toast } from 'sonner';
import { List } from 'lucide-react';

const Clients: React.FC = () => {
  const { store } = useAuth();
  const [clients, setClients] = useState<Client[]>([]);
  const [priceLists, setPriceLists] = useState<PriceList[]>([]);
  const [search, setSearch] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingClient, setEditingClient] = useState<Partial<Client> | null>(null);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [clientToDelete, setClientToDelete] = useState<number | null>(null);
  
  // Account Modal State
  const [isAccountModalOpen, setIsAccountModalOpen] = useState(false);
  const [selectedClient, setSelectedClient] = useState<Client | null>(null);

  useEffect(() => {
    fetchClients();
    fetchPriceLists();
  }, []);

  const fetchClients = () => fetch('/api/clients').then(res => res.json()).then(setClients);
  const fetchPriceLists = () => fetch('/api/price-lists').then(res => res.json()).then(setPriceLists);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    const method = editingClient?.id ? 'PUT' : 'POST';
    const url = editingClient?.id ? `/api/clients/${editingClient.id}` : '/api/clients';
    
    const res = await fetch(url, {
      method,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(editingClient)
    });
    
    if (res.ok) {
      setIsModalOpen(false);
      setEditingClient(null);
      fetchClients();
      toast.success(editingClient?.id ? 'Cliente atualizado!' : 'Cliente registado!');
    } else {
      toast.error('Erro ao guardar cliente');
    }
  };

  const handleDelete = async () => {
    if (!clientToDelete) return;
    const res = await fetch(`/api/clients/${clientToDelete}`, { method: 'DELETE' });
    if (res.ok) {
      setIsDeleteModalOpen(false);
      setClientToDelete(null);
      fetchClients();
      toast.success('Cliente eliminado!');
    } else {
      toast.error('Erro ao eliminar cliente');
    }
  };

  const filteredClients = clients.filter(c => 
    (c.name || '').toLowerCase().includes((search || '').toLowerCase()) || 
    (c.phone || '').includes(search) ||
    (c.nif || '').includes(search)
  );

  return (
    <div className="space-y-8">
      <header className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Gestão de Clientes</h1>
          <p className="text-muted-foreground">Registe e acompanhe os seus clientes e contas correntes.</p>
        </div>
        <button 
          onClick={() => { setEditingClient({ name: '', phone: '', email: '', whatsapp: '', nif: '', bank_coordinates: '', credit_limit: 0, balance: 0, debt: 0 }); setIsModalOpen(true); }}
          className="bg-indigo-600 text-white px-6 py-3 rounded-xl font-bold flex items-center gap-2 shadow-lg shadow-indigo-200 hover:bg-indigo-700 hover:scale-[1.02] transition-all"
        >
          <Plus size={20} /> Novo Cliente
        </button>
      </header>

      <div className="relative">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground" size={20} />
        <input
          type="text"
          placeholder="Pesquisar por nome, telefone ou NIF..."
          className="w-full pl-12 pr-4 py-3 bg-white border border-slate-200 rounded-xl outline-none font-medium text-slate-900 focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 transition-all shadow-sm"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredClients.map(client => (
          <div key={client.id} className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm hover:shadow-md transition-all">
            <div className="flex items-start justify-between mb-4">
              <div className="w-12 h-12 bg-indigo-50 rounded-2xl flex items-center justify-center text-indigo-600">
                <User size={24} />
              </div>
              <div className="flex items-center gap-1">
                <button 
                  onClick={() => { setEditingClient(client); setIsModalOpen(true); }}
                  title="Editar"
                  className="p-2 hover:bg-slate-100 rounded-xl text-slate-600 transition-colors"
                >
                  <Edit2 size={18} />
                </button>
                <button 
                  onClick={() => { setClientToDelete(client.id); setIsDeleteModalOpen(true); }}
                  title="Eliminar"
                  className="p-2 hover:bg-red-50 rounded-xl text-red-500 transition-colors"
                >
                  <Trash2 size={18} />
                </button>
                <button 
                  onClick={() => { setSelectedClient(client); setIsAccountModalOpen(true); }}
                  title="Conta Corrente"
                  className="p-2 hover:bg-indigo-50 rounded-xl text-indigo-600 transition-colors"
                >
                  <Wallet size={18} />
                </button>
              </div>
            </div>
            
            <h3 className="font-bold text-lg mb-2">{client.name}</h3>
            
            <div className="space-y-1 mb-4">
              {client.phone && (
                <div className="flex items-center gap-2 text-sm text-slate-500 font-medium">
                  <Phone size={14} /> {client.phone}
                </div>
              )}
              {client.whatsapp && (
                <div className="flex items-center gap-2 text-sm text-slate-500 font-medium">
                  <MessageCircle size={14} /> {client.whatsapp}
                </div>
              )}
              {client.email && (
                <div className="flex items-center gap-2 text-sm text-slate-500 font-medium">
                  <Mail size={14} /> {client.email}
                </div>
              )}
              {client.nif && (
                <div className="flex items-center gap-2 text-sm text-slate-500 font-medium">
                  <FileText size={14} /> NIF: {client.nif}
                </div>
              )}
            </div>

            {client.price_list_id && (
              <div className="flex items-center gap-2 text-xs text-indigo-600 font-bold mb-4 bg-indigo-50 w-fit px-2 py-1 rounded-lg">
                <List size={12} /> {priceLists.find(pl => pl.id === client.price_list_id)?.name}
              </div>
            )}

            <div className="pt-4 border-t border-slate-100 grid grid-cols-2 gap-4">
              <div>
                <p className="text-[10px] uppercase font-bold text-slate-400 mb-1">Saldo</p>
                <p className="font-black text-sm text-green-600">{formatCurrency(client.balance, store?.currency)}</p>
              </div>
              <div className="text-right">
                <p className="text-[10px] uppercase font-bold text-slate-400 mb-1">Dívida</p>
                <p className="font-black text-sm text-red-600">{formatCurrency(client.debt, store?.currency)}</p>
              </div>
            </div>
          </div>
        ))}
      </div>

      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={editingClient?.id ? 'Editar Cliente' : 'Novo Cliente'}
        maxWidth="2xl"
        icon={<User size={20} />}
        footer={
          <div className="flex gap-3">
            <button type="button" onClick={() => setIsModalOpen(false)} className="flex-1 py-4 rounded-2xl font-bold text-slate-500 hover:bg-slate-100 transition-all">Cancelar</button>
            <button onClick={handleSave} className="flex-[2] bg-indigo-600 text-white py-4 rounded-2xl font-bold shadow-lg shadow-indigo-200 hover:bg-indigo-700 transition-all">Guardar Cliente</button>
          </div>
        }
      >
        <form onSubmit={handleSave} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="group md:col-span-2">
              <label className="block text-xs font-bold text-slate-500 mb-2 uppercase tracking-wider group-focus-within:text-indigo-600 transition-colors">Nome Completo</label>
              <input
                required
                type="text"
                placeholder="Nome do cliente..."
                className="w-full px-4 py-4 bg-slate-50 border border-slate-200 rounded-2xl outline-none font-bold text-slate-900 focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 transition-all"
                value={editingClient?.name || ''}
                onChange={e => setEditingClient({...editingClient, name: e.target.value})}
              />
            </div>
            
            <div className="group">
              <label className="block text-xs font-bold text-slate-500 mb-2 uppercase tracking-wider group-focus-within:text-indigo-600 transition-colors">Telefone</label>
              <input
                type="text"
                placeholder="+239..."
                className="w-full px-4 py-4 bg-slate-50 border border-slate-200 rounded-2xl outline-none font-bold text-slate-900 focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 transition-all"
                value={editingClient?.phone || ''}
                onChange={e => setEditingClient({...editingClient, phone: e.target.value})}
              />
            </div>

            <div className="group">
              <label className="block text-xs font-bold text-slate-500 mb-2 uppercase tracking-wider group-focus-within:text-indigo-600 transition-colors">WhatsApp</label>
              <input
                type="text"
                placeholder="+239..."
                className="w-full px-4 py-4 bg-slate-50 border border-slate-200 rounded-2xl outline-none font-bold text-slate-900 focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 transition-all"
                value={editingClient?.whatsapp || ''}
                onChange={e => setEditingClient({...editingClient, whatsapp: e.target.value})}
              />
            </div>

            <div className="group md:col-span-2">
              <label className="block text-xs font-bold text-slate-500 mb-2 uppercase tracking-wider group-focus-within:text-indigo-600 transition-colors">Email</label>
              <input
                type="email"
                placeholder="email@exemplo.com"
                className="w-full px-4 py-4 bg-slate-50 border border-slate-200 rounded-2xl outline-none font-bold text-slate-900 focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 transition-all"
                value={editingClient?.email || ''}
                onChange={e => setEditingClient({...editingClient, email: e.target.value})}
              />
            </div>

            <div className="group">
              <label className="block text-xs font-bold text-slate-500 mb-2 uppercase tracking-wider group-focus-within:text-indigo-600 transition-colors">NIF</label>
              <input
                type="text"
                placeholder="Número de Identificação Fiscal"
                className="w-full px-4 py-4 bg-slate-50 border border-slate-200 rounded-2xl outline-none font-bold text-slate-900 focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 transition-all"
                value={editingClient?.nif || ''}
                onChange={e => setEditingClient({...editingClient, nif: e.target.value})}
              />
            </div>

            <div className="group">
              <label className="block text-xs font-bold text-slate-500 mb-2 uppercase tracking-wider group-focus-within:text-indigo-600 transition-colors">Limite de Crédito ({store?.currency})</label>
              <input
                type="number"
                step="0.01"
                min="0"
                className="w-full px-4 py-4 bg-slate-50 border border-slate-200 rounded-2xl outline-none font-bold text-slate-900 focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 transition-all"
                value={editingClient?.credit_limit || 0}
                onChange={e => setEditingClient({...editingClient, credit_limit: parseFloat(e.target.value)})}
              />
            </div>

            <div className="group md:col-span-2">
              <label className="block text-xs font-bold text-slate-500 mb-2 uppercase tracking-wider group-focus-within:text-indigo-600 transition-colors">Coordenadas Bancárias (IBAN/NIB)</label>
              <input
                type="text"
                placeholder="STN..."
                className="w-full px-4 py-4 bg-slate-50 border border-slate-200 rounded-2xl outline-none font-bold text-slate-900 focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 transition-all"
                value={editingClient?.bank_coordinates || ''}
                onChange={e => setEditingClient({...editingClient, bank_coordinates: e.target.value})}
              />
            </div>

            <div className="group md:col-span-2">
              <label className="block text-xs font-bold text-slate-500 mb-2 uppercase tracking-wider group-focus-within:text-indigo-600 transition-colors">Lista de Preços (Opcional)</label>
              <div className="relative">
                <List size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
                <select
                  className="w-full pl-12 pr-4 py-4 bg-slate-50 border border-slate-200 rounded-2xl outline-none font-bold text-slate-900 focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 transition-all appearance-none cursor-pointer"
                  value={editingClient?.price_list_id || ''}
                  onChange={e => setEditingClient({...editingClient, price_list_id: e.target.value ? parseInt(e.target.value) : null})}
                >
                  <option value="">Preço Padrão (Retalho)</option>
                  {priceLists.map(pl => <option key={pl.id} value={pl.id}>{pl.name}</option>)}
                </select>
              </div>
            </div>
          </div>
        </form>
      </Modal>

      <DeleteConfirmationModal
        isOpen={isDeleteModalOpen}
        onClose={() => setIsDeleteModalOpen(false)}
        onConfirm={handleDelete}
        title="Eliminar Cliente"
        description="Tem a certeza que deseja eliminar este cliente? Esta ação não pode ser desfeita."
      />

      {selectedClient && (
        <ClientAccountModal
          isOpen={isAccountModalOpen}
          onClose={() => setIsAccountModalOpen(false)}
          client={selectedClient}
          onUpdate={fetchClients}
        />
      )}
    </div>
  );
};

export default Clients;
