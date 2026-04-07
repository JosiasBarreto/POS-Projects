import React from "react";
import { motion, AnimatePresence } from "motion/react";
import { X, ArrowUpRight, ArrowDownLeft, CheckCircle2 } from "lucide-react";
import { formatCurrency, cn } from "../../lib/utils";

interface OpeningSessionModalProps {
  isOpen: boolean;
  openingBalance: string;
  setOpeningBalance: (val: string) => void;
  onOpen: (e?: React.FormEvent) => void;
  onClose?: () => void;
}

export const OpeningSessionModal: React.FC<OpeningSessionModalProps> = ({
  isOpen,
  openingBalance,
  setOpeningBalance,
  onOpen,
  onClose,
}) => (
  <AnimatePresence>
    {isOpen && (
      <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
        <motion.div
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className="bg-white w-full max-w-md rounded-3xl p-8 shadow-2xl"
        >
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold">Abertura de Caixa</h2>
            {onClose && (
              <button
                onClick={onClose}
                className="p-2 hover:bg-[#f5f5f5] rounded-full transition-colors"
              >
                <X size={24} />
              </button>
            )}
          </div>
          <p className="text-muted-foreground mb-8">
            Introduza o valor inicial em caixa para começar.
          </p>
          <form onSubmit={onOpen} className="space-y-6">
            <div>
              <label className="block text-sm font-bold mb-2">
                Valor Inicial (STN)*
              </label>
              <input
                type="number"
                className="w-full p-4 bg-[#f5f5f5] border-none rounded-2xl text-xl font-bold outline-none focus:ring-2 focus:ring-[#1a1a1a]/10"
                placeholder="0.00 Dbs"
                value={openingBalance}
                onChange={(e) => setOpeningBalance(e.target.value)}
                autoFocus
              />
            </div>
            <button
              type="submit"
              className="w-full bg-[#1a1a1a] text-white py-4 rounded-2xl font-bold text-lg"
            >
              Abrir Caixa
            </button>
            <button
              type="button"
              onClick={onClose}
              className="w-full bg-[#f5f5f5] text-black py-4 rounded-2xl font-bold text-lg hover:bg-[#e5e5e5] transition-colors border border-black"
            >
              Sair de Abertura de caixa
            </button>
          </form>
        </motion.div>
      </div>
    )}
  </AnimatePresence>
);

interface ClosingSessionModalProps {
  isOpen: boolean;
  onClose: () => void;
  sessionSummary: any;
  countedBalance: string;
  setCountedBalance: (val: string) => void;
  justification: string;
  setJustification: (val: string) => void;
  onCloseSession: (e?: React.FormEvent) => void;
  store: any;
}

export const ClosingSessionModal: React.FC<ClosingSessionModalProps> = ({
  isOpen,
  onClose,
  sessionSummary,
  countedBalance,
  setCountedBalance,
  justification,
  setJustification,
  onCloseSession,
  store,
}) => {
  const difference = countedBalance
    ? parseFloat(countedBalance) - sessionSummary.expected_balance
    : 0;
  const hasDifference = Math.abs(difference) > 0.01;

  return (
    <AnimatePresence>
      {isOpen && sessionSummary && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="bg-white w-full max-w-2xl rounded-3xl p-8 shadow-2xl overflow-auto max-h-[90vh]"
          >
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold">Fecho de Caixa</h2>
              <button
                onClick={onClose}
                className="p-2 hover:bg-[#f5f5f5] rounded-full"
              >
                <X size={24} />
              </button>
            </div>
            <div className="grid grid-cols-2 gap-8 mb-8">
              <div className="space-y-4">
                <h3 className="font-bold text-sm uppercase tracking-widest text-muted-foreground">
                  Resumo de Vendas
                </h3>
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>Dinheiro:</span>{" "}
                    <span className="font-bold">
                      {formatCurrency(
                        sessionSummary.sales.cash,
                        store?.currency
                      )}
                    </span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span>TPA:</span>{" "}
                    <span className="font-bold">
                      {formatCurrency(
                        sessionSummary.sales.card,
                        store?.currency
                      )}
                    </span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span>Transferência:</span>{" "}
                    <span className="font-bold">
                      {formatCurrency(
                        sessionSummary.sales.transfer,
                        store?.currency
                      )}
                    </span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span>Outros:</span>{" "}
                    <span className="font-bold">
                      {formatCurrency(
                        sessionSummary.sales.other,
                        store?.currency
                      )}
                    </span>
                  </div>
                  <div className="pt-2 border-t flex justify-between font-bold">
                    <span>Total Vendas:</span>{" "}
                    <span>
                      {formatCurrency(
                        sessionSummary.sales.total,
                        store?.currency
                      )}
                    </span>
                  </div>
                </div>
              </div>
              <div className="space-y-4">
                <h3 className="font-bold text-sm uppercase tracking-widest text-muted-foreground">
                  Fluxo de Caixa
                </h3>
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>Saldo Inicial:</span>{" "}
                    <span className="font-bold">
                      {formatCurrency(
                        sessionSummary.session.opening_balance,
                        store?.currency
                      )}
                    </span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span>Vendas em Dinheiro:</span>{" "}
                    <span className="font-bold text-green-600">
                      +
                      {formatCurrency(
                        sessionSummary.sales.cash,
                        store?.currency
                      )}
                    </span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span>Entradas Manuais:</span>{" "}
                    <span className="font-bold text-green-600">
                      +
                      {formatCurrency(
                        sessionSummary.movements.entries,
                        store?.currency
                      )}
                    </span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span>Saídas Manuais:</span>{" "}
                    <span className="font-bold text-red-600">
                      -
                      {formatCurrency(
                        sessionSummary.movements.exits,
                        store?.currency
                      )}
                    </span>
                  </div>
                  <div className="pt-2 border-t flex justify-between font-black text-lg">
                    <span>Esperado:</span>{" "}
                    <span>
                      {formatCurrency(
                        sessionSummary.expected_balance,
                        store?.currency
                      )}
                    </span>
                  </div>
                </div>
              </div>
            </div>
            <form
              onSubmit={onCloseSession}
              className="bg-[#f9f9f9] p-6 rounded-2xl space-y-6"
            >
              <div>
                <label className="block text-sm font-bold mb-2">
                  Valor Contado em Dinheiro (Contagem Física)
                </label>
                <input
                  type="number"
                  step="0.01"
                  className="w-full p-4 bg-white border-none rounded-xl text-2xl font-black outline-none shadow-sm"
                  placeholder="0.00"
                  value={countedBalance}
                  onChange={(e) => setCountedBalance(e.target.value)}
                  autoFocus
                />
              </div>

              {countedBalance && (
                <div
                  className={cn(
                    "p-4 rounded-xl flex items-center justify-between font-bold",
                    difference === 0
                      ? "bg-green-100 text-green-700"
                      : difference > 0
                      ? "bg-blue-100 text-blue-700"
                      : "bg-red-100 text-red-700"
                  )}
                >
                  <div className="flex flex-col">
                    <span>Diferença:</span>
                    <span className="text-xs font-normal">
                      {difference < 0
                        ? "Quebra de Caixa"
                        : difference > 0
                        ? "Sobra de Caixa"
                        : "Caixa Equilibrado"}
                    </span>
                  </div>
                  <span>{formatCurrency(difference, store?.currency)}</span>
                </div>
              )}

              {hasDifference && (
                <div className="space-y-2">
                  <label className="block text-sm font-bold text-red-600">
                    Justificação (Obrigatória)
                  </label>
                  <textarea
                    className="w-full p-4 bg-white border-2 border-red-100 rounded-xl outline-none focus:border-red-300 h-24 resize-none"
                    placeholder="Explique o motivo da diferença..."
                    value={justification}
                    onChange={(e) => setJustification(e.target.value)}
                    required
                  />
                </div>
              )}

              <button
                type="submit"
                disabled={hasDifference && !justification.trim()}
                className={cn(
                  "w-full py-4 rounded-xl font-bold text-lg shadow-lg transition-all",
                  hasDifference && !justification.trim()
                    ? "bg-gray-300 cursor-not-allowed"
                    : "bg-[#1a1a1a] text-white hover:scale-[1.01]"
                )}
              >
                Confirmar Fecho de Caixa
              </button>
            </form>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};

interface CashMovementModalProps {
  isOpen: boolean;
  onClose: () => void;
  type: "entry" | "exit";
  setType: (type: "entry" | "exit") => void;
  amount: string;
  setAmount: (val: string) => void;
  description: string;
  setDescription: (val: string) => void;
  onAdd: (e: React.FormEvent) => void;
}

export const CashMovementModal: React.FC<CashMovementModalProps> = ({
  isOpen,
  onClose,
  type,
  setType,
  amount,
  setAmount,
  description,
  setDescription,
  onAdd,
}) => (
  <AnimatePresence>
    {isOpen && (
      <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
        <motion.div
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className="bg-white w-full max-w-md rounded-3xl p-8 shadow-2xl"
        >
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold">Movimentação de Caixa</h2>
            <button
              onClick={onClose}
              className="p-2 hover:bg-[#f5f5f5] rounded-full"
            >
              <X size={24} />
            </button>
          </div>
          <form onSubmit={onAdd} className="space-y-6">
            <div className="flex bg-[#f5f5f5] p-1 rounded-xl">
              <button
                type="button"
                onClick={() => setType("entry")}
                className={cn(
                  "flex-1 py-3 rounded-lg font-bold transition-all flex items-center justify-center gap-2",
                  type === "entry"
                    ? "bg-white shadow-sm text-green-600"
                    : "text-muted-foreground"
                )}
              >
                <ArrowUpRight size={18} /> Entrada
              </button>
              <button
                type="button"
                onClick={() => setType("exit")}
                className={cn(
                  "flex-1 py-3 rounded-lg font-bold transition-all flex items-center justify-center gap-2",
                  type === "exit"
                    ? "bg-white shadow-sm text-red-600"
                    : "text-muted-foreground"
                )}
              >
                <ArrowDownLeft size={18} /> Saída
              </button>
            </div>
            <div>
              <label className="block text-sm font-bold mb-2">
                Valor (STN)
              </label>
              <input
                type="number"
                step="0.01"
                className="w-full p-4 bg-[#f5f5f5] border-none rounded-2xl text-xl font-bold outline-none"
                placeholder="0.00"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                autoFocus
              />
            </div>
            <div>
              <label className="block text-sm font-bold mb-2">
                Descrição / Motivo
              </label>
              <textarea
                className="w-full p-4 bg-[#f5f5f5] border-none rounded-2xl outline-none h-24 resize-none"
                placeholder="Ex: Reforço de trocos, Pagamento de fornecedor..."
                value={description}
                onChange={(e) => setDescription(e.target.value)}
              />
            </div>
            <button
              type="submit"
              className="w-full bg-[#1a1a1a] text-white py-4 rounded-2xl font-bold text-lg"
            >
              Registar Movimento
            </button>
          </form>
        </motion.div>
      </div>
    )}
  </AnimatePresence>
);
