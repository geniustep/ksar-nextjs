'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import Input from '@/components/ui/Input';
import Button from '@/components/ui/Button';
import { inspectorApi, ApiError } from '@/lib/api';

export default function InspectorAuthPage() {
  const { loginAsInspector, user } = useAuth();
  const router = useRouter();
  const [phone, setPhone] = useState('');
  const [code, setCode] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
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
    if (user && user.role === 'inspector') {
      router.push('/inspector');
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
          <h1 className="text-2xl font-bold text-neutral-dark mt-6">دخول المراقب</h1>
          <p className="text-gray-500 mt-2">أدخل رقم هاتفك وكود الدخول</p>
        </div>

        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8">
          <form onSubmit={handleSubmit} className="space-y-5">
            {error && (
              <div className="bg-danger-500/5 border border-danger-500/20 text-danger-500 text-sm p-3 rounded-xl">
                {error}
              </div>
            )}

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
              placeholder="أدخل كود الدخول"
              value={code}
              onChange={(e) => setCode(e.target.value)}
              required
              dir="ltr"
              maxLength={20}
            />

            <Button type="submit" className="w-full" loading={loading}>
              دخول
            </Button>
          </form>

          <div className="mt-6 pt-5 border-t border-gray-100 text-center">
            <Link
              href="/login"
              className="text-sm text-gray-500 hover:text-primary-600"
            >
              تسجيل دخول كأدمين أو مؤسسة
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
