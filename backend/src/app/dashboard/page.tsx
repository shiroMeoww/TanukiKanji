'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { AuthProvider, useAuth } from '@/components/AuthContext';
import Navbar from '@/components/Navbar';

interface Stats {
  total_items: number;
  apprentice: number;
  guru: number;
  master: number;
  lessons_available: number;
  reviews_available: number;
  next_review_date: string | null;
  kanji_total: number;
  kanji_learned: number;
  vocab_total: number;
  vocab_learned: number;
}

interface ItemSpread {
  apprentice: { radicals: number; kanji: number; vocabulary: number };
  guru: { radicals: number; kanji: number; vocabulary: number };
  master: { radicals: number; kanji: number; vocabulary: number };
  enlightened: { radicals: number; kanji: number; vocabulary: number };
  burned: { radicals: number; kanji: number; vocabulary: number };
}

function DashboardContent() {
  const { user, token, loading } = useAuth();
  const router = useRouter();
  const [stats, setStats] = useState<Stats | null>(null);
  const [itemSpread, setItemSpread] = useState<ItemSpread | null>(null);
  const [loadingStats, setLoadingStats] = useState(true);

  useEffect(() => {
    if (!loading && !user) {
      router.push('/login');
    }
  }, [user, loading, router]);

  useEffect(() => {
    if (token) {
      fetchStats();
    }
  }, [token]);

  useEffect(() => {
    if (!token) return;

    const intervalId = setInterval(async () => {
      try {
        await fetch('/api/lessons/unlock', {
          method: 'POST',
          headers: { 'Authorization': `Bearer ${token}` },
        });
        // Refresh stats after attempting unlock
        fetchStats();
      } catch (err) {
        console.error('Periodic unlock failed:', err);
      }
    }, 5 * 60 * 1000); // 5 minutes

    return () => clearInterval(intervalId);
  }, [token]);

  const fetchStats = async () => {
    try {
      const response = await fetch('/api/user/stats', {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        setStats(data.stats);
        setItemSpread(data.item_spread);

        // Auto-unlock: if there are currently no lessons available, try unlocking new items
        // The unlock endpoint will respect daily limits and return how many were unlocked.
        if (data.stats.lessons_available === 0) {
          try {
            const unlockResp = await fetch('/api/lessons/unlock', {
              method: 'POST',
              headers: {
                'Authorization': `Bearer ${token}`,
              },
            });

            if (unlockResp.ok) {
              const unlockData = await unlockResp.json();
              if (unlockData.unlocked && unlockData.unlocked > 0) {
                // If we unlocked items, refresh stats once
                const refreshed = await fetch('/api/user/stats', {
                  headers: { 'Authorization': `Bearer ${token}` },
                });
                if (refreshed.ok) {
                  const refreshedData = await refreshed.json();
                  setStats(refreshedData.stats);
                  setItemSpread(refreshedData.item_spread);
                }
              }
            }
          } catch (err) {
            console.error('Auto-unlock failed:', err);
          }
        }
      }
    } catch (error) {
      console.error('Failed to fetch stats:', error);
    } finally {
      setLoadingStats(false);
    }
  };

  if (loading || !user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-2xl">Loading...</div>
      </div>
    );
  }

  const kanjiProgress = stats ? Math.round((stats.kanji_learned / stats.kanji_total) * 100) : 0;
  const vocabProgress = stats ? Math.round((stats.vocab_learned / stats.vocab_total) * 100) : 0;
  const spreadValue = (value: number | undefined) => value ?? 0;

  return (
    <div className="min-h-screen bg-gradient-to-br from-tanuki-50 to-tanuki-100">
      <Navbar />
      
      <div className="max-w-7xl mx-auto py-12 px-4 sm:px-6 lg:px-8">
        {/* Lessons and Reviews */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-12">
          <div className="bg-white rounded-lg shadow-lg p-8">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-2xl font-bold text-gray-900">Lessons</h2>
              {stats && (
                <span className="text-4xl font-bold text-blue-600">
                  {stats.lessons_available}
                </span>
              )}
            </div>
            <p className="text-gray-600 mb-6">
              Learn new kanji and vocabulary
            </p>
            {stats && stats.lessons_available > 0 ? (
              <Link
                href="/lessons"
                className="block w-full bg-blue-500 hover:bg-blue-600 text-white text-center py-3 px-4 rounded-md font-medium"
              >
                Start Lessons
              </Link>
            ) : (
              <div className="text-center text-gray-500 py-3">
                No new lessons available
              </div>
            )}
          </div>

          <div className="bg-white rounded-lg shadow-lg p-8">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-2xl font-bold text-gray-900">Reviews</h2>
              {stats && (
                <span className="text-4xl font-bold text-kanji-DEFAULT">
                  {stats.reviews_available}
                </span>
              )}
            </div>
            <p className="text-gray-600 mb-6">
              Review your learned items
            </p>
            {stats && stats.reviews_available > 0 ? (
              <Link
                href="/reviews"
                className="block w-full bg-gradient-to-r from-fuchsia-700 via-pink-600 to-rose-500 text-white text-center py-3 px-4 rounded-md font-medium shadow-lg shadow-pink-200 transition-transform hover:scale-[1.01]"
              >
                Start Reviews
              </Link>
            ) : (
              <div className="text-center text-gray-500 py-3">
                No reviews available
              </div>
            )}
          </div>
        </div>

        {/* Item Spread */}
        {itemSpread && (
          <div className="bg-white rounded-lg shadow-lg p-8 mb-8">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold text-gray-900">Item Spread</h2>
              <span className="inline-flex items-center gap-2 text-sm text-gray-700">
                <span className="w-4 h-4 rounded bg-kanji-DEFAULT"></span>
                Kanji
              </span>
            </div>

            <div className="space-y-4">
              {/* Apprentice */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3 w-40">
                  <span className="text-2xl">🌱</span>
                  <div>
                    <div className="font-medium">Apprentice</div>
                    <div className="text-xs text-gray-500">{spreadValue(itemSpread.apprentice.kanji)} total</div>
                  </div>
                </div>
                <div className="flex gap-2">
                  <span className="bg-kanji-DEFAULT text-white px-4 py-1 rounded-full text-sm font-medium min-w-[3rem] text-center">
                    {spreadValue(itemSpread.apprentice.kanji)}
                  </span>
                </div>
              </div>

              {/* Guru */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3 w-40">
                  <span className="text-2xl">🔮</span>
                  <div>
                    <div className="font-medium">Guru</div>
                    <div className="text-xs text-gray-500">{spreadValue(itemSpread.guru.kanji)} total</div>
                  </div>
                </div>
                <div className="flex gap-2">
                  <span className="bg-kanji-DEFAULT text-white px-4 py-1 rounded-full text-sm font-medium min-w-[3rem] text-center">
                    {spreadValue(itemSpread.guru.kanji)}
                  </span>
                </div>
              </div>

              {/* Master */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3 w-40">
                  <span className="text-2xl">⚔️</span>
                  <div>
                    <div className="font-medium">Master</div>
                    <div className="text-xs text-gray-500">{spreadValue(itemSpread.master.kanji)} total</div>
                  </div>
                </div>
                <div className="flex gap-2">
                  <span className="bg-kanji-DEFAULT text-white px-4 py-1 rounded-full text-sm font-medium min-w-[3rem] text-center">
                    {spreadValue(itemSpread.master.kanji)}
                  </span>
                </div>
              </div>

              {/* Enlightened */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3 w-40">
                  <span className="text-2xl">✨</span>
                  <div>
                    <div className="font-medium">Enlightened</div>
                    <div className="text-xs text-gray-500">{spreadValue(itemSpread.enlightened.kanji)} total</div>
                  </div>
                </div>
                <div className="flex gap-2">
                  <span className="bg-kanji-DEFAULT text-white px-4 py-1 rounded-full text-sm font-medium min-w-[3rem] text-center">
                    {spreadValue(itemSpread.enlightened.kanji)}
                  </span>
                </div>
              </div>

              {/* Burned */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3 w-40">
                  <span className="text-2xl">🔥</span>
                  <div>
                    <div className="font-medium">Burned</div>
                    <div className="text-xs text-gray-500">{spreadValue(itemSpread.burned.kanji)} total</div>
                  </div>
                </div>
                <div className="flex gap-2">
                  <span className="bg-kanji-DEFAULT text-white px-4 py-1 rounded-full text-sm font-medium min-w-[3rem] text-center">
                    {spreadValue(itemSpread.burned.kanji)}
                  </span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Progress Bars */}
        {stats && (
          <div className="bg-white rounded-lg shadow-lg p-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-6">Progress</h2>
            
            <div className="space-y-6">
              {/* Kanji Progress */}
              <div>
                <div className="flex justify-between text-sm text-gray-600 mb-2">
                  <span className="font-medium">Kanji Progression</span>
                  <span>{kanjiProgress}%</span>
                </div>
                <div className="relative w-full bg-gray-200 rounded-full h-6">
                  <div
                    className="bg-gradient-to-r from-kanji-DEFAULT to-kanji-dark h-6 rounded-full transition-all duration-500"
                    style={{ width: `${kanjiProgress}%` }}
                  />
                  <div className="absolute inset-0 flex items-center justify-between px-3 text-xs font-medium">
                    <span className="text-white">0</span>
                    <span className={kanjiProgress > 50 ? 'text-white' : 'text-gray-700'}>
                      {stats.kanji_total}
                    </span>
                  </div>
                </div>
              </div>

              {/* Vocabulary Progress */}
              <div>
                <div className="flex justify-between text-sm text-gray-600 mb-2">
                  <span className="font-medium">Vocabulary Progression</span>
                  <span>{vocabProgress}%</span>
                </div>
                <div className="relative w-full bg-gray-200 rounded-full h-6">
                  <div
                    className="bg-gradient-to-r from-vocabulary-DEFAULT to-vocabulary-dark h-6 rounded-full transition-all duration-500"
                    style={{ width: `${vocabProgress}%` }}
                  />
                  <div className="absolute inset-0 flex items-center justify-between px-3 text-xs font-medium">
                    <span className="text-white">0</span>
                    <span className={vocabProgress > 50 ? 'text-white' : 'text-gray-700'}>
                      {stats.vocab_total}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {loadingStats && (
          <div className="text-center text-gray-500">Loading stats...</div>
        )}
      </div>
    </div>
  );
}

export default function DashboardPage() {
  return (
    <AuthProvider>
      <DashboardContent />
    </AuthProvider>
  );
}
