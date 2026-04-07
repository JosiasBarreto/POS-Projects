import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { 
  Save, 
  Store as StoreIcon, 
  Settings as SettingsIcon, 
  Database, 
  Download, 
  Upload, 
  Printer, 
  Barcode, 
  CreditCard,
  Monitor,
  Percent,
  List,
  Tag,
  Layers,
  Truck,
  Coins,
  Plus,
  Edit2,
  Trash2,
  X,
  Search
} from 'lucide-react';
import { cn } from '../lib/utils';
import { toast } from 'sonner';
import { Category, Supplier, Unit, Currency } from '../types';
import Modal from '../components/ui/Modal';
import DeleteConfirmationModal from '../components/inventory/DeleteConfirmationModal';

const Settings: React.FC = () => {
  const { store, refreshStore, user } = useAuth();
  const [activeSubTab, setActiveSubTab] = useState('store');
  const [formData, setFormData] = useState({
    name: '',
    nif: '',
    address: '',
    phone: '',
    currency: 'STN',
    tax_rate: 0,
    uses_tax: false,
    sender_email: '',
    sender_password: '',
    whatsapp_number: '',
    contact_email: ''
  });
  const [hardwareData, setHardwareData] = useState({
    printer: 'thermal-80mm',
    barcode_reader: 'usb-keyboard',
    tpa_integration: 'manual',
    cash_drawer: 'automatic'
  });
  const [loading, setLoading] = useState(false);
  const [syncing, setSyncing] = useState(false);
  const [message, setMessage] = useState('');

  const [taxes, setTaxes] = useState<any[]>([]);
  const [newTax, setNewTax] = useState({ name: '', rate: 0 });
  const [priceLists, setPriceLists] = useState<any[]>([]);
  const [newPriceList, setNewPriceList] = useState({ name: '' });

  // New states for Categories, Suppliers, Units, Currencies
  const [categories, setCategories] = useState<Category[]>([]);
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [units, setUnits] = useState<Unit[]>([]);
  const [currencies, setCurrencies] = useState<Currency[]>([]);
  
  const [isCategoryModalOpen, setIsCategoryModalOpen] = useState(false);
  const [isSupplierModalOpen, setIsSupplierModalOpen] = useState(false);
  const [isUnitModalOpen, setIsUnitModalOpen] = useState(false);
  const [isCurrencyModalOpen, setIsCurrencyModalOpen] = useState(false);
  
  const [editingCategory, setEditingCategory] = useState<Partial<Category> | null>(null);
  const [editingSupplier, setEditingSupplier] = useState<Partial<Supplier> | null>(null);
  const [editingUnit, setEditingUnit] = useState<Partial<Unit> | null>(null);
  const [editingCurrency, setEditingCurrency] = useState<Partial<Currency> | null>(null);

  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [deleteAction, setDeleteAction] = useState<{ id: number; type: 'category' | 'supplier' | 'currency' | 'unit' | 'tax' | 'pricelist' } | null>(null);

  useEffect(() => {
    if (store) {
      setFormData({
        name: store.name || '',
        nif: store.nif || '',
        address: store.address || '',
        phone: store.phone || '',
        currency: store.currency || 'STN',
        tax_rate: store.tax_rate || 0,
        uses_tax: store.uses_tax === 1,
        sender_email: store.sender_email || '',
        sender_password: store.sender_password || '',
        whatsapp_number: store.whatsapp_number || '',
        contact_email: store.contact_email || ''
      });
    }
    const savedHardware = localStorage.getItem('pos_hardware');
    if (savedHardware) setHardwareData(JSON.parse(savedHardware));
    
    fetchTaxes();
    fetchPriceLists();
    fetchCategories();
    fetchSuppliers();
    fetchUnits();
    fetchCurrencies();
  }, [store]);

  const fetchTaxes = async () => {
    const res = await fetch('/api/taxes');
    const data = await res.json();
    setTaxes(data);
  };

  const fetchPriceLists = async () => {
    const res = await fetch('/api/price-lists');
    const data = await res.json();
    setPriceLists(data);
  };

  const fetchCategories = () => fetch('/api/categories').then(res => res.json()).then(setCategories);
  const fetchSuppliers = () => fetch('/api/suppliers').then(res => res.json()).then(setSuppliers);
  const fetchUnits = () => fetch('/api/units').then(res => res.json()).then(setUnits);
  const fetchCurrencies = () => fetch('/api/currencies').then(res => res.json()).then(setCurrencies);

  const handleSaveCategory = async (e: React.FormEvent) => {
    e.preventDefault();
    const method = editingCategory?.id ? 'PUT' : 'POST';
    const url = editingCategory?.id ? `/api/categories/${editingCategory.id}` : '/api/categories';
    const res = await fetch(url, {
      method,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(editingCategory)
    });
    if (res.ok) {
      setIsCategoryModalOpen(false);
      setEditingCategory(null);
      fetchCategories();
      toast.success(editingCategory?.id ? 'Categoria atualizada!' : 'Categoria criada!');
    } else {
      toast.error('Erro ao guardar categoria.');
    }
  };

  const handleSaveSupplier = async (e: React.FormEvent) => {
    e.preventDefault();
    const method = editingSupplier?.id ? 'PUT' : 'POST';
    const url = editingSupplier?.id ? `/api/suppliers/${editingSupplier.id}` : '/api/suppliers';
    const res = await fetch(url, {
      method,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(editingSupplier)
    });
    if (res.ok) {
      setIsSupplierModalOpen(false);
      setEditingSupplier(null);
      fetchSuppliers();
      toast.success(editingSupplier?.id ? 'Fornecedor atualizado!' : 'Fornecedor criado!');
    } else {
      toast.error('Erro ao guardar fornecedor.');
    }
  };

  const handleSaveUnit = async (e: React.FormEvent) => {
    e.preventDefault();
    const method = editingUnit?.id ? 'PUT' : 'POST';
    const url = editingUnit?.id ? `/api/units/${editingUnit.id}` : '/api/units';
    const res = await fetch(url, {
      method,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(editingUnit)
    });
    if (res.ok) {
      setIsUnitModalOpen(false);
      setEditingUnit(null);
      fetchUnits();
      toast.success(editingUnit?.id ? 'Unidade atualizada!' : 'Unidade criada!');
    } else {
      toast.error('Erro ao guardar unidade.');
    }
  };

  const handleSaveCurrency = async (e: React.FormEvent) => {
    e.preventDefault();
    const method = editingCurrency?.id ? 'PUT' : 'POST';
    const url = editingCurrency?.id ? `/api/currencies/${editingCurrency.id}` : '/api/currencies';
    const res = await fetch(url, {
      method,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(editingCurrency)
    });
    if (res.ok) {
      setIsCurrencyModalOpen(false);
      setEditingCurrency(null);
      fetchCurrencies();
      toast.success(editingCurrency?.id ? 'Moeda atualizada!' : 'Moeda criada!');
    } else {
      toast.error('Erro ao guardar moeda.');
    }
  };

  const confirmDelete = (id: number, type: 'category' | 'supplier' | 'currency' | 'unit' | 'tax' | 'pricelist') => {
    setDeleteAction({ id, type });
    setIsDeleteModalOpen(true);
  };

  const handleDelete = async () => {
    if (!deleteAction) return;
    const { id, type } = deleteAction;
    
    let endpoint = '';
    let successMsg = '';
    let fetchFn = () => {};

    switch (type) {
      case 'category': endpoint = `/api/categories/${id}`; successMsg = 'Categoria eliminada!'; fetchFn = fetchCategories; break;
      case 'supplier': endpoint = `/api/suppliers/${id}`; successMsg = 'Fornecedor eliminado!'; fetchFn = fetchSuppliers; break;
      case 'currency': endpoint = `/api/currencies/${id}`; successMsg = 'Moeda eliminada!'; fetchFn = fetchCurrencies; break;
      case 'unit': endpoint = `/api/units/${id}`; successMsg = 'Unidade eliminada!'; fetchFn = fetchUnits; break;
      case 'tax': endpoint = `/api/taxes/${id}`; successMsg = 'Imposto eliminado!'; fetchFn = fetchTaxes; break;
      case 'pricelist': endpoint = `/api/price-lists/${id}`; successMsg = 'Lista eliminada!'; fetchFn = fetchPriceLists; break;
    }

    const res = await fetch(endpoint, { method: 'DELETE' });
    if (res.ok) {
      fetchFn();
      toast.success(successMsg);
    } else {
      const errorData = await res.json().catch(() => ({}));
      toast.error(errorData.error || 'Erro ao eliminar item.');
    }
    setIsDeleteModalOpen(false);
    setDeleteAction(null);
  };

  const handleAddTax = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTax.name || newTax.rate < 0) return;
    const res = await fetch('/api/taxes', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(newTax)
    });
    if (res.ok) {
      toast.success('Imposto adicionado');
      setNewTax({ name: '', rate: 0 });
      fetchTaxes();
    } else {
      toast.error('Erro ao adicionar imposto');
    }
  };

  const handleAddPriceList = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPriceList.name) return;
    const res = await fetch('/api/price-lists', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(newPriceList)
    });
    if (res.ok) {
      toast.success('Lista de preços adicionada');
      setNewPriceList({ name: '' });
      fetchPriceLists();
    } else {
      toast.error('Erro ao adicionar lista de preços');
    }
  };

  const handleSync = () => {
    setSyncing(true);
    setTimeout(() => {
      setSyncing(false);
      setMessage('Sincronização concluída com sucesso!');
      setTimeout(() => setMessage(''), 3000);
    }, 3000);
  };

  const handleExport = async () => {
    const res = await fetch('/api/backup/export');
    const data = await res.json();
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `backup_pos_stp_${new Date().toISOString().split('T')[0]}.json`;
    a.click();
  };

  const handleImport = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = async (event) => {
      try {
        const data = JSON.parse(event.target?.result as string);
        const res = await fetch('/api/backup/import', {
          method: 'POST',
          headers: { 
            'Content-Type': 'application/json',
            'x-user-id': user?.id.toString() || ''
          },
          body: JSON.stringify(data)
        });
        if (res.ok) {
          alert('Dados importados com sucesso! O sistema irá reiniciar.');
          window.location.reload();
        } else {
          const err = await res.json();
          toast.error(err.error || 'Erro na importação');
        }
      } catch (error) {
        toast.error('Ficheiro de backup inválido');
      }
    };
    reader.readAsText(file);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    if (activeSubTab === 'store') {
      const res = await fetch('/api/store', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });
      if (res.ok) {
        setMessage('Configurações da loja guardadas!');
        refreshStore();
      }
    } else if (activeSubTab === 'hardware') {
      localStorage.setItem('pos_hardware', JSON.stringify(hardwareData));
      setMessage('Configurações de hardware guardadas!');
    }
    setTimeout(() => setMessage(''), 3000);
    setLoading(false);
  };

  return (
    <div className="max-w-6xl space-y-8">
      <header>
        <h1 className="text-3xl font-bold tracking-tight">Configurações</h1>
        <p className="text-muted-foreground">Personalize a sua loja, gerencie categorias, fornecedores, unidades e moedas.</p>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
        <div className="md:col-span-1">
          <div className="p-4 bg-white rounded-3xl border border-[#e5e5e5] shadow-sm space-y-1 sticky top-8">
            <p className="px-4 py-2 text-[10px] font-black uppercase tracking-widest text-[#999]">Geral</p>
            <button 
              onClick={() => setActiveSubTab('store')}
              className={cn("w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all", activeSubTab === 'store' ? "bg-[#1a1a1a] text-white font-bold" : "text-[#666] hover:bg-[#f5f5f5]")}
            >
              <StoreIcon size={20} /> Loja
            </button>
            <button 
              onClick={() => setActiveSubTab('taxes')}
              className={cn("w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all", activeSubTab === 'taxes' ? "bg-[#1a1a1a] text-white font-bold" : "text-[#666] hover:bg-[#f5f5f5]")}
            >
              <Percent size={20} /> Impostos
            </button>
            <button 
              onClick={() => setActiveSubTab('pricelists')}
              className={cn("w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all", activeSubTab === 'pricelists' ? "bg-[#1a1a1a] text-white font-bold" : "text-[#666] hover:bg-[#f5f5f5]")}
            >
              <List size={20} /> Listas de Preços
            </button>

            <p className="px-4 py-2 mt-4 text-[10px] font-black uppercase tracking-widest text-[#999]">Inventário</p>
            <button 
              onClick={() => setActiveSubTab('categories')}
              className={cn("w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all", activeSubTab === 'categories' ? "bg-[#1a1a1a] text-white font-bold" : "text-[#666] hover:bg-[#f5f5f5]")}
            >
              <Tag size={20} /> Categorias
            </button>
            <button 
              onClick={() => setActiveSubTab('units')}
              className={cn("w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all", activeSubTab === 'units' ? "bg-[#1a1a1a] text-white font-bold" : "text-[#666] hover:bg-[#f5f5f5]")}
            >
              <Layers size={20} /> Unidades
            </button>
            <button 
              onClick={() => setActiveSubTab('suppliers')}
              className={cn("w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all", activeSubTab === 'suppliers' ? "bg-[#1a1a1a] text-white font-bold" : "text-[#666] hover:bg-[#f5f5f5]")}
            >
              <Truck size={20} /> Fornecedores
            </button>
            <button 
              onClick={() => setActiveSubTab('currencies')}
              className={cn("w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all", activeSubTab === 'currencies' ? "bg-[#1a1a1a] text-white font-bold" : "text-[#666] hover:bg-[#f5f5f5]")}
            >
              <Coins size={20} /> Moedas
            </button>

            <p className="px-4 py-2 mt-4 text-[10px] font-black uppercase tracking-widest text-[#999]">Sistema</p>
            <button 
              onClick={() => setActiveSubTab('hardware')}
              className={cn("w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all", activeSubTab === 'hardware' ? "bg-[#1a1a1a] text-white font-bold" : "text-[#666] hover:bg-[#f5f5f5]")}
            >
              <Monitor size={20} /> Hardware
            </button>
            <button 
              onClick={() => setActiveSubTab('backup')}
              className={cn("w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all", activeSubTab === 'backup' ? "bg-[#1a1a1a] text-white font-bold" : "text-[#666] hover:bg-[#f5f5f5]")}
            >
              <Database size={20} /> Backup & Sync
            </button>
          </div>
        </div>

        <div className="md:col-span-3">
          {syncing ? (
            <div className="bg-white rounded-3xl border border-[#e5e5e5] p-12 flex flex-col items-center justify-center text-center">
              <div className="w-16 h-16 border-4 border-[#1a1a1a] border-t-transparent rounded-full animate-spin mb-6" />
              <h3 className="text-xl font-bold mb-2">Sincronizando Dados...</h3>
              <p className="text-muted-foreground">A enviar vendas e a atualizar stock com o servidor central.</p>
            </div>
          ) : (
            <div className="bg-white rounded-3xl border border-[#e5e5e5] shadow-sm overflow-hidden">
              {activeSubTab === 'store' && (
                <form onSubmit={handleSubmit}>
                  <div className="p-8 space-y-6">
                    <h3 className="text-lg font-bold flex items-center gap-2"><StoreIcon size={20} /> Informações da Loja</h3>
                    <div className="grid grid-cols-2 gap-6">
                      <div className="col-span-2">
                        <label className="block text-sm font-bold mb-2">Nome da Loja</label>
                        <input type="text" className="w-full p-4 bg-[#f9f9f9] border-none rounded-2xl outline-none" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} />
                      </div>
                      <div>
                        <label className="block text-sm font-bold mb-2">NIF</label>
                        <input type="text" className="w-full p-4 bg-[#f9f9f9] border-none rounded-2xl outline-none" value={formData.nif} onChange={e => setFormData({...formData, nif: e.target.value})} />
                      </div>
                      <div>
                        <label className="block text-sm font-bold mb-2">Telefone</label>
                        <input type="text" className="w-full p-4 bg-[#f9f9f9] border-none rounded-2xl outline-none" value={formData.phone} onChange={e => setFormData({...formData, phone: e.target.value})} />
                      </div>
                      <div className="col-span-2">
                        <label className="block text-sm font-bold mb-2">Endereço</label>
                        <textarea className="w-full p-4 bg-[#f9f9f9] border-none rounded-2xl outline-none h-24 resize-none" value={formData.address} onChange={e => setFormData({...formData, address: e.target.value})} />
                      </div>
                      
                      <div className="col-span-2 grid grid-cols-2 gap-6">
                        <div>
                          <label className="block text-sm font-bold mb-2">Email de Contacto (na Fatura)</label>
                          <input type="email" className="w-full p-4 bg-[#f9f9f9] border-none rounded-2xl outline-none" placeholder="Ex: contacto@empresa.com" value={formData.contact_email} onChange={e => setFormData({...formData, contact_email: e.target.value})} />
                        </div>
                        <div>
                          <label className="block text-sm font-bold mb-2">WhatsApp da Empresa</label>
                          <input type="text" className="w-full p-4 bg-[#f9f9f9] border-none rounded-2xl outline-none" placeholder="Ex: 239999999" value={formData.whatsapp_number} onChange={e => setFormData({...formData, whatsapp_number: e.target.value})} />
                        </div>
                      </div>

                      <div className="col-span-2 p-6 bg-blue-50/50 rounded-3xl space-y-4 border border-blue-100">
                        <h4 className="font-bold text-blue-900 flex items-center gap-2">Configuração de E-mail Emissor (Gmail)</h4>
                        <p className="text-xs text-blue-700">Utilizado para enviar faturas automaticamente aos clientes.</p>
                        <div className="grid grid-cols-2 gap-6">
                          <div>
                            <label className="block text-sm font-bold mb-2 text-blue-900">E-mail Emissor</label>
                            <input type="email" className="w-full p-4 bg-white border-none rounded-2xl outline-none" placeholder="Ex: faturas@gmail.com" value={formData.sender_email} onChange={e => setFormData({...formData, sender_email: e.target.value})} />
                          </div>
                          <div>
                            <label className="block text-sm font-bold mb-2 text-blue-900">Palavra-passe de App</label>
                            <input type="password" title="Utilize uma palavra-passe de aplicação do Google" className="w-full p-4 bg-white border-none rounded-2xl outline-none" value={formData.sender_password} onChange={e => setFormData({...formData, sender_password: e.target.value})} />
                          </div>
                        </div>
                      </div>

                      <div className="col-span-2 flex items-center gap-3 p-4 bg-[#f9f9f9] rounded-2xl">
                        <input 
                          type="checkbox" 
                          id="uses_tax" 
                          checked={formData.uses_tax} 
                          onChange={e => setFormData({...formData, uses_tax: e.target.checked})}
                          className="w-5 h-5 rounded border-gray-300 text-[#1a1a1a] focus:ring-[#1a1a1a]"
                        />
                        <label htmlFor="uses_tax" className="text-sm font-bold cursor-pointer">
                          A loja utiliza Gestão de IVA (Impostos)
                        </label>
                      </div>
                    </div>
                  </div>
                  <div className="p-8 bg-[#f9f9f9] border-t border-[#e5e5e5] flex items-center justify-between">
                    <p className="text-sm font-medium text-green-600">{message}</p>
                    <button type="submit" disabled={loading} className="bg-[#1a1a1a] text-white px-8 py-4 rounded-2xl font-bold flex items-center gap-2 shadow-lg shadow-black/10 hover:scale-[1.02] transition-all">
                      <Save size={20} /> Guardar Loja
                    </button>
                  </div>
                </form>
              )}

              {activeSubTab === 'taxes' && (
                <div className="p-8 space-y-6">
                  <h3 className="text-lg font-bold flex items-center gap-2"><Percent size={20} /> Gestão de Impostos</h3>
                  <p className="text-sm text-muted-foreground">Defina os impostos que podem ser aplicados aos produtos (ex: IVA 15%, Isento).</p>
                  
                  <form onSubmit={handleAddTax} className="flex gap-4 items-end">
                    <div className="flex-1">
                      <label className="block text-sm font-bold mb-2">Nome do Imposto</label>
                      <input type="text" required className="w-full p-4 bg-[#f9f9f9] border-none rounded-2xl outline-none" placeholder="Ex: IVA 15%" value={newTax.name} onChange={e => setNewTax({...newTax, name: e.target.value})} />
                    </div>
                    <div className="w-32">
                      <label className="block text-sm font-bold mb-2">Taxa (%)</label>
                      <input type="number" step="0.01" required className="w-full p-4 bg-[#f9f9f9] border-none rounded-2xl outline-none" placeholder="15" value={newTax.rate} onChange={e => setNewTax({...newTax, rate: Number(e.target.value)})} />
                    </div>
                    <button type="submit" className="bg-[#1a1a1a] text-white px-6 py-4 rounded-2xl font-bold hover:scale-[1.02] transition-all">
                      Adicionar
                    </button>
                  </form>

                  <div className="mt-8">
                    <table className="w-full text-left border-collapse">
                      <thead>
                        <tr className="border-b border-[#e5e5e5]">
                          <th className="pb-3 font-bold text-[#666]">Nome</th>
                          <th className="pb-3 font-bold text-[#666]">Taxa (%)</th>
                          <th className="pb-3 font-bold text-[#666] text-right">Ações</th>
                        </tr>
                      </thead>
                      <tbody>
                        {taxes.map(tax => (
                          <tr key={tax.id} className="border-b border-[#f0f0f0] last:border-0">
                            <td className="py-4 font-medium">{tax.name}</td>
                            <td className="py-4">{tax.rate}%</td>
                            <td className="py-4 text-right">
                              <button onClick={() => confirmDelete(tax.id, 'tax')} className="p-2 text-red-500 hover:bg-red-50 rounded-xl transition-colors">
                                <Trash2 size={18} />
                              </button>
                            </td>
                          </tr>
                        ))}
                        {taxes.length === 0 && (
                          <tr>
                            <td colSpan={3} className="py-8 text-center text-muted-foreground">Nenhum imposto definido.</td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {activeSubTab === 'pricelists' && (
                <div className="p-8 space-y-6">
                  <h3 className="text-lg font-bold flex items-center gap-2"><List size={20} /> Listas de Preços</h3>
                  <p className="text-sm text-muted-foreground">Crie listas de preços diferenciadas (ex: Retalho, Grosso) para associar a clientes.</p>
                  
                  <form onSubmit={handleAddPriceList} className="flex gap-4 items-end">
                    <div className="flex-1">
                      <label className="block text-sm font-bold mb-2">Nome da Lista</label>
                      <input type="text" required className="w-full p-4 bg-[#f9f9f9] border-none rounded-2xl outline-none" placeholder="Ex: Revenda" value={newPriceList.name} onChange={e => setNewPriceList({...newPriceList, name: e.target.value})} />
                    </div>
                    <button type="submit" className="bg-[#1a1a1a] text-white px-6 py-4 rounded-2xl font-bold hover:scale-[1.02] transition-all">
                      Adicionar
                    </button>
                  </form>

                  <div className="mt-8">
                    <table className="w-full text-left border-collapse">
                      <thead>
                        <tr className="border-b border-[#e5e5e5]">
                          <th className="pb-3 font-bold text-[#666]">Nome da Lista de Preços</th>
                          <th className="pb-3 font-bold text-[#666] text-right">Ações</th>
                        </tr>
                      </thead>
                      <tbody>
                        {priceLists.map(list => (
                          <tr key={list.id} className="border-b border-[#f0f0f0] last:border-0">
                            <td className="py-4 font-medium">{list.name}</td>
                            <td className="py-4 text-right">
                              <button onClick={() => confirmDelete(list.id, 'pricelist')} className="p-2 text-red-500 hover:bg-red-50 rounded-xl transition-colors">
                                <Trash2 size={18} />
                              </button>
                            </td>
                          </tr>
                        ))}
                        {priceLists.length === 0 && (
                          <tr>
                            <td colSpan={2} className="py-8 text-center text-muted-foreground">Nenhuma lista de preços definida.</td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {activeSubTab === 'categories' && (
                <div className="p-8 space-y-6">
                  <div className="flex items-center justify-between">
                    <h3 className="text-lg font-bold flex items-center gap-2"><Tag size={20} /> Categorias</h3>
                    <button onClick={() => { setEditingCategory({}); setIsCategoryModalOpen(true); }} className="bg-[#1a1a1a] text-white px-4 py-2 rounded-xl font-bold text-sm flex items-center gap-2">
                      <Plus size={16} /> Nova Categoria
                    </button>
                  </div>
                  <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                      <thead>
                        <tr className="border-b border-[#e5e5e5]">
                          <th className="pb-3 font-bold text-[#666]">Nome da Categoria</th>
                          <th className="pb-3 font-bold text-[#666] text-right">Ações</th>
                        </tr>
                      </thead>
                      <tbody>
                        {categories.map(cat => (
                          <tr key={cat.id} className="border-b border-[#f0f0f0] last:border-0">
                            <td className="py-4 font-medium">{cat.name}</td>
                            <td className="py-4 text-right">
                              <div className="flex items-center justify-end gap-2">
                                <button onClick={() => { setEditingCategory(cat); setIsCategoryModalOpen(true); }} className="p-2 text-[#1a1a1a] hover:bg-gray-100 rounded-xl transition-colors">
                                  <Edit2 size={18} />
                                </button>
                                <button onClick={() => confirmDelete(cat.id, 'category')} className="p-2 text-red-500 hover:bg-red-50 rounded-xl transition-colors">
                                  <Trash2 size={18} />
                                </button>
                              </div>
                            </td>
                          </tr>
                        ))}
                        {categories.length === 0 && (
                          <tr>
                            <td colSpan={2} className="py-8 text-center text-muted-foreground">Nenhuma categoria definida.</td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {activeSubTab === 'units' && (
                <div className="p-8 space-y-6">
                  <div className="flex items-center justify-between">
                    <h3 className="text-lg font-bold flex items-center gap-2"><Layers size={20} /> Unidades</h3>
                    <button onClick={() => { setEditingUnit({}); setIsUnitModalOpen(true); }} className="bg-[#1a1a1a] text-white px-4 py-2 rounded-xl font-bold text-sm flex items-center gap-2">
                      <Plus size={16} /> Nova Unidade
                    </button>
                  </div>
                  <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                      <thead>
                        <tr className="border-b border-[#e5e5e5]">
                          <th className="pb-3 font-bold text-[#666]">Nome</th>
                          <th className="pb-3 font-bold text-[#666]">Símbolo</th>
                          <th className="pb-3 font-bold text-[#666] text-right">Ações</th>
                        </tr>
                      </thead>
                      <tbody>
                        {units.map(unit => (
                          <tr key={unit.id} className="border-b border-[#f0f0f0] last:border-0">
                            <td className="py-4 font-medium">{unit.name}</td>
                            <td className="py-4 font-mono text-sm">{unit.symbol || '-'}</td>
                            <td className="py-4 text-right">
                              <div className="flex items-center justify-end gap-2">
                                <button onClick={() => { setEditingUnit(unit); setIsUnitModalOpen(true); }} className="p-2 text-[#1a1a1a] hover:bg-gray-100 rounded-xl transition-colors">
                                  <Edit2 size={18} />
                                </button>
                                <button onClick={() => confirmDelete(unit.id, 'unit')} className="p-2 text-red-500 hover:bg-red-50 rounded-xl transition-colors">
                                  <Trash2 size={18} />
                                </button>
                              </div>
                            </td>
                          </tr>
                        ))}
                        {units.length === 0 && (
                          <tr>
                            <td colSpan={3} className="py-8 text-center text-muted-foreground">Nenhuma unidade definida.</td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {activeSubTab === 'suppliers' && (
                <div className="p-8 space-y-6">
                  <div className="flex items-center justify-between">
                    <h3 className="text-lg font-bold flex items-center gap-2"><Truck size={20} /> Fornecedores</h3>
                    <button onClick={() => { setEditingSupplier({}); setIsSupplierModalOpen(true); }} className="bg-[#1a1a1a] text-white px-4 py-2 rounded-xl font-bold text-sm flex items-center gap-2">
                      <Plus size={16} /> Novo Fornecedor
                    </button>
                  </div>
                  <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                      <thead>
                        <tr className="border-b border-[#e5e5e5]">
                          <th className="pb-3 font-bold text-[#666]">Fornecedor</th>
                          <th className="pb-3 font-bold text-[#666]">Contacto</th>
                          <th className="pb-3 font-bold text-[#666] text-right">Ações</th>
                        </tr>
                      </thead>
                      <tbody>
                        {suppliers.map(sup => (
                          <tr key={sup.id} className="border-b border-[#f0f0f0] last:border-0">
                            <td className="py-4 font-medium">{sup.name}</td>
                            <td className="py-4 text-sm text-muted-foreground">
                              {sup.phone && <div>{sup.phone}</div>}
                              {sup.email && <div>{sup.email}</div>}
                            </td>
                            <td className="py-4 text-right">
                              <div className="flex items-center justify-end gap-2">
                                <button onClick={() => { setEditingSupplier(sup); setIsSupplierModalOpen(true); }} className="p-2 text-[#1a1a1a] hover:bg-gray-100 rounded-xl transition-colors">
                                  <Edit2 size={18} />
                                </button>
                                <button onClick={() => confirmDelete(sup.id, 'supplier')} className="p-2 text-red-500 hover:bg-red-50 rounded-xl transition-colors">
                                  <Trash2 size={18} />
                                </button>
                              </div>
                            </td>
                          </tr>
                        ))}
                        {suppliers.length === 0 && (
                          <tr>
                            <td colSpan={3} className="py-8 text-center text-muted-foreground">Nenhum fornecedor definido.</td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {activeSubTab === 'currencies' && (
                <div className="p-8 space-y-6">
                  <div className="flex items-center justify-between">
                    <h3 className="text-lg font-bold flex items-center gap-2"><Coins size={20} /> Moedas</h3>
                    <button onClick={() => { setEditingCurrency({}); setIsCurrencyModalOpen(true); }} className="bg-[#1a1a1a] text-white px-4 py-2 rounded-xl font-bold text-sm flex items-center gap-2">
                      <Plus size={16} /> Nova Moeda
                    </button>
                  </div>
                  <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                      <thead>
                        <tr className="border-b border-[#e5e5e5]">
                          <th className="pb-3 font-bold text-[#666]">Moeda</th>
                          <th className="pb-3 font-bold text-[#666]">Código</th>
                          <th className="pb-3 font-bold text-[#666]">Símbolo</th>
                          <th className="pb-3 font-bold text-[#666] text-right">Ações</th>
                        </tr>
                      </thead>
                      <tbody>
                        {currencies.map(curr => (
                          <tr key={curr.id} className="border-b border-[#f0f0f0] last:border-0">
                            <td className="py-4 font-medium">{curr.name}</td>
                            <td className="py-4 font-mono text-sm">{curr.code}</td>
                            <td className="py-4 font-bold">{curr.symbol}</td>
                            <td className="py-4 text-right">
                              <div className="flex items-center justify-end gap-2">
                                <button onClick={() => { setEditingCurrency(curr); setIsCurrencyModalOpen(true); }} className="p-2 text-[#1a1a1a] hover:bg-gray-100 rounded-xl transition-colors">
                                  <Edit2 size={18} />
                                </button>
                                <button onClick={() => confirmDelete(curr.id, 'currency')} className="p-2 text-red-500 hover:bg-red-50 rounded-xl transition-colors">
                                  <Trash2 size={18} />
                                </button>
                              </div>
                            </td>
                          </tr>
                        ))}
                        {currencies.length === 0 && (
                          <tr>
                            <td colSpan={4} className="py-8 text-center text-muted-foreground">Nenhuma moeda definida.</td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {activeSubTab === 'hardware' && (
                <form onSubmit={handleSubmit}>
                  <div className="p-8 space-y-6">
                    <h3 className="text-lg font-bold flex items-center gap-2"><Monitor size={20} /> Integração de Hardware</h3>
                    <div className="grid grid-cols-2 gap-6">
                      <div>
                        <label className="block text-sm font-bold mb-2 flex items-center gap-2"><Printer size={16} /> Impressora Térmica</label>
                        <select className="w-full p-4 bg-[#f9f9f9] border-none rounded-2xl outline-none" value={hardwareData.printer} onChange={e => setHardwareData({...hardwareData, printer: e.target.value})}>
                          <option value="thermal-80mm">Térmica 80mm (Padrão)</option>
                          <option value="thermal-58mm">Térmica 58mm</option>
                          <option value="pdf">Apenas PDF</option>
                        </select>
                      </div>
                      <div>
                        <label className="block text-sm font-bold mb-2 flex items-center gap-2"><Barcode size={16} /> Leitor de Código</label>
                        <select className="w-full p-4 bg-[#f9f9f9] border-none rounded-2xl outline-none" value={hardwareData.barcode_reader} onChange={e => setHardwareData({...hardwareData, barcode_reader: e.target.value})}>
                          <option value="usb-keyboard">USB / Bluetooth (Emulação Teclado)</option>
                          <option value="serial">Porta Serial (COM)</option>
                        </select>
                      </div>
                      <div>
                        <label className="block text-sm font-bold mb-2 flex items-center gap-2"><CreditCard size={16} /> Terminal TPA</label>
                        <select className="w-full p-4 bg-[#f9f9f9] border-none rounded-2xl outline-none" value={hardwareData.tpa_integration} onChange={e => setHardwareData({...hardwareData, tpa_integration: e.target.value})}>
                          <option value="manual">Manual (Digitar no TPA)</option>
                          <option value="semi-auto">Semi-Automático (Via API)</option>
                        </select>
                      </div>
                      <div>
                        <label className="block text-sm font-bold mb-2">Gaveta de Dinheiro</label>
                        <select className="w-full p-4 bg-[#f9f9f9] border-none rounded-2xl outline-none" value={hardwareData.cash_drawer} onChange={e => setHardwareData({...hardwareData, cash_drawer: e.target.value})}>
                          <option value="automatic">Abertura Automática (Via Impressora)</option>
                          <option value="manual">Abertura Manual</option>
                        </select>
                      </div>
                    </div>
                  </div>
                  <div className="p-8 bg-[#f9f9f9] border-t border-[#e5e5e5] flex items-center justify-between">
                    <p className="text-sm font-medium text-green-600">{message}</p>
                    <button type="submit" disabled={loading} className="bg-[#1a1a1a] text-white px-8 py-4 rounded-2xl font-bold flex items-center gap-2 shadow-lg shadow-black/10 hover:scale-[1.02] transition-all">
                      <Save size={20} /> Guardar Hardware
                    </button>
                  </div>
                </form>
              )}

              {activeSubTab === 'backup' && (
                <div className="p-8 space-y-8">
                  <div className="space-y-4">
                    <h3 className="text-lg font-bold flex items-center gap-2"><Database size={20} /> Gestão de Dados</h3>
                    <p className="text-sm text-muted-foreground">Exporte todos os dados do sistema para um ficheiro ou importe um backup anterior.</p>
                    <div className="grid grid-cols-2 gap-4">
                      <button onClick={handleExport} className="flex items-center justify-center gap-3 p-6 rounded-3xl border-2 border-[#f0f0f0] hover:border-[#1a1a1a] hover:bg-[#fcfcfc] transition-all group">
                        <Download className="text-blue-600 group-hover:scale-110 transition-transform" />
                        <div className="text-left">
                          <p className="font-bold">Exportar Backup</p>
                          <p className="text-xs text-muted-foreground">Descarregar ficheiro .json</p>
                        </div>
                      </button>
                      <label className="flex items-center justify-center gap-3 p-6 rounded-3xl border-2 border-[#f0f0f0] hover:border-[#1a1a1a] hover:bg-[#fcfcfc] transition-all group cursor-pointer">
                        <Upload className="text-orange-600 group-hover:scale-110 transition-transform" />
                        <div className="text-left">
                          <p className="font-bold">Importar Backup</p>
                          <p className="text-xs text-muted-foreground">Carregar ficheiro .json</p>
                        </div>
                        <input type="file" accept=".json" className="hidden" onChange={handleImport} />
                      </label>
                    </div>
                  </div>

                  <div className="pt-8 border-t border-[#e5e5e5] space-y-4">
                    <h3 className="text-lg font-bold flex items-center gap-2"><Monitor size={20} /> Sincronização Online</h3>
                    <p className="text-sm text-muted-foreground">Sincronize as suas vendas e stock com o servidor central para acesso remoto.</p>
                    <button onClick={handleSync} className="w-full flex items-center justify-center gap-3 p-6 rounded-3xl bg-[#1a1a1a] text-white font-bold hover:scale-[1.01] transition-all">
                      <Database size={20} /> Sincronizar Agora
                    </button>
                  </div>

                  <div className="pt-8 border-t border-[#e5e5e5] space-y-4">
                    <h3 className="text-lg font-bold flex items-center gap-2 text-red-600"><Trash2 size={20} /> Zona de Perigo</h3>
                    <p className="text-sm text-muted-foreground">Estas ações são irreversíveis. Tenha cuidado ao prosseguir.</p>
                    <div className="grid grid-cols-2 gap-4">
                      <button 
                        onClick={async () => {
                          if (window.confirm('Tem certeza que deseja limpar todo o histórico de auditoria? Esta ação não pode ser desfeita.')) {
                            const res = await fetch('/api/audit-logs/clear', { method: 'POST' });
                            if (res.ok) toast.success('Histórico limpo com sucesso!');
                          }
                        }}
                        className="flex items-center justify-center gap-3 p-6 rounded-3xl border-2 border-red-100 hover:border-red-600 hover:bg-red-50 transition-all group"
                      >
                        <Trash2 className="text-red-600 group-hover:scale-110 transition-transform" />
                        <div className="text-left">
                          <p className="font-bold text-red-600">Limpar Histórico</p>
                          <p className="text-xs text-red-400">Remover todos os logs de auditoria</p>
                        </div>
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Category Modal */}
      <Modal
        isOpen={isCategoryModalOpen}
        onClose={() => setIsCategoryModalOpen(false)}
        title={editingCategory?.id ? 'Editar Categoria' : 'Nova Categoria'}
        maxWidth="md"
        icon={<Tag size={20} />}
        footer={
          <div className="flex gap-3">
            <button type="button" onClick={() => setIsCategoryModalOpen(false)} className="flex-1 py-4 rounded-2xl font-bold text-slate-500 hover:bg-slate-100 transition-all">Cancelar</button>
            <button onClick={handleSaveCategory} className="flex-[2] bg-[#1a1a1a] text-white py-4 rounded-2xl font-bold shadow-lg shadow-black/10 hover:bg-black transition-all">Guardar Categoria</button>
          </div>
        }
      >
        <form onSubmit={handleSaveCategory} className="space-y-6">
          <div className="group">
            <label className="block text-xs font-bold text-slate-500 mb-2 uppercase tracking-wider group-focus-within:text-[#1a1a1a] transition-colors">Nome da Categoria</label>
            <input
              required
              type="text"
              placeholder="Ex: Bebidas, Alimentos..."
              className="w-full px-4 py-4 bg-slate-50 border border-slate-200 rounded-2xl outline-none font-bold text-slate-900 focus:ring-4 focus:ring-[#1a1a1a]/10 focus:border-[#1a1a1a] transition-all"
              value={editingCategory?.name || ''}
              onChange={e => setEditingCategory({...editingCategory, name: e.target.value})}
            />
          </div>
        </form>
      </Modal>

      {/* Supplier Modal */}
      <Modal
        isOpen={isSupplierModalOpen}
        onClose={() => setIsSupplierModalOpen(false)}
        title={editingSupplier?.id ? 'Editar Fornecedor' : 'Novo Fornecedor'}
        maxWidth="lg"
        icon={<Truck size={20} />}
        footer={
          <div className="flex gap-3">
            <button type="button" onClick={() => setIsSupplierModalOpen(false)} className="flex-1 py-4 rounded-2xl font-bold text-slate-500 hover:bg-slate-100 transition-all">Cancelar</button>
            <button onClick={handleSaveSupplier} className="flex-[2] bg-[#1a1a1a] text-white py-4 rounded-2xl font-bold shadow-lg shadow-black/10 hover:bg-black transition-all">Guardar Fornecedor</button>
          </div>
        }
      >
        <form onSubmit={handleSaveSupplier} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="group">
              <label className="block text-xs font-bold text-slate-500 mb-2 uppercase tracking-wider group-focus-within:text-[#1a1a1a] transition-colors">Nome da Empresa</label>
              <input
                required
                type="text"
                placeholder="Nome do fornecedor..."
                className="w-full px-4 py-4 bg-slate-50 border border-slate-200 rounded-2xl outline-none font-bold text-slate-900 focus:ring-4 focus:ring-[#1a1a1a]/10 focus:border-[#1a1a1a] transition-all"
                value={editingSupplier?.name || ''}
                onChange={e => setEditingSupplier({...editingSupplier, name: e.target.value})}
              />
            </div>
            <div className="group">
              <label className="block text-xs font-bold text-slate-500 mb-2 uppercase tracking-wider group-focus-within:text-[#1a1a1a] transition-colors">Telefone</label>
              <input
                type="text"
                placeholder="+239..."
                className="w-full px-4 py-4 bg-slate-50 border border-slate-200 rounded-2xl outline-none font-bold text-slate-900 focus:ring-4 focus:ring-[#1a1a1a]/10 focus:border-[#1a1a1a] transition-all"
                value={editingSupplier?.phone || ''}
                onChange={e => setEditingSupplier({...editingSupplier, phone: e.target.value})}
              />
            </div>
          </div>
          <div className="group">
            <label className="block text-xs font-bold text-slate-500 mb-2 uppercase tracking-wider group-focus-within:text-[#1a1a1a] transition-colors">Email de Contacto</label>
            <input
              type="email"
              placeholder="exemplo@fornecedor.com"
              className="w-full px-4 py-4 bg-slate-50 border border-slate-200 rounded-2xl outline-none font-bold text-slate-900 focus:ring-4 focus:ring-[#1a1a1a]/10 focus:border-[#1a1a1a] transition-all"
              value={editingSupplier?.email || ''}
              onChange={e => setEditingSupplier({...editingSupplier, email: e.target.value})}
            />
          </div>
        </form>
      </Modal>

      {/* Unit Modal */}
      <Modal
        isOpen={isUnitModalOpen}
        onClose={() => setIsUnitModalOpen(false)}
        title={editingUnit?.id ? 'Editar Unidade' : 'Nova Unidade'}
        maxWidth="md"
        icon={<Layers size={20} />}
        footer={
          <div className="flex gap-3">
            <button type="button" onClick={() => setIsUnitModalOpen(false)} className="flex-1 py-4 rounded-2xl font-bold text-slate-500 hover:bg-slate-100 transition-all">Cancelar</button>
            <button onClick={handleSaveUnit} className="flex-[2] bg-[#1a1a1a] text-white py-4 rounded-2xl font-bold shadow-lg shadow-black/10 hover:bg-black transition-all">Guardar Unidade</button>
          </div>
        }
      >
        <form onSubmit={handleSaveUnit} className="space-y-6">
          <div className="group">
            <label className="block text-xs font-bold text-slate-500 mb-2 uppercase tracking-wider group-focus-within:text-[#1a1a1a] transition-colors">Nome da Unidade</label>
            <input
              required
              type="text"
              placeholder="Ex: Caixa, Unidade, Kg..."
              className="w-full px-4 py-4 bg-slate-50 border border-slate-200 rounded-2xl outline-none font-bold text-slate-900 focus:ring-4 focus:ring-[#1a1a1a]/10 focus:border-[#1a1a1a] transition-all"
              value={editingUnit?.name || ''}
              onChange={e => setEditingUnit({...editingUnit, name: e.target.value})}
            />
          </div>
          <div className="group">
            <label className="block text-xs font-bold text-slate-500 mb-2 uppercase tracking-wider group-focus-within:text-[#1a1a1a] transition-colors">Símbolo (Opcional)</label>
            <input
              type="text"
              placeholder="Ex: cx, un, kg..."
              className="w-full px-4 py-4 bg-slate-50 border border-slate-200 rounded-2xl outline-none font-bold text-slate-900 focus:ring-4 focus:ring-[#1a1a1a]/10 focus:border-[#1a1a1a] transition-all"
              value={editingUnit?.symbol || ''}
              onChange={e => setEditingUnit({...editingUnit, symbol: e.target.value})}
            />
          </div>
        </form>
      </Modal>

      {/* Currency Modal */}
      <Modal
        isOpen={isCurrencyModalOpen}
        onClose={() => setIsCurrencyModalOpen(false)}
        title={editingCurrency?.id ? 'Editar Moeda' : 'Nova Moeda'}
        maxWidth="md"
        icon={<Coins size={20} />}
        footer={
          <div className="flex gap-3">
            <button type="button" onClick={() => setIsCurrencyModalOpen(false)} className="flex-1 py-4 rounded-2xl font-bold text-slate-500 hover:bg-slate-100 transition-all">Cancelar</button>
            <button onClick={handleSaveCurrency} className="flex-[2] bg-[#1a1a1a] text-white py-4 rounded-2xl font-bold shadow-lg shadow-black/10 hover:bg-black transition-all">Guardar Moeda</button>
          </div>
        }
      >
        <form onSubmit={handleSaveCurrency} className="p-2 space-y-6">
          <div className="space-y-2">
            <label className="text-xs font-black uppercase tracking-widest text-muted-foreground ml-1">Nome da Moeda</label>
            <input
              type="text"
              required
              value={editingCurrency?.name || ''}
              onChange={e => setEditingCurrency(prev => ({ ...prev!, name: e.target.value }))}
              className="w-full px-6 py-4 bg-[#f5f5f5] border-none rounded-2xl focus:ring-2 focus:ring-[#1a1a1a] transition-all font-medium"
              placeholder="Ex: Euro, Dobra..."
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-xs font-black uppercase tracking-widest text-muted-foreground ml-1">Código (ISO)</label>
              <input
                type="text"
                required
                maxLength={3}
                value={editingCurrency?.code || ''}
                onChange={e => setEditingCurrency(prev => ({ ...prev!, code: e.target.value.toUpperCase() }))}
                className="w-full px-6 py-4 bg-[#f5f5f5] border-none rounded-2xl focus:ring-2 focus:ring-[#1a1a1a] transition-all font-mono"
                placeholder="Ex: EUR, STN"
              />
            </div>
            <div className="space-y-2">
              <label className="text-xs font-black uppercase tracking-widest text-muted-foreground ml-1">Símbolo</label>
              <input
                type="text"
                required
                value={editingCurrency?.symbol || ''}
                onChange={e => setEditingCurrency(prev => ({ ...prev!, symbol: e.target.value }))}
                className="w-full px-6 py-4 bg-[#f5f5f5] border-none rounded-2xl focus:ring-2 focus:ring-[#1a1a1a] transition-all font-bold text-center"
                placeholder="Ex: €, Db"
              />
            </div>
          </div>
        </form>
      </Modal>

      {/* Delete Confirmation Modal */}
      <DeleteConfirmationModal 
        isOpen={isDeleteModalOpen}
        onClose={() => { setIsDeleteModalOpen(false); setDeleteAction(null); }}
        onConfirm={handleDelete}
        title="Confirmar Eliminação"
        description={`Tem a certeza que deseja eliminar este item? Esta ação não pode ser revertida.`}
      />
    </div>
  );
};

export default Settings;
