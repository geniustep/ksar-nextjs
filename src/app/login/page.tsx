'use client';

import React, { useState, useMemo } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { ApiError } from '@/lib/api';
import { cn } from '@/lib/utils';

type InputType = 'unknown' | 'email' | 'phone';

function detectInputType(value: string): InputType {
  const trimmed = value.trim();
  if (!trimmed) return 'unknown';
  if (trimmed.includes('@')) return 'email';
  // If starts with + or 0 and mostly digits
  const digits = trimmed.replace(/[\s\-\+]/g, '');
  if (/^\d{4,}$/.test(digits)) return 'phone';
  // Could be start of email
  if (/^[a-zA-Z0-9._-]+$/.test(trimmed)) return 'unknown';
  return 'unknown';
}

function getRoleLabel(role: string): string {
  switch (role) {
    case 'superadmin': return 'المدير العام';
    case 'admin': return 'الإدارة';
    case 'inspector': return 'المراقب';
    case 'organization': return 'المؤسسة';
    case 'citizen': return 'المواطن';
    default: return role;
  }
}

function getRoleIcon(role: string): React.ReactNode {
  switch (role) {
    case 'superadmin':
    case 'admin':
      return (
        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M9.594 3.94c.09-.542.56-.94 1.11-.94h2.593c.55 0 1.02.398 1.11.94l.213 1.281c.063.374.313.686.645.87.074.04.147.083.22.127.324.196.72.257 1.075.124l1.217-.456a1.125 1.125 0 011.37.49l1.296 2.247a1.125 1.125 0 01-.26 1.431l-1.003.827c-.293.24-.438.613-.431.992a6.759 6.759 0 010 .255c-.007.378.138.75.43.99l1.005.828c.424.35.534.954.26 1.43l-1.298 2.247a1.125 1.125 0 01-1.369.491l-1.217-.456c-.355-.133-.75-.072-1.076.124a6.57 6.57 0 01-.22.128c-.331.183-.581.495-.644.869l-.213 1.28c-.09.543-.56.941-1.11.941h-2.594c-.55 0-1.02-.398-1.11-.94l-.213-1.281c-.062-.374-.312-.686-.644-.87a6.52 6.52 0 01-.22-.127c-.325-.196-.72-.257-1.076-.124l-1.217.456a1.125 1.125 0 01-1.369-.49l-1.297-2.247a1.125 1.125 0 01.26-1.431l1.004-.827c.292-.24.437-.613.43-.992a6.932 6.932 0 010-.255c.007-.378-.138-.75-.43-.99l-1.004-.828a1.125 1.125 0 01-.26-1.43l1.297-2.247a1.125 1.125 0 011.37-.491l1.216.456c.356.133.751.072 1.076-.124.072-.044.146-.087.22-.128.332-.183.582-.495.644-.869l.214-1.281z" />
          <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
        </svg>
      );
    case 'inspector':
      return (
        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75m-3-7.036A11.959 11.959 0 013.598 6 11.99 11.99 0 003 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285z" />
        </svg>
      );
    case 'organization':
      return (
        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 21h19.5m-18-18v18m10.5-18v18m6-13.5V21M6.75 6.75h.75m-.75 3h.75m-.75 3h.75m3-6h.75m-.75 3h.75m-.75 3h.75M6.75 21v-3.375c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125V21M3 3h12m-.75 4.5H21m-3.75 3h.008v.008h-.008v-.008zm0 3h.008v.008h-.008v-.008zm0 3h.008v.008h-.008v-.008z" />
        </svg>
      );
    default:
      return (
        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z" />
        </svg>
      );
  }
}

export default function LoginPage() {
  const { unifiedLogin, user } = useAuth();
  const router = useRouter();

  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [redirecting, setRedirecting] = useState(false);
  const [loggedInRole, setLoggedInRole] = useState('');

  const inputType = useMemo(() => detectInputType(identifier), [identifier]);

  const placeholderText = useMemo(() => {
    if (inputType === 'email') return 'أكمل بريدك الإلكتروني...';
    if (inputType === 'phone') return 'أكمل رقم هاتفك...';
    return 'example@email.com أو 06XXXXXXXX';
  }, [inputType]);

  const passwordLabel = useMemo(() => {
    if (inputType === 'phone') return 'كود الدخول';
    return 'كلمة المرور';
  }, [inputType]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      await unifiedLogin({ identifier: identifier.trim(), password });
    } catch (err) {
      if (err instanceof ApiError) {
        setError(err.detail);
      } else {
        setError('خطأ في الاتصال بالخادم');
      }
      setLoading(false);
      return;
    }

    setLoading(false);
  };

  // Redirect after login
  React.useEffect(() => {
    if (user) {
      setRedirecting(true);
      setLoggedInRole(user.role);
      const timer = setTimeout(() => {
        switch (user.role) {
          case 'superadmin':
          case 'admin':
            router.push('/admin');
            break;
          case 'inspector':
            router.push('/inspector');
            break;
          case 'organization':
            router.push('/org/requests');
            break;
          case 'citizen':
            router.push('/citizen');
            break;
        }
      }, 1200);
      return () => clearTimeout(timer);
    }
  }, [user, router]);

  // Success screen
  if (redirecting && user) {
    return (
      <div className="min-h-screen bg-gradient-to-bl from-primary-600 via-primary-700 to-primary-950 flex items-center justify-center" dir="rtl">
        <div className="text-center animate-fade-in-up">
          <div className="inline-flex items-center justify-center w-20 h-20 bg-white/10 backdrop-blur-sm rounded-3xl mb-6 border border-white/20">
            <div className="text-white">
              {getRoleIcon(loggedInRole)}
            </div>
          </div>
          <h2 className="text-2xl font-bold text-white mb-2">
            مرحباً، {user.full_name}
          </h2>
          <p className="text-primary-200 mb-4">
            جاري التوجيه إلى لوحة {getRoleLabel(loggedInRole)}...
          </p>
          <div className="flex items-center justify-center gap-1.5">
            <span className="w-2 h-2 bg-accent-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
            <span className="w-2 h-2 bg-accent-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
            <span className="w-2 h-2 bg-accent-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex" dir="rtl">
      {/* Left Panel - Decorative */}
      <div className="hidden lg:flex lg:w-[480px] xl:w-[540px] bg-gradient-to-bl from-primary-600 via-primary-700 to-primary-950 relative overflow-hidden">
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-20 right-10 w-72 h-72 bg-accent-500 rounded-full blur-3xl" />
          <div className="absolute bottom-32 left-10 w-96 h-96 bg-primary-400 rounded-full blur-3xl" />
        </div>
        <div className="relative z-10 flex flex-col justify-between p-10 w-full">
          <div>
            <Link href="/" className="inline-flex items-center gap-3 group">
              <Image
                src="/logo.png"
                alt="كرامة قصر"
                width={48}
                height={48}
                className="object-contain brightness-0 invert opacity-90 group-hover:opacity-100 transition-opacity"
              />
              <div>
                <span className="text-xl font-bold text-white font-cairo block">كرامة قصر</span>
                <span className="text-xs text-accent-400 font-inter tracking-wider">KKSAR.MA</span>
              </div>
            </Link>
          </div>

          <div className="space-y-8">
            <div>
              <h2 className="text-3xl font-bold text-white leading-relaxed mb-4">
                منصة إنسانية
                <br />
                تحفظ الكرامة قبل المساعدة
              </h2>
              <p className="text-primary-200 leading-relaxed text-base">
                جسر آمن بين من يحتاج ومن يُعين، بسرّية وكرامة تامة
              </p>
            </div>

            <div className="space-y-4">
              <div className="flex items-center gap-3 text-primary-200/80">
                <div className="flex items-center justify-center w-9 h-9 bg-white/10 rounded-xl flex-shrink-0">
                  <svg className="w-4.5 h-4.5 text-accent-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 10.5V6.75a4.5 4.5 0 10-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 002.25-2.25v-6.75a2.25 2.25 0 00-2.25-2.25H6.75a2.25 2.25 0 00-2.25 2.25v6.75a2.25 2.25 0 002.25 2.25z" />
                  </svg>
                </div>
                <span className="text-sm">سرية تامة وحماية البيانات</span>
              </div>
              <div className="flex items-center gap-3 text-primary-200/80">
                <div className="flex items-center justify-center w-9 h-9 bg-white/10 rounded-xl flex-shrink-0">
                  <svg className="w-4.5 h-4.5 text-accent-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <span className="text-sm">نظام موحد للإدارة والمراقبة والمؤسسات</span>
              </div>
              <div className="flex items-center gap-3 text-primary-200/80">
                <div className="flex items-center justify-center w-9 h-9 bg-white/10 rounded-xl flex-shrink-0">
                  <svg className="w-4.5 h-4.5 text-accent-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M21 8.25c0-2.485-2.099-4.5-4.688-4.5-1.935 0-3.597 1.126-4.312 2.733-.715-1.607-2.377-2.733-4.313-2.733C5.1 3.75 3 5.765 3 8.25c0 7.22 9 12 9 12s9-4.78 9-12z" />
                  </svg>
                </div>
                <span className="text-sm">لأن الظرف لا يُسقط الكرامة</span>
              </div>
            </div>
          </div>

          <p className="text-primary-300/50 text-xs">
            كرامة قصر &copy; {new Date().getFullYear()}
          </p>
        </div>
      </div>

      {/* Right Panel - Login Form */}
      <div className="flex-1 bg-gray-50 flex flex-col">
        {/* Mobile Header */}
        <div className="lg:hidden bg-gradient-to-bl from-primary-600 via-primary-700 to-primary-950 px-6 py-8 text-center">
          <Link href="/" className="inline-flex flex-col items-center gap-2">
            <Image
              src="/logo.png"
              alt="كرامة قصر"
              width={56}
              height={56}
              className="object-contain brightness-0 invert opacity-90"
            />
            <span className="text-xl font-bold text-white font-cairo">كرامة قصر</span>
            <span className="text-xs text-accent-400 font-inter tracking-wider">KKSAR.MA</span>
          </Link>
        </div>

        <div className="flex-1 flex items-center justify-center px-4 py-8 sm:py-12">
          <div className="w-full max-w-[420px]">
            {/* Title */}
            <div className="mb-8">
              <h1 className="text-2xl font-bold text-neutral-dark mb-2">تسجيل الدخول</h1>
              <p className="text-gray-500 text-sm">
                أدخل بريدك الإلكتروني أو رقم هاتفك للوصول إلى حسابك
              </p>
            </div>

            {/* Login Card */}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 sm:p-8">
              {/* Input Type Indicator */}
              {identifier.trim() && inputType !== 'unknown' && (
                <div className={cn(
                  'flex items-center gap-2 text-xs font-medium px-3 py-1.5 rounded-lg mb-5 transition-all',
                  inputType === 'email'
                    ? 'bg-blue-50 text-blue-600'
                    : 'bg-emerald-50 text-emerald-600'
                )}>
                  {inputType === 'email' ? (
                    <>
                      <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M21.75 6.75v10.5a2.25 2.25 0 01-2.25 2.25h-15a2.25 2.25 0 01-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25m19.5 0v.243a2.25 2.25 0 01-1.07 1.916l-7.5 4.615a2.25 2.25 0 01-2.36 0L3.32 8.91a2.25 2.25 0 01-1.07-1.916V6.75" />
                      </svg>
                      <span>الدخول بالبريد الإلكتروني</span>
                    </>
                  ) : (
                    <>
                      <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 1.5H8.25A2.25 2.25 0 006 3.75v16.5a2.25 2.25 0 002.25 2.25h7.5A2.25 2.25 0 0018 20.25V3.75a2.25 2.25 0 00-2.25-2.25H13.5m-3 0V3h3V1.5m-3 0h3m-3 18.75h3" />
                      </svg>
                      <span>الدخول برقم الهاتف</span>
                    </>
                  )}
                </div>
              )}

              {/* Error */}
              {error && (
                <div className="flex items-start gap-3 bg-red-50 border border-red-100 text-red-600 text-sm p-4 rounded-xl mb-5">
                  <svg className="w-5 h-5 flex-shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0zm-9 3.75h.008v.008H12v-.008z" />
                  </svg>
                  <span>{error}</span>
                </div>
              )}

              <form onSubmit={handleSubmit} className="space-y-5">
                {/* Identifier Field */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">
                    البريد الإلكتروني أو رقم الهاتف
                  </label>
                  <div className="relative">
                    <div className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400">
                      {inputType === 'phone' ? (
                        <svg className="w-5 h-5 text-emerald-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 1.5H8.25A2.25 2.25 0 006 3.75v16.5a2.25 2.25 0 002.25 2.25h7.5A2.25 2.25 0 0018 20.25V3.75a2.25 2.25 0 00-2.25-2.25H13.5m-3 0V3h3V1.5m-3 0h3m-3 18.75h3" />
                        </svg>
                      ) : inputType === 'email' ? (
                        <svg className="w-5 h-5 text-blue-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M21.75 6.75v10.5a2.25 2.25 0 01-2.25 2.25h-15a2.25 2.25 0 01-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25m19.5 0v.243a2.25 2.25 0 01-1.07 1.916l-7.5 4.615a2.25 2.25 0 01-2.36 0L3.32 8.91a2.25 2.25 0 01-1.07-1.916V6.75" />
                        </svg>
                      ) : (
                        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z" />
                        </svg>
                      )}
                    </div>
                    <input
                      type="text"
                      value={identifier}
                      onChange={(e) => { setIdentifier(e.target.value); setError(''); }}
                      placeholder={placeholderText}
                      required
                      dir="ltr"
                      className={cn(
                        'w-full rounded-xl border border-gray-200 pr-11 pl-4 py-3 text-sm transition-all',
                        'focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20 focus:outline-none',
                        'placeholder:text-gray-400 text-gray-800',
                        error && 'border-red-300'
                      )}
                      autoComplete="username"
                    />
                  </div>
                </div>

                {/* Password Field */}
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <label className="block text-sm font-medium text-gray-700">
                      {passwordLabel}
                    </label>
                  </div>
                  <div className="relative">
                    <div className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400">
                      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 10.5V6.75a4.5 4.5 0 10-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 002.25-2.25v-6.75a2.25 2.25 0 00-2.25-2.25H6.75a2.25 2.25 0 00-2.25 2.25v6.75a2.25 2.25 0 002.25 2.25z" />
                      </svg>
                    </div>
                    <input
                      type={showPassword ? 'text' : 'password'}
                      value={password}
                      onChange={(e) => { setPassword(e.target.value); setError(''); }}
                      placeholder={inputType === 'phone' ? 'أدخل كود الدخول' : '••••••••'}
                      required
                      dir="ltr"
                      maxLength={inputType === 'phone' ? 20 : undefined}
                      className={cn(
                        'w-full rounded-xl border border-gray-200 pr-11 pl-11 py-3 text-sm transition-all',
                        'focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20 focus:outline-none',
                        'placeholder:text-gray-400 text-gray-800',
                        error && 'border-red-300'
                      )}
                      autoComplete="current-password"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
                      tabIndex={-1}
                    >
                      {showPassword ? (
                        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M3.98 8.223A10.477 10.477 0 001.934 12C3.226 16.338 7.244 19.5 12 19.5c.993 0 1.953-.138 2.863-.395M6.228 6.228A10.45 10.45 0 0112 4.5c4.756 0 8.773 3.162 10.065 7.498a10.523 10.523 0 01-4.293 5.774M6.228 6.228L3 3m3.228 3.228l3.65 3.65m7.894 7.894L21 21m-3.228-3.228l-3.65-3.65m0 0a3 3 0 10-4.243-4.243m4.242 4.242L9.88 9.88" />
                        </svg>
                      ) : (
                        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M2.036 12.322a1.012 1.012 0 010-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178z" />
                          <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                        </svg>
                      )}
                    </button>
                  </div>
                  {inputType === 'phone' && (
                    <p className="text-xs text-gray-400 mt-1.5">كود الدخول يُقدم من الإدارة</p>
                  )}
                </div>

                {/* Submit */}
                <button
                  type="submit"
                  disabled={loading}
                  className={cn(
                    'w-full py-3 rounded-xl font-semibold text-sm transition-all',
                    'bg-primary-600 text-white hover:bg-primary-700 active:bg-primary-800',
                    'focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2',
                    'disabled:opacity-60 disabled:cursor-not-allowed',
                    'shadow-sm hover:shadow-md'
                  )}
                >
                  {loading ? (
                    <span className="inline-flex items-center gap-2">
                      <svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                      </svg>
                      جاري الدخول...
                    </span>
                  ) : (
                    'تسجيل الدخول'
                  )}
                </button>
              </form>

              {/* Role hints */}
              <div className="mt-6 pt-5 border-t border-gray-100">
                {/* <p className="text-xs text-gray-400 text-center mb-3">من يمكنه الدخول من هنا؟</p> */}
                {/* <div className="grid grid-cols-2 gap-2">
                  {[
                    { label: 'المدير / الإدارة', icon: '🔧', hint: 'بريد + كلمة مرور' },
                    { label: 'المراقب', icon: '🛡️', hint: 'هاتف + كود' },
                    { label: 'المؤسسة', icon: '🏢', hint: 'هاتف + كود' },
                    { label: 'superadmin', icon: '⚙️', hint: 'بريد + كلمة مرور' },
                  ].map((item) => (
                    <div
                      key={item.label}
                      className="flex items-center gap-2 bg-gray-50 rounded-lg px-3 py-2"
                    >
                      <span className="text-base flex-shrink-0">{item.icon}</span>
                      <div className="min-w-0">
                        <p className="text-xs font-medium text-gray-700 truncate">{item.label}</p>
                        <p className="text-[10px] text-gray-400 truncate">{item.hint}</p>
                      </div>
                    </div>
                  ))}
                </div> */}
              </div>
            </div>

            {/* Extra links */}
            <div className="mt-6 space-y-3">
              <div className="bg-white rounded-xl border border-gray-100 p-4 flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-700">مواطن يريد تقديم طلب؟</p>
                  <p className="text-xs text-gray-400">بدون حساب، برقم الهاتف فقط</p>
                </div>
                <Link
                  href="/citizen/new-request"
                  className="text-sm text-accent-500 hover:text-accent-600 font-semibold whitespace-nowrap flex items-center gap-1"
                >
                  ادخل مباشرة
                  <svg className="w-4 h-4 rotate-180" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" />
                  </svg>
                </Link>
              </div>

              <div className="bg-white rounded-xl border border-gray-100 p-4 flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-700">جمعية أو مبادرة إنسانية جديدة؟</p>
                  <p className="text-xs text-gray-400">سجل وانتظر المصادقة</p>
                </div>
                <Link
                  href="/org-register"
                  className="text-sm text-green-600 hover:text-green-700 font-semibold whitespace-nowrap flex items-center gap-1"
                >
                  إنشاء حساب
                  <svg className="w-4 h-4 rotate-180" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" />
                  </svg>
                </Link>
              </div>
            </div>

            {/* Footer on mobile */}
            <p className="text-center text-xs text-gray-400 mt-6 lg:hidden">
              كرامة قصر &copy; {new Date().getFullYear()} - لأن الظرف لا يُسقط الكرامة
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
