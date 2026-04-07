import { Product, Client } from '../types';

export interface CartItem {
  product: Product;
  quantity: number;
  unit_id: number;
  price: number;
  discount: number;
  tax_rate: number;
  tax_amount: number;
  subtotal_without_tax: number;
  subtotal: number;
}

export interface POSSession {
  id: number;
  user_id: number;
  opening_balance: number;
  opening_time: string;
  closing_balance?: number;
  closing_time?: string;
  status: 'open' | 'closed';
}

export interface SessionSummary {
  session: POSSession;
  sales: {
    cash: number;
    card: number;
    transfer: number;
    other: number;
    total: number;
  };
  movements: {
    entries: number;
    exits: number;
  };
  expected_balance: number;
}
