import React, { useState, useEffect } from 'react';
import { Plus, Search, Truck, Phone, Mail, Edit2, Trash2 } from 'lucide-react';
import { formatCurrency } from '../lib/utils';

interface Supplier {
  id: number;
  name: string;
  phone: string;
  email: string;
}

const Suppliers: React.FC = () => {
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [search, setSearch] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingSupplier, setEditingSupplier] = useState<Partial<Supplier> | null>(null);

  useEffect(() => {
    fetchSuppliers();
  }, []);

  const fetchSuppliers = () => fetch('/api/suppliers').then(res => res.json()).then(setSuppliers);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    const method = editingSupplier?.id ? 'PUT' : 'POST';
    const url = editingSupplier?.id ? `/api/suppliers/${editingSupplier.id}` : '/api/suppliers';
    
    const res = await fetch(url, {
      method,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(editingSupplier)
    });

    if (res.ok) {
      setIsModalOpen(false);
      setEditingSupplier(null);
      fetchSuppliers();
    }
  };

  const filteredSuppliers = suppliers.filter(s => 
    (s.name || '').toLowerCase().includes((search || '').toLowerCase()) || 
    (s.email || '').toLowerCase().includes((search || '').toLowerCase())
  );

  return (
    <div className="space-y-8">
      <header className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Fornecedores</h1>
          <p className="text-muted-foreground">Gerencie seus parceiros e fornecedores de stock.</p>
        </div>
        <button 
          onClick={() => { setEditingSupplier({}); setIsModalOpen(true); }}
          className="bg-[#1a1a1a] text-white px-6 py-3 rounded-xl font-bold flex items-center gap-2"
        >
          <Plus size={20} /> Novo Fornecedor
        </button>
      </header>

      <div className="relative">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground" size={20} />
        <input
          type="text"
          placeholder="Pesquisar por nome ou email..."
          className="w-full pl-12 pr-4 py-3 bg-white border border-[#e5e5e5] rounded-xl outline-none focus:ring-2 focus:ring-[#1a1a1a]/10"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredSuppliers.map(supplier => (
          <div key={supplier.id} className="bg-white p-6 rounded-3xl border border-[#e5e5e5] shadow-sm hover:shadow-md transition-all group">
            <div className="flex items-start justify-between mb-6">
              <div className="w-12 h-12 bg-[#f5f5f5] rounded-2xl flex items-center justify-center text-[#1a1a1a]">
                <Truck size={24} />
              </div>
              <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                <button 
                  onClick={() => { setEditingSupplier(supplier); setIsModalOpen(true); }} 
                  title="Editar"
                  className="p-2 hover:bg-gray-100 rounded-xl text-[#1a1a1a] transition-colors"
                >
                  <Edit2 size={18} />
                </button>
                <button 
                  title="Eliminar"
                  className="p-2 hover:bg-red-50 rounded-xl text-red-500 transition-colors"
                >
                  <Trash2 size={18} />
                </button>
              </div>
            </div>
            
            <h3 className="font-bold text-lg mb-4">{supplier.name}</h3>
            
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Phone size={14} /> {supplier.phone || 'N/A'}
              </div>
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Mail size={14} /> {supplier.email || 'N/A'}
              </div>
            </div>
          </div>
        ))}
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white w-full max-w-md rounded-3xl p-8 shadow-2xl">
            <h2 className="text-2xl font-bold mb-6">{editingSupplier?.id ? 'Editar Fornecedor' : 'Novo Fornecedor'}</h2>
            <form onSubmit={handleSave} className="space-y-4">
              <div>
                <label className="block text-sm font-bold mb-2">Nome do Fornecedor</label>
                <input
                  required
                  type="text"
                  className="w-full p-3 bg-[#f5f5f5] rounded-xl outline-none"
                  value={editingSupplier?.name || ''}
                  onChange={e => setEditingSupplier({...editingSupplier, name: e.target.value})}
                />
              </div>
              <div>
                <label className="block text-sm font-bold mb-2">Telefone</label>
                <input
                  type="text"
                  className="w-full p-3 bg-[#f5f5f5] rounded-xl outline-none"
                  value={editingSupplier?.phone || ''}
                  onChange={e => setEditingSupplier({...editingSupplier, phone: e.target.value})}
                />
              </div>
              <div>
                <label className="block text-sm font-bold mb-2">Email</label>
                <input
                  type="email"
                  className="w-full p-3 bg-[#f5f5f5] rounded-xl outline-none"
                  value={editingSupplier?.email || ''}
                  onChange={e => setEditingSupplier({...editingSupplier, email: e.target.value})}
                />
              </div>
              <div className="flex justify-end gap-4 mt-6">
                <button 
                  type="button" 
                  onClick={() => { setIsModalOpen(false); setEditingSupplier(null); }}
                  className="px-6 py-3 rounded-xl font-bold text-[#666] hover:bg-[#f5f5f5]"
                >
                  Cancelar
                </button>
                <button 
                  type="submit"
                  className="bg-[#1a1a1a] text-white px-8 py-3 rounded-xl font-bold"
                >
                  Guardar
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Suppliers;
