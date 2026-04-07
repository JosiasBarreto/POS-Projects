export interface User {
  id: number;
  username: string;
  role: 'admin' | 'supervisor' | 'cashier';
  name: string;
}

export interface Product {
  id: number;
  name: string;
  barcode: string;
  description?: string;
  type: 'base' | 'fracionado';
  purchase_price: number;
  sale_price: number;
  category_id: number;
  category_name?: string;
  supplier_id?: number;
  supplier_name?: string;
  unit_id?: number;
  unit_name?: string;
  base_unit_id?: number;
  base_unit_name?: string;
  tax_id?: number;
  produto_base_id?: number;
  unidades_por_base: number;
  stock_base: number;
  stock_fracionado: number;
  min_stock: number;
  is_favorite: number;
  is_active: number;
  tax_rate?: number;
  created_by?: number;
  creator_name?: string;
  created_at: string;
  updated_at: string;
  unit_id_from_barcode?: number;
}

export interface Unit {
  id: number;
  name: string;
  symbol?: string;
}

export interface Tax {
  id: number;
  name: string;
  rate: number;
  is_active: number;
}

export interface PriceList {
  id: number;
  name: string;
  description?: string;
  is_active: number;
}

export interface ProductUnit {
  id: number;
  product_id: number;
  unit_id: number;
  conversion_factor: number;
  barcode?: string;
  is_active: number;
}

export interface ProductPrice {
  id: number;
  product_id: number;
  price_list_id: number;
  unit_id: number;
  price: number;
}

export interface StockMovement {
  id: number;
  product_id: number;
  user_id: number;
  user_name?: string;
  type: 'in' | 'out' | 'adjustment' | 'sale';
  quantity: number;
  unit: string;
  reason: string;
  created_at: string;
}

export interface Category {
  id: number;
  name: string;
}

export interface Supplier {
  id: number;
  name: string;
  phone?: string;
  email?: string;
}

export interface Currency {
  id: number;
  name: string;
  symbol: string;
  code: string;
  is_active: number;
}

export interface Client {
  id: number;
  name: string;
  phone: string;
  email?: string;
  whatsapp?: string;
  nif?: string;
  bank_coordinates?: string;
  credit_limit: number;
  balance: number;
  debt: number;
  price_list_id?: number | null;
}

export interface ClientTransaction {
  id: number;
  client_id: number;
  type: 'deposit' | 'debt_payment' | 'purchase_balance' | 'purchase_credit';
  amount: number;
  description?: string;
  sale_id?: number;
  created_at: string;
  user_id: number;
  user_name?: string;
}

export interface Store {
  id: number;
  name: string;
  nif: string;
  address: string;
  phone: string;
  currency: string;
  tax_rate: number;
  uses_tax: number;
  sender_email?: string;
  sender_password?: string;
  whatsapp_number?: string;
  contact_email?: string;
}

export interface CashierSession {
  id: number;
  user_id: number;
  opening_time: string;
  closing_time: string | null;
  opening_balance: number;
  closing_balance: number | null;
  expected_balance: number | null;
  counted_balance: number | null;
  difference: number | null;
  status: 'open' | 'closed';
}

export interface CashMovement {
  id: number;
  session_id: number;
  user_id: number;
  type: 'entry' | 'exit';
  amount: number;
  description: string;
  created_at: string;
}

export interface Sale {
  id: number;
  session_id: number;
  client_id: number | null;
  client_name?: string;
  total: number;
  total_without_tax?: number;
  total_tax?: number;
  payment_method: 'cash' | 'card' | 'transfer' | 'other' | 'mixed';
  cash_amount: number;
  card_amount: number;
  transfer_amount: number;
  other_amount: number;
  change_amount: number;
  created_at: string;
  user_name?: string;
}

export interface Return {
  id: number;
  sale_id: number;
  user_id: number;
  session_id: number;
  total_amount: number;
  reason: string;
  created_at: string;
  user_name?: string;
  original_total?: number;
}

export interface ReturnItem {
  id: number;
  return_id: number;
  product_id: number;
  quantity: number;
  price: number;
  subtotal: number;
}

export interface SaleItem {
  id: number;
  sale_id: number;
  product_id: number;
  quantity: number;
  price: number;
  unit_id?: number;
  tax_rate?: number;
  tax_amount?: number;
  subtotal_without_tax?: number;
  product_name?: string;
  barcode?: string;
}
