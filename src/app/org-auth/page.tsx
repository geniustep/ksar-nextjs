'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import Button from '@/components/ui/Button';
import { orgAuthApi, ApiError } from '@/lib/api';

export default function OrgAuthPage() {
  const { loginAsOrganization, user } = useAuth();
  const router = useRouter();
  const [phone, setPhone] = useState('');
  const [code, setCode] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  // Redirect if already logged in as org
  useEffect(() => {
    if (user?.role === 'organization') {
      router.push('/org/requests');
    }
  }, [user, router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    const cleanPhone = phone.replace(/\s/g, '');
    if (!cleanPhone || cleanPhone.length < 9) {
      setError('يرجى إدخال رقم هاتف صحيح');
      return;
    }
    if (!code || code.length < 4) {
      setError('يرجى إدخال كود الدخول');
      return;
    }

    setLoading(true);
    try {
      const res = await orgAuthApi.login({ phone: cleanPhone, code });
      loginAsOrganization(res);
      setSuccess(true);
      setTimeout(() => {
        router.push('/org/requests');
      }, 1500);
    } catch (err) {
      if (err instanceof ApiError) {
        setError(err.detail);
      } else {
        setError('خطأ في الاتصال بالخادم');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-neutral-light flex flex-col items-center justify-center py-12 px-4" dir="rtl">
      <div className="w-full max-w-md">
        {/* Header */}
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
        </div>

        {success ? (
          <div className="text-center">
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-10">
              <div className="w-16 h-16 bg-accent-50 rounded-full flex items-center justify-center mx-auto mb-6">
                <svg className="w-8 h-8 text-accent-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
                </svg>
              </div>
              <h2 className="text-2xl font-bold text-neutral-dark mb-2">تم الدخول بنجاح</h2>
              <p className="text-gray-500">جاري التحويل إلى لوحة التحكم...</p>
            </div>
          </div>
        ) : (
          <div>
            <div className="text-center mb-6">
              <h1 className="text-2xl font-bold text-neutral-dark">دخول المؤسسات</h1>
              <p className="text-gray-500 mt-2">
                أدخل رقم الهاتف وكود الدخول الخاص بمؤسستك
              </p>
            </div>

            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8">
              <form onSubmit={handleSubmit} className="space-y-5">
                {error && (
                  <div className="bg-danger-500/5 border border-danger-500/20 text-danger-500 text-sm p-3 rounded-xl">
                    {error}
                  </div>
                )}

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    رقم الهاتف
                  </label>
                  <input
                    type="tel"
                    placeholder="06XXXXXXXX"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    required
                    dir="ltr"
                    className="w-full rounded-xl border border-gray-200 px-4 py-3 text-lg text-center font-inter tracking-wider shadow-sm focus:border-primary-500 focus:ring-2 focus:ring-primary-100 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    كود الدخول
                  </label>
                  <input
                    type="text"
                    maxLength={20}
                    placeholder="أدخل الكود"
                    value={code}
                    onChange={(e) => setCode(e.target.value)}
                    required
                    dir="ltr"
                    className="w-full rounded-xl border border-gray-200 px-4 py-3 text-lg text-center font-mono font-bold tracking-[0.3em] shadow-sm focus:border-primary-500 focus:ring-2 focus:ring-primary-100 focus:outline-none"
                  />
                </div>

                <Button type="submit" className="w-full !py-3 !rounded-xl !text-base" loading={loading}>
                  دخول
                </Button>
              </form>

              <div className="mt-6 pt-5 border-t border-gray-100 text-center">
                <p className="text-sm text-gray-500 mb-2">ليس لديك حساب مؤسسة؟</p>
                <p className="text-xs text-gray-400">تواصل مع الإدارة للحصول على حساب</p>
              </div>
            </div>

            <div className="mt-6 text-center">
              <Link
                href="/login"
                className="text-sm text-primary-600 hover:text-primary-700 font-medium"
              >
                الدخول بالبريد الإلكتروني
              </Link>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
