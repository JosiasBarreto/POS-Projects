import React, { useState, useEffect, useRef } from 'react';
import { 
  Plus, 
  Search, 
  Filter, 
  MoreVertical, 
  Edit2, 
  Trash2, 
  AlertCircle,
  Package,
  Barcode,
  RefreshCw,
  History,
  TrendingUp,
  TrendingDown,
  ArrowUpRight,
  ArrowDownRight,
  Star,
  Eye,
  EyeOff,
  ChevronRight,
  User,
  Layers,
  X,
  Save,
  Truck,
  Tag,
  Info,
  Calendar,
  Clock,
  Coins,
  ChevronLeft,
  ArrowUpDown
} from 'lucide-react';
import { Product, Category, Supplier, StockMovement, Unit, Tax, PriceList, Currency } from '../types';
import { formatCurrency, cn } from '../lib/utils';
import { useAuth } from '../contexts/AuthContext';
import { motion, AnimatePresence } from 'motion/react';
import { toast } from 'sonner';

import Modal from '../components/ui/Modal';
import DeleteConfirmationModal from '../components/inventory/DeleteConfirmationModal';
import ProductUnitsPricesModal from '../components/inventory/ProductUnitsPricesModal';
import ImportProductsModal from '../components/inventory/ImportProductsModal';
import ProductFormModal from '../components/inventory/ProductFormModal';

const Inventory: React.FC = () => {
  const { store, user } = useAuth();
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [units, setUnits] = useState<Unit[]>([]);
  const [taxes, setTaxes] = useState<Tax[]>([]);
  const [priceLists, setPriceLists] = useState<PriceList[]>([]);
  const [search, setSearch] = useState('');
  const [filterCategory, setFilterCategory] = useState<string>('all');
  const [filterSupplier, setFilterSupplier] = useState<string>('all');
  const [filterUnit, setFilterUnit] = useState<string>('all');
  const [filterPriceRange, setFilterPriceRange] = useState<[number, number]>([0, 1000000]);
  const [isFilterVisible, setIsFilterVisible] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);
  const [isHistoryOpen, setIsHistoryOpen] = useState(false);
  const [isStockModalOpen, setIsStockModalOpen] = useState(false);
  const [isUnitsPricesModalOpen, setIsUnitsPricesModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Partial<Product>>({
    name: '',
    barcode: '',
    purchase_price: 0,
    sale_price: 0,
    min_stock: 5,
    is_active: 1,
    is_favorite: 0,
    stock_base: 0
  });
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [history, setHistory] = useState<StockMovement[]>([]);
  const [stockAdjustment, setStockAdjustment] = useState({ quantity: 0, type: 'in' as 'in' | 'out' | 'adjustment', reason: '' });
  const [showInactive, setShowInactive] = useState(false);
  const [selectedProducts, setSelectedProducts] = useState<number[]>([]);

  const barcodeInputRef = useRef<HTMLInputElement>(null);

  const [currencies, setCurrencies] = useState<Currency[]>([]);

  // Pagination and Sorting
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(10);
  const [sortConfig, setSortConfig] = useState<{ key: keyof Product; direction: 'asc' | 'desc' } | null>(null);

  useEffect(() => {
    fetchProducts();
    fetchCategories();
    fetchSuppliers();
    fetchCurrencies();
    fetchUnits();
    fetchTaxes();
    fetchPriceLists();
  }, [showInactive]);

  const fetchProducts = async () => {
    try {
      const res = await fetch(`/api/products?all=${showInactive}`);
      if (!res.ok) throw new Error('Erro ao buscar produtos');
      const data = await res.json();
      setProducts(data);
    } catch (error) {
      toast.error('Erro ao carregar produtos');
    }
  };
  const fetchCategories = () => fetch('/api/categories').then(res => res.json()).then(setCategories);
  const fetchSuppliers = () => fetch('/api/suppliers').then(res => res.json()).then(setSuppliers);
  const fetchCurrencies = () => fetch('/api/currencies').then(res => res.json()).then(setCurrencies);
  const fetchUnits = () => fetch('/api/units').then(res => res.json()).then(setUnits);
  const fetchTaxes = () => fetch('/api/taxes').then(res => res.json()).then(setTaxes);
  const fetchPriceLists = () => fetch('/api/price-lists').then(res => res.json()).then(setPriceLists);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!editingProduct.name || editingProduct.name.trim() === '') {
      toast.error('O nome do produto é obrigatório.');
      return;
    }
    if (Number(editingProduct.sale_price) < 0 || Number(editingProduct.purchase_price) < 0) {
      toast.error('Os preços não podem ser negativos.');
      return;
    }

    const method = editingProduct?.id ? 'PUT' : 'POST';
    const url = editingProduct?.id ? `/api/products/${editingProduct.id}` : '/api/products';
    
    const productData = {
      ...editingProduct,
      purchase_price: Number(editingProduct.purchase_price),
      sale_price: Number(editingProduct.sale_price),
      stock_base: Number(editingProduct.stock_base),
      min_stock: Number(editingProduct.min_stock),
      user_id: user?.id
    };

    const res = await fetch(url, {
      method,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(productData)
    });

    if (res.ok) {
      setIsModalOpen(false);
      setEditingProduct({ name: '', barcode: '', purchase_price: 0, sale_price: 0, min_stock: 5, is_active: 1, is_favorite: 0, stock_base: 0 });
      fetchProducts();
      toast.success(editingProduct?.id ? 'Produto atualizado com sucesso!' : 'Produto criado com sucesso!');
    } else {
      const errorData = await res.json();
      toast.error(errorData.error || 'Erro ao guardar produto.');
    }
  };

  const toggleFavorite = async (product: Product) => {
    const res = await fetch(`/api/products/${product.id}/favorite`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ is_favorite: product.is_favorite === 1 ? 0 : 1 })
    });
    if (res.ok) {
      fetchProducts();
      toast.success(product.is_favorite === 1 ? 'Removido dos favoritos' : 'Adicionado aos favoritos');
    }
  };

  const toggleStatus = async (product: Product) => {
    const res = await fetch(`/api/products/${product.id}/status`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ is_active: product.is_active === 1 ? 0 : 1 })
    });
    if (res.ok) {
      fetchProducts();
      toast.success(product.is_active === 1 ? 'Produto desativado' : 'Produto ativado');
    }
  };

  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [deleteAction, setDeleteAction] = useState<{ id?: number; type: 'product' | 'bulk_product' | 'user' | 'category' | 'supplier' } | null>(null);

  const confirmDelete = (id: number, type: 'product') => {
    setDeleteAction({ id, type });
    setIsDeleteModalOpen(true);
  };

  const confirmBulkDelete = () => {
    if (selectedProducts.length === 0) return;
    setDeleteAction({ type: 'bulk_product' });
    setIsDeleteModalOpen(true);
  };

  const handleDelete = async () => {
    if (!deleteAction) return;
    const { id, type } = deleteAction;
    
    if (type === 'bulk_product') {
      try {
        const res = await fetch('/api/products/bulk-delete', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ ids: selectedProducts, user_id: user?.id })
        });
        
        if (res.ok) {
          fetchProducts();
          setSelectedProducts([]);
          toast.success(`${selectedProducts.length} produtos eliminados!`);
        } else {
          const errorData = await res.json().catch(() => ({}));
          toast.error(errorData.error || 'Erro ao eliminar produtos.');
        }
      } catch (error) {
        toast.error('Erro de conexão ao servidor.');
      }
    } else {
      let endpoint = '';
      let successMsg = '';
      let fetchFn = () => {};

      switch (type) {
        case 'product': endpoint = `/api/products/${id}`; successMsg = 'Produto eliminado!'; fetchFn = fetchProducts; break;
      }

      const res = await fetch(endpoint, { 
        method: 'DELETE',
        headers: { 'x-user-id': user?.id.toString() || '' }
      });
      if (res.ok) {
        fetchFn();
        toast.success(successMsg);
      } else {
        const errorData = await res.json().catch(() => ({}));
        toast.error(errorData.error || 'Erro ao eliminar item.');
      }
    }
    
    setIsDeleteModalOpen(false);
    setDeleteAction(null);
  };

  const deleteProduct = async (id: number) => {
    confirmDelete(id, 'product');
  };

  const generateBarcode = async () => {
    const res = await fetch('/api/products/generate-barcode');
    const { barcode } = await res.json();
    setEditingProduct(prev => ({ ...prev, barcode }));
  };

  const viewHistory = async (product: Product) => {
    setSelectedProduct(product);
    const res = await fetch(`/api/products/${product.id}/history`);
    const data = await res.json();
    setHistory(data);
    setIsHistoryOpen(true);
  };

  const handleStockAdjustment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedProduct) return;
    
    if (isNaN(stockAdjustment.quantity) || stockAdjustment.quantity === null) {
      toast.error('Quantidade inválida.');
      return;
    }

    const res = await fetch(`/api/products/${selectedProduct.id}/stock`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        ...stockAdjustment,
        quantity: stockAdjustment.type === 'out' ? -Math.abs(stockAdjustment.quantity) : stockAdjustment.quantity,
        user_id: user?.id
      })
    });

    if (res.ok) {
      setIsStockModalOpen(false);
      setStockAdjustment({ quantity: 0, type: 'in', reason: '' });
      fetchProducts();
      toast.success('Stock atualizado com sucesso!');
    } else {
      const errorData = await res.json().catch(() => ({}));
      toast.error(errorData.error || 'Erro ao atualizar stock.');
    }
  };

  const resetFilters = () => {
    setSearch('');
    setFilterCategory('all');
    setFilterSupplier('all');
    setFilterUnit('all');
    setFilterPriceRange([0, 1000000]);
  };

  // Sorting logic
  const handleSort = (key: keyof Product) => {
    let direction: 'asc' | 'desc' = 'asc';
    if (sortConfig && sortConfig.key === key && sortConfig.direction === 'asc') {
      direction = 'desc';
    }
    setSortConfig({ key, direction });
  };

  const sortedProducts = React.useMemo(() => {
    let sortableItems = [...products];
    if (sortConfig !== null) {
      sortableItems.sort((a, b) => {
        const aValue = a[sortConfig.key];
        const bValue = b[sortConfig.key];
        
        if (aValue === undefined || bValue === undefined) return 0;
        
        if (aValue < bValue) {
          return sortConfig.direction === 'asc' ? -1 : 1;
        }
        if (aValue > bValue) {
          return sortConfig.direction === 'asc' ? 1 : -1;
        }
        return 0;
      });
    }
    return sortableItems;
  }, [products, sortConfig]);

  const filteredProducts = React.useMemo(() => {
    if (!Array.isArray(sortedProducts)) return [];
    
    return sortedProducts.filter(p => {
      try {
        const searchLower = (search || '').toLowerCase();
        const nameStr = (p.name || '').toLowerCase();
        const barcodeStr = (p.barcode || '').toLowerCase();
        
        const matchesSearch = nameStr.includes(searchLower) || barcodeStr.includes(searchLower);
        const matchesCategory = filterCategory === 'all' || p.category_id === parseInt(filterCategory);
        const matchesSupplier = filterSupplier === 'all' || p.supplier_id === parseInt(filterSupplier);
        const matchesUnit = filterUnit === 'all' || p.unit_id === parseInt(filterUnit);
        const matchesPrice = (p.sale_price || 0) >= filterPriceRange[0] && (p.sale_price || 0) <= filterPriceRange[1];
        
        return matchesSearch && matchesCategory && matchesSupplier && matchesUnit && matchesPrice;
      } catch (err) {
        console.error("Erro ao filtrar produto:", p, err);
        return false;
      }
    });
  }, [sortedProducts, search, filterCategory, filterSupplier, filterUnit, filterPriceRange]);

  // Pagination logic
  const totalPages = Math.ceil(filteredProducts.length / itemsPerPage);
  const currentProducts = filteredProducts.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  // Stock Summary logic
  const stockSummary = React.useMemo(() => {
    const byCategory: Record<string, number> = {};
    const byUnit: Record<string, number> = {};

    products.forEach(p => {
      const catName = p.category_name || 'Sem Categoria';
      const unitName = p.unit_name || 'Sem Unidade';
      
      byCategory[catName] = (byCategory[catName] || 0) + 1;
      byUnit[unitName] = (byUnit[unitName] || 0) + 1;
    });

    return { byCategory, byUnit };
  }, [products]);

  const filteredCategories = categories.filter(c => 
    (c.name || '').toLowerCase().includes((search || '').toLowerCase())
  );

  const filteredSuppliers = suppliers.filter(s => 
    (s.name || '').toLowerCase().includes((search || '').toLowerCase()) ||
    (s.email || '').toLowerCase().includes((search || '').toLowerCase()) ||
    (s.phone || '').toLowerCase().includes((search || '').toLowerCase())
  );

  const filteredCurrencies = currencies.filter(c => 
    (c.name || '').toLowerCase().includes((search || '').toLowerCase()) ||
    (c.symbol || '').toLowerCase().includes((search || '').toLowerCase()) ||
    (c.code || '').toLowerCase().includes((search || '').toLowerCase())
  );

  const filteredUnits = units.filter(u => 
    (u.name || '').toLowerCase().includes((search || '').toLowerCase()) ||
    (u.symbol || '').toLowerCase().includes((search || '').toLowerCase())
  );

  const getStockStatus = (product: Product) => {
    const totalStock = product.stock_base;
    if (totalStock <= 0) return { label: 'Sem Stock', color: 'bg-red-100 text-red-600', icon: <AlertCircle size={12} /> };
    if (totalStock <= product.min_stock) return { label: 'Stock Baixo', color: 'bg-orange-100 text-orange-600', icon: <AlertCircle size={12} /> };
    return { label: 'Normal', color: 'bg-green-100 text-green-600', icon: null };
  };

  const toggleSelectAll = () => {
    if (selectedProducts.length === currentProducts.length && currentProducts.length > 0) {
      setSelectedProducts([]);
    } else {
      setSelectedProducts(currentProducts.map(p => p.id));
    }
  };

  const toggleSelectProduct = (id: number) => {
    setSelectedProducts(prev => 
      prev.includes(id) ? prev.filter(pId => pId !== id) : [...prev, id]
    );
  };

  return (
    <div className="space-y-8">
      <header className="flex flex-col gap-6">
        <div className="flex items-center justify-between bg-white shadow-sm rounded-2xl p-4">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Inventário do Stock</h1>
            <p className="text-muted-foreground">Gerencie seus produtos e controle o stock da sua loja.</p>
          </div>
          <div className="flex items-center gap-3">
            {selectedProducts.length > 0 && user?.role === 'admin' && (
              <button 
                onClick={confirmBulkDelete}
                className="bg-red-50 text-red-600 border border-red-200 px-4 py-2 rounded-xl text-sm font-bold flex items-center gap-2 hover:bg-red-100 transition-colors"
              >
                <Trash2 size={18} />
                Eliminar Selecionados ({selectedProducts.length})
              </button>
            )}
            <button 
              onClick={() => setShowInactive(!showInactive)}
              className={cn(
                "px-4 py-2 rounded-xl text-sm font-bold flex items-center gap-2 transition-all",
                showInactive ? "bg-orange-50 text-orange-600 border border-orange-200" : "bg-white text-[#666] border border-[#e5e5e5]"
              )}
            >
              {showInactive ? <Eye size={18} /> : <EyeOff size={18} />}
              {showInactive ? "Ocultar Inativos" : "Mostrar Inativos"}
            </button>
            {user?.role === 'admin' && (
              <button 
                onClick={() => setIsImportModalOpen(true)}
                className="bg-white text-[#1a1a1a] border border-[#e5e5e5] px-6 py-3 rounded-xl font-bold flex items-center gap-2 hover:bg-[#f5f5f5] transition-colors shadow-sm"
              >
                <ArrowUpRight size={20} /> Importar
              </button>
            )}
            <button 
              onClick={() => {
                const exportData = {
                  store: {
                    name: store?.name,
                    nif: store?.nif,
                    address: store?.address
                  },
                  exportDate: new Date().toISOString(),
                  products: products
                };
                const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(exportData, null, 2));
                const downloadAnchorNode = document.createElement('a');
                downloadAnchorNode.setAttribute("href", dataStr);
                downloadAnchorNode.setAttribute("download", "produtos_export.json");
                document.body.appendChild(downloadAnchorNode);
                downloadAnchorNode.click();
                downloadAnchorNode.remove();
              }}
              className="bg-white text-[#1a1a1a] border border-[#e5e5e5] px-6 py-3 rounded-xl font-bold flex items-center gap-2 hover:bg-[#f5f5f5] transition-colors shadow-sm"
            >
              <ArrowDownRight size={20} /> Exportar JSON
            </button>
            <button 
              onClick={() => { setEditingProduct({ is_active: 1, is_favorite: 0, stock_base: 0, min_stock: 5 }); setIsModalOpen(true); }}
              className="bg-[#1a1a1a] text-white px-6 py-3 rounded-xl font-bold flex items-center gap-2 hover:scale-[1.02] transition-transform shadow-lg shadow-black/10"
            >
              <Plus size={20} /> Novo Produto
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-white p-6 rounded-[2rem] border border-[#e5e5e5] shadow-sm flex items-center gap-4">
            <div className="w-12 h-12 bg-indigo-50 rounded-2xl flex items-center justify-center text-indigo-600">
              <Package size={24} />
            </div>
            <div>
              <p className="text-[10px] font-black text-muted-foreground uppercase tracking-widest">Total de Produtos</p>
              <p className="text-2xl font-black">{products.length}</p>
            </div>
          </div>
          <div className="bg-white p-6 rounded-[2rem] border border-[#e5e5e5] shadow-sm flex items-center gap-4">
            <div className="w-12 h-12 bg-emerald-50 rounded-2xl flex items-center justify-center text-emerald-600">
              <Tag size={24} />
            </div>
            <div>
              <p className="text-[10px] font-black text-muted-foreground uppercase tracking-widest">Categorias Ativas</p>
              <p className="text-2xl font-black">{categories.length}</p>
            </div>
          </div>
          <div className="bg-white p-6 rounded-[2rem] border border-[#e5e5e5] shadow-sm flex items-center gap-4">
            <div className="w-12 h-12 bg-orange-50 rounded-2xl flex items-center justify-center text-orange-600">
              <AlertCircle size={24} />
            </div>
            <div>
              <p className="text-[10px] font-black text-muted-foreground uppercase tracking-widest">Stock Baixo</p>
              <p className="text-2xl font-black text-red-500">{products.filter(p => p.stock_base <= p.min_stock).length}</p>
            </div>
          </div>
        </div>
    
      </header>

      <div className="flex flex-col gap-4">
        <div className="flex items-center gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground" size={20} />
            <input
              type="text"
              placeholder="Pesquisar por nome ou código de barras..."
              className="w-full pl-12 pr-4 py-4 bg-white border border-[#e5e5e5] rounded-2xl outline-none focus:ring-2 focus:ring-[#1a1a1a]/10 shadow-sm"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <button 
            onClick={() => setIsFilterVisible(!isFilterVisible)}
            className={cn(
              "flex items-center gap-2 px-6 py-4 rounded-2xl font-bold transition-all border shadow-sm",
              isFilterVisible ? "bg-[#1a1a1a] text-white border-[#1a1a1a]" : "bg-white text-[#666] border-[#e5e5e5] hover:bg-[#f9f9f9]"
            )}
          >
            <Filter size={20} />
            {isFilterVisible ? "Ocultar Filtros" : "Filtros Avançados"}
          </button>
          {(search || (filterCategory !== 'all' || filterSupplier !== 'all' || filterUnit !== 'all' || filterPriceRange[1] !== 1000000)) && (
            <button 
              onClick={resetFilters}
              className="flex items-center gap-2 px-6 py-4 rounded-2xl font-bold text-rose-600 hover:bg-rose-50 transition-all border border-transparent"
            >
              <X size={20} />
              Limpar
            </button>
          )}
        </div>

        <AnimatePresence>
          {isFilterVisible && (
            <motion.div 
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="overflow-hidden"
            >
              <div className="grid grid-cols-1 md:grid-cols-4 gap-6 p-8 bg-white border border-[#e5e5e5] rounded-[2.5rem] shadow-xl">
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-muted-foreground uppercase tracking-[0.2em]">Categoria</label>
                  <select 
                    className="w-full p-4 bg-[#f5f5f5] border-none rounded-2xl outline-none font-bold text-sm appearance-none cursor-pointer"
                    value={filterCategory}
                    onChange={e => setFilterCategory(e.target.value)}
                  >
                    <option value="all">Todas as Categorias</option>
                    {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                  </select>
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-muted-foreground uppercase tracking-[0.2em]">Fornecedor</label>
                  <select 
                    className="w-full p-4 bg-[#f5f5f5] border-none rounded-2xl outline-none font-bold text-sm appearance-none cursor-pointer"
                    value={filterSupplier}
                    onChange={e => setFilterSupplier(e.target.value)}
                  >
                    <option value="all">Todos os Fornecedores</option>
                    {suppliers.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                  </select>
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-muted-foreground uppercase tracking-[0.2em]">Unidade</label>
                  <select 
                    className="w-full p-4 bg-[#f5f5f5] border-none rounded-2xl outline-none font-bold text-sm appearance-none cursor-pointer"
                    value={filterUnit}
                    onChange={e => setFilterUnit(e.target.value)}
                  >
                    <option value="all">Todas as Unidades</option>
                    {units.map(u => <option key={u.id} value={u.id}>{u.name}</option>)}
                  </select>
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-muted-foreground uppercase tracking-[0.2em]">Preço Máximo</label>
                  <div className="flex flex-col gap-2">
                    <input 
                      type="range" 
                      min="0" 
                      max="50000" 
                      step="100"
                      className="w-full accent-[#1a1a1a]"
                      value={filterPriceRange[1]}
                      onChange={e => setFilterPriceRange([0, parseInt(e.target.value)])}
                    />
                    <div className="flex justify-between items-center px-1">
                      <span className="text-[10px] font-bold text-slate-400">0 STN</span>
                      <span className="text-sm font-black text-[#1a1a1a]">
                        {formatCurrency(filterPriceRange[1], store?.currency)}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      <div className="bg-white rounded-[2rem] border border-[#e5e5e5] shadow-xl overflow-hidden">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-[#f9f9f9] border-b border-[#e5e5e5]">
                <th className="px-6 py-5 w-12">
                  {user?.role === 'admin' && (
                    <input 
                      type="checkbox" 
                      className="w-4 h-4 rounded border-gray-300 text-[#1a1a1a] focus:ring-[#1a1a1a]"
                      checked={selectedProducts.length === currentProducts.length && currentProducts.length > 0}
                      onChange={toggleSelectAll}
                    />
                  )}
                </th>
                <th 
                  className="px-6 py-5 text-xs font-bold text-muted-foreground uppercase tracking-wider cursor-pointer hover:text-[#1a1a1a] transition-colors"
                  onClick={() => handleSort('name')}
                >
                  <div className="flex items-center gap-2">
                    Produto
                    <ArrowUpDown size={12} className={cn(sortConfig?.key === 'name' ? "text-[#1a1a1a]" : "text-slate-300")} />
                  </div>
                </th>
                <th className="px-6 py-5 text-xs font-bold text-muted-foreground uppercase tracking-wider">Categoria / Fornecedor</th>
                <th className="px-6 py-5 text-xs font-bold text-muted-foreground uppercase tracking-wider">Unidade</th>
                <th 
                  className="px-6 py-5 text-xs font-bold text-muted-foreground uppercase tracking-wider cursor-pointer hover:text-[#1a1a1a] transition-colors"
                  onClick={() => handleSort('sale_price')}
                >
                  <div className="flex items-center gap-2">
                    Preços
                    <ArrowUpDown size={12} className={cn(sortConfig?.key === 'sale_price' ? "text-[#1a1a1a]" : "text-slate-300")} />
                  </div>
                </th>
                <th 
                  className="px-6 py-5 text-xs font-bold text-muted-foreground uppercase tracking-wider cursor-pointer hover:text-[#1a1a1a] transition-colors"
                  onClick={() => handleSort('stock_base')}
                >
                  <div className="flex items-center gap-2">
                    Stock
                    <ArrowUpDown size={12} className={cn(sortConfig?.key === 'stock_base' ? "text-[#1a1a1a]" : "text-slate-300")} />
                  </div>
                </th>
                <th className="px-6 py-5 text-xs font-bold text-muted-foreground uppercase tracking-wider">Stock Grosso</th>
                <th className="px-6 py-5 text-xs font-bold text-muted-foreground uppercase tracking-wider">Status</th>
                <th className="px-6 py-5 text-xs font-bold text-muted-foreground uppercase tracking-wider text-right">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#e5e5e5]">
              {currentProducts.map(product => {
                const status = getStockStatus(product);
                return (
                  <tr key={product.id} className={cn("hover:bg-[#fcfcfc] transition-colors group", !product.is_active && "opacity-60 grayscale")}>
                    <td className="px-6 py-4">
                      {user?.role === 'admin' && (
                        <input 
                          type="checkbox" 
                          className="w-4 h-4 rounded border-gray-300 text-[#1a1a1a] focus:ring-[#1a1a1a]"
                          checked={selectedProducts.includes(product.id)}
                          onChange={() => toggleSelectProduct(product.id)}
                        />
                      )}
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-4">
                        <div className="w-12 h-12 bg-[#f5f5f5] rounded-2xl flex items-center justify-center text-[#ccc] relative overflow-hidden group/img">
                          <Package size={24} />
                          {user?.role === 'admin' && (
                            <button 
                              onClick={(e) => { e.stopPropagation(); toggleFavorite(product); }}
                              className={cn(
                                "absolute top-0 right-0 p-1 transition-all",
                                product.is_favorite === 1 ? "bg-yellow-400 text-white" : "bg-black/20 text-white opacity-0 group-hover/img:opacity-100"
                              )}
                            >
                              <Star size={10} fill={product.is_favorite === 1 ? "currentColor" : "none"} />
                            </button>
                          )}
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <p className="font-bold text-sm">{product.name}</p>
                            {!product.is_active && <span className="text-[10px] bg-gray-100 text-gray-500 px-1.5 py-0.5 rounded font-bold uppercase">Inativo</span>}
                          </div>
                          <div className="flex items-center gap-2 text-xs text-muted-foreground">
                            <Barcode size={12} />
                            <span>{product.barcode || 'Sem código'}</span>
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="space-y-1">
                        <div className="flex items-center gap-1.5 text-sm font-medium text-[#1a1a1a]">
                          <Tag size={14} className="text-muted-foreground" />
                          {product.category_name || 'Geral'}
                        </div>
                        <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                          <Truck size={14} />
                          {product.supplier_name || 'Sem fornecedor'}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="space-y-1">
                        <p className="text-xs font-bold text-[#1a1a1a]">{product.unit_name || product.base_unit_name || 'un'}</p>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="space-y-1">
                        <p className="text-xs text-muted-foreground">Venda: <span className="font-bold text-[#1a1a1a]">{formatCurrency(product.sale_price, store?.currency)}</span></p>
                        <p className="text-[10px] text-muted-foreground">Compra: {formatCurrency(product.purchase_price, store?.currency)}</p>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex flex-col gap-1">
                        <div className="flex items-center gap-2">
                          <span className={cn(
                            "font-black text-lg",
                            product.stock_base <= product.min_stock ? "text-red-500" : "text-[#1a1a1a]"
                          )}>
                            {product.stock_base}
                          </span>
                          <span className="text-xs text-muted-foreground font-medium">{product.unit_name || 'un'}</span>
                        </div>
                        {product.type === 'fracionado' && (
                          <div className="flex items-center gap-2 text-xs text-slate-500 italic">
                            <span>{product.stock_fracionado}</span>
                            <span>un. frac.</span>
                          </div>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex flex-col">
                        <span className="text-sm font-bold text-slate-600">
                          {product.stock_base > 0 ? product.stock_base : 0} {product.unit_name}
                        </span>
                        <span className="text-[10px] text-muted-foreground italic">Stock Bruto</span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className={cn(
                        "inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider",
                        status.color
                      )}>
                        {status.icon}
                        {status.label}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-1">
                        <button 
                          onClick={() => { setSelectedProduct(product); setIsStockModalOpen(true); }}
                          title="Entrada de Stock"
                          className="p-2 hover:bg-blue-50 rounded-xl text-blue-600 transition-colors"
                        >
                          <Plus size={18} />
                        </button>
                        <button 
                          onClick={() => viewHistory(product)}
                          title="Histórico"
                          className="p-2 hover:bg-purple-50 rounded-xl text-purple-600 transition-colors"
                        >
                          <History size={18} />
                        </button>
                        <button 
                          onClick={() => { setSelectedProduct(product); setIsUnitsPricesModalOpen(true); }}
                          title="Unidades e Preços"
                          className="p-2 hover:bg-orange-50 rounded-xl text-orange-600 transition-colors"
                        >
                          <Tag size={18} />
                        </button>
                        <div className="w-px h-4 bg-gray-200 mx-1" />
                        <button 
                          onClick={() => { setEditingProduct(product); setIsModalOpen(true); }}
                          title="Editar"
                          className="p-2 hover:bg-gray-100 rounded-xl text-[#1a1a1a] transition-colors"
                        >
                          <Edit2 size={18} />
                        </button>
                        <button 
                          onClick={() => toggleFavorite(product)}
                          title={product.is_favorite ? "Remover dos Favoritos" : "Marcar como Favorito"}
                          className={cn("p-2 rounded-xl transition-colors", product.is_favorite ? "text-yellow-500 hover:bg-yellow-50" : "text-gray-300 hover:bg-gray-100")}
                        >
                          <Star size={18} fill={product.is_favorite ? "currentColor" : "none"} />
                        </button>
                        <button 
                          onClick={() => toggleStatus(product)}
                          title={product.is_active ? "Desativar" : "Ativar"}
                          className={cn("p-2 rounded-xl transition-colors", product.is_active ? "text-green-500 hover:bg-green-50" : "text-red-500 hover:bg-red-50")}
                        >
                          {product.is_active ? <Eye size={18} /> : <EyeOff size={18} />}
                        </button>
                        {user?.role === 'admin' && (
                          <button 
                            onClick={() => deleteProduct(product.id)}
                            title="Eliminar"
                            className="p-2 hover:bg-red-50 rounded-xl text-red-500 transition-colors"
                          >
                            <Trash2 size={18} />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>

          {/* Pagination Controls */}
          {totalPages > 1 && (
            <div className="px-6 py-4 bg-[#f9f9f9] border-t border-[#e5e5e5] flex items-center justify-between">
              <p className="text-xs font-bold text-muted-foreground">
                Mostrando <span className="text-[#1a1a1a]">{(currentPage - 1) * itemsPerPage + 1}</span> a <span className="text-[#1a1a1a]">{Math.min(currentPage * itemsPerPage, filteredProducts.length)}</span> de <span className="text-[#1a1a1a]">{filteredProducts.length}</span> produtos
              </p>
              <div className="flex items-center gap-2">
                <button
                  disabled={currentPage === 1}
                  onClick={() => setCurrentPage(prev => prev - 1)}
                  className="p-2 rounded-xl border border-[#e5e5e5] bg-white text-[#1a1a1a] disabled:opacity-50 hover:bg-[#f5f5f5] transition-all"
                >
                  <ChevronLeft size={16} />
                </button>
                <div className="flex items-center gap-1">
                  {Array.from({ length: totalPages }, (_, i) => i + 1).map(page => (
                    <button
                      key={page}
                      onClick={() => setCurrentPage(page)}
                      className={cn(
                        "w-8 h-8 rounded-xl text-xs font-bold transition-all",
                        currentPage === page ? "bg-[#1a1a1a] text-white" : "bg-white border border-[#e5e5e5] text-[#666] hover:bg-[#f5f5f5]"
                      )}
                    >
                      {page}
                    </button>
                  ))}
                </div>
                <button
                  disabled={currentPage === totalPages}
                  onClick={() => setCurrentPage(prev => prev + 1)}
                  className="p-2 rounded-xl border border-[#e5e5e5] bg-white text-[#1a1a1a] disabled:opacity-50 hover:bg-[#f5f5f5] transition-all"
                >
                  <ChevronRight size={16} />
                </button>
              </div>
            </div>
          )}
        </div>
      
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={editingProduct?.id ? 'Editar Registro de Produto' : 'Novo Registro de Produto'}
        maxWidth="6xl"
        icon={<Package size={24} />}
        footer={
          <div className="flex items-center justify-between">
            <div className="text-slate-400 text-xs font-medium italic">
              * Campos obrigatórios para garantir a integridade do stock.
            </div>
            <div className="flex gap-4">
              <button 
                type="button" 
                onClick={() => setIsModalOpen(false)}
                className="px-8 py-4 rounded-2xl font-bold text-slate-500 hover:bg-slate-100 transition-all"
              >
                Descartar
              </button>
              <button 
                onClick={handleSave}
                className="bg-indigo-600 text-white px-12 py-4 rounded-2xl font-bold shadow-xl shadow-indigo-200 hover:bg-indigo-700 hover:translate-y-[-2px] active:translate-y-[0px] transition-all flex items-center gap-3"
              >
                <Save size={20} /> 
                {editingProduct?.id ? 'Atualizar Registro' : 'Salvar Produto'}
              </button>
            </div>
          </div>
        }
      >
        <form onSubmit={handleSave} className="space-y-10">
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
                  
                  {/* Column 1: Identity */}
                  <div className="space-y-8">
                    <div className="flex items-center gap-2 text-indigo-600 font-bold text-xs uppercase tracking-[0.2em]">
                      <div className="w-6 h-[2px] bg-indigo-600 rounded-full" />
                      Identidade
                    </div>
                    
                    <div className="space-y-5">
                      <div className="group">
                        <label className="block text-xs font-bold text-slate-500 mb-2 uppercase tracking-wider group-focus-within:text-indigo-600 transition-colors">Nome do Produto</label>
                        <div className="relative">
                          <Info size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
                          <input
                            required
                            type="text"
                            placeholder="Nome comercial..."
                            className="w-full pl-12 pr-4 py-4 bg-slate-50 border border-slate-200 rounded-2xl outline-none font-semibold text-slate-900 focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 transition-all placeholder:text-slate-300"
                            value={editingProduct?.name || ''}
                            onChange={e => setEditingProduct({...editingProduct, name: e.target.value})}
                          />
                        </div>
                      </div>

                      <div className="group">
                        <label className="block text-xs font-bold text-slate-500 mb-2 uppercase tracking-wider group-focus-within:text-indigo-600 transition-colors">Código de Barras</label>
                        <div className="flex gap-2">
                          <div className="relative flex-1">
                            <Barcode size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
                            <input
                              type="text"
                              placeholder="EAN-13 / SKU"
                              className="w-full pl-12 pr-4 py-4 bg-slate-50 border border-slate-200 rounded-2xl outline-none font-mono text-sm focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 transition-all"
                              value={editingProduct?.barcode || ''}
                              onChange={e => setEditingProduct({...editingProduct, barcode: e.target.value})}
                            />
                          </div>
                          <button 
                            type="button"
                            onClick={generateBarcode}
                            className="w-14 bg-white border border-slate-200 rounded-2xl text-slate-400 hover:text-indigo-600 hover:border-indigo-200 hover:bg-indigo-50 transition-all flex items-center justify-center shadow-sm"
                            title="Gerar código automático"
                          >
                            <RefreshCw size={20} />
                          </button>
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-4">
                        <div className="group">
                          <label className="block text-xs font-bold text-slate-500 mb-2 uppercase tracking-wider group-focus-within:text-indigo-600 transition-colors">Categoria</label>
                          <select
                            className="w-full px-4 py-4 bg-slate-50 border border-slate-200 rounded-2xl outline-none font-bold text-slate-900 focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 transition-all appearance-none cursor-pointer"
                            value={editingProduct?.category_id || ''}
                            onChange={e => setEditingProduct({...editingProduct, category_id: parseInt(e.target.value)})}
                          >
                            <option value="">Geral</option>
                            {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                          </select>
                        </div>
                        <div className="group">
                          <label className="block text-xs font-bold text-slate-500 mb-2 uppercase tracking-wider group-focus-within:text-indigo-600 transition-colors">Unidade Base (Stock)</label>
                          <select
                            className="w-full px-4 py-4 bg-slate-50 border border-slate-200 rounded-2xl outline-none font-bold text-slate-900 focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 transition-all appearance-none cursor-pointer"
                            value={editingProduct?.base_unit_id || ''}
                            onChange={e => setEditingProduct({...editingProduct, base_unit_id: e.target.value ? parseInt(e.target.value) : undefined})}
                          >
                            <option value="">Unidade Base</option>
                            {units.map(u => <option key={u.id} value={u.id}>{u.name}</option>)}
                          </select>
                        </div>
                        {store?.uses_tax ? (
                          <div className="group col-span-2">
                            <label className="block text-xs font-bold text-slate-500 mb-2 uppercase tracking-wider group-focus-within:text-indigo-600 transition-colors">Imposto (IVA)</label>
                            <select
                              className="w-full px-4 py-4 bg-slate-50 border border-slate-200 rounded-2xl outline-none font-bold text-slate-900 focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 transition-all appearance-none cursor-pointer"
                              value={editingProduct?.tax_id || ''}
                              onChange={e => setEditingProduct({...editingProduct, tax_id: parseInt(e.target.value)})}
                            >
                              <option value="">Isento / Padrão</option>
                              {taxes.map(t => <option key={t.id} value={t.id}>{t.name} ({t.rate}%)</option>)}
                            </select>
                          </div>
                        ) : null}
                      </div>
                    </div>
                  </div>

                  {/* Column 2: Logistics */}
                  <div className="space-y-8">
                    <div className="flex items-center gap-2 text-indigo-600 font-bold text-xs uppercase tracking-[0.2em]">
                      <div className="w-6 h-[2px] bg-indigo-600 rounded-full" />
                      Logística
                    </div>

                    <div className="space-y-5">
                      <div className="group">
                        <label className="block text-xs font-bold text-slate-500 mb-2 uppercase tracking-wider group-focus-within:text-indigo-600 transition-colors">Fornecedor Preferencial</label>
                        <div className="relative">
                          <Truck size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
                          <select
                            className="w-full pl-12 pr-4 py-4 bg-slate-50 border border-slate-200 rounded-2xl outline-none font-bold text-slate-900 focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 transition-all appearance-none cursor-pointer"
                            value={editingProduct?.supplier_id || ''}
                            onChange={e => setEditingProduct({...editingProduct, supplier_id: parseInt(e.target.value)})}
                          >
                            <option value="">Nenhum fornecedor...</option>
                            {suppliers.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                          </select>
                        </div>
                      </div>

                      <div className="group">
                        <label className="block text-xs font-bold text-slate-500 mb-2 uppercase tracking-wider group-focus-within:text-indigo-600 transition-colors">Notas Internas</label>
                        <textarea
                          placeholder="Observações sobre o produto..."
                          className="w-full px-4 py-4 bg-slate-50 border border-slate-200 rounded-2xl outline-none h-28 resize-none font-medium text-slate-700 focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 transition-all"
                          value={editingProduct?.description || ''}
                          onChange={e => setEditingProduct({...editingProduct, description: e.target.value})}
                        />
                      </div>
                    </div>
                  </div>

                  {/* Column 3: Financial */}
                  <div className="space-y-8">
                    <div className="flex items-center gap-2 text-indigo-600 font-bold text-xs uppercase tracking-[0.2em]">
                      <div className="w-6 h-[2px] bg-indigo-600 rounded-full" />
                      Financeiro
                    </div>

                    <div className="space-y-6">
                      <div className="grid grid-cols-2 gap-4">
                        <div className="p-5 bg-slate-50 rounded-3xl border border-slate-100 group hover:border-indigo-200 transition-all">
                          <label className="block text-[10px] font-black text-slate-400 mb-2 uppercase tracking-widest">Custo Unitário</label>
                          <div className="flex items-baseline gap-1">
                            <span className="text-xs font-bold text-slate-400">{store?.currency || 'STN'}</span>
                            <input
                              required
                              type="number"
                              step="0.01"
                              className="w-full bg-transparent outline-none font-black text-xl text-slate-900"
                              value={editingProduct?.purchase_price || ''}
                              onChange={e => setEditingProduct({...editingProduct, purchase_price: parseFloat(e.target.value)})}
                            />
                          </div>
                        </div>
                        <div className="p-5 bg-emerald-50/50 rounded-3xl border border-emerald-100 group hover:border-emerald-300 transition-all">
                          <label className="block text-[10px] font-black text-emerald-600/50 mb-2 uppercase tracking-widest">Preço Venda</label>
                          <div className="flex items-baseline gap-1">
                            <span className="text-xs font-bold text-emerald-600/50">{store?.currency || 'STN'}</span>
                            <input
                              required
                              type="number"
                              step="0.01"
                              className="w-full bg-transparent outline-none font-black text-xl text-emerald-600"
                              value={editingProduct?.sale_price || ''}
                              onChange={e => setEditingProduct({...editingProduct, sale_price: parseFloat(e.target.value)})}
                            />
                          </div>
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-4">
                        <div className="p-5 bg-slate-50 rounded-3xl border border-slate-100">
                          <label className="block text-[10px] font-black text-slate-400 mb-2 uppercase tracking-widest">Stock</label>
                          <input
                            required
                            type="number"
                            className="w-full bg-transparent outline-none font-black text-xl text-slate-900"
                            value={editingProduct?.stock_base || ''}
                            onChange={e => setEditingProduct({...editingProduct, stock_base: parseFloat(e.target.value)})}
                          />
                        </div>
                        <div className="p-5 bg-orange-50/50 rounded-3xl border border-orange-100">
                          <label className="block text-[10px] font-black text-orange-600/50 mb-2 uppercase tracking-widest">Mínimo</label>
                          <input
                            required
                            type="number"
                            className="w-full bg-transparent outline-none font-black text-xl text-orange-600"
                            value={editingProduct?.min_stock || ''}
                            onChange={e => setEditingProduct({...editingProduct, min_stock: parseInt(e.target.value)})}
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

        </form>
      </Modal>

      <Modal
        isOpen={isHistoryOpen && !!selectedProduct}
        onClose={() => setIsHistoryOpen(false)}
        title="Movimentações"
        maxWidth="2xl"
        icon={<History size={24} />}
      >
        <div className="min-h-[200px]">
          {selectedProduct && (
            <div className="space-y-4">
              <div className="mb-6">
                <p className="text-sm font-medium text-slate-400">{selectedProduct.name}</p>
              </div>
              {history.length === 0 ? (
                <div className="flex flex-col items-center justify-center text-slate-300 py-20">
                  <div className="w-20 h-20 bg-slate-50 rounded-full flex items-center justify-center mb-6">
                    <History size={40} />
                  </div>
                  <p className="font-bold text-lg">Sem movimentações registadas</p>
                  <p className="text-sm">As alterações de stock aparecerão aqui.</p>
                </div>
              ) : (
                history.map(item => (
                  <div key={item.id} className="p-6 bg-white rounded-3xl border border-slate-100 flex items-center gap-6 hover:shadow-md hover:border-slate-200 transition-all group">
                    <div className={cn(
                      "w-14 h-14 rounded-2xl flex items-center justify-center shadow-sm transition-transform group-hover:scale-110",
                      item.type === 'in' ? "bg-emerald-50 text-emerald-600 border border-emerald-100" : 
                      item.type === 'out' ? "bg-rose-50 text-rose-600 border border-rose-100" : 
                      item.type === 'sale' ? "bg-indigo-50 text-indigo-600 border border-indigo-100" : "bg-slate-50 text-slate-600 border border-slate-100"
                    )}>
                      {item.type === 'in' ? <TrendingUp size={24} /> : 
                       item.type === 'out' ? <TrendingDown size={24} /> : 
                       item.type === 'sale' ? <ArrowDownRight size={24} /> : <RefreshCw size={24} />}
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center justify-between mb-2">
                        <p className="font-black text-slate-900 uppercase tracking-wider text-xs">
                          {item.type === 'in' ? 'Entrada de Stock' : item.type === 'out' ? 'Saída de Stock' : item.type === 'sale' ? 'Venda Realizada' : 'Ajuste Manual'}
                        </p>
                        <p className={cn("font-black text-xl", item.quantity > 0 ? "text-emerald-600" : "text-rose-600")}>
                          {item.quantity > 0 ? `+${item.quantity}` : item.quantity} <span className="text-xs text-slate-400">{item.unit || 'un'}</span>
                        </p>
                      </div>
                      <p className="text-sm text-slate-500 font-medium mb-4 leading-relaxed bg-slate-50 p-3 rounded-xl border border-slate-100/50">{item.reason}</p>
                      <div className="flex items-center gap-6 text-[10px] font-black text-slate-400 uppercase tracking-widest">
                        <div className="flex items-center gap-2 bg-slate-100 px-2 py-1 rounded-md"><Calendar size={12} className="text-slate-500" /> {new Date(item.created_at).toLocaleDateString()}</div>
                        <div className="flex items-center gap-2 bg-slate-100 px-2 py-1 rounded-md"><Clock size={12} className="text-slate-500" /> {new Date(item.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</div>
                        <div className="flex items-center gap-2 bg-slate-100 px-2 py-1 rounded-md"><User size={12} className="text-slate-500" /> {item.user_name}</div>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          )}
        </div>
      </Modal>

      <ProductUnitsPricesModal
        isOpen={isUnitsPricesModalOpen}
        onClose={() => { setIsUnitsPricesModalOpen(false); setSelectedProduct(null); }}
        product={selectedProduct}
        units={units}
        priceLists={priceLists}
      />

      {/* Delete Confirmation Modal */}
      <DeleteConfirmationModal 
        isOpen={isDeleteModalOpen}
        onClose={() => { setIsDeleteModalOpen(false); setDeleteAction(null); }}
        onConfirm={handleDelete}
        title="Confirmar Eliminação"
        description={`Tem a certeza que deseja eliminar este ${deleteAction?.type === 'user' ? 'funcionário' : deleteAction?.type === 'category' ? 'categoria' : deleteAction?.type === 'supplier' ? 'fornecedor' : 'item'}?`}
      />

      <ImportProductsModal
        isOpen={isImportModalOpen}
        onClose={() => setIsImportModalOpen(false)}
        onSuccess={fetchProducts}
      />
    </div>
  );
};

export default Inventory;
