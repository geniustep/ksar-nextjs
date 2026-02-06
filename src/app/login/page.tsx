'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import Input from '@/components/ui/Input';
import Button from '@/components/ui/Button';
import { ApiError } from '@/lib/api';

export default function LoginPage() {
  const { login, user } = useAuth();
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
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

  // Redirect after login
  React.useEffect(() => {
    if (user) {
      switch (user.role) {
        case 'admin':
          router.push('/admin');
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
    <div className="min-h-screen bg-neutral-light flex flex-col items-center justify-center py-12 px-4">
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
          <form onSubmit={handleSubmit} className="space-y-5">
            {error && (
              <div className="bg-danger-500/5 border border-danger-500/20 text-danger-500 text-sm p-3 rounded-xl">
                {error}
              </div>
            )}

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

          <div className="mt-6 pt-5 border-t border-gray-100 space-y-3 text-center">
            <p className="text-sm text-gray-500">
              مواطن يريد تقديم طلب؟
            </p>
            <Link
              href="/citizen-auth"
              className="block text-sm text-accent-500 hover:text-accent-600 font-semibold"
            >
              ادخل برقم هاتفك مباشرة
            </Link>
          </div>
        </div>

        {/* Demo accounts */}
        <div className="mt-6 bg-primary-50 border border-primary-100 rounded-2xl p-4 text-sm">
          <p className="font-medium text-primary-800 mb-2">حسابات تجريبية:</p>
          <div className="space-y-1 text-primary-700">
            <p>المدير: admin@ksar.ma / admin123</p>
            <p>المؤسسة: org@ksar.ma / org123</p>
            <p>المواطن: citizen@example.ma / citizen123</p>
          </div>
        </div>
      </div>
    </div>
  );
}
