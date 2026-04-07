import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import { Store, User, Client } from '../types';
import { formatCurrency } from './utils';

interface PrintCartItem {
  product: { name: string };
  quantity: number;
  price: number;
  discount: number;
  tax_rate: number;
  tax_amount: number;
  subtotal_without_tax: number;
  subtotal: number;
}

interface ReceiptData {
  store: Store | null;
  user: User | null;
  client: Client | null;
  items: PrintCartItem[];
  total: number;
  totalWithoutTax: number;
  totalTax: number;
  totalDiscount: number;
  paymentMethod?: 'cash' | 'card' | 'transfer' | 'other' | 'mixed' | 'credit' | 'balance' | 'proforma';
  cashAmount?: number;
  cardAmount?: number;
  transferAmount?: number;
  otherAmount?: number;
  creditAmount?: number;
  balanceAmount?: number;
  changeAmount?: number;
  date?: string;
  isProforma?: boolean;
  proformaId?: number;
  saleId?: number;
}

export const generateReceiptHTML = (data: ReceiptData, width: '80mm' | '58mm' = '80mm') => {
  const { store, user, client, items, total, totalWithoutTax, totalTax, totalDiscount, paymentMethod, cashAmount, cardAmount, transferAmount, otherAmount, creditAmount, balanceAmount, changeAmount } = data;
  const dateStr = data.date || new Date().toLocaleString('pt-PT');
  
  const widthPx = width === '80mm' ? '300px' : '200px';

  const getPaymentMethodLabel = (method: string) => {
    switch (method) {
      case 'cash': return 'Dinheiro';
      case 'card': return 'TPA';
      case 'transfer': return 'Transferência';
      case 'other': return 'Outros';
      case 'mixed': return 'Misto';
      case 'credit': return 'Crédito (Fiado)';
      case 'balance': return 'Saldo em Conta';
      case 'proforma': return 'Proforma';
      default: return method;
    }
  };

  let html = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <title>Fatura</title>
      <style>
        body {
          font-family: 'Courier New', Courier, monospace;
          font-size: 12px;
          width: ${widthPx};
          margin: 0 auto;
          padding: 10px;
          color: #000;
        }
        h1, h2, h3, p { margin: 0; padding: 0; text-align: center; }
        .divider { border-top: 1px dashed #000; margin: 10px 0; }
        table { width: 100%; border-collapse: collapse; }
        th, td { text-align: left; padding: 2px 0; }
        .right { text-align: right; }
        .center { text-align: center; }
        .bold { font-weight: bold; }
        .text-sm { font-size: 10px; }
      </style>
    </head>
    <body>
      <h3>${store?.name || 'Loja'}</h3>
      <p>${store?.address || ''}</p>
      <p>NIF: ${store?.nif || ''}</p>
      <p>Tel: ${store?.phone || ''}</p>
      ${store?.contact_email ? `<p>Email: ${store.contact_email}</p>` : ''}
      <div class="divider"></div>
      <h2 style="margin: 10px 0;">${data.isProforma ? 'FATURA PROFORMA' : 'FATURA / RECIBO'}</h2>
      ${data.proformaId ? `<p>Nº: PF-${data.proformaId.toString().padStart(4, '0')}</p>` : ''}
      ${data.saleId ? `<p>Nº: ${data.saleId.toString().padStart(6, '0')}</p>` : ''}
      <div class="divider"></div>
      <p>Data: ${dateStr}</p>
      <p>Operador: ${user?.name || ''}</p>
      ${client ? `<p>Cliente: ${client.name}</p>` : ''}
      <div class="divider"></div>
      <table>
        <thead>
          <tr>
            <th>Qtd</th>
            <th>Artigo</th>
            <th class="right">Total</th>
          </tr>
        </thead>
        <tbody>
  `;

  items.forEach(item => {
    html += `
      <tr>
        <td colspan="3" class="bold">${item.product.name}</td>
      </tr>
      <tr>
        <td>${item.quantity}x</td>
        <td>${formatCurrency(item.price, store?.currency)}</td>
        <td class="right">${formatCurrency(item.subtotal, store?.currency)}</td>
      </tr>
    `;
    if (item.discount > 0) {
      html += `
        <tr>
          <td colspan="3" class="text-sm right">Desc: ${item.discount}%</td>
        </tr>
      `;
    }
  });

  html += `
        </tbody>
      </table>
      <div class="divider"></div>
      <table>
        <tr>
          <td>Subtotal Bruto:</td>
          <td class="right">${formatCurrency(total + totalDiscount, store?.currency)}</td>
        </tr>
        ${totalDiscount > 0 ? `
        <tr>
          <td>Desconto:</td>
          <td class="right">-${formatCurrency(totalDiscount, store?.currency)}</td>
        </tr>
        ` : ''}
        ${store?.uses_tax ? `
        <tr>
          <td>Subtotal (S/ IVA):</td>
          <td class="right">${formatCurrency(totalWithoutTax, store?.currency)}</td>
        </tr>
        <tr>
          <td>IVA (${store.tax_rate}%):</td>
          <td class="right">${formatCurrency(totalTax, store?.currency)}</td>
        </tr>
        ` : `
        <tr>
          <td>IVA:</td>
          <td class="right">Isento</td>
        </tr>
        `}
        <tr class="bold" style="font-size: 14px;">
          <td>Total:</td>
          <td class="right">${formatCurrency(total, store?.currency)}</td>
        </tr>
      </table>
      <div class="divider"></div>
  `;

  if (paymentMethod) {
    html += `
      <table>
        <tr>
          <td>Pagamento:</td>
          <td class="right">${getPaymentMethodLabel(paymentMethod)}</td>
        </tr>
        ${paymentMethod === 'cash' || paymentMethod === 'mixed' ? `
        <tr>
          <td>Recebido:</td>
          <td class="right">${formatCurrency((cashAmount || 0) + (cardAmount || 0) + (transferAmount || 0) + (otherAmount || 0) + (creditAmount || 0) + (balanceAmount || 0), store?.currency)}</td>
        </tr>
        ${creditAmount && creditAmount > 0 ? `
        <tr>
          <td>Crédito (Fiado):</td>
          <td class="right">${formatCurrency(creditAmount, store?.currency)}</td>
        </tr>
        ` : ''}
        ${balanceAmount && balanceAmount > 0 ? `
        <tr>
          <td>Saldo em Conta:</td>
          <td class="right">${formatCurrency(balanceAmount, store?.currency)}</td>
        </tr>
        ` : ''}
        <tr>
          <td>Troco:</td>
          <td class="right">${formatCurrency(changeAmount || 0, store?.currency)}</td>
        </tr>
        ` : ''}
        ${paymentMethod === 'credit' ? `
        <tr>
          <td>A Crédito:</td>
          <td class="right">${formatCurrency(total, store?.currency)}</td>
        </tr>
        ` : ''}
        ${paymentMethod === 'balance' ? `
        <tr>
          <td>Pago via Saldo:</td>
          <td class="right">${formatCurrency(total, store?.currency)}</td>
        </tr>
        ` : ''}
      </table>
      <div class="divider"></div>
    `;
  }

  html += `
      <p class="center">Obrigado pela preferência!</p>
      <p class="center text-sm">Processado por software certificado</p>
    </body>
    </html>
  `;

  return html;
};

export const printThermalReceipt = (data: ReceiptData, width: '80mm' | '58mm' = '80mm') => {
  const html = generateReceiptHTML(data, width);
  const iframe = document.createElement('iframe');
  iframe.style.position = 'fixed';
  iframe.style.right = '0';
  iframe.style.bottom = '0';
  iframe.style.width = '0';
  iframe.style.height = '0';
  iframe.style.border = 'none';
  document.body.appendChild(iframe);

  const doc = iframe.contentWindow?.document;
  if (doc) {
    doc.open();
    doc.write(html);
    doc.close();
    
    // Wait for resources to load
    const checkReady = setInterval(() => {
      if (doc.readyState === 'complete') {
        clearInterval(checkReady);
        setTimeout(() => {
          iframe.contentWindow?.focus();
          iframe.contentWindow?.print();
          setTimeout(() => {
            document.body.removeChild(iframe);
          }, 1000);
        }, 500);
      }
    }, 100);
  }
};

export const generateReceiptPDF = (data: ReceiptData) => {
  try {
    const { store, user, client, items, total, totalWithoutTax, totalTax, totalDiscount, paymentMethod, cashAmount, cardAmount, transferAmount, otherAmount, creditAmount, balanceAmount, changeAmount } = data;
    const dateStr = data.date || new Date().toLocaleString('pt-PT');
  
    const getPaymentMethodLabel = (method: string) => {
      switch (method) {
        case 'cash': return 'Dinheiro';
        case 'card': return 'TPA';
        case 'transfer': return 'Transferência';
        case 'other': return 'Outros';
        case 'mixed': return 'Misto';
        case 'credit': return 'Crédito (Fiado)';
        case 'balance': return 'Saldo em Conta';
        case 'proforma': return 'Proforma';
        default: return method;
      }
    };
  
    const doc = new jsPDF({
      orientation: 'portrait',
      unit: 'mm',
      format: 'a4'
    });
  
    doc.setFontSize(20);
    doc.text(store?.name || 'Loja', 105, 20, { align: 'center' });
    
    doc.setFontSize(10);
    doc.text(store?.address || '', 105, 28, { align: 'center' });
    doc.text(`NIF: ${store?.nif || ''} | Tel: ${store?.phone || ''}`, 105, 34, { align: 'center' });
    if (store?.contact_email) {
      doc.text(`Email: ${store.contact_email}`, 105, 40, { align: 'center' });
    }
  
    doc.setFontSize(12);
    doc.text(data.isProforma ? 'FATURA PROFORMA' : 'FATURA / RECIBO', 105, 50, { align: 'center' });
    if (data.proformaId) {
      doc.setFontSize(10);
      doc.text(`Nº: PF-${data.proformaId.toString().padStart(4, '0')}`, 105, 51, { align: 'center' });
    }
  
    doc.setFontSize(10);
    doc.text(`Data: ${dateStr}`, 14, 55);
    doc.text(`Operador: ${user?.name || ''}`, 14, 61);
    if (client) {
      doc.text(`Cliente: ${client.name}`, 14, 67);
    }
  
    const tableData = items.map(item => [
      item.product.name,
      item.quantity.toString(),
      formatCurrency(item.price, store?.currency),
      item.discount > 0 ? `${item.discount}%` : '-',
      `${item.tax_rate}%`,
      formatCurrency(item.subtotal, store?.currency)
    ]);
  
    autoTable(doc, {
      startY: 75,
      head: [['Artigo', 'Qtd', 'Preço Unit.', 'Desc.', 'IVA', 'Total']],
      body: tableData,
      theme: 'striped',
      headStyles: { fillColor: [26, 26, 26] },
      columnStyles: {
        1: { halign: 'center' },
        2: { halign: 'right' },
        3: { halign: 'center' },
        4: { halign: 'center' },
        5: { halign: 'right' }
      }
    });
  
    let currentY = (doc as any).lastAutoTable.finalY + 10;
  
    doc.text('Resumo:', 14, currentY);
    doc.text(`Subtotal Bruto:`, 120, currentY);
    doc.text(formatCurrency(total + totalDiscount, store?.currency), 196, currentY, { align: 'right' });
    
    if (totalDiscount > 0) {
      currentY += 6;
      doc.text(`Desconto:`, 120, currentY);
      doc.text(`-${formatCurrency(totalDiscount, store?.currency)}`, 196, currentY, { align: 'right' });
    }
  
    if (store?.uses_tax) {
      currentY += 6;
      doc.text(`Subtotal (S/ IVA):`, 120, currentY);
      doc.text(formatCurrency(totalWithoutTax, store?.currency), 196, currentY, { align: 'right' });
      
      currentY += 6;
      doc.text(`Total IVA (${store.tax_rate}%):`, 120, currentY);
      doc.text(formatCurrency(totalTax, store?.currency), 196, currentY, { align: 'right' });
    } else {
      currentY += 6;
      doc.text(`IVA:`, 120, currentY);
      doc.text(`Isento`, 196, currentY, { align: 'right' });
    }
  
    currentY += 10;
    doc.setFontSize(14);
    doc.setFont('helvetica', 'bold');
    doc.text(`TOTAL:`, 120, currentY);
    doc.text(formatCurrency(total, store?.currency), 196, currentY, { align: 'right' });
  
    if (paymentMethod) {
      currentY += 14;
      doc.setFontSize(10);
      doc.setFont('helvetica', 'normal');
      doc.text(`Método de Pagamento: ${getPaymentMethodLabel(paymentMethod)}`, 14, currentY);
      if (paymentMethod === 'cash' || paymentMethod === 'mixed') {
        currentY += 6;
        const totalPaid = (cashAmount || 0) + (cardAmount || 0) + (transferAmount || 0) + (otherAmount || 0) + (creditAmount || 0) + (balanceAmount || 0);
        doc.text(`Valor Recebido: ${formatCurrency(totalPaid, store?.currency)}`, 14, currentY);
        
        if (creditAmount && creditAmount > 0) {
          currentY += 6;
          doc.text(`Crédito (Fiado): ${formatCurrency(creditAmount, store?.currency)}`, 14, currentY);
        }
        if (balanceAmount && balanceAmount > 0) {
          currentY += 6;
          doc.text(`Saldo em Conta: ${formatCurrency(balanceAmount, store?.currency)}`, 14, currentY);
        }
        
        currentY += 6;
        doc.text(`Troco: ${formatCurrency(changeAmount || 0, store?.currency)}`, 14, currentY);
      } else if (paymentMethod === 'credit') {
        currentY += 6;
        doc.text(`Valor a Crédito: ${formatCurrency(total, store?.currency)}`, 14, currentY);
      } else if (paymentMethod === 'balance') {
        currentY += 6;
        doc.text(`Pago via Saldo: ${formatCurrency(total, store?.currency)}`, 14, currentY);
      }
    }
  
    doc.setFontSize(8);
    doc.text('Obrigado pela preferência!', 105, 280, { align: 'center' });
    doc.text('Processado por software certificado', 105, 285, { align: 'center' });
  
    doc.save(`Fatura_${new Date().getTime()}.pdf`);
  } catch (error) {
    console.error("Erro ao gerar PDF do recibo:", error);
    alert("Ocorreu um erro ao gerar o PDF da fatura.");
  }
};

export const sendInvoiceByEmail = async (data: ReceiptData, email: string) => {
  const html = generateReceiptHTML(data, '80mm');
  const subject = data.isProforma ? `Fatura Proforma - ${data.store?.name}` : `Fatura / Recibo - ${data.store?.name}`;
  
  try {
    const res = await fetch('/api/send-invoice', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email,
        subject,
        html,
        store_id: data.store?.id
      })
    });
    
    const result = await res.json();
    if (!res.ok) throw new Error(result.error || "Erro ao enviar e-mail");
    return true;
  } catch (error: any) {
    console.error("Erro ao enviar fatura por e-mail:", error);
    throw error;
  }
};

export const sendInvoiceByWhatsApp = (data: ReceiptData, phone: string) => {
  const { store, items, total, paymentMethod } = data;
  const dateStr = data.date || new Date().toLocaleString('pt-PT');
  
  let message = `*${data.isProforma ? 'FATURA PROFORMA' : 'FATURA / RECIBO'}*\n`;
  message += `*${store?.name}*\n`;
  message += `Data: ${dateStr}\n`;
  message += `--------------------------\n`;
  
  items.forEach(item => {
    message += `${item.quantity}x ${item.product.name} - ${formatCurrency(item.subtotal, store?.currency)}\n`;
  });
  
  message += `--------------------------\n`;
  message += `*TOTAL: ${formatCurrency(total, store?.currency)}*\n`;
  
  if (paymentMethod) {
    message += `Pagamento: ${paymentMethod}\n`;
  }
  
  message += `--------------------------\n`;
  message += `Obrigado pela preferência!`;
  
  const encodedMessage = encodeURIComponent(message);
  const whatsappUrl = `https://wa.me/${phone.replace(/\D/g, '')}?text=${encodedMessage}`;
  window.open(whatsappUrl, '_blank');
};
