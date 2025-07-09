import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';

export function useWallet() {
  const { user } = useAuth();
  const [balance, setBalance] = useState<number>(0);
  const [loading, setLoading] = useState(true);

  const fetchBalance = async () => {
    if (!user) return;
    
    try {
      const { data, error } = await supabase.rpc('get_wallet_balance', {
        p_user_id: user.id
      });
      
      if (error) throw error;
      setBalance(Number(data) || 0);
    } catch (error) {
      console.error('Error fetching wallet balance:', error);
    } finally {
      setLoading(false);
    }
  };

  const addTransaction = async (
    amount: number, 
    type: 'deposit' | 'withdrawal' | 'game_debit' | 'game_credit',
    paymentGatewayId?: string
  ) => {
    if (!user) return { error: 'User not authenticated' };

    try {
      const { error } = await supabase
        .from('wallet_transactions')
        .insert({
          user_id: user.id,
          amount,
          transaction_type: type,
          payment_gateway_id: paymentGatewayId,
          status: 'completed'
        });

      if (error) throw error;
      
      // Refresh balance
      await fetchBalance();
      return { error: null };
    } catch (error) {
      console.error('Error adding transaction:', error);
      return { error };
    }
  };

  const getTransactions = async () => {
    if (!user) return [];

    try {
      const { data, error } = await supabase
        .from('wallet_transactions')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error fetching transactions:', error);
      return [];
    }
  };

  useEffect(() => {
    fetchBalance();
  }, [user]);

  return {
    balance,
    loading,
    fetchBalance,
    addTransaction,
    getTransactions
  };
}