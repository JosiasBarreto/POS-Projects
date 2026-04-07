import { useState, useCallback } from 'react';
import { toast } from 'sonner';
import { formatCurrency } from '../lib/utils';

export const usePOSSession = (user: any, store: any, session: any, setSession: (s: any) => void) => {
  const [openingBalance, setOpeningBalance] = useState('');
  const [countedBalance, setCountedBalance] = useState('');
  const [justification, setJustification] = useState('');
  const [sessionSummary, setSessionSummary] = useState<any>(null);
  const [movementType, setMovementType] = useState<'entry' | 'exit'>('entry');
  const [movementAmount, setMovementAmount] = useState('');
  const [movementDescription, setMovementDescription] = useState('');

  const handleOpenSession = useCallback(async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!openingBalance || parseFloat(openingBalance) < 0) {
      toast.error("Informe um valor inicial válido");
      return;
    }
    try {
      const res = await fetch('/api/sessions/open', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ user_id: user?.id, opening_balance: parseFloat(openingBalance) || 0 })
      });
      if (res.ok) {
        const sessionData = await res.json();
        setSession({ ...sessionData, opening_balance: parseFloat(openingBalance) || 0 });
        toast.success("Caixa aberto com sucesso!");
        return true;
      } else {
        const err = await res.json();
        toast.error(err.error || "Erro ao abrir caixa");
      }
    } catch (error) {
      toast.error("Erro de conexão ao abrir caixa");
    }
    return false;
  }, [openingBalance, user?.id, setSession]);

  const handleCloseSession = useCallback(async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!countedBalance || parseFloat(countedBalance) < 0) {
      toast.error("Informe o valor contado em caixa");
      return;
    }
    try {
      const res = await fetch('/api/sessions/close', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          session_id: session?.id, 
          counted_balance: parseFloat(countedBalance),
          user_id: user?.id,
          justification
        })
      });
      if (res.ok) {
        const result = await res.json();
        toast.success(`Caixa fechado! Diferença: ${formatCurrency(result.difference, store?.currency)}`);
        setSession(null);
        setCountedBalance('');
        setJustification('');
        return true;
      } else {
        const err = await res.json();
        console.error("Erro ao fechar caixa:", err);
        toast.error(err.error || "Erro ao fechar caixa");
      }
    } catch (error) {
      console.error("Erro de conexão ao fechar caixa:", error);
      toast.error("Erro de conexão ao fechar caixa");
    }
    return false;
  }, [countedBalance, session?.id, user?.id, store?.currency, setSession]);

  const handleAddMovement = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();
    if (!movementAmount || parseFloat(movementAmount) <= 0) {
      toast.error("Informe um valor válido");
      return;
    }
    try {
      const res = await fetch('/api/cash-movements', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          session_id: session?.id,
          user_id: user?.id,
          type: movementType,
          amount: parseFloat(movementAmount),
          description: movementDescription
        })
      });
      if (res.ok) {
        toast.success("Movimentação registada!");
        setMovementAmount('');
        setMovementDescription('');
        return true;
      } else {
        toast.error("Erro ao registar movimentação");
      }
    } catch (error) {
      toast.error("Erro de conexão ao registar movimentação");
    }
    return false;
  }, [movementAmount, movementType, movementDescription, session?.id, user?.id]);

  const fetchSessionSummary = useCallback(async () => {
    if (!session?.id) return;
    try {
      const res = await fetch(`/api/sessions/summary/${session.id}`);
      if (res.ok) {
        const data = await res.json();
        setSessionSummary(data);
        return data;
      }
    } catch (error) {
      console.error("Error fetching session summary:", error);
    }
    return null;
  }, [session?.id]);

  return {
    openingBalance,
    setOpeningBalance,
    countedBalance,
    setCountedBalance,
    justification,
    setJustification,
    sessionSummary,
    movementType,
    setMovementType,
    movementAmount,
    setMovementAmount,
    movementDescription,
    setMovementDescription,
    handleOpenSession,
    handleCloseSession,
    handleAddMovement,
    fetchSessionSummary,
  };
};
