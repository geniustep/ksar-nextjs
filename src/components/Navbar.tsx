'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';

export default function Navbar() {
  const { user, isAuthenticated, logout } = useAuth();
  const router = useRouter();
  const [menuOpen, setMenuOpen] = useState(false);

  const handleLogout = () => {
    logout();
    router.push('/');
  };

  const getDashboardLink = () => {
    if (!user) return '/login';
    switch (user.role) {
      case 'admin':
        return '/admin';
      case 'inspector':
        return '/inspector';
      case 'organization':
        return '/org/requests';
      case 'citizen':
        return '/citizen';
      default:
        return '/';
    }
  };

  return (
    <nav className="bg-white/95 backdrop-blur-sm border-b border-gray-100 sticky top-0 z-40">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          <div className="flex items-center gap-8">
            <Link href="/" className="flex items-center gap-3">
              <Image
                src="/logo.png"
                alt="كرامة قصر"
                width={50}
                height={50}
                className="object-contain"
              />
              <div className="flex flex-col">
                <span className="text-lg font-bold text-primary-600 font-cairo leading-tight">كرامة قصر</span>
                <span className="text-[10px] text-accent-500 font-inter tracking-widest">KKSAR.MA</span>
              </div>
            </Link>

            <div className="hidden md:flex items-center gap-1">
              <Link href="/" className="text-sm text-gray-600 hover:text-primary-600 transition-colors px-3 py-2 rounded-lg hover:bg-primary-50">
                الرئيسية
              </Link>
              <Link href="/about" className="text-sm text-gray-600 hover:text-primary-600 transition-colors px-3 py-2 rounded-lg hover:bg-primary-50">
                من نحن
              </Link>
              <Link href="/org" className="text-sm text-gray-600 hover:text-primary-600 transition-colors px-3 py-2 rounded-lg hover:bg-primary-50">
                المواكبة الإنسانية
              </Link>
            </div>
          </div>

          <div className="hidden md:flex items-center gap-3">
            {isAuthenticated && user ? (
              <>
                <Link
                  href={getDashboardLink()}
                  className="text-sm text-gray-600 hover:text-primary-600 transition-colors px-3 py-2 rounded-lg hover:bg-primary-50"
                >
                  لوحة التحكم
                </Link>
                <span className="text-sm text-gray-300">|</span>
                <span className="text-sm text-gray-600">{user.full_name}</span>
                <button
                  onClick={handleLogout}
                  className="text-sm text-danger-500 hover:text-danger-600 transition-colors"
                >
                  خروج
                </button>
              </>
            ) : (
              <>
                <Link
                  href="/login"
                  className="text-sm px-4 py-2 text-primary-600 hover:bg-primary-50 rounded-lg transition-colors font-medium"
                >
                  دخول
                </Link>
                <Link
                  href="/citizen/new-request"
                  className="text-sm px-5 py-2.5 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors font-medium shadow-sm"
                >
                  تسجيل وضع
                </Link>
              </>
            )}
          </div>

          {/* Mobile menu button */}
          <div className="md:hidden flex items-center">
            <button
              onClick={() => setMenuOpen(!menuOpen)}
              className="text-gray-600 hover:text-gray-900 p-2"
            >
              <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                {menuOpen ? (
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                ) : (
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                )}
              </svg>
            </button>
          </div>
        </div>
      </div>

      {/* Mobile menu */}
      {menuOpen && (
        <div className="md:hidden border-t border-gray-100 bg-white">
          <div className="px-4 py-3 space-y-1">
            <Link href="/" className="block text-sm text-gray-600 py-2.5 px-3 rounded-lg hover:bg-primary-50" onClick={() => setMenuOpen(false)}>
              الرئيسية
            </Link>
            <Link href="/about" className="block text-sm text-gray-600 py-2.5 px-3 rounded-lg hover:bg-primary-50" onClick={() => setMenuOpen(false)}>
              من نحن
            </Link>
            <Link href="/org" className="block text-sm text-gray-600 py-2.5 px-3 rounded-lg hover:bg-primary-50" onClick={() => setMenuOpen(false)}>
              المواكبة الإنسانية
            </Link>
            {isAuthenticated && user ? (
              <>
                <Link href={getDashboardLink()} className="block text-sm text-gray-600 py-2.5 px-3 rounded-lg hover:bg-primary-50" onClick={() => setMenuOpen(false)}>
                  لوحة التحكم
                </Link>
                <button onClick={handleLogout} className="block text-sm text-danger-500 py-2.5 px-3 rounded-lg hover:bg-red-50 w-full text-right">
                  خروج
                </button>
              </>
            ) : (
              <>
                <Link href="/login" className="block text-sm text-primary-600 py-2.5 px-3 rounded-lg hover:bg-primary-50 font-medium" onClick={() => setMenuOpen(false)}>
                  دخول
                </Link>
                <Link href="/citizen/new-request" className="block text-sm bg-primary-600 text-white py-2.5 px-3 rounded-lg text-center font-medium" onClick={() => setMenuOpen(false)}>
                  طلب مساعدة
                </Link>
              </>
            )}
          </div>
        </div>
      )}
    </nav>
  );
}
