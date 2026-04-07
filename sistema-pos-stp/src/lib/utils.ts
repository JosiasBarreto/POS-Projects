import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatCurrency(amount: number, currency: string = 'STN') {
  return new Intl.NumberFormat('pt-ST', {
    style: 'currency',
    currency: currency,
  }).format(amount);
}
