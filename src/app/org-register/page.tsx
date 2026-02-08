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
    preferred_code: '',
    org_type: '' as 'association' | 'individual' | '',
    national_id: '',
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [orgName, setOrgName] = useState('');
  const [acceptedTerms, setAcceptedTerms] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!form.org_type) {
      setError('يرجى اختيار نوع المؤسسة');
      return;
    }

    if (!form.name.trim()) {
      setError('يرجى إدخال اسم المؤسسة');
      return;
    }

    const cleanPhone = form.phone.replace(/\s/g, '');
    if (!cleanPhone || cleanPhone.length < 9) {
      setError('يرجى إدخال رقم هاتف صحيح');
      return;
    }

    if (form.org_type === 'individual' && !form.national_id.trim()) {
      setError('يرجى إدخال رقم البطاقة الوطنية');
      return;
    }

    if (!acceptedTerms) {
      setError('يرجى الموافقة على شروط الاستخدام للمتابعة');
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
        preferred_code: form.preferred_code.trim() || undefined,
        org_type: form.org_type as 'association' | 'individual',
        national_id: form.org_type === 'individual' ? form.national_id.trim() : undefined,
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
              <h1 className="text-2xl font-bold text-neutral-dark">تسجيل جمعية أو مبادرة إنسانية جديدة</h1>
              <p className="text-gray-500 mt-2">
                سجّل جمعيتك أو مبادرتك للمساهمة في تقديم المساعدات
              </p>
            </div>

            {/* Already have account? */}
            <div className="bg-primary-50 border border-primary-100 rounded-2xl p-4 text-center mb-6">
              <p className="text-sm text-primary-700 mb-1">لديك حساب جمعية أو مبادرة إنسانية بالفعل؟</p>
              <Link
                href="/login"
                className="text-sm text-primary-700 font-semibold hover:text-primary-800 underline"
              >
                اذهب لصفحة دخول الجمعيات والمبادرات الإنسانية
              </Link>
            </div>

            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8">
              <form onSubmit={handleSubmit} className="space-y-4">
                {error && (
                  <div className="bg-danger-500/5 border border-danger-500/20 text-danger-500 text-sm p-3 rounded-xl">
                    {error}
                  </div>
                )}

                {/* نوع المؤسسة */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    نوع التسجيل <span className="text-red-500">*</span>
                  </label>
                  <div className="grid grid-cols-2 gap-3">
                    <button
                      type="button"
                      onClick={() => setForm({ ...form, org_type: 'association', national_id: '' })}
                      className={`relative flex flex-col items-center gap-2 p-4 rounded-xl border-2 transition-all ${
                        form.org_type === 'association'
                          ? 'border-primary-500 bg-primary-50 shadow-sm'
                          : 'border-gray-200 bg-white hover:border-gray-300'
                      }`}
                    >
                      <span className="text-2xl">🏢</span>
                      <span className={`text-sm font-medium ${form.org_type === 'association' ? 'text-primary-700' : 'text-gray-700'}`}>
                        جمعية / مؤسسة
                      </span>
                      {form.org_type === 'association' && (
                        <div className="absolute top-2 left-2 w-5 h-5 bg-primary-500 rounded-full flex items-center justify-center">
                          <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
                          </svg>
                        </div>
                      )}
                    </button>
                    <button
                      type="button"
                      onClick={() => setForm({ ...form, org_type: 'individual' })}
                      className={`relative flex flex-col items-center gap-2 p-4 rounded-xl border-2 transition-all ${
                        form.org_type === 'individual'
                          ? 'border-primary-500 bg-primary-50 shadow-sm'
                          : 'border-gray-200 bg-white hover:border-gray-300'
                      }`}
                    >
                      <span className="text-2xl">👤</span>
                      <span className={`text-sm font-medium ${form.org_type === 'individual' ? 'text-primary-700' : 'text-gray-700'}`}>
                        شخص ذاتي
                      </span>
                      {form.org_type === 'individual' && (
                        <div className="absolute top-2 left-2 w-5 h-5 bg-primary-500 rounded-full flex items-center justify-center">
                          <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
                          </svg>
                        </div>
                      )}
                    </button>
                  </div>
                </div>

                <Input
                  label={form.org_type === 'individual' ? 'الاسم الكامل' : 'اسم الجمعية / المبادرة'}
                  name="name"
                  placeholder={form.org_type === 'individual' ? 'الاسم الكامل للشخص' : 'مثال: اسم الجمعية أو الشخص القائم بالمبادرة'}
                  value={form.name}
                  onChange={handleChange}
                  required
                />

                {/* رقم البطاقة الوطنية - يظهر فقط للشخص الذاتي */}
                {form.org_type === 'individual' && (
                  <Input
                    label="رقم البطاقة الوطنية"
                    name="national_id"
                    placeholder="مثال: AB123456"
                    value={form.national_id}
                    onChange={handleChange}
                    required
                    dir="ltr"
                  />
                )}

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

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">
                    كود الدخول المفضل 
                  </label>
                  <input
                    type="password"
                    name="preferred_code"
                    value={form.preferred_code}
                    onChange={(e) => setForm({ ...form, preferred_code: e.target.value.replace(/\s/g, '').slice(0, 20) })}
                    placeholder="أدخل كود الدخول"
                    maxLength={20}
                    dir="ltr"
                    className="w-full rounded-xl border border-gray-200 px-4 py-2.5 text-sm font-mono tracking-wider focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20 focus:outline-none placeholder:text-gray-400 text-gray-800"
                  />
                  <p className="text-xs text-gray-400 mt-1.5">
                    اختر كود من 6 إلى 20 حرف (أحرف، أرقام، رموز - أي شيء ما عدا المسافات). إن لم تختر، سيتم توليد كود قوي تلقائيا.
                  </p>
                </div>

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

                {/* Terms of use */}
                <div className="bg-gray-50 border border-gray-200 rounded-xl p-4">
                  <h4 className="text-sm font-semibold text-gray-800 mb-3 flex items-center gap-2">
                    <svg className="w-4 h-4 text-primary-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75m-3-7.036A11.959 11.959 0 013.598 6 11.99 11.99 0 003 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285z" />
                    </svg>
                    التزامات المنصة
                  </h4>
                  <div className="text-sm text-gray-600 leading-relaxed space-y-2 mb-4 pr-1">
                    <p>تلتزم منصة كرامة قصر والجمعيات والمبادرات المساهمة بـ:</p>
                    <ul className="space-y-1.5 text-gray-600">
                      <li className="flex items-start gap-2">
                        <span className="text-primary-500 mt-1 flex-shrink-0">-</span>
                        <span>الحفاظ على المعطيات الشخصية للأفراد والجمعيات ومختلف المتدخلين.</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <span className="text-primary-500 mt-1 flex-shrink-0">-</span>
                        <span>استغلال المعطيات الشخصية، فقط للأغراض التي أُنشئت من أجلها المنصة.</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <span className="text-primary-500 mt-1 flex-shrink-0">-</span>
                        <span>عدم إعطائها لأية جهة غير الجهة المتدخلة.</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <span className="text-primary-500 mt-1 flex-shrink-0">-</span>
                        <span>سيتم التخلص من كل المعطيات المدونة من طرف المستفيدين والمتدخلين، فور الانتهاء من عمل المنصة.</span>
                      </li>
                    </ul>
                  </div>
                  <label className="flex items-start gap-3 cursor-pointer group border-t border-gray-200 pt-3">
                    <div className="flex-shrink-0 mt-0.5">
                      <input
                        type="checkbox"
                        checked={acceptedTerms}
                        onChange={(e) => setAcceptedTerms(e.target.checked)}
                        className="w-5 h-5 rounded border-gray-300 text-primary-600 focus:ring-primary-500 focus:ring-2 cursor-pointer"
                      />
                    </div>
                    <span className="text-sm text-gray-700 leading-relaxed group-hover:text-gray-900 transition-colors font-medium">
                      أوافق على الالتزام بالشروط المذكورة أعلاه
                    </span>
                  </label>
                </div>

                <Button type="submit" className="w-full" loading={loading} disabled={!acceptedTerms}>
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
