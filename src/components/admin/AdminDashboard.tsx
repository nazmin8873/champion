import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

import { 
  Users, 
  FileQuestion, 
  Wallet, 
  Trophy, 
  Plus,
  BarChart3,
  LogOut,
  Shield
} from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';

interface DashboardStats {
  totalUsers: number;
  totalQuestions: number;
  totalGamesPlayed: number;
  totalWalletFunds: number;
  dailyGames: number;
  topPlayers: any[];
}

export function AdminDashboard() {
  const { signOut } = useAuth();
  const [stats, setStats] = useState<DashboardStats>({
    totalUsers: 0,
    totalQuestions: 0,
    totalGamesPlayed: 0,
    totalWalletFunds: 0,
    dailyGames: 0,
    topPlayers: []
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDashboardStats();
  }, []);

  const fetchDashboardStats = async () => {
    try {
      // Fetch total users
      const { count: usersCount } = await supabase
        .from('profiles')
        .select('*', { count: 'exact', head: true });

      // Fetch total questions
      const { count: questionsCount } = await supabase
        .from('quiz_questions')
        .select('*', { count: 'exact', head: true });

      // Fetch total games played
      const { count: gamesCount } = await supabase
        .from('game_attempts')
        .select('*', { count: 'exact', head: true });

      // Fetch daily games (today)
      const today = new Date().toISOString().split('T')[0];
      const { count: dailyGamesCount } = await supabase
        .from('game_attempts')
        .select('*', { count: 'exact', head: true })
        .gte('created_at', today);

      // Fetch wallet funds
      const { data: walletData } = await supabase
        .from('wallet_transactions')
        .select('amount, transaction_type')
        .eq('status', 'completed');

      const totalFunds = walletData?.reduce((sum, transaction) => {
        return transaction.transaction_type === 'deposit' 
          ? sum + Number(transaction.amount)
          : sum;
      }, 0) || 0;

      // Fetch top players - simplified to avoid relation issues
      const { data: topPlayersData } = await supabase
        .from('game_attempts')
        .select(`
          user_id,
          amount_won
        `)
        .eq('is_correct', true)
        .order('amount_won', { ascending: false })
        .limit(20);

      // Group and sum winnings by user
      const topPlayers = topPlayersData?.reduce((acc: any[], attempt) => {
        const existingPlayer = acc.find(p => p.user_id === attempt.user_id);
        if (existingPlayer) {
          existingPlayer.total_winnings += Number(attempt.amount_won);
        } else {
          acc.push({
            user_id: attempt.user_id,
            display_name: `Champion ${attempt.user_id.slice(-4)}`,
            total_winnings: Number(attempt.amount_won)
          });
        }
        return acc;
      }, []).sort((a, b) => b.total_winnings - a.total_winnings).slice(0, 5) || [];

      setStats({
        totalUsers: usersCount || 0,
        totalQuestions: questionsCount || 0,
        totalGamesPlayed: gamesCount || 0,
        totalWalletFunds: totalFunds,
        dailyGames: dailyGamesCount || 0,
        topPlayers
      });
    } catch (error) {
      console.error('Error fetching dashboard stats:', error);
      toast({
        title: "Error",
        description: "Failed to load dashboard statistics.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-blue-100">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-blue-100 p-4">
      <div className="max-w-6xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Shield className="w-8 h-8 text-primary" />
            <h1 className="text-3xl font-bold text-primary">Admin Dashboard</h1>
          </div>
          <Button onClick={signOut} variant="outline">
            <LogOut className="w-4 h-4 mr-2" />
            Sign Out
          </Button>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <Card className="champion-card">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Users</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.totalUsers}</div>
              <p className="text-xs text-muted-foreground">Registered players</p>
            </CardContent>
          </Card>

          <Card className="champion-card">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Questions</CardTitle>
              <FileQuestion className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.totalQuestions}</div>
              <p className="text-xs text-muted-foreground">Available questions</p>
            </CardContent>
          </Card>

          <Card className="champion-card">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Games Played</CardTitle>
              <BarChart3 className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.totalGamesPlayed}</div>
              <p className="text-xs text-muted-foreground">
                {stats.dailyGames} today
              </p>
            </CardContent>
          </Card>

          <Card className="champion-card">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Wallet Funds</CardTitle>
              <Wallet className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">₹{stats.totalWalletFunds.toFixed(2)}</div>
              <p className="text-xs text-muted-foreground">Total deposited</p>
            </CardContent>
          </Card>
        </div>

        {/* Action Buttons */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Button 
            className="champion-button h-20 text-lg"
            onClick={() => window.open('/admin/questions', '_blank')}
          >
            <Plus className="w-6 h-6 mr-2" />
            Add New Question
          </Button>
          
          <Button 
            variant="outline" 
            className="h-20 text-lg"
            onClick={() => window.open('/admin/users', '_blank')}
          >
            <Users className="w-6 h-6 mr-2" />
            Manage Users
          </Button>
        </div>

        {/* Top Players Leaderboard */}
        <Card className="champion-card">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Trophy className="w-5 h-5 text-primary" />
              Top Champions
            </CardTitle>
          </CardHeader>
          <CardContent>
            {stats.topPlayers.length === 0 ? (
              <p className="text-center text-muted-foreground py-8">
                No champions yet. Players will appear here after winning games.
              </p>
            ) : (
              <div className="space-y-4">
                {stats.topPlayers.map((player, index) => (
                  <div key={player.user_id} className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <Badge variant={index === 0 ? "default" : "secondary"}>
                        #{index + 1}
                      </Badge>
                      <span className="font-medium">
                        {player.display_name || 'Anonymous Champion'}
                      </span>
                    </div>
                    <div className="text-lg font-bold text-green-600">
                      ₹{player.total_winnings}
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