'use client';

import React, { Suspense, useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useRouter, useSearchParams } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import Button from '@/components/ui/Button';
import { otpApi, ApiError } from '@/lib/api';

type Step = 'phone' | 'otp' | 'success';

function CitizenAuthContent() {
  const { loginWithOtp, user } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();
  const [step, setStep] = useState<Step>('phone');
  const [phone, setPhone] = useState('');
  const [otp, setOtp] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [countdown, setCountdown] = useState(0);
  const otpInputRef = useRef<HTMLInputElement>(null);

  // Get redirect URL from query params
  const redirectUrl = searchParams.get('redirect') || '/citizen';
  const fromGuest = searchParams.get('from') === 'guest';

  // Redirect if already logged in as citizen
  useEffect(() => {
    if (user?.role === 'citizen') {
      // Use the redirect URL if provided, otherwise go to citizen dashboard
      router.push(redirectUrl);
    }
  }, [user, router, redirectUrl]);

  // Countdown timer for resend
  useEffect(() => {
    if (countdown <= 0) return;
    const timer = setInterval(() => {
      setCountdown((prev) => prev - 1);
    }, 1000);
    return () => clearInterval(timer);
  }, [countdown]);

  // Focus OTP input when step changes
  useEffect(() => {
    if (step === 'otp') {
      otpInputRef.current?.focus();
    }
  }, [step]);

  const handleSendOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    // Basic phone validation
    const cleanPhone = phone.replace(/\s/g, '');
    if (!cleanPhone || cleanPhone.length < 9) {
      setError('يرجى إدخال رقم هاتف صحيح');
      return;
    }

    setLoading(true);
    try {
      const res = await otpApi.sendOtp({ phone: cleanPhone });
      setCountdown(res.expires_in || 120);
      setStep('otp');
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

  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!otp || otp.length < 4) {
      setError('يرجى إدخال رمز التحقق');
      return;
    }

    setLoading(true);
    try {
      const cleanPhone = phone.replace(/\s/g, '');
      const res = await otpApi.verifyOtp({ phone: cleanPhone, code: otp });
      loginWithOtp(res);
      setStep('success');
      // Redirect to the specified URL or citizen dashboard
      setTimeout(() => {
        // If coming from guest request flow, add query param to indicate completion
        if (fromGuest) {
          router.push(`${redirectUrl}?from=guest`);
        } else {
          router.push(redirectUrl);
        }
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

  const handleResendOtp = async () => {
    if (countdown > 0) return;
    setError('');
    setLoading(true);
    try {
      const cleanPhone = phone.replace(/\s/g, '');
      const res = await otpApi.sendOtp({ phone: cleanPhone });
      setCountdown(res.expires_in || 120);
      setOtp('');
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
    <div className="min-h-screen bg-neutral-light flex flex-col items-center justify-center py-12 px-4">
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

        {/* Step: Phone */}
        {step === 'phone' && (
          <div>
            <div className="text-center mb-6">
              <h1 className="text-2xl font-bold text-neutral-dark">
                {fromGuest ? 'خطوة أخيرة!' : 'مرحبًا بك'}
              </h1>
              <p className="text-gray-500 mt-2">
                {fromGuest 
                  ? 'أدخل رقم هاتفك لإرسال طلبك - بيانات الطلب محفوظة'
                  : 'أدخل رقم هاتفك للبدء - لا حاجة لتسجيل معقد'}
              </p>
            </div>
            
            {/* Info banner for guest flow */}
            {fromGuest && (
              <div className="bg-accent-50 border border-accent-100 rounded-xl p-3 mb-4">
                <div className="flex items-center gap-2 text-accent-700 text-sm">
                  <svg className="w-5 h-5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <span>بيانات طلبك محفوظة وستُرسل بعد التحقق</span>
                </div>
              </div>
            )}

            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8">
              <form onSubmit={handleSendOtp} className="space-y-5">
                {error && (
                  <div className="bg-danger-500/5 border border-danger-500/20 text-danger-500 text-sm p-3 rounded-xl">
                    {error}
                  </div>
                )}

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    رقم الهاتف
                  </label>
                  <div className="relative">
                    <input
                      type="tel"
                      placeholder="06XXXXXXXX"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      required
                      dir="ltr"
                      className="w-full rounded-xl border border-gray-200 px-4 py-3 text-lg text-center font-inter tracking-wider shadow-sm focus:border-primary-500 focus:ring-2 focus:ring-primary-100 focus:outline-none"
                    />
                    <div className="absolute left-3 top-1/2 -translate-y-1/2">
                      <svg className="w-5 h-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 1.5H8.25A2.25 2.25 0 006 3.75v16.5a2.25 2.25 0 002.25 2.25h7.5A2.25 2.25 0 0018 20.25V3.75a2.25 2.25 0 00-2.25-2.25H13.5m-3 0V3h3V1.5m-3 0h3m-3 18.75h3" />
                      </svg>
                    </div>
                  </div>
                  <p className="text-xs text-gray-400 mt-2 text-center">
                    سنرسل لك رمز تحقق عبر SMS
                  </p>
                </div>

                <Button type="submit" className="w-full !py-3 !rounded-xl !text-base" loading={loading}>
                  إرسال رمز التحقق
                </Button>
              </form>

              {/* Optional: Link to existing account */}
              <div className="mt-6 pt-5 border-t border-gray-100">
                <p className="text-center text-sm text-gray-500 mb-3">لديك حساب مسبق؟</p>
                <Link
                  href="/login"
                  className="block text-center text-sm text-primary-600 hover:text-primary-700 font-medium py-2 px-4 rounded-lg hover:bg-primary-50 transition-colors"
                >
                  الدخول بالبريد الإلكتروني
                </Link>
              </div>
            </div>

            {/* Trust message */}
            <div className="mt-6 bg-accent-50/50 border border-accent-100/50 rounded-2xl p-4 text-center">
              <p className="text-sm text-accent-700">
                معلوماتك محمية وسرّية - كرامتك محفوظة
              </p>
            </div>
          </div>
        )}

        {/* Step: OTP Verification */}
        {step === 'otp' && (
          <div>
            <div className="text-center mb-6">
              <h1 className="text-2xl font-bold text-neutral-dark">رمز التحقق</h1>
              <p className="text-gray-500 mt-2">
                أدخل الرمز المرسل إلى
                <span className="font-inter font-semibold text-primary-600 mr-1 inline-block" dir="ltr">
                  {phone}
                </span>
              </p>
            </div>

            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8">
              <form onSubmit={handleVerifyOtp} className="space-y-5">
                {error && (
                  <div className="bg-danger-500/5 border border-danger-500/20 text-danger-500 text-sm p-3 rounded-xl">
                    {error}
                  </div>
                )}

                <div>
                  <input
                    ref={otpInputRef}
                    type="text"
                    inputMode="numeric"
                    maxLength={6}
                    placeholder="------"
                    value={otp}
                    onChange={(e) => {
                      const val = e.target.value.replace(/\D/g, '');
                      setOtp(val);
                    }}
                    required
                    dir="ltr"
                    className="otp-input w-full rounded-xl border border-gray-200 px-4 py-4 shadow-sm focus:border-primary-500 focus:ring-2 focus:ring-primary-100 focus:outline-none"
                  />
                </div>

                <Button type="submit" className="w-full !py-3 !rounded-xl !text-base" loading={loading}>
                  تأكيد الرمز
                </Button>
              </form>

              <div className="mt-5 text-center">
                {countdown > 0 ? (
                  <p className="text-sm text-gray-400">
                    إعادة الإرسال بعد <span className="font-inter font-semibold text-primary-600">{countdown}</span> ثانية
                  </p>
                ) : (
                  <button
                    onClick={handleResendOtp}
                    className="text-sm text-primary-600 hover:text-primary-700 font-medium"
                    disabled={loading}
                  >
                    إعادة إرسال الرمز
                  </button>
                )}
              </div>

              <div className="mt-4 text-center">
                <button
                  onClick={() => {
                    setStep('phone');
                    setOtp('');
                    setError('');
                  }}
                  className="text-sm text-gray-500 hover:text-gray-700"
                >
                  تغيير رقم الهاتف
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Step: Success */}
        {step === 'success' && (
          <div className="text-center">
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-10">
              <div className="w-16 h-16 bg-accent-50 rounded-full flex items-center justify-center mx-auto mb-6">
                <svg className="w-8 h-8 text-accent-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
                </svg>
              </div>
              <h2 className="text-2xl font-bold text-neutral-dark mb-2">تم التحقق بنجاح</h2>
              <p className="text-gray-500">جاري التحويل إلى حسابك...</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default function CitizenAuthPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-neutral-light flex flex-col items-center justify-center">
          <div className="w-10 h-10 border-4 border-primary-200 border-t-primary-600 rounded-full animate-spin" />
          <p className="mt-4 text-gray-500 text-sm">جاري التحميل...</p>
        </div>
      }
    >
      <CitizenAuthContent />
    </Suspense>
  );
}
