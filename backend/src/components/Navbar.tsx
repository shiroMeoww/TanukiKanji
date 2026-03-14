'use client';

import Link from 'next/link';
import { useAuth } from './AuthContext';
import { useState } from 'react';

export default function Navbar() {
  const { user, logout } = useAuth();
  const [showLevelsDropdown, setShowLevelsDropdown] = useState(false);

  const levels = Array.from({ length: 60 }, (_, i) => i + 1);

  return (
    <nav className="bg-white shadow-md">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          <div className="flex items-center">
            <Link href="/" className="flex items-center">
              <span className="text-2xl font-bold text-tanuki-600">🦝 Tanuki Kanji</span>
            </Link>
            
            {user && (
              <div className="ml-10 flex items-baseline space-x-4">
                <Link
                  href="/dashboard"
                  className="text-gray-700 hover:text-tanuki-600 px-3 py-2 rounded-md text-sm font-medium"
                >
                  Dashboard
                </Link>
                
                {/* Levels Dropdown */}
                <div
                  className="relative"
                  onMouseEnter={() => setShowLevelsDropdown(true)}
                  onMouseLeave={() => setShowLevelsDropdown(false)}
                >
                  <button
                    className="text-gray-700 hover:text-tanuki-600 px-3 py-2 rounded-md text-sm font-medium"
                  >
                    Levels ▾
                  </button>
                  
                  {showLevelsDropdown && (
                    <div
                      className="absolute left-0 top-full w-80 bg-white rounded-md shadow-xl z-50 p-4"
                    >
                      <div className="grid grid-cols-10 gap-1">
                        {levels.map(level => (
                          <Link
                            key={level}
                            href={`/levels/${level}`}
                            className={`text-center py-2 rounded text-sm font-medium ${
                              level <= user.current_level
                                ? 'bg-tanuki-500 text-white hover:bg-tanuki-600'
                                : 'bg-gray-200 text-gray-600 hover:bg-gray-300'
                            }`}
                            onClick={() => setShowLevelsDropdown(false)}
                          >
                            {level}
                          </Link>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>

          <div className="flex items-center">
            {user ? (
              <div className="flex items-center space-x-4">
                <Link
                  href="/profile"
                  className="text-sm text-gray-700 hover:text-tanuki-600"
                >
                  Level {user.current_level} • {user.username}
                </Link>
                <button
                  onClick={logout}
                  className="bg-tanuki-500 hover:bg-tanuki-600 text-white px-4 py-2 rounded-md text-sm font-medium"
                >
                  Logout
                </button>
              </div>
            ) : (
              <div className="space-x-2">
                <Link
                  href="/login"
                  className="text-gray-700 hover:text-tanuki-600 px-4 py-2 rounded-md text-sm font-medium"
                >
                  Login
                </Link>
                <Link
                  href="/register"
                  className="bg-tanuki-500 hover:bg-tanuki-600 text-white px-4 py-2 rounded-md text-sm font-medium"
                >
                  Register
                </Link>
              </div>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
}
