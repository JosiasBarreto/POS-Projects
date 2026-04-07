import { useState, useCallback } from 'react';
import { toast } from 'sonner';
import { CartItem } from '../types/pos';

export const usePOSSale = (
  session: any,
  user: any,
  store: any,
  cart: CartItem[],
  selectedClient: any,
  total: number,
  totalWithoutTax: number,
  totalTax: number,
  totalDiscount: number,
  pendingExchange: any,
  setPendingExchange: (e: any) => void,
  setCart: (c: CartItem[]) => void,
  setSelectedClient: (c: any) => void,
  refreshProducts: () => void
) => {
  const [loading, setLoading] = useState(false);
  const [successModal, setSuccessModal] = useState(false);
  const [lastSaleData, setLastSaleData] = useState<any>(null);

  const finalizeSale = useCallback(async (
    method: 'cash' | 'card' | 'transfer' | 'other' | 'credit' | 'balance' | 'mixed' | 'proforma',
    paymentDetails: {
      receivedAmount?: number;
      cashAmount?: string;
      cardAmount?: string;
      transferAmount?: string;
      otherAmount?: string;
      creditAmount?: string;
      balanceAmount?: string;
    }
  ) => {
    if (!session) {
      toast.error("É necessário ter um caixa aberto para realizar vendas.");
      return;
    }
    setLoading(true);
    
    let finalCash = 0;
    let finalCard = 0;
    let finalTransfer = 0;
    let finalOther = 0;
    let finalCredit = 0;
    let finalBalance = 0;
    let finalChange = 0;

    const { receivedAmount, cashAmount, cardAmount, transferAmount, otherAmount, creditAmount, balanceAmount } = paymentDetails;

    if (method === 'cash') {
      const cashVal = receivedAmount || total;
      if (cashVal < total) {
        toast.error("Valor recebido insuficiente");
        setLoading(false);
        return;
      }
      finalCash = cashVal;
      finalChange = Math.max(0, finalCash - total);
    } else if (method === 'card') {
      finalCard = total;
    } else if (method === 'transfer') {
      finalTransfer = total;
    } else if (method === 'other') {
      finalOther = total;
    } else if (method === 'credit') {
      if (!selectedClient) {
        toast.error("Selecione um cliente para venda a crédito.");
        setLoading(false);
        return;
      }
      if (selectedClient.debt + total > selectedClient.credit_limit) {
        toast.error("Limite de crédito excedido.");
        setLoading(false);
        return;
      }
      finalCredit = total;
    } else if (method === 'balance') {
      if (!selectedClient) {
        toast.error("Selecione um cliente para usar o saldo.");
        setLoading(false);
        return;
      }
      if (selectedClient.balance < total) {
        toast.error("Saldo insuficiente.");
        setLoading(false);
        return;
      }
      finalBalance = total;
    } else if (method === 'mixed') {
      finalCash = parseFloat(cashAmount || '0') || 0;
      finalCard = parseFloat(cardAmount || '0') || 0;
      finalTransfer = parseFloat(transferAmount || '0') || 0;
      finalOther = parseFloat(otherAmount || '0') || 0;
      finalCredit = parseFloat(creditAmount || '0') || 0;
      finalBalance = parseFloat(balanceAmount || '0') || 0;
      
      if (finalCredit > 0 || finalBalance > 0) {
        if (!selectedClient) {
          toast.error("Selecione um cliente para usar crédito ou saldo.");
          setLoading(false);
          return;
        }
        if (finalCredit > 0 && selectedClient.debt + finalCredit > selectedClient.credit_limit) {
          toast.error("Limite de crédito excedido.");
          setLoading(false);
          return;
        }
        if (finalBalance > 0 && selectedClient.balance < finalBalance) {
          toast.error("Saldo insuficiente.");
          setLoading(false);
          return;
        }
      }

      const paidTotal = finalCash + finalCard + finalTransfer + finalOther + finalCredit + finalBalance;
      if (paidTotal < total) {
        toast.error("Valor insuficiente");
        setLoading(false);
        return;
      }
      finalChange = Math.max(0, paidTotal - total);
    }

    if (method === 'proforma') {
      try {
        const proformaData = {
          client_id: selectedClient?.id || null,
          total,
          total_without_tax: totalWithoutTax,
          total_tax: totalTax,
          user_id: user?.id,
          items: cart.map(item => ({
            product_id: item.product.id,
            quantity: item.quantity,
            unit_id: item.unit_id,
            price: item.price,
            tax_rate: item.product.tax_rate,
            tax_amount: (item.price - (item.price / (1 + item.product.tax_rate / 100))) * item.quantity,
            subtotal_without_tax: (item.price / (1 + item.product.tax_rate / 100)) * item.quantity
          }))
        };
        
        const res = await fetch('/api/proformas', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(proformaData)
        });

        if (res.ok) {
          const savedProforma = await res.json();
          const receiptData = {
            store, user, client: selectedClient,
            items: cart.map(item => ({
              product: { name: item.product.name },
              quantity: item.quantity, price: item.price, discount: item.discount,
              tax_rate: item.tax_rate, tax_amount: item.tax_amount,
              subtotal_without_tax: item.subtotal_without_tax, subtotal: item.subtotal
            })),
            total, totalWithoutTax, totalTax, totalDiscount,
            paymentMethod: 'proforma', date: new Date().toLocaleString('pt-PT'),
            isProforma: true, proformaId: savedProforma.proformaId
          };
          setLastSaleData(receiptData);
          setSuccessModal(true);
          toast.success("Fatura Proforma gerada com sucesso!");
          setCart([]);
          setSelectedClient(null);
        } else {
          const errorData = await res.json();
          throw new Error(errorData.error || "Erro ao gerar fatura proforma.");
        }
      } catch (error) {
        console.error("Error generating proforma:", error);
        toast.error("Erro ao gerar fatura proforma.");
      } finally {
        setLoading(false);
      }
      return;
    }

    const saleData = {
      session_id: session?.id,
      client_id: selectedClient?.id || null,
      total,
      total_without_tax: totalWithoutTax,
      total_tax: totalTax,
      payment_method: method,
      cash_amount: finalCash,
      card_amount: finalCard,
      transfer_amount: finalTransfer,
      other_amount: finalOther,
      credit_amount: finalCredit,
      balance_amount: finalBalance,
      change_amount: finalChange,
      user_id: user?.id,
      items: cart.map(item => ({
        product_id: item.product.id,
        quantity: item.quantity,
        unit_id: item.unit_id,
        price: item.price,
        tax_rate: item.tax_rate,
        tax_amount: item.tax_amount,
        subtotal_without_tax: item.subtotal_without_tax,
        subtotal: item.subtotal
      }))
    };

    try {
      const res = await fetch('/api/sales', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(saleData)
      });

      if (res.ok) {
        const savedSale = await res.json();
        const receiptData = {
          store, user, client: selectedClient, saleId: savedSale.id,
          items: cart.map(item => ({
            product: { name: item.product.name },
            quantity: item.quantity, price: item.price, discount: item.discount,
            tax_rate: item.tax_rate, tax_amount: item.tax_amount,
            subtotal_without_tax: item.subtotal_without_tax, subtotal: item.subtotal
          })),
          total, totalWithoutTax, totalTax, totalDiscount,
          paymentMethod: method, cashAmount: finalCash, cardAmount: finalCard,
          transferAmount: finalTransfer, otherAmount: finalOther,
          creditAmount: finalCredit, balanceAmount: finalBalance,
          changeAmount: finalChange, date: new Date().toLocaleString('pt-PT')
        };
        setLastSaleData(receiptData);
        setSuccessModal(true);
        setCart([]);
        setPendingExchange(null);
        setSelectedClient(null);
        refreshProducts();
      } else {
        const err = await res.json();
        toast.error(err.error || "Erro ao finalizar venda");
      }
    } catch (error) {
      toast.error("Erro de conexão ao finalizar venda");
    } finally {
      setLoading(false);
    }
  }, [session, user?.id, store, cart, selectedClient, total, totalWithoutTax, totalTax, totalDiscount, setPendingExchange, setCart, setSelectedClient, refreshProducts]);

  return {
    loading,
    successModal,
    setSuccessModal,
    lastSaleData,
    setLastSaleData,
    finalizeSale
  };
};
