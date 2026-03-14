'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { AuthProvider, useAuth } from '@/components/AuthContext';
import Navbar from '@/components/Navbar';

interface ItemSpread {
  apprentice: { radicals: number; kanji: number; vocabulary: number };
  guru: { radicals: number; kanji: number; vocabulary: number };
  master: { radicals: number; kanji: number; vocabulary: number };
  enlightened: { radicals: number; kanji: number; vocabulary: number };
  burned: { radicals: number; kanji: number; vocabulary: number };
}

function ProfileContent() {
  const { user, token, loading } = useAuth();
  const router = useRouter();
  const [itemSpread, setItemSpread] = useState<ItemSpread | null>(null);

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

  const fetchStats = async () => {
    try {
      const response = await fetch('/api/user/stats', {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        setItemSpread(data.item_spread);
      }
    } catch (error) {
      console.error('Failed to fetch stats:', error);
    }
  };

  if (loading || !user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-2xl">Loading...</div>
      </div>
    );
  }

  const getTotalForCategory = (category: keyof ItemSpread) => {
    if (!itemSpread) return 0;
    const cat = itemSpread[category];
    return cat.radicals + cat.kanji + cat.vocabulary;
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-tanuki-50 to-tanuki-100">
      <Navbar />
      
      <div className="max-w-4xl mx-auto py-12 px-4">
        {/* User Header */}
        <div className="bg-white rounded-lg shadow-lg p-8 mb-8 text-center">
          <div className="w-24 h-24 bg-tanuki-500 rounded-full mx-auto mb-4 flex items-center justify-center text-4xl">
            🦝
          </div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">{user.username}</h1>
          <p className="text-xl text-gray-600">Level {user.current_level}</p>
          <p className="text-sm text-gray-500 mt-2">
            Member since {new Date(user.created_at).toLocaleDateString()}
          </p>
        </div>

        {/* Item Spread */}
        {itemSpread && (
          <div className="bg-white rounded-lg shadow-lg p-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-6">Item Spread</h2>
            
            <div className="flex items-center justify-end gap-4 text-sm mb-6">
              <span className="flex items-center gap-1">
                <div className="w-4 h-4 rounded bg-radical-DEFAULT"></div>
                Radicals
              </span>
              <span className="flex items-center gap-1">
                <div className="w-4 h-4 rounded bg-kanji-DEFAULT"></div>
                Kanji
              </span>
              <span className="flex items-center gap-1">
                <div className="w-4 h-4 rounded bg-vocabulary-DEFAULT"></div>
                Vocabulary
              </span>
            </div>

            <div className="space-y-4">
              <div className="flex items-center justify-between border-b pb-4">
                <div className="flex items-center gap-3 w-48">
                  <span className="text-2xl">🌱</span>
                  <div>
                    <div className="font-semibold">Apprentice</div>
                    <div className="text-sm text-gray-500">{getTotalForCategory('apprentice')} total</div>
                  </div>
                </div>
                <div className="flex gap-2">
                  <span className="bg-radical-DEFAULT text-white px-4 py-2 rounded-full text-sm font-medium min-w-[3.5rem] text-center">
                    {itemSpread.apprentice.radicals}
                  </span>
                  <span className="bg-kanji-DEFAULT text-white px-4 py-2 rounded-full text-sm font-medium min-w-[3.5rem] text-center">
                    {itemSpread.apprentice.kanji}
                  </span>
                  <span className="bg-vocabulary-DEFAULT text-white px-4 py-2 rounded-full text-sm font-medium min-w-[3.5rem] text-center">
                    {itemSpread.apprentice.vocabulary}
                  </span>
                </div>
              </div>

              <div className="flex items-center justify-between border-b pb-4">
                <div className="flex items-center gap-3 w-48">
                  <span className="text-2xl">🔮</span>
                  <div>
                    <div className="font-semibold">Guru</div>
                    <div className="text-sm text-gray-500">{getTotalForCategory('guru')} total</div>
                  </div>
                </div>
                <div className="flex gap-2">
                  <span className="bg-radical-DEFAULT text-white px-4 py-2 rounded-full text-sm font-medium min-w-[3.5rem] text-center">
                    {itemSpread.guru.radicals}
                  </span>
                  <span className="bg-kanji-DEFAULT text-white px-4 py-2 rounded-full text-sm font-medium min-w-[3.5rem] text-center">
                    {itemSpread.guru.kanji}
                  </span>
                  <span className="bg-vocabulary-DEFAULT text-white px-4 py-2 rounded-full text-sm font-medium min-w-[3.5rem] text-center">
                    {itemSpread.guru.vocabulary}
                  </span>
                </div>
              </div>

              <div className="flex items-center justify-between border-b pb-4">
                <div className="flex items-center gap-3 w-48">
                  <span className="text-2xl">⚔️</span>
                  <div>
                    <div className="font-semibold">Master</div>
                    <div className="text-sm text-gray-500">{getTotalForCategory('master')} total</div>
                  </div>
                </div>
                <div className="flex gap-2">
                  <span className="bg-radical-DEFAULT text-white px-4 py-2 rounded-full text-sm font-medium min-w-[3.5rem] text-center">
                    {itemSpread.master.radicals}
                  </span>
                  <span className="bg-kanji-DEFAULT text-white px-4 py-2 rounded-full text-sm font-medium min-w-[3.5rem] text-center">
                    {itemSpread.master.kanji}
                  </span>
                  <span className="bg-vocabulary-DEFAULT text-white px-4 py-2 rounded-full text-sm font-medium min-w-[3.5rem] text-center">
                    {itemSpread.master.vocabulary}
                  </span>
                </div>
              </div>

              <div className="flex items-center justify-between border-b pb-4">
                <div className="flex items-center gap-3 w-48">
                  <span className="text-2xl">✨</span>
                  <div>
                    <div className="font-semibold">Enlightened</div>
                    <div className="text-sm text-gray-500">{getTotalForCategory('enlightened')} total</div>
                  </div>
                </div>
                <div className="flex gap-2">
                  <span className="bg-radical-DEFAULT text-white px-4 py-2 rounded-full text-sm font-medium min-w-[3.5rem] text-center">
                    {itemSpread.enlightened.radicals}
                  </span>
                  <span className="bg-kanji-DEFAULT text-white px-4 py-2 rounded-full text-sm font-medium min-w-[3.5rem] text-center">
                    {itemSpread.enlightened.kanji}
                  </span>
                  <span className="bg-vocabulary-DEFAULT text-white px-4 py-2 rounded-full text-sm font-medium min-w-[3.5rem] text-center">
                    {itemSpread.enlightened.vocabulary}
                  </span>
                </div>
              </div>

              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3 w-48">
                  <span className="text-2xl">🔥</span>
                  <div>
                    <div className="font-semibold">Burned</div>
                    <div className="text-sm text-gray-500">{getTotalForCategory('burned')} total</div>
                  </div>
                </div>
                <div className="flex gap-2">
                  <span className="bg-radical-DEFAULT text-white px-4 py-2 rounded-full text-sm font-medium min-w-[3.5rem] text-center">
                    {itemSpread.burned.radicals}
                  </span>
                  <span className="bg-kanji-DEFAULT text-white px-4 py-2 rounded-full text-sm font-medium min-w-[3.5rem] text-center">
                    {itemSpread.burned.kanji}
                  </span>
                  <span className="bg-vocabulary-DEFAULT text-white px-4 py-2 rounded-full text-sm font-medium min-w-[3.5rem] text-center">
                    {itemSpread.burned.vocabulary}
                  </span>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default function ProfilePage() {
  return (
    <AuthProvider>
      <ProfileContent />
    </AuthProvider>
  );
}
