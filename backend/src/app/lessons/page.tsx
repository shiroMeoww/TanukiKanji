'use client';

import { useEffect, useState, useRef, type FormEvent } from 'react';
import { useRouter } from 'next/navigation';
import { AuthProvider, useAuth } from '@/components/AuthContext';
import Navbar from '@/components/Navbar';

interface LessonItem {
  type: 'kanji' | 'vocabulary';
  id: number;
  data: any;
}

interface QuizItem extends LessonItem {
  question_type: 'meaning' | 'reading';
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

function LessonsContent() {
  const { user, token, loading } = useAuth();
  const router = useRouter();
  const [lessons, setLessons] = useState<LessonItem[]>([]);
  const [mode, setMode] = useState<'presentation' | 'quiz'>('presentation');
  const [currentIndex, setCurrentIndex] = useState(0);
  const [quizItems, setQuizItems] = useState<QuizItem[]>([]);
  const [answer, setAnswer] = useState('');
  const [showResult, setShowResult] = useState(false);
  const [isCorrect, setIsCorrect] = useState(false);
  const [correctAnswer, setCorrectAnswer] = useState('');
  const [completed, setCompleted] = useState(false);
  const [loadingLessons, setLoadingLessons] = useState(true);
  const [correctCount, setCorrectCount] = useState(0);
  const [incorrectCount, setIncorrectCount] = useState(0);
  
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!loading && !user) {
      router.push('/login');
    }
  }, [user, loading, router]);

  useEffect(() => {
    if (token) {
      fetchLessons();
    }
  }, [token]);

  useEffect(() => {
    inputRef.current?.focus();
  }, [currentIndex, showResult, mode]);



  const fetchLessons = async () => {
    try {
      const response = await fetch('/api/lessons', {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        setLessons(data.lessons);
      }
    } catch (error) {
      console.error('Failed to fetch lessons:', error);
    } finally {
      setLoadingLessons(false);
    }
  };

  const startQuiz = () => {
    // Create quiz items - each lesson item gets meaning + reading question
    const items: QuizItem[] = [];
    lessons.forEach((lesson: LessonItem) => {
      items.push({
        ...lesson,
        question_type: 'meaning',
      });
      items.push({
        ...lesson,
        question_type: 'reading',
      });
    });
    
    // Shuffle
    const shuffled = items.sort(() => Math.random() - 0.5);
    setQuizItems(shuffled);
    setMode('quiz');
    setCurrentIndex(0);
  };

  const handleSubmit = (e?: FormEvent) => {
    e?.preventDefault();
    
    if (!answer.trim() || showResult) return;

    const currentQuiz = quizItems[currentIndex];
    const item = currentQuiz.data;
    const questionType = currentQuiz.question_type;
    
    let correct = '';
    let userCorrect = false;
    const normalizedAnswer = normalizeAnswer(answer);
    
    if (questionType === 'meaning') {
      const acceptedMeanings = splitAcceptedAnswers(item.meaning);
      correct = acceptedMeanings.join(' / ');
      userCorrect = acceptedMeanings.includes(normalizedAnswer);
    } else {
      if (currentQuiz.type === 'kanji') {
        const onReadings = splitAcceptedAnswers(item.on_reading);
        const kunReadings = splitAcceptedAnswers(item.kun_reading);
        const acceptedReadings = [...onReadings, ...kunReadings];
        correct = acceptedReadings.join(' / ');
        userCorrect = acceptedReadings.includes(normalizedAnswer);
      } else {
        correct = item.reading.toLowerCase();
        userCorrect = normalizedAnswer === correct;
      }
    }
    
    setIsCorrect(userCorrect);
    setCorrectAnswer(correct);
    setShowResult(true);
    
    if (userCorrect) {
      setCorrectCount(correctCount + 1);
    } else {
      setIncorrectCount(incorrectCount + 1);
    }
  };

  const handleNext = () => {
    setAnswer('');
    setShowResult(false);
    
    if (currentIndex < quizItems.length - 1) {
      setCurrentIndex(currentIndex + 1);
    } else {
      completeLesson();
    }
  };

  const completeLesson = async () => {
    try {
      const response = await fetch('/api/lessons/complete', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          items: lessons.map((lesson: LessonItem) => ({ type: lesson.type, id: lesson.id })),
        }),
      });

      if (response.ok) {
        setCompleted(true);
      }
    } catch (error) {
      console.error('Failed to complete lessons:', error);
    }
  };

  if (loading || !user || loadingLessons) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-2xl">Loading...</div>
      </div>
    );
  }

  if (lessons.length === 0) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-tanuki-50 to-tanuki-100">
        <Navbar />
        <div className="max-w-4xl mx-auto py-12 px-4 text-center">
          <h1 className="text-3xl font-bold text-gray-900 mb-4">No Lessons Available</h1>
          <p className="text-gray-600 mb-8">
            There are no lesson items ready right now.
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
    return (
      <div className="min-h-screen bg-gradient-to-br from-tanuki-50 to-tanuki-100">
        <Navbar />
        <div className="max-w-4xl mx-auto py-12 px-4 text-center">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">Great Job! 🎉</h1>
          <p className="text-xl text-gray-600 mb-8">
            You learned {lessons.length} new items. They are now available for reviews!
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

  // Presentation mode
  if (mode === 'presentation') {
    const currentLesson = lessons[currentIndex];
    const isKanji = currentLesson.type === 'kanji';
    const headerClass = isKanji
      ? 'bg-gradient-to-br from-fuchsia-700 via-pink-600 to-rose-500'
      : 'bg-gradient-to-br from-violet-700 via-purple-600 to-indigo-500';

    return (
      <div className="min-h-screen bg-gradient-to-br from-tanuki-50 to-tanuki-100">
        <Navbar />
        
        <div className="max-w-4xl mx-auto py-12 px-4">
          {/* Progress */}
          <div className="mb-8">
            <div className="flex justify-between text-sm text-gray-600 mb-2">
              <span>Lesson {currentIndex + 1} of {lessons.length}</span>
              <span>{Math.round(((currentIndex) / lessons.length) * 100)}% Complete</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div
                className="bg-tanuki-500 h-2 rounded-full transition-all"
                style={{ width: `${(currentIndex / lessons.length) * 100}%` }}
              />
            </div>
          </div>

          {/* Lesson Card */}
          <div className="bg-white rounded-lg shadow-2xl overflow-hidden">
            <div className={`${headerClass} text-white py-12 text-center shadow-xl`}>
              <span className="inline-block px-4 py-1 bg-white bg-opacity-20 rounded-full text-sm font-medium mb-4">
                {isKanji ? 'Kanji' : 'Vocabulary'}
              </span>
              <div className="text-9xl font-bold mb-4 drop-shadow-[0_4px_14px_rgba(0,0,0,0.35)]">
                {isKanji ? currentLesson.data.character : currentLesson.data.word}
              </div>
            </div>

            <div className="p-12 text-center">
              <div className="text-3xl font-semibold text-gray-800 mb-6">
                {currentLesson.data.meaning}
              </div>

              <div className="space-y-3 mb-8">
                {isKanji ? (
                  <>
                    {currentLesson.data.on_reading && (
                      <div className="text-xl text-gray-600">
                        <span className="font-medium">On:</span> {currentLesson.data.on_reading}
                      </div>
                    )}
                    {currentLesson.data.kun_reading && (
                      <div className="text-xl text-gray-600">
                        <span className="font-medium">Kun:</span> {currentLesson.data.kun_reading}
                      </div>
                    )}
                  </>
                ) : (
                  <div className="text-2xl text-gray-600">
                    {currentLesson.data.reading}
                  </div>
                )}
              </div>

              {currentIndex < lessons.length - 1 ? (
                <button
                  onClick={() => setCurrentIndex(currentIndex + 1)}
                  className="bg-tanuki-500 hover:bg-tanuki-600 text-white px-8 py-4 rounded-md text-lg font-medium"
                >
                  Next
                </button>
              ) : (
                <button
                  onClick={startQuiz}
                  className="bg-green-500 hover:bg-green-600 text-white px-8 py-4 rounded-md text-lg font-medium"
                >
                  Start Quiz
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Quiz mode
  const currentQuiz = quizItems[currentIndex];
  const isKanji = currentQuiz.type === 'kanji';
  const isMeaningQuestion = currentQuiz.question_type === 'meaning';
  const promptText = isKanji ? currentQuiz.data.character : currentQuiz.data.word;
  const headerClass = isMeaningQuestion
    ? 'bg-gradient-to-br from-violet-700 via-purple-600 to-indigo-500'
    : 'bg-gradient-to-br from-fuchsia-700 via-pink-600 to-rose-500';
  
  let inputBorderColor = 'border-gray-300';
  if (showResult) {
    inputBorderColor = isCorrect ? 'border-green-500 bg-green-50' : 'border-red-500 bg-red-50';
  }

  return (
    <div className="min-h-screen bg-gray-100">
      <Navbar />
      
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

      <div className="bg-gray-200 py-3">
        <div className="max-w-4xl mx-auto px-4 text-center">
          <span className="text-sm font-medium text-gray-700">
            {isKanji ? 'Kanji' : 'Vocabulary'} {isMeaningQuestion ? 'Meaning' : 'Reading'}
          </span>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 py-8">
        <form onSubmit={handleSubmit}>
          <input
            ref={inputRef}
            type="text"
            value={answer}
            onChange={(e) => !showResult && setAnswer(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                e.preventDefault();
                if (showResult) {
                  handleNext();
                } else if (answer.trim()) {
                  handleSubmit();
                }
              }
            }}
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

          {!showResult && (
            <div className="text-center mt-6 text-gray-600">
              Press Enter to submit • Quiz {currentIndex + 1} of {quizItems.length}
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
                Press <kbd className="px-2 py-1 bg-gray-200 rounded">Enter</kbd> for next
              </div>
            </div>
          )}
        </form>
      </div>

      <div className="fixed bottom-0 left-0 right-0 bg-white shadow-lg">
        <div className="max-w-4xl mx-auto px-4 py-3 flex items-center justify-between">
          <span className="text-sm text-gray-600">
            {currentIndex + 1} / {quizItems.length}
          </span>
          <span className="text-sm space-x-4">
            <span className="text-green-600">✓ {correctCount}</span>
            <span className="text-red-600">✗ {incorrectCount}</span>
          </span>
        </div>
        <div className="w-full bg-gray-200 h-1">
          <div
            className="bg-tanuki-500 h-1 transition-all"
            style={{ width: `${((currentIndex + 1) / quizItems.length) * 100}%` }}
          />
        </div>
      </div>
    </div>
  );
}

export default function LessonsPage() {
  return (
    <AuthProvider>
      <LessonsContent />
    </AuthProvider>
  );
}
