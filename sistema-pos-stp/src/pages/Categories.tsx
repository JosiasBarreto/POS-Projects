import React, { useState, useEffect } from 'react';
import { Plus, Search, Tag, Edit2, Trash2 } from 'lucide-react';
import { Category } from '../types';

const Categories: React.FC = () => {
  const [categories, setCategories] = useState<Category[]>([]);
  const [search, setSearch] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<Partial<Category> | null>(null);

  useEffect(() => {
    fetchCategories();
  }, []);

  const fetchCategories = () => fetch('/api/categories').then(res => res.json()).then(setCategories);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    const method = editingCategory?.id ? 'PUT' : 'POST';
    const url = editingCategory?.id ? `/api/categories/${editingCategory.id}` : '/api/categories';
    
    const res = await fetch(url, {
      method,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(editingCategory)
    });

    if (res.ok) {
      setIsModalOpen(false);
      setEditingCategory(null);
      fetchCategories();
    }
  };

  const filteredCategories = categories.filter(c => 
    (c.name || '').toLowerCase().includes((search || '').toLowerCase())
  );

  return (
    <div className="space-y-8">
      <header className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Categorias</h1>
          <p className="text-muted-foreground">Organize seus produtos por categorias.</p>
        </div>
        <button 
          onClick={() => { setEditingCategory({}); setIsModalOpen(true); }}
          className="bg-[#1a1a1a] text-white px-6 py-3 rounded-xl font-bold flex items-center gap-2"
        >
          <Plus size={20} /> Nova Categoria
        </button>
      </header>

      <div className="relative">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground" size={20} />
        <input
          type="text"
          placeholder="Pesquisar por nome..."
          className="w-full pl-12 pr-4 py-3 bg-white border border-[#e5e5e5] rounded-xl outline-none focus:ring-2 focus:ring-[#1a1a1a]/10"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {filteredCategories.map(category => (
          <div key={category.id} className="bg-white p-6 rounded-3xl border border-[#e5e5e5] shadow-sm hover:shadow-md transition-all group">
            <div className="flex items-start justify-between mb-4">
              <div className="w-10 h-10 bg-[#f5f5f5] rounded-xl flex items-center justify-center text-[#1a1a1a]">
                <Tag size={20} />
              </div>
              <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                <button onClick={() => { setEditingCategory(category); setIsModalOpen(true); }} className="p-2 hover:bg-[#f5f5f5] rounded-lg text-blue-600">
                  <Edit2 size={16} />
                </button>
                <button className="p-2 hover:bg-[#f5f5f5] rounded-lg text-red-500">
                  <Trash2 size={16} />
                </button>
              </div>
            </div>
            <h3 className="font-bold text-lg">{category.name}</h3>
          </div>
        ))}
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white w-full max-w-md rounded-3xl p-8 shadow-2xl">
            <h2 className="text-2xl font-bold mb-6">{editingCategory?.id ? 'Editar Categoria' : 'Nova Categoria'}</h2>
            <form onSubmit={handleSave} className="space-y-4">
              <div>
                <label className="block text-sm font-bold mb-2">Nome da Categoria</label>
                <input
                  required
                  type="text"
                  className="w-full p-3 bg-[#f5f5f5] rounded-xl outline-none"
                  value={editingCategory?.name || ''}
                  onChange={e => setEditingCategory({...editingCategory, name: e.target.value})}
                />
              </div>
              <div className="flex justify-end gap-4 mt-6">
                <button 
                  type="button" 
                  onClick={() => { setIsModalOpen(false); setEditingCategory(null); }}
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

export default Categories;
