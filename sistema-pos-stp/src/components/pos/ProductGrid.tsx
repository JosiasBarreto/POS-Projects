import React from 'react';
import { Star } from 'lucide-react';
import { Product, Tax } from '../../types';
import { formatCurrency, cn } from '../../lib/utils';

interface ProductGridProps {
  products: Product[];
  taxes: Tax[];
  store: any;
  onAddToCart: (product: Product) => void;
}

const ProductGrid: React.FC<ProductGridProps> = ({ products, taxes, store, onAddToCart }) => {
  return (
    <div className="flex-1 overflow-auto p-3 grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-2 content-start">
      {products.map(product => (
        <button
          key={product.id}
          onClick={() => onAddToCart(product)}
          className="bg-white border border-[#e5e5e5] rounded-2xl p-4 text-left hover:border-[#1a1a1a] hover:shadow-lg transition-all group flex flex-col justify-between min-h-[140px]"
        >
          <div>
            <div className="flex items-start justify-between gap-2 mb-1">
              <h3 className="font-bold text-[#1a1a1a] leading-tight line-clamp-2">{product.name}</h3>
              {product.is_favorite === 1 && <Star size={14} className="text-yellow-400 fill-yellow-400 shrink-0" />}
            </div>
            {product.barcode && (
              <p className="text-[10px] text-muted-foreground font-mono mb-2">{product.barcode}</p>
            )}
          </div>
          
          <div className="mt-auto">
            <div className="flex items-end justify-between">
              <div>
                <p className="text-lg font-black text-[#1a1a1a]">
                  {formatCurrency(product.sale_price, store?.currency)}
                </p>
                {store?.uses_tax && product.tax_id && (
                  <p className="text-[10px] text-muted-foreground">
                    + {taxes.find(t => t.id === product.tax_id)?.rate || 0}% IVA
                  </p>
                )}
              </div>
              <span className={cn(
                "text-[10px] font-bold px-2 py-1 rounded-lg",
                product.stock_base > 5 ? "bg-green-50 text-green-600" : "bg-orange-50 text-orange-600"
              )}>
                {product.stock_base} {product.unit_name || 'un'}
              </span>
            </div>
          </div>
        </button>
      ))}
    </div>
  );
};

export default ProductGrid;
