import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Wallet, ArrowRight, Coins, Trophy } from 'lucide-react';

interface WalletCardProps {
  balance: number;
  onPayToPlay: () => void;
  questionNumber: number;
  totalQuestions: number;
}

export function WalletCard({ balance, onPayToPlay, questionNumber, totalQuestions }: WalletCardProps) {
  const canPlay = balance >= 50;

  return (
    <Card className="question-card">
      <CardContent className="p-0 h-full flex flex-col justify-center">
        <div className="text-center p-8">
          {/* Header */}
          <div className="flex items-center justify-center mb-6">
            <Trophy className="w-8 h-8 text-primary mr-2" />
            <h1 className="text-2xl font-bold text-primary">Champion Quiz</h1>
          </div>

          {/* Question Counter */}
          <Badge variant="outline" className="mb-6">
            Question {questionNumber} of {totalQuestions}
          </Badge>

          {/* Wallet Balance */}
          <div className="champion-card p-6 mb-8">
            <div className="flex items-center justify-center mb-4">
              <Wallet className="w-6 h-6 text-primary mr-2" />
              <h2 className="text-lg font-semibold">Your Wallet</h2>
            </div>
            <div className="text-3xl font-bold text-primary mb-2">
              ₹{balance.toFixed(2)}
            </div>
            <p className="text-sm text-muted-foreground">Current Balance</p>
          </div>

          {/* Game Rules */}
          <div className="bg-blue-50 rounded-lg p-6 mb-8 text-left">
            <h3 className="font-semibold mb-4 flex items-center">
              <Coins className="w-5 h-5 mr-2 text-primary" />
              How to Play
            </h3>
            <div className="space-y-2 text-sm">
              <div className="flex items-center justify-between">
                <span>Pay to unlock question:</span>
                <span className="font-semibold text-red-600">-₹50</span>
              </div>
              <div className="flex items-center justify-between">
                <span>Win if correct:</span>
                <span className="font-semibold text-green-600">+₹100</span>
              </div>
              <div className="flex items-center justify-between">
                <span>Lose if wrong:</span>
                <span className="font-semibold text-red-600">-₹50</span>
              </div>
            </div>
          </div>

          {/* Action Button */}
          {canPlay ? (
            <Button 
              onClick={onPayToPlay}
              className="w-full champion-button"
              size="lg"
            >
              <ArrowRight className="w-5 h-5 mr-2" />
              Pay ₹50 & Start Playing
            </Button>
          ) : (
            <div>
              <Button 
                disabled
                className="w-full mb-4"
                size="lg"
                variant="outline"
              >
                Insufficient Balance
              </Button>
              <Button 
                className="w-full champion-button"
                size="lg"
                onClick={() => window.open('/wallet', '_blank')}
              >
                <Wallet className="w-5 h-5 mr-2" />
                Add Money to Wallet
              </Button>
            </div>
          )}

          {/* Warning */}
          <p className="text-xs text-muted-foreground mt-4">
            You need at least ₹50 to play each question. Win ₹100 for correct answers!
          </p>
        </div>
      </CardContent>
    </Card>
  );
}