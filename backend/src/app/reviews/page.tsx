'use client';

import { useEffect, useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { AuthProvider, useAuth } from '@/components/AuthContext';
import Navbar from '@/components/Navbar';

interface ReviewItem {
  type: 'kanji' | 'vocabulary';
  id: number;
  question_type: 'meaning' | 'reading';
  data: any;
}

function normalizeAnswer(value: string) {
  return value.trim().toLowerCase();
}

function splitAcceptedAnswers(value: string | null | undefined) {
  return (value || '')
    .split(/,|、|;/)
    .map(part => normalizeAnswer(part))
    .filter(Boolean);
}

function ReviewsContent() {
  const { user, token, loading } = useAuth();
  const router = useRouter();
  const [reviews, setReviews] = useState<ReviewItem[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [answer, setAnswer] = useState('');
  const [showResult, setShowResult] = useState(false);
  const [isCorrect, setIsCorrect] = useState(false);
  const [correctAnswer, setCorrectAnswer] = useState('');
  const [completed, setCompleted] = useState(false);
  const [loadingReviews, setLoadingReviews] = useState(true);
  const [correctCount, setCorrectCount] = useState(0);
  const [incorrectCount, setIncorrectCount] = useState(0);
  const [showInfo, setShowInfo] = useState(false);
  const [answeredIncorrectly, setAnsweredIncorrectly] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const inputRef = useRef<HTMLInputElement>(null);
  const enterActionRef = useRef<() => void>(() => {});

  useEffect(() => {
    if (!loading && !user) {
      router.push('/login');
    }
  }, [user, loading, router]);

  useEffect(() => {
    if (token) {
      fetchReviews();
    }
  }, [token]);

  useEffect(() => {
    // Focus input on mount and after each question
    inputRef.current?.focus();
  }, [currentIndex, showResult]);

  useEffect(() => {
    const onGlobalKeyDown = (e: KeyboardEvent) => {
      if (e.key !== 'Enter') return;
      // Let multiline fields behave normally if any appear in the future
      if ((e.target as HTMLElement)?.tagName === 'TEXTAREA') return;
      e.preventDefault();
      enterActionRef.current();
    };

    window.addEventListener('keydown', onGlobalKeyDown, true);
    return () => window.removeEventListener('keydown', onGlobalKeyDown, true);
  }, []);



  const fetchReviews = async () => {
    try {
      const response = await fetch('/api/reviews', {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        setReviews(data.reviews);
      }
    } catch (error) {
      console.error('Failed to fetch reviews:', error);
    } finally {
      setLoadingReviews(false);
    }
  };

  const handleSubmit = async (e?: React.FormEvent) => {
    e?.preventDefault();
    
    if (!answer.trim() || showResult || isSubmitting) return;

    setIsSubmitting(true);

    const currentReview = reviews[currentIndex];
    
    try {
      const response = await fetch('/api/reviews/submit', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          item_type: currentReview.type,
          item_id: currentReview.id,
          question_type: currentReview.question_type,
          answer: answer.trim(),
        }),
      });

      if (response.ok) {
        const result = await response.json();
        setIsCorrect(result.is_correct);
        setCorrectAnswer(result.correct_answer);
        setShowResult(true);
        
        if (result.is_correct) {
          setCorrectCount(correctCount + 1);
        } else {
          setIncorrectCount(incorrectCount + 1);
          setAnsweredIncorrectly(true);
        }
      }
    } catch (error) {
      console.error('Failed to submit answer:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleShowInfo = () => {
    if (!showResult) return; // Only allow after answering
    setShowInfo(!showInfo);
  };

  const handleNext = () => {
    if (isSubmitting) return;

    // If user got it wrong and hasn't seen it again yet, add it back to queue
    if (answeredIncorrectly && !isCorrect) {
      const incorrectItem = reviews[currentIndex];
      setReviews([...reviews.slice(0, currentIndex + 1), incorrectItem, ...reviews.slice(currentIndex + 1)]);
    }

    setAnswer('');
    setShowResult(false);
    setShowInfo(false);
    setAnsweredIncorrectly(false);
    
    if (currentIndex < reviews.length - 1) {
      setCurrentIndex(currentIndex + 1);
    } else {
      setCompleted(true);
    }
  };

  if (loading || !user || loadingReviews) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-2xl">Loading...</div>
      </div>
    );
  }

  if (reviews.length === 0) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-tanuki-50 to-tanuki-100">
        <Navbar />
        <div className="max-w-4xl mx-auto py-12 px-4 text-center">
          <h1 className="text-3xl font-bold text-gray-900 mb-4">No Reviews Available</h1>
          <p className="text-gray-600 mb-8">
            Complete some lessons first!
          </p>
          <button
            onClick={() => router.push('/dashboard')}
            className="bg-tanuki-500 hover:bg-tanuki-600 text-white px-6 py-3 rounded-md font-medium"
          >
            Back to Dashboard
          </button>
        </div>
      </div>
    );
  }

  if (completed) {
    const accuracy = Math.round((correctCount / (correctCount + incorrectCount)) * 100);
    
    return (
      <div className="min-h-screen bg-gradient-to-br from-tanuki-50 to-tanuki-100">
        <Navbar />
        <div className="max-w-4xl mx-auto py-12 px-4 text-center">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">Reviews Complete! 🎉</h1>
          
          <div className="bg-white rounded-lg shadow-lg p-8 mb-8">
            <div className="grid grid-cols-3 gap-6 mb-6">
              <div>
                <div className="text-4xl font-bold text-gray-700">{reviews.length}</div>
                <div className="text-gray-600">Total</div>
              </div>
              <div>
                <div className="text-4xl font-bold text-green-500">{correctCount}</div>
                <div className="text-gray-600">Correct</div>
              </div>
              <div>
                <div className="text-4xl font-bold text-red-500">{incorrectCount}</div>
                <div className="text-gray-600">Incorrect</div>
              </div>
            </div>
            
            <div className="text-3xl font-bold text-tanuki-600">
              {accuracy}% Accuracy
            </div>
          </div>
          
          <button
            onClick={() => router.push('/dashboard')}
            className="bg-tanuki-500 hover:bg-tanuki-600 text-white px-6 py-3 rounded-md font-medium"
          >
            Back to Dashboard
          </button>
        </div>
      </div>
    );
  }

  const currentReview = reviews[currentIndex];
  const isKanji = currentReview.type === 'kanji';
  const isMeaningQuestion = currentReview.question_type === 'meaning';
  const promptText = isKanji ? currentReview.data.character : currentReview.data.word;

  enterActionRef.current = () => {
    if (loading || loadingReviews || !user || completed || isSubmitting) return;
    if (showResult) {
      handleNext();
    } else if (answer.trim()) {
      void handleSubmit();
    }
  };
  
  const headerClass = isKanji
    ? 'bg-gradient-to-br from-fuchsia-700 via-pink-600 to-rose-500'
    : 'bg-gradient-to-br from-violet-700 via-purple-600 to-indigo-500';
  
  // Determine input border color
  let inputBorderColor = 'border-gray-300';
  if (showResult) {
    inputBorderColor = isCorrect ? 'border-green-500 bg-green-50' : 'border-red-500 bg-red-50';
  }

  return (
    <div className="min-h-screen bg-gray-100">
      <Navbar />
      
      {/* Header with character */}
      <div className={`${headerClass} text-white py-20 shadow-xl`}>
        <div className="max-w-4xl mx-auto px-4 text-center">
          <div className="text-9xl font-bold mb-4 drop-shadow-[0_4px_14px_rgba(0,0,0,0.35)]">
            {promptText}
          </div>
          <div className="text-sm uppercase tracking-[0.3em] text-white/80">
            {isMeaningQuestion ? 'Meaning question' : 'Reading question'}
          </div>
        </div>
      </div>

      {/* Question type indicator */}
      <div className="bg-gray-200 py-3">
        <div className="max-w-4xl mx-auto px-4 text-center">
          <span className="text-sm font-medium text-gray-700">
            {isKanji ? 'Kanji' : 'Vocabulary'} {isMeaningQuestion ? 'Meaning' : 'Reading'}
          </span>
        </div>
      </div>

      {/* Answer input */}
      <div className="max-w-4xl mx-auto px-4 py-8">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            enterActionRef.current();
          }}
        >
          <div className="relative">
            <input
              ref={inputRef}
              type="text"
              value={answer}
              onChange={(e) => !showResult && setAnswer(e.target.value)}
              readOnly={showResult}
              className={`w-full px-6 py-6 text-3xl text-center border-4 rounded-lg focus:outline-none transition-colors ${inputBorderColor}`}
              placeholder="Your answer..."
              autoComplete="off"
              autoCorrect="off"
              autoCapitalize="off"
              spellCheck="false"
            />
            <button type="submit" className="hidden" aria-hidden="true" tabIndex={-1}>
              Submit
            </button>
            
            {/* Show info button (eye icon) */}
            {showResult && (
              <button
                type="button"
                onClick={handleShowInfo}
                className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700 text-2xl"
              >
                👁️
              </button>
            )}
          </div>

          {!showResult && (
            <div className="text-center mt-6 text-gray-600">
              Press Enter to submit • {currentIndex + 1} of {reviews.length}
            </div>
          )}

          {showResult && (
            <div className="text-center mt-6">
              <div className={`text-2xl font-bold mb-4 ${isCorrect ? 'text-green-600' : 'text-red-600'}`}>
                {isCorrect ? '✓ Correct!' : '✗ Incorrect'}
              </div>
              
              {!isCorrect && (
                <div className="mb-4 text-gray-700">
                  <p className="text-lg">Correct answer: <span className="font-bold">{correctAnswer}</span></p>
                </div>
              )}
              
              <div className="text-gray-600">
                Press <kbd className="px-2 py-1 bg-gray-200 rounded">Enter</kbd> for next question
              </div>
            </div>
          )}
        </form>

        {/* Info panel */}
        {showInfo && (
          <div className="mt-8 bg-white rounded-lg shadow-lg p-8 border-t-4 border-gray-300">
            <h3 className="text-2xl font-bold mb-6">
              {isKanji ? currentReview.data.character : currentReview.data.word}
            </h3>
            
            <div className="space-y-4">
              <div>
                <h4 className="font-semibold text-gray-700 mb-2">Meaning</h4>
                <p className="text-gray-900">{splitAcceptedAnswers(currentReview.data.meaning).join(' / ')}</p>
              </div>
              
              <div>
                <h4 className="font-semibold text-gray-700 mb-2">Reading</h4>
                <p className="text-gray-900">
                  {isKanji ? (
                    <>
                      {currentReview.data.on_reading && <div>On: {currentReview.data.on_reading}</div>}
                      {currentReview.data.kun_reading && <div>Kun: {currentReview.data.kun_reading}</div>}
                    </>
                  ) : (
                    currentReview.data.reading
                  )}
                </p>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Progress bar at bottom */}
      <div className="fixed bottom-0 left-0 right-0 bg-white shadow-lg">
        <div className="max-w-4xl mx-auto px-4 py-3 flex items-center justify-between">
          <span className="text-sm text-gray-600">
            {currentIndex + 1} / {reviews.length}
          </span>
          <span className="text-sm space-x-4">
            <span className="text-green-600">✓ {correctCount}</span>
            <span className="text-red-600">✗ {incorrectCount}</span>
          </span>
        </div>
        <div className="w-full bg-gray-200 h-1">
          <div
            className="bg-tanuki-500 h-1 transition-all"
            style={{ width: `${((currentIndex + 1) / reviews.length) * 100}%` }}
          />
        </div>
      </div>
    </div>
  );
}

export default function ReviewsPage() {
  return (
    <AuthProvider>
      <ReviewsContent />
    </AuthProvider>
  );
}
