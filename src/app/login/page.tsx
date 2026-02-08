'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import Input from '@/components/ui/Input';
import Button from '@/components/ui/Button';
import { ApiError, inspectorApi } from '@/lib/api';
import { cn } from '@/lib/utils';

type LoginMode = 'email' | 'phone';

export default function LoginPage() {
  const { login, loginAsInspector, user } = useAuth();
  const router = useRouter();

  const [mode, setMode] = useState<LoginMode>('email');

  // Email login
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  // Phone login (inspector)
  const [phone, setPhone] = useState('');
  const [code, setCode] = useState('');

  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleEmailLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      await login({ email, password });
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

  const handlePhoneLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const response = await inspectorApi.login({ phone, code });
      loginAsInspector(response);
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
    }
  }, [user, router]);

  return (
    <div className="min-h-screen bg-neutral-light flex flex-col items-center justify-center py-12 px-4" dir="rtl">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <Link href="/" className="inline-flex flex-col items-center gap-2">
            <Image
              src="/logo.png"
              alt="كرامة قصر"
              width={70}
              height={70}
              className="object-contain"
            />
            <span className="text-2xl font-bold text-primary-600 font-cairo">كرامة قصر</span>
            <span className="text-xs text-accent-500 font-inter tracking-wider">KKSAR.MA</span>
          </Link>
          <h1 className="text-2xl font-bold text-neutral-dark mt-6">تسجيل الدخول</h1>
          <p className="text-gray-500 mt-2">أدخل بياناتك للوصول إلى حسابك</p>
        </div>

        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8">
          {/* Mode Tabs */}
          <div className="flex bg-gray-100 rounded-xl p-1 mb-6">
            <button
              type="button"
              onClick={() => { setMode('email'); setError(''); }}
              className={cn(
                'flex-1 py-2.5 text-sm font-medium rounded-lg transition-all',
                mode === 'email'
                  ? 'bg-white text-primary-700 shadow-sm'
                  : 'text-gray-500 hover:text-gray-700'
              )}
            >
              بريد إلكتروني
            </button>
            <button
              type="button"
              onClick={() => { setMode('phone'); setError(''); }}
              className={cn(
                'flex-1 py-2.5 text-sm font-medium rounded-lg transition-all',
                mode === 'phone'
                  ? 'bg-white text-primary-700 shadow-sm'
                  : 'text-gray-500 hover:text-gray-700'
              )}
            >
              رقم الهاتف (مراقب)
            </button>
          </div>

          {/* Error */}
          {error && (
            <div className="bg-danger-500/5 border border-danger-500/20 text-danger-500 text-sm p-3 rounded-xl mb-5">
              {error}
            </div>
          )}

          {/* Email Login Form */}
          {mode === 'email' && (
            <form onSubmit={handleEmailLogin} className="space-y-5">
              <Input
                label="البريد الإلكتروني"
                type="email"
                placeholder="example@email.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                dir="ltr"
              />

              <Input
                label="كلمة المرور"
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                dir="ltr"
              />

              <Button type="submit" className="w-full" loading={loading}>
                دخول
              </Button>
            </form>
          )}

          {/* Phone Login Form (Inspector) */}
          {mode === 'phone' && (
            <form onSubmit={handlePhoneLogin} className="space-y-5">
              <Input
                label="رقم الهاتف"
                type="tel"
                placeholder="06XXXXXXXX"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                required
                dir="ltr"
              />

              <Input
                label="كود الدخول"
                type="text"
                placeholder="XXXXXX"
                value={code}
                onChange={(e) => setCode(e.target.value)}
                required
                dir="ltr"
                maxLength={6}
              />

              <Button type="submit" className="w-full" loading={loading}>
                دخول
              </Button>

              <p className="text-xs text-gray-400 text-center">
                كود الدخول يُقدم من الإدارة
              </p>
            </form>
          )}

          <div className="mt-6 pt-5 border-t border-gray-100 text-center space-y-3">
            <div>
              <p className="text-sm text-gray-500 mb-1">مواطن يريد تقديم طلب؟</p>
              <Link
                href="/citizen/new-request"
                className="block text-sm text-accent-500 hover:text-accent-600 font-semibold"
              >
                ادخل برقم هاتفك مباشرة
              </Link>
            </div>
            <div>
              <p className="text-sm text-gray-500 mb-1">مؤسسة أو جمعية؟</p>
              <div className="flex items-center justify-center gap-3">
                <Link
                  href="/org-auth"
                  className="text-sm text-primary-500 hover:text-primary-600 font-semibold"
                >
                  دخول المؤسسات
                </Link>
                <span className="text-gray-300">|</span>
                <Link
                  href="/org-register"
                  className="text-sm text-green-600 hover:text-green-700 font-semibold"
                >
                  إنشاء مؤسسة جديدة
                </Link>
              </div>
            </div>
          </div>
        </div>

        {/* Demo accounts */}
        {/* <div className="mt-6 bg-primary-50 border border-primary-100 rounded-2xl p-4 text-sm">
          <p className="font-medium text-primary-800 mb-2">حسابات تجريبية:</p>
          <div className="space-y-1 text-primary-700">
            <p>المدير: admin@ksar.ma / admin123</p>
            <p>المؤسسة: org@ksar.ma / org123</p>
            <p>المواطن: citizen@example.ma / citizen123</p>
          </div>
        </div> */}
      </div>
    </div>
  );
}
