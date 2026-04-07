import { useState, useEffect, useCallback } from 'react';
import { Product, Client, Tax, PriceList, ProductUnit, ProductPrice, Unit } from '../types';
import { CartItem } from '../types/pos';
import { toast } from 'sonner';

interface POSState {
  products: Product[];
  clients: Client[];
  taxes: Tax[];
  priceLists: PriceList[];
  productUnits: ProductUnit[];
  productPrices: ProductPrice[];
  units: Unit[];
  cart: CartItem[];
  selectedClient: Client | null;
  search: string;
}

export const usePOS = (store: any) => {
  const [state, setState] = useState<POSState>({
    products: [],
    clients: [],
    taxes: [],
    priceLists: [],
    productUnits: [],
    productPrices: [],
    units: [],
    cart: [],
    selectedClient: null,
    search: '',
  });

  const fetchInitialData = useCallback(async () => {
    try {
      const [products, clients, taxes, priceLists, productUnits, productPrices, units] = await Promise.all([
        fetch('/api/products').then(res => res.json()),
        fetch('/api/clients').then(res => res.json()),
        fetch('/api/taxes').then(res => res.json()),
        fetch('/api/price-lists').then(res => res.json()),
        fetch('/api/product-units').then(res => res.json()),
        fetch('/api/product-prices').then(res => res.json()),
        fetch('/api/units').then(res => res.json()),
      ]);

      setState(prev => ({
        ...prev,
        products,
        clients,
        taxes,
        priceLists,
        productUnits,
        productPrices,
        units,
      }));
    } catch (error) {
      console.error('Error fetching POS data:', error);
      toast.error('Erro ao carregar dados do POS');
    }
  }, []);

  useEffect(() => {
    fetchInitialData();
  }, [fetchInitialData]);

  const calculateItemPriceAndTax = useCallback((
    product: Product, 
    quantity: number, 
    unitId: number, 
    client: Client | null, 
    discount: number = 0
  ) => {
    let price = product.sale_price;
    let conversionFactor = 1;

    if (unitId !== product.base_unit_id) {
      const pu = state.productUnits.find(u => u.product_id === product.id && u.unit_id === unitId);
      if (pu) {
        conversionFactor = pu.conversion_factor;
        price = product.sale_price * conversionFactor;
      }
    }
    
    if (client?.price_list_id) {
      const specificPrice = state.productPrices.find(
        pp => pp.product_id === product.id && pp.price_list_id === client.price_list_id && pp.unit_id === unitId
      );
      if (specificPrice) {
        price = specificPrice.price;
      }
    } else {
      const defaultPrice = state.productPrices.find(
        pp => pp.product_id === product.id && pp.unit_id === unitId
      );
      if (defaultPrice) {
        price = defaultPrice.price;
      }
    }

    const grossSubtotal = price * quantity;
    const discountAmount = grossSubtotal * (discount / 100);
    const subtotal = grossSubtotal - discountAmount;
    
    const taxRate = store?.uses_tax ? (state.taxes.find(t => t.id === product.tax_id)?.rate || 0) : 0;
    const taxAmount = subtotal - (subtotal / (1 + taxRate / 100));
    const subtotalWithoutTax = subtotal - taxAmount;

    return {
      price,
      discount,
      tax_rate: taxRate,
      tax_amount: taxAmount,
      subtotal_without_tax: subtotalWithoutTax,
      subtotal
    };
  }, [state.productUnits, state.productPrices, state.taxes, store?.uses_tax]);

  const addToCart = useCallback((product: Product) => {
    if (product.stock_base <= 0) {
      toast.error("Produto sem stock!");
      return;
    }
    
    const defaultUnitId = product.unit_id_from_barcode || product.base_unit_id || product.unit_id || 0;

    setState(prev => {
      const existing = prev.cart.find(item => item.product.id === product.id && item.unit_id === defaultUnitId);
      let newCart;
      
      if (existing) {
        newCart = prev.cart.map(item => {
          if (item.product.id === product.id && item.unit_id === defaultUnitId) {
            const newQty = item.quantity + 1;
            const pricing = calculateItemPriceAndTax(product, newQty, defaultUnitId, prev.selectedClient, item.discount);
            return { ...item, quantity: newQty, ...pricing };
          }
          return item;
        });
      } else {
        const pricing = calculateItemPriceAndTax(product, 1, defaultUnitId, prev.selectedClient);
        newCart = [...prev.cart, { product, quantity: 1, unit_id: defaultUnitId, ...pricing }];
      }
      
      return { ...prev, cart: newCart, search: '' };
    });
  }, [calculateItemPriceAndTax]);

  const updateQuantity = useCallback((productId: number, unitId: number, newQty: number) => {
    setState(prev => ({
      ...prev,
      cart: prev.cart.map(item => {
        if (item.product.id === productId && item.unit_id === unitId) {
          const qty = Math.max(0, newQty);
          const pricing = calculateItemPriceAndTax(item.product, qty, unitId, prev.selectedClient, item.discount);
          return { ...item, quantity: qty, ...pricing };
        }
        return item;
      }).filter(item => item.quantity > 0)
    }));
  }, [calculateItemPriceAndTax]);

  const updateUnit = useCallback((productId: number, oldUnitId: number, newUnitId: number) => {
    setState(prev => ({
      ...prev,
      cart: prev.cart.map(item => {
        if (item.product.id === productId && item.unit_id === oldUnitId) {
          const pricing = calculateItemPriceAndTax(item.product, item.quantity, newUnitId, prev.selectedClient, item.discount);
          return { ...item, unit_id: newUnitId, ...pricing };
        }
        return item;
      })
    }));
  }, [calculateItemPriceAndTax]);

  const updateDiscount = useCallback((productId: number, unitId: number, newDiscount: number) => {
    setState(prev => ({
      ...prev,
      cart: prev.cart.map(item => {
        if (item.product.id === productId && item.unit_id === unitId) {
          const discount = Math.max(0, Math.min(100, newDiscount));
          const pricing = calculateItemPriceAndTax(item.product, item.quantity, unitId, prev.selectedClient, discount);
          return { ...item, ...pricing };
        }
        return item;
      })
    }));
  }, [calculateItemPriceAndTax]);

  const handleBarcodeSearch = useCallback(async (code: string) => {
    if (!code) return;
    try {
      const res = await fetch(`/api/products/barcode/${code}`);
      if (!res.ok) throw new Error('Not found');
      const product = await res.json();
      if (product) {
        addToCart(product);
      } else {
        throw new Error('Not found');
      }
    } catch (error) {
      if (/^\d{8,14}$/.test(code)) {
        toast.error("Produto não encontrado com este código de barras.");
      }
    }
  }, [addToCart]);

  // Recalculate cart when client changes
  useEffect(() => {
    setState(prev => ({
      ...prev,
      cart: prev.cart.map(item => {
        const pricing = calculateItemPriceAndTax(item.product, item.quantity, item.unit_id, prev.selectedClient, item.discount);
        return { ...item, ...pricing };
      })
    }));
  }, [state.selectedClient, calculateItemPriceAndTax]);

  const totals = {
    cartTotal: state.cart.reduce((sum, item) => sum + item.subtotal, 0),
    totalTax: state.cart.reduce((sum, item) => sum + item.tax_amount, 0),
    totalWithoutTax: state.cart.reduce((sum, item) => sum + item.subtotal_without_tax, 0),
    totalDiscount: state.cart.reduce((sum, item) => sum + (item.price * item.quantity * (item.discount / 100)), 0),
  };

  return {
    ...state,
    ...totals,
    setSearch: (search: string) => setState(prev => ({ ...prev, search })),
    setSelectedClient: (selectedClient: Client | null) => setState(prev => ({ ...prev, selectedClient })),
    setCart: (cart: CartItem[]) => setState(prev => ({ ...prev, cart })),
    addToCart,
    updateQuantity,
    updateUnit,
    updateDiscount,
    handleBarcodeSearch,
    refreshProducts: () => fetch('/api/products').then(res => res.json()).then(products => setState(prev => ({ ...prev, products }))),
  };
};
