import React, { useState, useEffect, useRef } from 'react';
import { Search, User, X, Check, Plus } from 'lucide-react';
import { Client } from '../../types';
import { cn } from '../../lib/utils';

interface ClientSelectProps {
  selectedClient: Client | null;
  onSelect: (client: Client | null) => void;
}

const ClientSelect: React.FC<ClientSelectProps> = ({ selectedClient, onSelect }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [search, setSearch] = useState('');
  const [clients, setClients] = useState<Client[]>([]);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    fetch('/api/clients')
      .then(res => res.json())
      .then(setClients);
  }, []);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const filteredClients = clients.filter(c => 
    c.name.toLowerCase().includes(search.toLowerCase()) || 
    c.phone.includes(search)
  );

  return (
    <div className="relative" ref={dropdownRef}>
      {selectedClient ? (
        <div className="flex items-center justify-between p-3 bg-indigo-50 border border-indigo-200 rounded-2xl">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-indigo-100 text-indigo-600 rounded-xl flex items-center justify-center">
              <User size={18} />
            </div>
            <div>
              <p className="text-sm font-bold text-indigo-900">{selectedClient.name}</p>
              <p className="text-[10px] font-medium text-indigo-600 uppercase tracking-wider">Cliente Selecionado</p>
            </div>
          </div>
          <button 
            onClick={() => onSelect(null)}
            className="p-1.5 hover:bg-indigo-100 rounded-lg text-indigo-400 transition-colors"
          >
            <X size={16} />
          </button>
        </div>
      ) : (
        <button 
          onClick={() => setIsOpen(!isOpen)}
          className="w-full flex items-center justify-between p-3 bg-[#f5f5f5] border border-dashed border-slate-300 rounded-2xl text-slate-500 hover:border-indigo-500 hover:text-indigo-600 transition-all"
        >
          <div className="flex items-center gap-2">
          <Plus size={18} />  <User size={18} />
            <span className="text-sm font-bold"> Adic. Cliente</span>
          </div>
          
        </button>
      )}

      {isOpen && (
        <div className="absolute top-full left-0 right-0 mt-2 bg-white border border-slate-200 rounded-2xl shadow-2xl z-50 overflow-hidden animate-in fade-in slide-in-from-top-2 duration-200">
          <div className="p-3 border-b border-slate-100">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
              <input
                autoFocus
                type="text"
                placeholder="Pesquisar cliente..."
                className="w-full pl-10 pr-4 py-2 bg-slate-50 border-none rounded-xl text-sm font-medium outline-none"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
          </div>
          <div className="max-h-60 overflow-y-auto">
            {filteredClients.length === 0 ? (
              <div className="p-4 text-center text-xs text-slate-500 font-medium">
                Nenhum cliente encontrado.
              </div>
            ) : (
              filteredClients.map(client => (
                <button
                  key={client.id}
                  onClick={() => {
                    onSelect(client);
                    setIsOpen(false);
                    setSearch('');
                  }}
                  className="w-full flex items-center justify-between p-3 hover:bg-slate-50 transition-colors border-b border-slate-50 last:border-0"
                >
                  <div className="text-left">
                    <p className="text-sm font-bold text-slate-900">{client.name}</p>
                    <p className="text-[10px] text-slate-500">{client.phone}</p>
                  </div>
                  {selectedClient?.id === client.id && <Check size={16} className="text-indigo-600" />}
                </button>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default ClientSelect;
