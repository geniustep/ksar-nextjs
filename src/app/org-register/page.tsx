'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import Input from '@/components/ui/Input';
import Textarea from '@/components/ui/Textarea';
import Button from '@/components/ui/Button';
import { publicApi, ApiError } from '@/lib/api';

export default function OrgRegisterPage() {
  const [form, setForm] = useState({
    name: '',
    phone: '',
    email: '',
    responsible_name: '',
    city: '',
    region: '',
    description: '',
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [orgName, setOrgName] = useState('');

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!form.name.trim()) {
      setError('يرجى إدخال اسم المؤسسة');
      return;
    }

    const cleanPhone = form.phone.replace(/\s/g, '');
    if (!cleanPhone || cleanPhone.length < 9) {
      setError('يرجى إدخال رقم هاتف صحيح');
      return;
    }

    setLoading(true);
    try {
      const res = await publicApi.registerOrganization({
        name: form.name.trim(),
        phone: cleanPhone,
        email: form.email.trim() || undefined,
        responsible_name: form.responsible_name.trim() || undefined,
        city: form.city.trim() || undefined,
        region: form.region.trim() || undefined,
        description: form.description.trim() || undefined,
      });
      setOrgName(res.organization_name);
      setSuccess(true);
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
      <div className="w-full max-w-lg">
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
              <div className="w-16 h-16 bg-green-50 rounded-full flex items-center justify-center mx-auto mb-6">
                <svg className="w-8 h-8 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
                </svg>
              </div>
              <h2 className="text-2xl font-bold text-neutral-dark mb-3">تم تسجيل المؤسسة بنجاح</h2>
              <p className="text-lg font-semibold text-primary-600 mb-4">{orgName}</p>
              <div className="bg-blue-50 border border-blue-100 rounded-xl p-4 text-sm text-blue-700 mb-6">
                <p className="font-medium mb-2">ماذا بعد؟</p>
                <ul className="space-y-1 text-right">
                  <li>- سيتم مراجعة طلبك من طرف الإدارة</li>
                  <li>- عند الموافقة، ستتلقى كود الدخول الخاص بمؤسستك</li>
                  <li>- يمكنك بعدها الدخول من صفحة دخول المؤسسات</li>
                </ul>
              </div>
              <div className="flex gap-3">
                <Link href="/login" className="flex-1">
                  <Button variant="secondary" className="w-full">
                    صفحة الدخول
                  </Button>
                </Link>
                <Link href="/" className="flex-1">
                  <Button variant="ghost" className="w-full">
                    الصفحة الرئيسية
                  </Button>
                </Link>
              </div>
            </div>
          </div>
        ) : (
          <div>
            <div className="text-center mb-6">
              <h1 className="text-2xl font-bold text-neutral-dark">تسجيل مؤسسة جديدة</h1>
              <p className="text-gray-500 mt-2">
                سجّل مؤسستك أو جمعيتك للمساهمة في تقديم المساعدات
              </p>
            </div>

            {/* Already have account? */}
            <div className="bg-primary-50 border border-primary-100 rounded-2xl p-4 text-center mb-6">
              <p className="text-sm text-primary-700 mb-1">لديك حساب مؤسسة بالفعل؟</p>
              <Link
                href="/org-auth"
                className="text-sm text-primary-700 font-semibold hover:text-primary-800 underline"
              >
                اذهب لصفحة دخول المؤسسات
              </Link>
            </div>

            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8">
              <form onSubmit={handleSubmit} className="space-y-4">
                {error && (
                  <div className="bg-danger-500/5 border border-danger-500/20 text-danger-500 text-sm p-3 rounded-xl">
                    {error}
                  </div>
                )}

                <Input
                  label="اسم المؤسسة / الجمعية"
                  name="name"
                  placeholder="مثال: جمعية الخير للتنمية"
                  value={form.name}
                  onChange={handleChange}
                  required
                />

                <Input
                  label="رقم الهاتف"
                  name="phone"
                  type="tel"
                  placeholder="06XXXXXXXX"
                  value={form.phone}
                  onChange={handleChange}
                  required
                  dir="ltr"
                />

                <Input
                  label="اسم المسؤول"
                  name="responsible_name"
                  placeholder="الاسم الكامل للمسؤول عن المؤسسة"
                  value={form.responsible_name}
                  onChange={handleChange}
                />

                <Input
                  label="البريد الإلكتروني (اختياري)"
                  name="email"
                  type="email"
                  placeholder="contact@association.ma"
                  value={form.email}
                  onChange={handleChange}
                  dir="ltr"
                />

                <div className="grid grid-cols-2 gap-3">
                  <Input
                    label="المدينة"
                    name="city"
                    placeholder="المدينة"
                    value={form.city}
                    onChange={handleChange}
                  />
                  <Input
                    label="المنطقة / الحي"
                    name="region"
                    placeholder="المنطقة"
                    value={form.region}
                    onChange={handleChange}
                  />
                </div>

                <Textarea
                  label="وصف المؤسسة ونشاطها (اختياري)"
                  name="description"
                  placeholder="اذكر مجال عمل المؤسسة ونوع المساعدات التي تقدمها..."
                  value={form.description}
                  onChange={handleChange}
                  rows={4}
                />

                <Button type="submit" className="w-full" loading={loading}>
                  تسجيل المؤسسة
                </Button>
              </form>

              <p className="mt-5 text-xs text-center text-gray-400">
                سيتم مراجعة طلبك من الإدارة. ستتلقى بيانات الدخول عند الموافقة.
              </p>
            </div>

            <div className="mt-6 text-center">
              <Link
                href="/login"
                className="text-sm text-primary-600 hover:text-primary-700 font-medium"
              >
                العودة لصفحة الدخول
              </Link>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
