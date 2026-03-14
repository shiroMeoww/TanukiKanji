'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { AuthProvider, useAuth } from '@/components/AuthContext';
import Navbar from '@/components/Navbar';

interface LevelKanji {
  id: number;
  character: string;
  meaning: string;
  on_reading: string | null;
  kun_reading: string | null;
  level: number;
}

function LevelContent() {
  const { user, token, loading } = useAuth();
  const router = useRouter();
  const params = useParams<{ level: string }>();
  const level = Number(params.level);

  const [kanji, setKanji] = useState<LevelKanji[]>([]);
  const [isLevelUnlocked, setIsLevelUnlocked] = useState(false);
  const [loadingLevel, setLoadingLevel] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!loading && !user) {
      router.push('/login');
      return;
    }

    if (!loading && user && token) {
      fetchLevelData();
    }
  }, [loading, user, token, level]);

  const fetchLevelData = async () => {
    try {
      const response = await fetch(`/api/levels/${level}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to load level data');
      }

      setKanji(data.kanji || []);
      setIsLevelUnlocked(Boolean(data.unlocked));
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load level data');
    } finally {
      setLoadingLevel(false);
    }
  };

  if (loading || loadingLevel || !user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-2xl">Loading...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-tanuki-50 to-tanuki-100">
      <Navbar />

      <div className="max-w-6xl mx-auto py-10 px-4 sm:px-6 lg:px-8">
        <div className="bg-white rounded-xl shadow-lg p-8 mb-8">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div>
              <h1 className="text-4xl font-bold text-gray-900">Level {level}</h1>
              <p className="text-gray-600 mt-2">
                Zestaw znakow (kanji) dla poziomu {level}.
              </p>
            </div>
            <div
              className={`inline-flex items-center px-4 py-2 rounded-full text-sm font-medium ${
                isLevelUnlocked
                  ? 'bg-green-100 text-green-700'
                  : 'bg-gray-200 text-gray-600'
              }`}
            >
              {isLevelUnlocked ? 'Unlocked' : 'Locked'}
            </div>
          </div>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 p-4 rounded-lg mb-6">
            {error}
          </div>
        )}

        {!error && (
          <>
            {kanji.length === 0 ? (
              <div className="bg-white rounded-xl shadow p-8 text-center text-gray-600">
                Brak znakow dla tego poziomu.
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
                {kanji.map((item: LevelKanji) => (
                  <div
                    key={item.id}
                    className="bg-white rounded-xl shadow hover:shadow-lg transition-shadow border border-gray-100 overflow-hidden"
                  >
                    <div className="bg-gradient-to-br from-fuchsia-700 via-pink-600 to-rose-500 text-white p-6 text-center">
                      <div className="text-7xl font-bold drop-shadow-[0_4px_12px_rgba(0,0,0,0.35)]">
                        {item.character}
                      </div>
                    </div>
                    <div className="p-5 space-y-3">
                      <div>
                        <div className="text-xs uppercase tracking-wide text-gray-500">Meaning</div>
                        <div className="text-lg font-semibold text-gray-900">{item.meaning}</div>
                      </div>
                      <div>
                        <div className="text-xs uppercase tracking-wide text-gray-500">On reading</div>
                        <div className="text-gray-800">{item.on_reading || '-'}</div>
                      </div>
                      <div>
                        <div className="text-xs uppercase tracking-wide text-gray-500">Kun reading</div>
                        <div className="text-gray-800">{item.kun_reading || '-'}</div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}

export default function LevelPage() {
  return (
    <AuthProvider>
      <LevelContent />
    </AuthProvider>
  );
}
