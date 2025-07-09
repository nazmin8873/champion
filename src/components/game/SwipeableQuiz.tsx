import { useState, useEffect, useRef } from 'react';
import { QuizCard } from './QuizCard';
import { WalletCard } from '../wallet/WalletCard';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useWallet } from '@/hooks/useWallet';
import { toast } from '@/hooks/use-toast';

interface QuizQuestion {
  id: string;
  question_type: 'text' | 'image' | 'video';
  question_content: string;
  media_url?: string | null;
  option_a: string;
  option_b: string;
  option_c: string;
  option_d: string;
  correct_answer: 'A' | 'B' | 'C' | 'D';
  difficulty_level: string;
  tags: string[] | null;
  created_at: string;
  updated_at: string;
  is_active: boolean;
}

export function SwipeableQuiz() {
  const { user } = useAuth();
  const { balance, addTransaction, fetchBalance } = useWallet();
  const [questions, setQuestions] = useState<QuizQuestion[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [showResult, setShowResult] = useState(false);
  const [selectedAnswer, setSelectedAnswer] = useState<'A' | 'B' | 'C' | 'D' | null>(null);
  const [isCorrect, setIsCorrect] = useState(false);
  const [hasAnswered, setHasAnswered] = useState(false);
  const [showWalletPrompt, setShowWalletPrompt] = useState(true);
  const [loading, setLoading] = useState(true);
  
  const containerRef = useRef<HTMLDivElement>(null);
  const startY = useRef(0);
  const currentY = useRef(0);
  const isDragging = useRef(false);

  useEffect(() => {
    fetchQuestions();
  }, []);

  const fetchQuestions = async () => {
    try {
      const { data, error } = await supabase
        .from('quiz_questions')
        .select('*')
        .eq('is_active', true)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setQuestions((data || []) as QuizQuestion[]);
    } catch (error) {
      console.error('Error fetching questions:', error);
      toast({
        title: "Error",
        description: "Failed to load questions. Please try again.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handlePayToPlay = async () => {
    if (balance < 50) {
      toast({
        title: "Insufficient Balance",
        description: "You need at least ₹50 to play. Please add funds to your wallet.",
        variant: "destructive",
      });
      return;
    }

    try {
      const { error } = await addTransaction(50, 'game_debit');
      if (error) throw error;

      setShowWalletPrompt(false);
      toast({
        title: "Game Started!",
        description: "₹50 deducted. Good luck, Champion!",
      });
    } catch (error) {
      toast({
        title: "Payment Failed",
        description: "Failed to process payment. Please try again.",
        variant: "destructive",
      });
    }
  };

  const handleAnswer = async (answer: 'A' | 'B' | 'C' | 'D') => {
    if (hasAnswered || !user) return;

    const currentQuestion = questions[currentIndex];
    const correct = answer === currentQuestion.correct_answer;
    
    setSelectedAnswer(answer);
    setIsCorrect(correct);
    setHasAnswered(true);
    setShowResult(true);

    try {
      // Record the game attempt
      const { error: attemptError } = await supabase
        .from('game_attempts')
        .insert({
          user_id: user.id,
          question_id: currentQuestion.id,
          selected_answer: answer,
          is_correct: correct,
          amount_wagered: 50,
          amount_won: correct ? 100 : 0
        });

      if (attemptError) throw attemptError;

      // If correct, add winnings to wallet
      if (correct) {
        const { error: walletError } = await addTransaction(100, 'game_credit');
        if (walletError) throw walletError;
      }

      // Show appropriate toast
      if (correct) {
        toast({
          title: "🎉 Congratulations Champion!",
          description: "You won ₹100! Your winnings have been added to your wallet.",
        });
      } else {
        toast({
          title: "😔 Better luck next time!",
          description: "You lost ₹50. Swipe up to try the next question!",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error('Error recording game attempt:', error);
    }
  };

  const handleNextQuestion = () => {
    if (currentIndex < questions.length - 1) {
      setCurrentIndex(currentIndex + 1);
      setShowResult(false);
      setSelectedAnswer(null);
      setIsCorrect(false);
      setHasAnswered(false);
      setShowWalletPrompt(true);
    } else {
      toast({
        title: "All Questions Completed!",
        description: "You've completed all available questions. More coming soon!",
      });
    }
  };

  const handleTouchStart = (e: React.TouchEvent) => {
    if (!showResult) return;
    startY.current = e.touches[0].clientY;
    isDragging.current = true;
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (!isDragging.current || !showResult) return;
    currentY.current = e.touches[0].clientY;
    const diff = startY.current - currentY.current;
    
    if (containerRef.current) {
      if (diff > 0) {
        containerRef.current.style.transform = `translateY(-${Math.min(diff, 100)}px)`;
      }
    }
  };

  const handleTouchEnd = () => {
    if (!isDragging.current || !showResult) return;
    
    const diff = startY.current - currentY.current;
    
    if (containerRef.current) {
      containerRef.current.style.transform = 'translateY(0)';
    }
    
    if (diff > 50) {
      handleNextQuestion();
    }
    
    isDragging.current = false;
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-blue-100">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading questions...</p>
        </div>
      </div>
    );
  }

  if (questions.length === 0) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-blue-100">
        <div className="text-center p-6">
          <h2 className="text-2xl font-bold mb-4">No Questions Available</h2>
          <p className="text-muted-foreground">Questions will be added soon!</p>
        </div>
      </div>
    );
  }

  const currentQuestion = questions[currentIndex];

  return (
    <div className="swipe-container bg-gradient-to-br from-blue-50 to-blue-100">
      <div
        ref={containerRef}
        className="h-full"
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
      >
        {showWalletPrompt ? (
          <WalletCard
            balance={balance}
            onPayToPlay={handlePayToPlay}
            questionNumber={currentIndex + 1}
            totalQuestions={questions.length}
          />
        ) : (
          <QuizCard
            question={currentQuestion}
            onAnswer={handleAnswer}
            showResult={showResult}
            selectedAnswer={selectedAnswer}
            isCorrect={isCorrect}
            disabled={hasAnswered}
          />
        )}
      </div>
      
      {showResult && (
        <div className="absolute bottom-6 left-1/2 transform -translate-x-1/2">
          <div className="bg-white/80 backdrop-blur-sm rounded-full px-4 py-2 text-sm text-muted-foreground">
            👆 Swipe up for next question
          </div>
        </div>
      )}
    </div>
  );
}