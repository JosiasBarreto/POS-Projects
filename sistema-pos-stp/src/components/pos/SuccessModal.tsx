import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { CheckCircle2, Printer, FileText, MessageCircle, Mail } from 'lucide-react';
import { cn } from '../../lib/utils';
import { printThermalReceipt, generateReceiptPDF, sendInvoiceByEmail, sendInvoiceByWhatsApp } from '../../lib/print';
import { toast } from 'sonner';

interface SuccessModalProps {
  isOpen: boolean;
  onClose: () => void;
  lastSaleData: any;
}

const SuccessModal: React.FC<SuccessModalProps> = ({ isOpen, onClose, lastSaleData }) => {
  const handleSendEmail = async () => {
    if (!lastSaleData?.client?.email) {
      toast.error("Cliente não tem e-mail registado.");
      return;
    }
    try {
      await sendInvoiceByEmail(lastSaleData, lastSaleData.client.email);
      toast.success("Fatura enviada por e-mail!");
    } catch (error: any) {
      toast.error(error.message || "Erro ao enviar e-mail.");
    }
  };

  const handleSendWhatsApp = () => {
    if (!lastSaleData?.client?.phone) {
      toast.error("Cliente não tem telefone registado.");
      return;
    }
    sendInvoiceByWhatsApp(lastSaleData, lastSaleData.client.phone);
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.9, opacity: 0 }} className="bg-white w-full max-w-md rounded-3xl p-8 shadow-2xl text-center overflow-y-auto max-h-[90vh]">
            <div className={cn("w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-6", lastSaleData?.paymentMethod ? "bg-green-100 text-green-600" : "bg-blue-100 text-blue-600")}>
              {lastSaleData?.paymentMethod ? <CheckCircle2 size={40} /> : <Printer size={40} />}
            </div>
            <h2 className="text-2xl font-bold mb-2">
              {lastSaleData?.isProforma ? 'Proforma Gerada!' : lastSaleData?.paymentMethod ? 'Venda Finalizada!' : 'Opções de Impressão'}
            </h2>
            <p className="text-muted-foreground mb-8">
              {lastSaleData?.isProforma ? 'A fatura proforma foi gerada com sucesso.' : lastSaleData?.paymentMethod ? 'A transação foi concluída com sucesso.' : 'Escolha o formato para imprimir a fatura atual.'}
            </p>
            <div className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <button onClick={() => printThermalReceipt(lastSaleData, '80mm')} className="flex flex-col items-center justify-center gap-2 bg-[#f5f5f5] hover:bg-[#e5e5e5] text-[#1a1a1a] p-4 rounded-2xl font-bold transition-colors text-sm"><Printer size={20} /> Recibo (80mm)</button>
                <button onClick={() => printThermalReceipt(lastSaleData, '58mm')} className="flex flex-col items-center justify-center gap-2 bg-[#f5f5f5] hover:bg-[#e5e5e5] text-[#1a1a1a] p-4 rounded-2xl font-bold transition-colors text-sm"><Printer size={20} /> Recibo (58mm)</button>
              </div>
              <button onClick={() => generateReceiptPDF(lastSaleData)} className="w-full flex items-center justify-center gap-2 bg-[#f5f5f5] hover:bg-[#e5e5e5] text-[#1a1a1a] py-4 rounded-2xl font-bold transition-colors"><FileText size={20} /> Baixar PDF</button>
              
              <div className="grid grid-cols-2 gap-3">
                <button onClick={handleSendWhatsApp} className="flex items-center justify-center gap-2 bg-[#25D366]/10 hover:bg-[#25D366]/20 text-[#25D366] py-4 rounded-2xl font-bold transition-colors"><MessageCircle size={20} /> WhatsApp</button>
                <button onClick={handleSendEmail} className="flex items-center justify-center gap-2 bg-blue-50 hover:bg-blue-100 text-blue-600 py-4 rounded-2xl font-bold transition-colors"><Mail size={20} /> E-mail</button>
              </div>

              <button onClick={onClose} className="w-full bg-[#1a1a1a] text-white py-4 rounded-2xl font-bold mt-4">{lastSaleData?.isProforma || lastSaleData?.paymentMethod ? 'Nova Venda' : 'Voltar'}</button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};

export default SuccessModal;
