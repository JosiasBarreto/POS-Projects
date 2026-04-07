import React from 'react';
import { Package, Info, Barcode, RefreshCw, Save, Truck } from 'lucide-react';
import Modal from '../ui/Modal';
import { Product, Category, Supplier, Unit, Tax, Store } from '../../types';

interface ProductFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (e: React.FormEvent) => void;
  editingProduct: Partial<Product>;
  setEditingProduct: (product: Partial<Product>) => void;
  categories: Category[];
  suppliers: Supplier[];
  units: Unit[];
  taxes: Tax[];
  generateBarcode: () => void;
  store: Store | null;
}

const ProductFormModal: React.FC<ProductFormModalProps> = ({
  isOpen,
  onClose,
  onSave,
  editingProduct,
  setEditingProduct,
  categories,
  suppliers,
  units,
  taxes,
  generateBarcode,
  store,
}) => {
  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
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
              onClick={onClose}
              className="px-8 py-4 rounded-2xl font-bold text-slate-500 hover:bg-slate-100 transition-all"
            >
              Descartar
            </button>
            <button 
              onClick={onSave}
              className="bg-indigo-600 text-white px-12 py-4 rounded-2xl font-bold shadow-xl shadow-indigo-200 hover:bg-indigo-700 hover:translate-y-[-2px] active:translate-y-[0px] transition-all flex items-center gap-3"
            >
              <Save size={20} /> 
              {editingProduct?.id ? 'Atualizar Registro' : 'Salvar Produto'}
            </button>
          </div>
        </div>
      }
    >
      <form onSubmit={onSave} className="space-y-10">
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
                      className="w-full bg-transparent outline-none font-black text-xl text-slate-900"
                      value={editingProduct?.sale_price || ''}
                      onChange={e => setEditingProduct({...editingProduct, sale_price: parseFloat(e.target.value)})}
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </form>
    </Modal>
  );
};

export default ProductFormModal;
