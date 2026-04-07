import React, { useState, useEffect } from 'react';
import { X, Plus, Trash2, Save } from 'lucide-react';
import { Product, Unit, PriceList, ProductUnit, ProductPrice } from '../../types';
import { toast } from 'sonner';

interface ProductUnitsPricesModalProps {
  isOpen: boolean;
  onClose: () => void;
  product: Product | null;
  units: Unit[];
  priceLists: PriceList[];
}

const ProductUnitsPricesModal: React.FC<ProductUnitsPricesModalProps> = ({
  isOpen,
  onClose,
  product,
  units,
  priceLists
}) => {
  const [productUnits, setProductUnits] = useState<ProductUnit[]>([]);
  const [productPrices, setProductPrices] = useState<ProductPrice[]>([]);
  
  const [newUnit, setNewUnit] = useState<Partial<ProductUnit>>({
    unit_id: 0,
    conversion_factor: 1,
    barcode: ''
  });

  const [newPrice, setNewPrice] = useState<Partial<ProductPrice>>({
    price_list_id: 0,
    unit_id: 0,
    price: 0
  });

  useEffect(() => {
    if (isOpen && product) {
      fetchProductDetails();
    }
  }, [isOpen, product]);

  const fetchProductDetails = async () => {
    if (!product) return;
    try {
      const res = await fetch(`/api/products/${product.id}`);
      if (res.ok) {
        const data = await res.json();
        setProductUnits(data.units || []);
        setProductPrices(data.prices || []);
      }
    } catch (error) {
      toast.error('Erro ao carregar detalhes do produto');
    }
  };

  const handleAddUnit = async () => {
    if (!product || !newUnit.unit_id || !newUnit.conversion_factor) {
      toast.error('Preencha os campos obrigatórios da unidade');
      return;
    }

    try {
      const res = await fetch(`/api/products/${product.id}/units`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newUnit)
      });

      if (res.ok) {
        toast.success('Unidade adicionada com sucesso');
        setNewUnit({ unit_id: 0, conversion_factor: 1, barcode: '' });
        fetchProductDetails();
      } else {
        const err = await res.json();
        toast.error(err.error || 'Erro ao adicionar unidade');
      }
    } catch (error) {
      toast.error('Erro ao adicionar unidade');
    }
  };

  const handleAddPrice = async () => {
    if (!product || !newPrice.price_list_id || !newPrice.unit_id || !newPrice.price) {
      toast.error('Preencha os campos obrigatórios do preço');
      return;
    }

    try {
      const res = await fetch(`/api/products/${product.id}/prices`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newPrice)
      });

      if (res.ok) {
        toast.success('Preço adicionado/atualizado com sucesso');
        setNewPrice({ price_list_id: 0, unit_id: 0, price: 0 });
        fetchProductDetails();
      } else {
        const err = await res.json();
        toast.error(err.error || 'Erro ao adicionar preço');
      }
    } catch (error) {
      toast.error('Erro ao adicionar preço');
    }
  };

  const handleDeleteUnit = async (id: number) => {
    try {
      const res = await fetch(`/api/product-units/${id}`, { method: 'DELETE' });
      if (res.ok) {
        toast.success('Unidade removida');
        fetchProductDetails();
      } else {
        toast.error('Erro ao remover unidade');
      }
    } catch (error) {
      toast.error('Erro ao remover unidade');
    }
  };

  const handleDeletePrice = async (id: number) => {
    try {
      const res = await fetch(`/api/product-prices/${id}`, { method: 'DELETE' });
      if (res.ok) {
        toast.success('Preço removido');
        fetchProductDetails();
      } else {
        toast.error('Erro ao remover preço');
      }
    } catch (error) {
      toast.error('Erro ao remover preço');
    }
  };

  if (!isOpen || !product) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
      <div className="bg-white rounded-3xl w-full max-w-4xl max-h-[90vh] overflow-hidden shadow-2xl flex flex-col">
        <div className="p-6 border-b border-gray-100 flex justify-between items-center bg-gray-50/50">
          <div>
            <h2 className="text-xl font-bold text-gray-900">Unidades e Preços</h2>
            <p className="text-sm text-gray-500 mt-1">{product.name}</p>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-full transition-colors">
            <X size={20} className="text-gray-500" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-6 space-y-8">
          {/* Unidades de Conversão */}
          <section>
            <h3 className="text-lg font-bold text-gray-900 mb-4">Unidades de Conversão</h3>
            <div className="bg-white border border-gray-200 rounded-2xl overflow-hidden">
              <div className="p-4 bg-gray-50 border-b border-gray-200 grid grid-cols-12 gap-4 items-end">
                <div className="col-span-4">
                  <label className="block text-xs font-bold text-gray-500 mb-1 uppercase">Unidade</label>
                  <select
                    className="w-full p-2 border border-gray-200 rounded-xl text-sm"
                    value={newUnit.unit_id || ''}
                    onChange={e => setNewUnit({ ...newUnit, unit_id: parseInt(e.target.value) })}
                  >
                    <option value="">Selecione...</option>
                    {units.map(u => <option key={u.id} value={u.id}>{u.name}</option>)}
                  </select>
                </div>
                <div className="col-span-3">
                  <label className="block text-xs font-bold text-gray-500 mb-1 uppercase">Fator (Qtd Base)</label>
                  <input
                    type="number"
                    step="0.01"
                    className="w-full p-2 border border-gray-200 rounded-xl text-sm"
                    value={newUnit.conversion_factor || ''}
                    onChange={e => setNewUnit({ ...newUnit, conversion_factor: parseFloat(e.target.value) })}
                  />
                </div>
                <div className="col-span-4">
                  <label className="block text-xs font-bold text-gray-500 mb-1 uppercase">Cód. Barras (Opcional)</label>
                  <input
                    type="text"
                    className="w-full p-2 border border-gray-200 rounded-xl text-sm"
                    value={newUnit.barcode || ''}
                    onChange={e => setNewUnit({ ...newUnit, barcode: e.target.value })}
                  />
                </div>
                <div className="col-span-1">
                  <button
                    onClick={handleAddUnit}
                    className="w-full p-2 bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 flex justify-center items-center"
                  >
                    <Plus size={20} />
                  </button>
                </div>
              </div>
              
              <table className="w-full text-left text-sm">
                <thead className="bg-gray-50 text-gray-500">
                  <tr>
                    <th className="p-3 font-medium">Unidade</th>
                    <th className="p-3 font-medium">Fator de Conversão</th>
                    <th className="p-3 font-medium">Código de Barras</th>
                    <th className="p-3 font-medium text-right">Ações</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {productUnits.map(pu => {
                    const unitName = units.find(u => u.id === pu.unit_id)?.name;
                    return (
                      <tr key={pu.id}>
                        <td className="p-3 font-medium text-gray-900">{unitName}</td>
                        <td className="p-3 text-gray-600">1 {unitName} = {pu.conversion_factor} {product.unit_name || 'Base'}</td>
                        <td className="p-3 text-gray-600">{pu.barcode || '-'}</td>
                        <td className="p-3 text-right">
                          <button onClick={() => handleDeleteUnit(pu.id)} className="p-1.5 text-red-500 hover:bg-red-50 rounded-lg">
                            <Trash2 size={16} />
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                  {productUnits.length === 0 && (
                    <tr>
                      <td colSpan={4} className="p-4 text-center text-gray-500">Nenhuma unidade de conversão definida.</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </section>

          {/* Tabelas de Preços */}
          <section>
            <h3 className="text-lg font-bold text-gray-900 mb-4">Preços por Lista e Unidade</h3>
            <div className="bg-white border border-gray-200 rounded-2xl overflow-hidden">
              <div className="p-4 bg-gray-50 border-b border-gray-200 grid grid-cols-12 gap-4 items-end">
                <div className="col-span-4">
                  <label className="block text-xs font-bold text-gray-500 mb-1 uppercase">Lista de Preços</label>
                  <select
                    className="w-full p-2 border border-gray-200 rounded-xl text-sm"
                    value={newPrice.price_list_id || ''}
                    onChange={e => setNewPrice({ ...newPrice, price_list_id: parseInt(e.target.value) })}
                  >
                    <option value="">Selecione...</option>
                    {priceLists.map(pl => <option key={pl.id} value={pl.id}>{pl.name}</option>)}
                  </select>
                </div>
                <div className="col-span-4">
                  <label className="block text-xs font-bold text-gray-500 mb-1 uppercase">Unidade</label>
                  <select
                    className="w-full p-2 border border-gray-200 rounded-xl text-sm"
                    value={newPrice.unit_id || ''}
                    onChange={e => setNewPrice({ ...newPrice, unit_id: parseInt(e.target.value) })}
                  >
                    <option value="">Selecione...</option>
                    {/* Include base unit and conversion units */}
                    {product.base_unit_id && (
                      <option value={product.base_unit_id}>
                        {units.find(u => u.id === product.base_unit_id)?.name} (Base)
                      </option>
                    )}
                    {productUnits.map(pu => (
                      <option key={pu.id} value={pu.unit_id}>
                        {units.find(u => u.id === pu.unit_id)?.name}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="col-span-3">
                  <label className="block text-xs font-bold text-gray-500 mb-1 uppercase">Preço</label>
                  <input
                    type="number"
                    step="0.01"
                    className="w-full p-2 border border-gray-200 rounded-xl text-sm"
                    value={newPrice.price || ''}
                    onChange={e => setNewPrice({ ...newPrice, price: parseFloat(e.target.value) })}
                  />
                </div>
                <div className="col-span-1">
                  <button
                    onClick={handleAddPrice}
                    className="w-full p-2 bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 flex justify-center items-center"
                  >
                    <Save size={20} />
                  </button>
                </div>
              </div>
              
              <table className="w-full text-left text-sm">
                <thead className="bg-gray-50 text-gray-500">
                  <tr>
                    <th className="p-3 font-medium">Lista de Preços</th>
                    <th className="p-3 font-medium">Unidade</th>
                    <th className="p-3 font-medium">Preço</th>
                    <th className="p-3 font-medium text-right">Ações</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {productPrices.map(pp => {
                    const listName = priceLists.find(pl => pl.id === pp.price_list_id)?.name;
                    const unitName = units.find(u => u.id === pp.unit_id)?.name;
                    return (
                      <tr key={pp.id}>
                        <td className="p-3 font-medium text-gray-900">{listName}</td>
                        <td className="p-3 text-gray-600">{unitName}</td>
                        <td className="p-3 font-bold text-gray-900">{pp.price.toFixed(2)}</td>
                        <td className="p-3 text-right">
                          <button onClick={() => handleDeletePrice(pp.id)} className="p-1.5 text-red-500 hover:bg-red-50 rounded-lg">
                            <Trash2 size={16} />
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                  {productPrices.length === 0 && (
                    <tr>
                      <td colSpan={4} className="p-4 text-center text-gray-500">Nenhum preço específico definido.</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
};

export default ProductUnitsPricesModal;
