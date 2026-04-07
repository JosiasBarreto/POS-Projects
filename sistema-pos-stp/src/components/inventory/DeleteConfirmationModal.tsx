import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Trash2, X, AlertCircle } from 'lucide-react';

interface DeleteConfirmationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  description: string;
}

const DeleteConfirmationModal: React.FC<DeleteConfirmationModalProps> = ({
  isOpen,
  onClose,
  onConfirm,
  title,
  description,
}) => {
  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center z-[100] p-4 overflow-hidden">
          <motion.div 
            initial={{ scale: 0.9, opacity: 0, y: 20 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.9, opacity: 0, y: 20 }}
            className="bg-white w-full max-w-md rounded-[2.5rem] shadow-2xl relative border border-slate-200 overflow-hidden"
          >
            <div className="p-8 text-center">
              <div className="w-20 h-20 bg-rose-50 rounded-3xl flex items-center justify-center text-rose-600 mx-auto mb-6 shadow-sm">
                <Trash2 size={40} />
              </div>
              <h2 className="text-2xl font-bold text-slate-900 mb-2">{title}</h2>
              <p className="text-slate-500 font-medium leading-relaxed">{description}</p>
              
              <div className="mt-8 flex items-center gap-3 p-4 bg-amber-50 rounded-2xl border border-amber-100 text-amber-700 text-xs text-left">
                <AlertCircle size={16} className="shrink-0" />
                <p className="font-bold">Esta ação não pode ser desfeita. Todos os dados associados a este item serão permanentemente removidos.</p>
              </div>
            </div>
            
            <div className="p-8 bg-slate-50/50 border-t border-slate-100 flex gap-3">
              <button 
                onClick={onClose}
                className="flex-1 py-4 rounded-2xl font-bold text-slate-500 hover:bg-slate-100 transition-all"
              >
                Cancelar
              </button>
              <button 
                onClick={onConfirm}
                className="flex-[2] bg-rose-600 text-white py-4 rounded-2xl font-bold shadow-lg shadow-rose-200 hover:bg-rose-700 transition-all"
              >
                Sim, Eliminar
              </button>
            </div>
            
            <button 
              onClick={onClose}
              className="absolute top-6 right-6 p-2 hover:bg-slate-100 rounded-full transition-colors text-slate-400"
            >
              <X size={20} />
            </button>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};

export default DeleteConfirmationModal;
