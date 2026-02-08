'use client';

import React, { useState, useEffect } from 'react';
import DashboardLayout from '@/components/DashboardLayout';
import Input from '@/components/ui/Input';
import Button from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import Spinner from '@/components/ui/Spinner';
import { authApi, ApiError } from '@/lib/api';
import type { UserProfileResponse } from '@/lib/types';

export default function InspectorProfilePage() {
  const [profile, setProfile] = useState<UserProfileResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  const [form, setForm] = useState({
    full_name: '',
    phone: '',
    address: '',
    city: '',
    region: '',
  });

  const [passwordForm, setPasswordForm] = useState({
    current_password: '',
    new_password: '',
    confirm_password: '',
  });
  const [passwordSaving, setPasswordSaving] = useState(false);
  const [passwordMessage, setPasswordMessage] = useState('');
  const [passwordError, setPasswordError] = useState('');

  useEffect(() => {
    loadProfile();
  }, []);

  const loadProfile = async () => {
    try {
      const data = await authApi.getMe();
      setProfile(data);
      setForm({
        full_name: data.full_name || '',
        phone: data.phone || '',
        address: data.address || '',
        city: data.city || '',
        region: data.region || '',
      });
    } catch {
      setError('خطأ في تحميل البيانات');
    } finally {
      setLoading(false);
    }
  };

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setMessage(''); setError(''); setSaving(true);
    try {
      const updated = await authApi.updateProfile({
        full_name: form.full_name || undefined, phone: form.phone || undefined,
        address: form.address || undefined, city: form.city || undefined, region: form.region || undefined,
      });
      setProfile(updated);
      setMessage('تم تحديث الملف الشخصي بنجاح');
    } catch (err) {
      if (err instanceof ApiError) setError(err.detail); else setError('خطأ في حفظ البيانات');
    } finally { setSaving(false); }
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setPasswordMessage(''); setPasswordError('');
    if (passwordForm.new_password !== passwordForm.confirm_password) { setPasswordError('كلمتا المرور غير متطابقتين'); return; }
    if (passwordForm.new_password.length < 6) { setPasswordError('كلمة المرور يجب أن تكون 6 أحرف على الأقل'); return; }
    setPasswordSaving(true);
    try {
      await authApi.changePassword({ current_password: passwordForm.current_password, new_password: passwordForm.new_password });
      setPasswordMessage('تم تغيير كلمة المرور بنجاح');
      setPasswordForm({ current_password: '', new_password: '', confirm_password: '' });
    } catch (err) {
      if (err instanceof ApiError) setPasswordError(err.detail); else setPasswordError('خطأ في تغيير كلمة المرور');
    } finally { setPasswordSaving(false); }
  };

  if (loading) {
    return (<DashboardLayout><div className="flex justify-center py-12"><Spinner /></div></DashboardLayout>);
  }

  return (
    <DashboardLayout>
      <div className="mb-4 sm:mb-6">
        <h1 className="text-lg sm:text-2xl font-bold text-neutral-dark">الملف الشخصي</h1>
        <p className="text-gray-500 text-xs sm:text-base mt-0.5">تحرير بيانات حسابك</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
        {/* Profile form */}
        <Card>
          <h2 className="text-sm sm:text-lg font-semibold mb-3 sm:mb-4">البيانات الشخصية</h2>
          <form onSubmit={handleSaveProfile} className="space-y-3 sm:space-y-4">
            {message && (
              <div className="bg-green-50 border border-green-200 text-green-700 text-xs sm:text-sm p-2.5 sm:p-3 rounded-xl">{message}</div>
            )}
            {error && (
              <div className="bg-red-50 border border-red-200 text-red-700 text-xs sm:text-sm p-2.5 sm:p-3 rounded-xl">{error}</div>
            )}

            <div className="bg-gray-50 rounded-xl p-2.5 sm:p-3">
              <p className="text-[10px] sm:text-xs text-gray-400 mb-0.5">الدور</p>
              <p className="font-medium text-primary-600 text-sm">مراقب</p>
            </div>

            {profile?.email && (
              <Input label="البريد الإلكتروني" value={profile.email} disabled dir="ltr" />
            )}

            <Input label="الاسم الكامل" value={form.full_name} onChange={(e) => setForm({ ...form, full_name: e.target.value })} required />
            <Input label="رقم الهاتف" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} dir="ltr" required />
            <Input label="العنوان" value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })} />

            <div className="grid grid-cols-2 gap-2.5 sm:gap-3">
              <Input label="المدينة" value={form.city} onChange={(e) => setForm({ ...form, city: e.target.value })} />
              <Input label="المنطقة" value={form.region} onChange={(e) => setForm({ ...form, region: e.target.value })} />
            </div>

            <Button type="submit" loading={saving} className="w-full">حفظ التغييرات</Button>
          </form>
        </Card>

        {/* Password form */}
        <Card>
          <h2 className="text-sm sm:text-lg font-semibold mb-3 sm:mb-4">تغيير كلمة المرور</h2>
          <form onSubmit={handleChangePassword} className="space-y-3 sm:space-y-4">
            {passwordMessage && (
              <div className="bg-green-50 border border-green-200 text-green-700 text-xs sm:text-sm p-2.5 sm:p-3 rounded-xl">{passwordMessage}</div>
            )}
            {passwordError && (
              <div className="bg-red-50 border border-red-200 text-red-700 text-xs sm:text-sm p-2.5 sm:p-3 rounded-xl">{passwordError}</div>
            )}

            <Input label="كلمة المرور الحالية" type="password" value={passwordForm.current_password} onChange={(e) => setPasswordForm({ ...passwordForm, current_password: e.target.value })} required dir="ltr" />
            <Input label="كلمة المرور الجديدة" type="password" value={passwordForm.new_password} onChange={(e) => setPasswordForm({ ...passwordForm, new_password: e.target.value })} required minLength={6} dir="ltr" />
            <Input label="تأكيد كلمة المرور" type="password" value={passwordForm.confirm_password} onChange={(e) => setPasswordForm({ ...passwordForm, confirm_password: e.target.value })} required dir="ltr" />

            <Button type="submit" loading={passwordSaving} className="w-full">تغيير كلمة المرور</Button>
          </form>

          {/* Account Info */}
          <div className="mt-4 sm:mt-6 pt-4 sm:pt-6 border-t border-gray-100">
            <h3 className="text-xs sm:text-sm font-semibold text-gray-700 mb-2 sm:mb-3">معلومات الحساب</h3>
            <div className="space-y-2 text-xs sm:text-sm">
              <div className="flex justify-between">
                <span className="text-gray-500">المعرف</span>
                <span className="text-gray-700 font-mono text-[10px] sm:text-xs" dir="ltr">{profile?.id?.slice(0, 12)}...</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">الدور</span>
                <span className="text-primary-600 font-medium">مراقب</span>
              </div>
            </div>
          </div>
        </Card>
      </div>
    </DashboardLayout>
  );
}
