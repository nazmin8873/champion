import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { CheckCircle, XCircle, Play, Image, FileText } from 'lucide-react';

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
}

interface QuizCardProps {
  question: QuizQuestion;
  onAnswer: (answer: 'A' | 'B' | 'C' | 'D') => void;
  showResult?: boolean;
  selectedAnswer?: 'A' | 'B' | 'C' | 'D';
  isCorrect?: boolean;
  disabled?: boolean;
}

export function QuizCard({ 
  question, 
  onAnswer, 
  showResult = false, 
  selectedAnswer, 
  isCorrect,
  disabled = false 
}: QuizCardProps) {
  const [answer, setAnswer] = useState<'A' | 'B' | 'C' | 'D' | null>(null);

  const handleAnswerSelect = (selectedOption: 'A' | 'B' | 'C' | 'D') => {
    if (disabled || showResult) return;
    
    setAnswer(selectedOption);
    onAnswer(selectedOption);
  };

  const getOptionClass = (option: 'A' | 'B' | 'C' | 'D') => {
    const baseClass = "w-full p-4 text-left border rounded-lg transition-all duration-200 hover:shadow-md";
    
    if (!showResult) {
      return `${baseClass} ${answer === option ? 'border-primary bg-primary/10' : 'border-border bg-card'}`;
    }
    
    // Show result colors
    if (option === question.correct_answer) {
      return `${baseClass} border-green-500 bg-green-50 text-green-800`;
    }
    
    if (selectedAnswer === option && selectedAnswer !== question.correct_answer) {
      return `${baseClass} border-red-500 bg-red-50 text-red-800`;
    }
    
    return `${baseClass} border-border bg-card opacity-60`;
  };

  const renderMediaContent = () => {
    if (question.question_type === 'image' && question.media_url) {
      return (
        <div className="mb-6">
          <img 
            src={question.media_url} 
            alt="Question media"
            className="w-full h-48 object-cover rounded-lg"
          />
        </div>
      );
    }
    
    if (question.question_type === 'video' && question.media_url) {
      return (
        <div className="mb-6">
          <video 
            src={question.media_url}
            controls
            className="w-full h-48 rounded-lg"
            poster="/placeholder.svg"
          />
        </div>
      );
    }
    
    return null;
  };

  const getQuestionTypeIcon = () => {
    switch (question.question_type) {
      case 'image':
        return <Image className="w-4 h-4" />;
      case 'video':
        return <Play className="w-4 h-4" />;
      default:
        return <FileText className="w-4 h-4" />;
    }
  };

  return (
    <Card className="question-card">
      <CardContent className="p-0 h-full flex flex-col">
        {/* Header */}
        <div className="p-6 pb-4">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              {getQuestionTypeIcon()}
              <Badge variant="secondary" className="text-xs">
                {question.difficulty_level}
              </Badge>
            </div>
            {showResult && (
              <div className="flex items-center gap-2">
                {isCorrect ? (
                  <CheckCircle className="w-6 h-6 text-green-600" />
                ) : (
                  <XCircle className="w-6 h-6 text-red-600" />
                )}
              </div>
            )}
          </div>
          
          {renderMediaContent()}
          
          <h2 className="text-xl font-semibold mb-6 leading-relaxed">
            {question.question_content}
          </h2>
        </div>

        {/* Options */}
        <div className="flex-1 p-6 pt-0">
          <div className="space-y-3">
            {[
              { key: 'A' as const, text: question.option_a },
              { key: 'B' as const, text: question.option_b },
              { key: 'C' as const, text: question.option_c },
              { key: 'D' as const, text: question.option_d },
            ].map(({ key, text }) => (
              <Button
                key={key}
                variant="ghost"
                className={getOptionClass(key)}
                onClick={() => handleAnswerSelect(key)}
                disabled={disabled}
              >
                <div className="flex items-center gap-3">
                  <div className="flex-shrink-0 w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center text-sm font-semibold">
                    {key}
                  </div>
                  <span className="text-left">{text}</span>
                </div>
              </Button>
            ))}
          </div>
        </div>

        {/* Result Message */}
        {showResult && (
          <div className="p-6 pt-0">
            <div className={`p-4 rounded-lg ${isCorrect ? 'bg-green-50 text-green-800' : 'bg-red-50 text-red-800'}`}>
              <p className="font-semibold">
                {isCorrect ? '🎉 Congratulations Champion!' : '😔 Better luck next time!'}
              </p>
              <p className="text-sm mt-1">
                {isCorrect 
                  ? 'You won ₹100! Swipe up for the next challenge.' 
                  : `Correct answer was ${question.correct_answer}. Add ₹50 to try again!`
                }
              </p>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}