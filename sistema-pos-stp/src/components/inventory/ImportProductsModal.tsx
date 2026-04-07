import React, { useState, useRef } from 'react';
import { Upload, X, FileJson, FileSpreadsheet, AlertCircle } from 'lucide-react';
import { toast } from 'sonner';
import Modal from '../ui/Modal';
import { useAuth } from '../../contexts/AuthContext';

interface ImportProductsModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

const ImportProductsModal: React.FC<ImportProductsModalProps> = ({ isOpen, onClose, onSuccess }) => {
  const { user } = useAuth();
  const [file, setFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const selectedFile = e.target.files[0];
      const validTypes = ['application/json', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', 'application/vnd.ms-excel'];
      const validExtensions = ['.json', '.xlsx', '.xls'];
      
      const isValidExtension = validExtensions.some(ext => selectedFile.name.toLowerCase().endsWith(ext));

      if (isValidExtension) {
        setFile(selectedFile);
      } else {
        toast.error('Formato inválido. Por favor selecione um ficheiro .json, .xlsx ou .xls');
        setFile(null);
      }
    }
  };

  const handleImport = async () => {
    if (!file) return;

    setIsUploading(true);
    const formData = new FormData();
    formData.append('file', file);
    if (user?.id) {
      formData.append('user_id', user.id.toString());
    }

    try {
      const res = await fetch('/api/products/import', {
        method: 'POST',
        body: formData,
      });

      const data = await res.json();

      if (res.ok) {
        toast.success(data.message || 'Produtos importados com sucesso!');
        onSuccess();
        onClose();
        setFile(null);
      } else {
        toast.error(data.error || 'Erro ao importar produtos');
      }
    } catch (error) {
      toast.error('Erro de conexão ao servidor');
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Importar Produtos">
      <div className="p-6 space-y-6">
        <div className="bg-blue-50 text-blue-800 p-4 rounded-xl flex gap-3 text-sm">
          <AlertCircle size={20} className="shrink-0" />
          <div>
            <p className="font-bold mb-1">Instruções de Importação</p>
            <p>Faça o upload de um ficheiro JSON ou Excel (.xlsx, .xls).</p>
            <p className="mt-2 text-xs opacity-80">
              Colunas suportadas: name, barcode, purchase_price, sale_price, category_name, supplier_name, unit_name, stock_base, min_stock, description.
            </p>
          </div>
        </div>

        <div 
          className="border-2 border-dashed border-[#e5e5e5] rounded-2xl p-8 text-center hover:bg-[#f9f9f9] transition-colors cursor-pointer"
          onClick={() => fileInputRef.current?.click()}
        >
          <input 
            type="file" 
            ref={fileInputRef} 
            className="hidden" 
            accept=".json,.xlsx,.xls"
            onChange={handleFileChange}
          />
          
          {file ? (
            <div className="flex flex-col items-center gap-3">
              {file.name.endsWith('.json') ? (
                <FileJson size={48} className="text-blue-500" />
              ) : (
                <FileSpreadsheet size={48} className="text-green-500" />
              )}
              <div>
                <p className="font-bold text-[#1a1a1a]">{file.name}</p>
                <p className="text-sm text-muted-foreground">{(file.size / 1024).toFixed(2)} KB</p>
              </div>
              <button 
                onClick={(e) => { e.stopPropagation(); setFile(null); }}
                className="text-sm text-red-500 hover:underline mt-2"
              >
                Remover ficheiro
              </button>
            </div>
          ) : (
            <div className="flex flex-col items-center gap-3">
              <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center text-gray-400">
                <Upload size={24} />
              </div>
              <div>
                <p className="font-bold text-[#1a1a1a]">Clique para selecionar um ficheiro</p>
                <p className="text-sm text-muted-foreground">ou arraste e solte aqui</p>
              </div>
            </div>
          )}
        </div>

        <div className="flex justify-end gap-3 pt-4">
          <button
            onClick={onClose}
            className="px-6 py-3 rounded-xl font-bold text-[#1a1a1a] hover:bg-[#f5f5f5] transition-colors"
          >
            Cancelar
          </button>
          <button
            onClick={handleImport}
            disabled={!file || isUploading}
            className="bg-[#1a1a1a] text-white px-6 py-3 rounded-xl font-bold hover:scale-[1.02] transition-transform disabled:opacity-50 disabled:scale-100 flex items-center gap-2"
          >
            {isUploading ? (
              <>A importar...</>
            ) : (
              <>
                <Upload size={20} />
                Importar
              </>
            )}
          </button>
        </div>
      </div>
    </Modal>
  );
};

export default ImportProductsModal;
