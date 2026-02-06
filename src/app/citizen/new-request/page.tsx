'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import DashboardLayout from '@/components/DashboardLayout';
import Input from '@/components/ui/Input';
import Select from '@/components/ui/Select';
import Textarea from '@/components/ui/Textarea';
import Button from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { citizenApi, ApiError } from '@/lib/api';
import { useAuth } from '@/contexts/AuthContext';
import { ALL_CATEGORIES, CATEGORY_LABELS } from '@/lib/constants';
import type { RequestCategory } from '@/lib/types';

// Storage key for pending request
export const PENDING_REQUEST_KEY = 'pending_request_data';

export interface PendingRequestData {
  category: RequestCategory | '';
  description: string;
  quantity: string;
  family_members: string;
  address: string;
  city: string;
  region: string;
  is_urgent: boolean;
  timestamp: number;
}

export default function NewRequestPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { isAuthenticated, isLoading, user } = useAuth();
  const fromGuest = searchParams.get('from') === 'guest';
  const hasAutoSubmitted = useRef(false);
  
  const [form, setForm] = useState<PendingRequestData>({
    category: '',
    description: '',
    quantity: '1',
    family_members: '1',
    address: '',
    city: '',
    region: '',
    is_urgent: false,
    timestamp: Date.now(),
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState<{ tracking_code: string; message: string } | null>(null);
  const [autoSubmitting, setAutoSubmitting] = useState(false);

  const categoryOptions = ALL_CATEGORIES.map((c) => ({
    value: c,
    label: CATEGORY_LABELS[c],
  }));

  // Load pending request data from sessionStorage
  useEffect(() => {
    if (hasAutoSubmitted.current) return;
    
    try {
      const savedData = sessionStorage.getItem(PENDING_REQUEST_KEY);
      if (savedData) {
        const pendingData: PendingRequestData = JSON.parse(savedData);
        
        // Check if data is not too old (24 hours max)
        const maxAge = 24 * 60 * 60 * 1000; // 24 hours in ms
        if (Date.now() - pendingData.timestamp > maxAge) {
          sessionStorage.removeItem(PENDING_REQUEST_KEY);
          return;
        }

        // Load form data
        setForm({
          category: pendingData.category,
          description: pendingData.description,
          quantity: pendingData.quantity,
          family_members: pendingData.family_members,
          address: pendingData.address,
          city: pendingData.city,
          region: pendingData.region,
          is_urgent: pendingData.is_urgent,
          timestamp: pendingData.timestamp,
        });

        // If authenticated and coming from guest flow, auto-submit the request
        if (isAuthenticated && fromGuest && pendingData.category && pendingData.description) {
          hasAutoSubmitted.current = true;
          setAutoSubmitting(true);
          
          // Submit after a short delay to show the user what's happening
          setTimeout(() => {
            submitRequest({
              category: pendingData.category as RequestCategory,
              description: pendingData.description,
              quantity: pendingData.quantity,
              family_members: pendingData.family_members,
              address: pendingData.address,
              city: pendingData.city,
              region: pendingData.region,
              is_urgent: pendingData.is_urgent,
            });
          }, 500);
        }
      }
    } catch {
      // Ignore parsing errors
    }
  }, [fromGuest, isAuthenticated]);

  const submitRequest = async (data: {
    category: RequestCategory;
    description: string;
    quantity: string;
    family_members: string;
    address: string;
    city: string;
    region: string;
    is_urgent: boolean;
  }) => {
    setError('');
    setLoading(true);

    try {
      const result = await citizenApi.createRequest({
        category: data.category,
        description: data.description,
        quantity: parseInt(data.quantity),
        family_members: parseInt(data.family_members),
        address: data.address || undefined,
        city: data.city || undefined,
        region: data.region || undefined,
        is_urgent: data.is_urgent,
      });
      
      // Clear the pending request data on success
      sessionStorage.removeItem(PENDING_REQUEST_KEY);
      
      setSuccess({
        tracking_code: result.tracking_code,
        message: result.message,
      });
    } catch (err) {
      if (err instanceof ApiError) {
        setError(err.detail);
      } else {
        setError('خطأ في الاتصال بالخادم');
      }
    } finally {
      setLoading(false);
      setAutoSubmitting(false);
    }
  };

  const validateForm = (): boolean => {
    if (!form.category) {
      setError('يرجى اختيار نوع المساعدة');
      return false;
    }
    if (!form.description || form.description.length < 10) {
      setError('يرجى إدخال وصف الاحتياج (10 أحرف على الأقل)');
      return false;
    }
    setError('');
    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) return;

    // If not authenticated, save to sessionStorage and redirect to auth
    if (!isAuthenticated) {
      const dataToSave: PendingRequestData = {
        ...form,
        timestamp: Date.now(),
      };
      sessionStorage.setItem(PENDING_REQUEST_KEY, JSON.stringify(dataToSave));
      router.push('/citizen-auth?redirect=/citizen/new-request&from=guest');
      return;
    }
    
    // If authenticated, submit the request
    await submitRequest({
      category: form.category as RequestCategory,
      description: form.description,
      quantity: form.quantity,
      family_members: form.family_members,
      address: form.address,
      city: form.city,
      region: form.region,
      is_urgent: form.is_urgent,
    });
  };

  // Form content (shared between authenticated and guest views)
  const formContent = (
    <form onSubmit={handleSubmit} className="space-y-5">
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 text-sm p-3 rounded-lg">
          {error}
        </div>
      )}

      <Select
        label="نوع المساعدة"
        options={categoryOptions}
        placeholder="اختر نوع المساعدة"
        value={form.category}
        onChange={(e) => setForm({ ...form, category: e.target.value as RequestCategory })}
        required
      />

      <Textarea
        label="وصف الاحتياج"
        placeholder="صف احتياجك بالتفصيل (10 أحرف على الأقل)"
        value={form.description}
        onChange={(e) => setForm({ ...form, description: e.target.value })}
        required
        minLength={10}
      />

      <div className="grid grid-cols-2 gap-4">
        <Input
          label="الكمية المطلوبة"
          type="number"
          min="1"
          max="100"
          value={form.quantity}
          onChange={(e) => setForm({ ...form, quantity: e.target.value })}
        />
        <Input
          label="عدد أفراد الأسرة"
          type="number"
          min="1"
          max="50"
          value={form.family_members}
          onChange={(e) => setForm({ ...form, family_members: e.target.value })}
        />
      </div>

      <Input
        label={isAuthenticated ? "العنوان (اختياري - يُستخدم عنوان حسابك إن لم يُحدد)" : "العنوان (اختياري)"}
        placeholder="العنوان التفصيلي"
        value={form.address}
        onChange={(e) => setForm({ ...form, address: e.target.value })}
      />

      <div className="grid grid-cols-2 gap-4">
        <Input
          label="المدينة"
          placeholder="المدينة"
          value={form.city}
          onChange={(e) => setForm({ ...form, city: e.target.value })}
        />
        <Input
          label="المنطقة/الحي"
          placeholder="المنطقة"
          value={form.region}
          onChange={(e) => setForm({ ...form, region: e.target.value })}
        />
      </div>

      <label className="flex items-center gap-3 cursor-pointer">
        <input
          type="checkbox"
          checked={form.is_urgent}
          onChange={(e) => setForm({ ...form, is_urgent: e.target.checked })}
          className="w-4 h-4 text-red-600 rounded border-gray-300 focus:ring-red-500"
        />
        <span className="text-sm font-medium text-red-700">
          طلب مستعجل (يرفع أولوية الطلب)
        </span>
      </label>

      {isAuthenticated ? (
        <div className="flex gap-3 pt-2">
          <Button type="submit" className="flex-1" loading={loading}>
            إرسال الطلب
          </Button>
          <Button type="button" variant="secondary" onClick={() => router.push('/citizen')}>
            إلغاء
          </Button>
        </div>
      ) : (
        <div className="pt-4 border-t border-gray-100">
          <Button type="submit" className="w-full !py-3 !rounded-xl !text-base" loading={loading}>
            <span className="flex items-center justify-center gap-2">
              المتابعة للتسجيل
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" />
              </svg>
            </span>
          </Button>
          <p className="text-center text-sm text-gray-500 mt-3">
            سيُطلب منك إدخال رقم هاتفك فقط للتحقق
          </p>
        </div>
      )}
    </form>
  );

  // Success view (shared)
  const successContent = (
    <div className="max-w-lg mx-auto py-12">
      <Card className="text-center">
        <div className="text-5xl mb-4">&#10003;</div>
        <h2 className="text-2xl font-bold text-green-700 mb-2">تم إرسال الطلب بنجاح!</h2>
        <p className="text-gray-600 mb-4">{success?.message}</p>
        <div className="bg-gray-50 rounded-lg p-4 mb-6">
          <p className="text-sm text-gray-500">رمز المتابعة</p>
          <p className="text-2xl font-mono font-bold text-primary-600 mt-1">
            {success?.tracking_code}
          </p>
          <p className="text-xs text-gray-400 mt-1">احتفظ بهذا الرمز لمتابعة طلبك</p>
        </div>
        <div className="flex gap-3 justify-center">
          <Button onClick={() => router.push('/citizen')}>العودة لطلباتي</Button>
          <Button
            variant="secondary"
            onClick={() => {
              setSuccess(null);
              setForm({
                category: '',
                description: '',
                quantity: '1',
                family_members: '1',
                address: '',
                city: '',
                region: '',
                is_urgent: false,
                timestamp: Date.now(),
              });
            }}
          >
            طلب جديد
          </Button>
        </div>
      </Card>
    </div>
  );

  // Auto-submitting view (shared)
  const autoSubmittingContent = (
    <div className="max-w-lg mx-auto py-12">
      <Card className="text-center">
        <div className="flex flex-col items-center">
          <div className="w-16 h-16 border-4 border-primary-200 border-t-primary-600 rounded-full animate-spin mb-6"></div>
          <h2 className="text-xl font-bold text-gray-900 mb-2">جاري إرسال طلبك...</h2>
          <p className="text-gray-500">يرجى الانتظار قليلاً</p>
        </div>
      </Card>
    </div>
  );

  // ================== GUEST VIEW (Not authenticated) ==================
  if (!isLoading && !isAuthenticated) {
    return (
      <div className="min-h-screen bg-neutral-light">
        {/* Header */}
        <div className="bg-gradient-to-bl from-primary-600 via-primary-700 to-primary-950 py-8 px-4">
          <div className="max-w-2xl mx-auto">
            <Link href="/" className="inline-flex items-center gap-2 text-white/80 hover:text-white transition-colors mb-4">
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 19.5L3 12m0 0l7.5-7.5M3 12h18" />
              </svg>
              <span>العودة للرئيسية</span>
            </Link>
            <div className="flex items-center gap-3">
              <Image
                src="/logo.png"
                alt="كرامة قصر"
                width={50}
                height={50}
                className="object-contain"
              />
              <div>
                <h1 className="text-2xl font-bold text-white">طلب مساعدة جديد</h1>
                <p className="text-primary-200 text-sm">أملأ البيانات ثم سجّل برقم هاتفك</p>
              </div>
            </div>
          </div>
        </div>

        {/* Form Section */}
        <div className="max-w-2xl mx-auto px-4 py-8">
          {/* Info Banner */}
          <div className="bg-accent-50 border border-accent-100 rounded-2xl p-4 mb-6">
            <div className="flex items-start gap-3">
              <div className="flex-shrink-0 w-10 h-10 bg-accent-100 rounded-xl flex items-center justify-center">
                <svg className="w-5 h-5 text-accent-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <div>
                <h3 className="font-semibold text-accent-700 mb-1">كيف يعمل هذا؟</h3>
                <ol className="text-sm text-accent-600 space-y-1 list-decimal list-inside">
                  <li>أملأ بيانات طلبك أدناه</li>
                  <li>عند الإرسال، ستُسجّل برقم هاتفك فقط (OTP)</li>
                  <li>سيُرسل طلبك ويُعطى لك رمز متابعة</li>
                </ol>
              </div>
            </div>
          </div>

          <Card>{formContent}</Card>

          {/* Already have account */}
          <div className="mt-6 text-center">
            <p className="text-gray-500 text-sm mb-2">لديك حساب مسبق؟</p>
            <Link
              href="/login"
              className="text-primary-600 hover:text-primary-700 font-medium text-sm"
            >
              الدخول بالبريد الإلكتروني
            </Link>
          </div>

          {/* Trust message */}
          <div className="mt-6 bg-white border border-gray-100 rounded-2xl p-4 text-center">
            <p className="text-sm text-gray-500">
              معلوماتك محمية وسرّية - كرامتك محفوظة
            </p>
          </div>
        </div>
      </div>
    );
  }

  // ================== AUTHENTICATED VIEW ==================
  
  // Show auto-submitting state
  if (autoSubmitting && !success && !error) {
    return <DashboardLayout>{autoSubmittingContent}</DashboardLayout>;
  }

  // Show success state
  if (success) {
    return <DashboardLayout>{successContent}</DashboardLayout>;
  }

  // Show form
  return (
    <DashboardLayout>
      <div className="max-w-2xl mx-auto">
        <div className="mb-6">
          <button
            onClick={() => router.push('/citizen')}
            className="text-sm text-primary-600 hover:text-primary-700 mb-2 block"
          >
            &larr; العودة
          </button>
          <h1 className="text-2xl font-bold text-gray-900">طلب مساعدة جديد</h1>
          <p className="text-gray-500 mt-1">أملأ البيانات التالية لتقديم طلب مساعدة</p>
        </div>

        <Card>{formContent}</Card>
      </div>
    </DashboardLayout>
  );
}
