'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import Navbar from '@/components/Navbar';
import Input from '@/components/ui/Input';
import Button from '@/components/ui/Button';
import Badge from '@/components/ui/Badge';
import { Card } from '@/components/ui/Card';
import { publicApi, ApiError } from '@/lib/api';
import { REQUEST_STATUS_LABELS, REQUEST_STATUS_COLORS, CATEGORY_LABELS } from '@/lib/constants';
import { formatDateTime } from '@/lib/utils';
import type { RequestTrackResponse, RequestStatus, RequestCategory } from '@/lib/types';

export default function TrackPage() {
  const [trackingCode, setTrackingCode] = useState('');
  const [phone, setPhone] = useState('');
  const [result, setResult] = useState<RequestTrackResponse | null>(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setResult(null);
    setLoading(true);

    try {
      const data = await publicApi.trackRequest(trackingCode, phone);
      setResult(data);
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
    <div className="min-h-screen bg-neutral-light">
      <Navbar />

      <div className="max-w-xl mx-auto px-4 py-12">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-14 h-14 bg-primary-50 rounded-2xl mb-4">
            <svg className="w-7 h-7 text-primary-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M2.036 12.322a1.012 1.012 0 010-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178z" />
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
          </div>
          <h1 className="text-3xl font-bold text-neutral-dark">تتبع طلبك</h1>
          <p className="text-gray-500 mt-2">أدخل رمز المتابعة ورقم الهاتف لمعرفة حالة طلبك</p>
        </div>

        <Card className="!rounded-2xl !border-gray-100">
          <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
              <div className="bg-danger-500/5 border border-danger-500/20 text-danger-500 text-sm p-3 rounded-xl">
                {error}
              </div>
            )}

            <Input
              label="رمز المتابعة"
              placeholder="مثال: A1B2C3D4"
              value={trackingCode}
              onChange={(e) => setTrackingCode(e.target.value)}
              required
              dir="ltr"
            />

            <Input
              label="رقم الهاتف"
              type="tel"
              placeholder="06XXXXXXXX"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              required
              dir="ltr"
            />

            <Button type="submit" className="w-full" loading={loading}>
              تتبع الطلب
            </Button>
          </form>
        </Card>

        {result && (
          <Card className="mt-6 !rounded-2xl !border-gray-100">
            <h2 className="text-lg font-semibold mb-4">حالة الطلب</h2>

            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-gray-500">الحالة</span>
                <Badge className={REQUEST_STATUS_COLORS[result.status as RequestStatus]}>
                  {result.status_ar || REQUEST_STATUS_LABELS[result.status as RequestStatus]}
                </Badge>
              </div>

              <div className="flex justify-between items-center">
                <span className="text-gray-500">التصنيف</span>
                <span className="font-medium">{CATEGORY_LABELS[result.category as RequestCategory]}</span>
              </div>

              <div className="flex justify-between items-center">
                <span className="text-gray-500">تاريخ الإنشاء</span>
                <span className="text-sm">{formatDateTime(result.created_at)}</span>
              </div>

              {result.organization_name && (
                <div className="flex justify-between items-center">
                  <span className="text-gray-500">المؤسسة المتكفلة</span>
                  <span className="font-medium text-accent-500">{result.organization_name}</span>
                </div>
              )}

              {result.updated_at && (
                <div className="flex justify-between items-center">
                  <span className="text-gray-500">آخر تحديث</span>
                  <span className="text-sm">{formatDateTime(result.updated_at)}</span>
                </div>
              )}
            </div>

            {/* Status timeline */}
            <div className="mt-6 pt-4 border-t border-gray-100">
              <h3 className="text-sm font-medium text-gray-700 mb-3">مراحل الطلب</h3>
              <div className="flex items-center justify-between text-xs">
                {(['new', 'assigned', 'in_progress', 'completed'] as RequestStatus[]).map((s, i) => {
                  const isActive = s === result.status;
                  const isPast =
                    ['new', 'assigned', 'in_progress', 'completed'].indexOf(result.status as string) >=
                    ['new', 'assigned', 'in_progress', 'completed'].indexOf(s);
                  return (
                    <div key={s} className="flex flex-col items-center flex-1">
                      <div
                        className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold ${
                          isPast
                            ? 'bg-primary-600 text-white'
                            : 'bg-gray-200 text-gray-400'
                        } ${isActive ? 'ring-2 ring-primary-200 ring-offset-2' : ''}`}
                      >
                        {i + 1}
                      </div>
                      <span className={`mt-1.5 ${isPast ? 'text-primary-600 font-medium' : 'text-gray-400'}`}>
                        {REQUEST_STATUS_LABELS[s]}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          </Card>
        )}

        <div className="text-center mt-8 space-y-3">
          <p className="text-sm text-gray-500">
            ليس لديك رمز متابعة؟
          </p>
          <Link
            href="/citizen/new-request"
            className="inline-block text-sm text-primary-600 hover:text-primary-700 font-medium"
          >
            قدّم طلبًا جديدًا عبر رقم هاتفك
          </Link>
        </div>
      </div>
    </div>
  );
}
