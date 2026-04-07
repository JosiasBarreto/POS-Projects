import React from "react";
import { ShoppingCart, Minus, Plus, Trash2, X, RotateCcw, Percent } from "lucide-react";
import { CartItem } from "../../types/pos";
import { ProductUnit, Unit } from "../../types";
import { formatCurrency, cn } from "../../lib/utils";
import ClientSelect from "./ClientSelect";

interface CartProps {
  cart: CartItem[];
  selectedClient: any;
  setSelectedClient: (client: any) => void;
  pendingExchange: any;
  setPendingExchange: (exchange: any) => void;
  updateQuantity: (productId: number, unitId: number, newQty: number) => void;
  updateUnit: (productId: number, oldUnitId: number, newUnitId: number) => void;
  updateDiscount: (
    productId: number,
    unitId: number,
    newDiscount: number
  ) => void;
  setCart: (cart: CartItem[]) => void;
  productUnits: ProductUnit[];
  units: Unit[];
  store: any;
}

const Cart: React.FC<CartProps> = ({
  cart,
  selectedClient,
  setSelectedClient,
  pendingExchange,
  setPendingExchange,
  updateQuantity,
  updateUnit,
  updateDiscount,
  setCart,
  productUnits,
  units,
  store,
}) => {
  const exchangeCredit = pendingExchange?.total_credit || 0;

  return (
    <div className="w-[400px] h-full bg-white border border-[#e5e5e5] rounded-3xl flex flex-col  overflow-hidden">
      <div className="p-6 border-b border-[#e5e5e5] flex items-center justify-between">
        <ShoppingCart size={30} className="mb-2" />
        <h3 className="font-bold text-lg">Carrinho</h3>
        <ClientSelect
          selectedClient={selectedClient}
          onSelect={setSelectedClient}
        />
        <button
          onClick={() => setCart([])}
          className="text-xs text-red-500 font-medium hover:underline"
        >
          Limpar
        </button>
      </div>

      <div className="flex-1 overflow-auto p-2 space-y-3">
        {pendingExchange && (
          <div className="bg-blue-50 border border-blue-200 rounded-2xl p-4 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-100 rounded-xl text-blue-600">
                <RotateCcw size={20} />
              </div>
              <div>
                <p className="text-xs font-bold text-blue-800 uppercase tracking-wider">
                  Crédito de Troca
                </p>
                <p className="text-sm font-black text-blue-900">
                  -{formatCurrency(exchangeCredit, store?.currency)}
                </p>
              </div>
            </div>
            <button
              onClick={() => setPendingExchange(null)}
              className="text-blue-400 hover:text-blue-600 p-1"
            >
              <X size={16} />
            </button>
          </div>
        )}
        {cart.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-muted-foreground opacity-50">
            <ShoppingCart size={48} className="mb-4" />
            <p>Carrinho vazio</p>
          </div>
        ) : (
          cart.map((item) => {
            const availableUnits = [
              ...(item.product.base_unit_id
                ? [
                    {
                      id: item.product.base_unit_id,
                      name:
                        units.find((u) => u.id === item.product.base_unit_id)
                          ?.name || "Base",
                    },
                  ]
                : []),
              ...productUnits
                .filter((pu) => pu.product_id === item.product.id)
                .map((pu) => ({
                  id: pu.unit_id,
                  name: units.find((u) => u.id === pu.unit_id)?.name || "un",
                })),
              ...(!item.product.base_unit_id
                ? [{ id: 0, name: item.product.unit_name || "un" }]
                : []),
            ];

            return (
              <div
                key={`${item.product.id}-${item.unit_id}`}
                className="p-2 bg-gray-50/50 border border-gray-100 rounded-2xl space-y-3 group hover:w-full hover:shadow-lg hover:bg-white ransition-all shadow-sm"
              >
                {/* Top Row: Product Info & Delete */}
                <div className="flex justify-between items-start gap-2">
                  <div className="flex-1 min-w-0">
                    <h4 className="font-black text-sm text-[#1a1a1a] line-clamp-1">
                      {item.product.name}
                    </h4>
                    <p className="text-[10px] text-muted-foreground font-medium">
                      Unitário: {formatCurrency(item.price, store?.currency)}
                      {item.tax_rate > 0 && (
                        <span className="text-blue-500 ml-1">
                          ({item.tax_rate}% IVA)
                        </span>
                      )}
                    </p>
                  </div>
                  <button
                    onClick={() =>
                      updateQuantity(item.product.id, item.unit_id, 0)
                    }
                    className="text-red-500 p-1"
                  >
                    <Trash2 size={17} />
                  </button>
                </div>

                {/* Middle Row: Quantity, Units & Discount */}
                <div className="flex items-center justify-between gap-3">
                  <div className="flex items-center gap-1 bg-white border border-gray-200 rounded-xl p-1 shadow-sm">
                    <button
                      onClick={() =>
                        updateQuantity(
                          item.product.id,
                          item.unit_id,
                          item.quantity - 1
                        )
                      }
                      className="p-1.5 hover:bg-gray-100 rounded-lg transition-colors text-gray-600"
                    >
                      <Minus size={14} />
                    </button>
                    <input
                      type="number"
                      className="w-10 text-center font-bold text-sm bg-transparent border-none outline-none"
                      value={item.quantity}
                      onChange={(e) =>
                        updateQuantity(
                          item.product.id,
                          item.unit_id,
                          parseFloat(e.target.value) || 0
                        )
                      }
                    />
                    <button
                      onClick={() =>
                        updateQuantity(
                          item.product.id,
                          item.unit_id,
                          item.quantity + 1
                        )
                      }
                      className="p-1.5 hover:bg-gray-100 rounded-lg transition-colors text-gray-600"
                    >
                      <Plus size={14} />
                    </button>
                  </div>

                  <div className="flex-1 flex items-center gap-2 justify-end">
                    {/* Unit Selector */}
                    <div className="min-w-[70px]">
                      {availableUnits.length > 1 ? (
                        <select
                          className="w-full text-[10px] font-bold text-gray-600 bg-white border border-gray-200 rounded-lg p-1.5 outline-none cursor-pointer"
                          value={item.unit_id}
                          onChange={(e) =>
                            updateUnit(
                              item.product.id,
                              item.unit_id,
                              parseInt(e.target.value)
                            )
                          }
                        >
                          {availableUnits.map((u) => (
                            <option key={u.id} value={u.id}>
                              {u.name}
                            </option>
                          ))}
                        </select>
                      ) : (
                        <div className="text-[10px] font-bold text-muted-foreground bg-gray-100 px-2 py-1.5 rounded-lg text-center">
                          {availableUnits[0]?.name || "un"}
                        </div>
                      )}
                    </div>

                    {/* Discount Input */}
                    <div className="relative w-20">
                      <input
                        type="number"
                        placeholder="Descontos"
                        className="w-full text-[11px] font-bold text-red-600 bg-red-50/50 border border-red-100 rounded-lg p-1.5 outline-none text-center placeholder:text-red-300"
                        value={item.discount || ""}
                        onChange={(e) =>
                          updateDiscount(
                            item.product.id,
                            item.unit_id,
                            parseFloat(e.target.value) || 0
                          )
                        }
                      />
                      <div className="absolute right-0 top-1/2 transform -translate-y-1/2">
                        <Percent size={12} className="text-red-500" />
                      </div>
                    </div>
                  </div>
                </div>

                {/* Bottom Row: Totals Breakdown */}
                <div className="flex justify-end items-baseline gap-3 pt-2 border-t border-gray-100">
                  {item.discount > 0 && (
                    <span className="text-[11px] text-red-500 font-bold ">
                      Desc: -
                      {formatCurrency(
                        item.price * item.quantity * (item.discount / 100),
                        store?.currency
                      )}
                    </span>
                  )}
                  <span className="text-sm font-black text-[#1a1a1a] ">
                    {formatCurrency(item.subtotal, store?.currency)}
                  </span>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};

export default Cart;
