import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { ArrowLeft, Plus, Minus, CreditCard, History, Users } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useWallet } from '@/hooks/useWallet';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';

export function WalletPage() {
  const navigate = useNavigate();
  const { balance, addTransaction, getTransactions } = useWallet();
  const { user } = useAuth();
  const [amount, setAmount] = useState('');
  const [transactions, setTransactions] = useState<any[]>([]);
  const [referralCount, setReferralCount] = useState(0);
  const [canWithdraw, setCanWithdraw] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    loadTransactions();
    checkReferralStatus();
  }, []);

  const loadTransactions = async () => {
    const data = await getTransactions();
    setTransactions(data.slice(0, 10)); // Show last 10 transactions
  };

  const checkReferralStatus = async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from('referrals')
        .select('id')
        .eq('referrer_id', user.id);

      if (error) throw error;
      
      const count = data?.length || 0;
      setReferralCount(count);
      setCanWithdraw(count >= 3);
    } catch (error) {
      console.error('Error checking referral status:', error);
    }
  };

  const handleAddMoney = async () => {
    const numAmount = parseFloat(amount);
    if (!numAmount || numAmount <= 0) {
      toast({
        title: "Invalid Amount",
        description: "Please enter a valid amount.",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    try {
      // Simulate payment gateway integration
      // In a real app, you would integrate with Razorpay/Stripe here
      const { error } = await addTransaction(numAmount, 'deposit', `mock_payment_${Date.now()}`);
      if (error) throw error;

      toast({
        title: "Money Added Successfully!",
        description: `₹${numAmount} has been added to your wallet.`,
      });
      
      setAmount('');
      loadTransactions();
    } catch (error) {
      toast({
        title: "Payment Failed",
        description: "Failed to add money. Please try again.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleWithdraw = async () => {
    if (!canWithdraw) {
      toast({
        title: "Withdrawal Not Allowed",
        description: "You need to refer 3 friends before withdrawing.",
        variant: "destructive",
      });
      return;
    }

    const numAmount = parseFloat(amount);
    if (!numAmount || numAmount <= 0 || numAmount > balance) {
      toast({
        title: "Invalid Amount",
        description: "Please enter a valid withdrawal amount.",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    try {
      const { error } = await addTransaction(numAmount, 'withdrawal', `withdrawal_${Date.now()}`);
      if (error) throw error;

      toast({
        title: "Withdrawal Successful!",
        description: `₹${numAmount} will be transferred to your account within 24 hours.`,
      });
      
      setAmount('');
      loadTransactions();
    } catch (error) {
      toast({
        title: "Withdrawal Failed",
        description: "Failed to process withdrawal. Please try again.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const shareApp = async () => {
    const shareData = {
      title: 'Champion Quiz App',
      text: 'Join me on Champion - the ultimate quiz app where you can win real money!',
      url: window.location.origin
    };

    try {
      if (navigator.share) {
        await navigator.share(shareData);
      } else {
        // Fallback for browsers that don't support Web Share API
        const shareUrl = `https://wa.me/?text=${encodeURIComponent(shareData.text + ' ' + shareData.url)}`;
        window.open(shareUrl, '_blank');
      }
      
      toast({
        title: "Thanks for Sharing!",
        description: "Help your friends become Champions too!",
      });
    } catch (error) {
      console.error('Error sharing:', error);
    }
  };

  const getTransactionIcon = (type: string) => {
    switch (type) {
      case 'deposit':
        return <Plus className="w-4 h-4 text-green-600" />;
      case 'withdrawal':
        return <Minus className="w-4 h-4 text-red-600" />;
      case 'game_credit':
        return <Plus className="w-4 h-4 text-green-600" />;
      case 'game_debit':
        return <Minus className="w-4 h-4 text-red-600" />;
      default:
        return <CreditCard className="w-4 h-4" />;
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-blue-100 p-4">
      <div className="max-w-md mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center gap-4 pt-4">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => navigate('/')}
            className="rounded-full"
          >
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <h1 className="text-2xl font-bold">Wallet</h1>
        </div>

        {/* Balance Card */}
        <Card className="champion-card">
          <CardHeader className="text-center">
            <CardTitle className="text-3xl font-bold text-primary">
              ₹{balance.toFixed(2)}
            </CardTitle>
            <p className="text-muted-foreground">Available Balance</p>
          </CardHeader>
        </Card>

        {/* Referral Status */}
        <Card className="champion-card">
          <CardContent className="p-4">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <Users className="w-5 h-5 text-primary" />
                <span className="font-semibold">Referral Status</span>
              </div>
              <Badge variant={canWithdraw ? "default" : "secondary"}>
                {referralCount}/3 friends
              </Badge>
            </div>
            <p className="text-sm text-muted-foreground mb-4">
              {canWithdraw 
                ? "🎉 You can now withdraw your winnings!" 
                : `Refer ${3 - referralCount} more friends to unlock withdrawals`
              }
            </p>
            <Button onClick={shareApp} className="w-full" variant="outline">
              <Users className="w-4 h-4 mr-2" />
              Share App with Friends
            </Button>
          </CardContent>
        </Card>

        {/* Add/Withdraw Money */}
        <Card className="champion-card">
          <CardHeader>
            <CardTitle className="text-lg">Manage Money</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="amount">Amount (₹)</Label>
              <Input
                id="amount"
                type="number"
                placeholder="Enter amount"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <Button 
                onClick={handleAddMoney}
                disabled={loading}
                className="w-full"
              >
                <Plus className="w-4 h-4 mr-2" />
                Add Money
              </Button>
              <Button 
                onClick={handleWithdraw}
                disabled={loading || !canWithdraw}
                variant="outline"
                className="w-full"
              >
                <Minus className="w-4 h-4 mr-2" />
                Withdraw
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Transaction History */}
        <Card className="champion-card">
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <History className="w-5 h-5" />
              Recent Transactions
            </CardTitle>
          </CardHeader>
          <CardContent>
            {transactions.length === 0 ? (
              <p className="text-center text-muted-foreground py-4">
                No transactions yet
              </p>
            ) : (
              <div className="space-y-3">
                {transactions.map((transaction) => (
                  <div key={transaction.id} className="flex items-center justify-between py-2">
                    <div className="flex items-center gap-3">
                      {getTransactionIcon(transaction.transaction_type)}
                      <div>
                        <p className="text-sm font-medium capitalize">
                          {transaction.transaction_type.replace('_', ' ')}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {new Date(transaction.created_at).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className={`font-semibold ${
                        transaction.transaction_type === 'deposit' || transaction.transaction_type === 'game_credit'
                          ? 'text-green-600' 
                          : 'text-red-600'
                      }`}>
                        {transaction.transaction_type === 'deposit' || transaction.transaction_type === 'game_credit' ? '+' : '-'}
                        ₹{Number(transaction.amount).toFixed(2)}
                      </p>
                      <Badge variant="outline" className="text-xs">
                        {transaction.status}
                      </Badge>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}