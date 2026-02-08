'use client';

import React, { useEffect, useState } from 'react';
import DashboardLayout from '@/components/DashboardLayout';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import Spinner from '@/components/ui/Spinner';
import { orgApi, ApiError } from '@/lib/api';
import type { OrgProfileResponse } from '@/lib/types';

export default function OrgProfilePage() {
  const [profile, setProfile] = useState<OrgProfileResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [editing, setEditing] = useState(false);
  const [success, setSuccess] = useState('');
  const [error, setError] = useState('');

  const [form, setForm] = useState({
    name: '',
    description: '',
    contact_phone: '',
    contact_email: '',
    address: '',
  });

  useEffect(() => {
    loadProfile();
  }, []);

  const loadProfile = async () => {
    setLoading(true);
    try {
      const data = await orgApi.getProfile();
      setProfile(data);
      setForm({
        name: data.name || '',
        description: data.description || '',
        contact_phone: data.contact_phone || '',
        contact_email: data.contact_email || '',
        address: data.address || '',
      });
    } catch (err) {
      console.error('Failed to load profile:', err);
      setError('فشل في تحميل بيانات المؤسسة');
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    setError('');
    setSuccess('');
    setSaving(true);

    try {
      const updateData: Record<string, string> = {};
      if (form.name !== (profile?.name || '')) updateData.name = form.name;
      if (form.description !== (profile?.description || '')) updateData.description = form.description;
      if (form.contact_phone !== (profile?.contact_phone || '')) updateData.contact_phone = form.contact_phone;
      if (form.contact_email !== (profile?.contact_email || '')) updateData.contact_email = form.contact_email;
      if (form.address !== (profile?.address || '')) updateData.address = form.address;

      if (Object.keys(updateData).length === 0) {
        setEditing(false);
        return;
      }

      const res = await orgApi.updateProfile(updateData);
      setProfile(res.organization);
      setSuccess('تم تحديث بيانات المؤسسة بنجاح');
      setEditing(false);
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      if (err instanceof ApiError) {
        setError(err.detail);
      } else {
        setError('حدث خطأ أثناء التحديث');
      }
    } finally {
      setSaving(false);
    }
  };

  const handleCancel = () => {
    if (profile) {
      setForm({
        name: profile.name || '',
        description: profile.description || '',
        contact_phone: profile.contact_phone || '',
        contact_email: profile.contact_email || '',
        address: profile.address || '',
      });
    }
    setEditing(false);
    setError('');
  };

  if (loading) {
    return (
      <DashboardLayout>
        <div className="flex justify-center py-12"><Spinner /></div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="mb-4 sm:mb-6">
        <h1 className="text-xl sm:text-2xl font-bold text-gray-900">ملف المؤسسة</h1>
        <p className="text-gray-500 text-sm mt-1">عرض وتعديل بيانات المؤسسة</p>
      </div>

      {/* Success / Error Messages */}
      {success && (
        <div className="mb-4 p-3 bg-green-50 border border-green-200 rounded-xl text-green-700 text-sm">
          {success}
        </div>
      )}
      {error && (
        <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-xl text-red-700 text-sm">
          {error}
        </div>
      )}

      {/* Stats Cards */}
      {profile && (
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 mb-6">
          <div className="bg-white rounded-xl border border-gray-200 p-4 text-center">
            <p className="text-2xl font-bold text-primary-600">{profile.total_completed}</p>
            <p className="text-xs text-gray-500 mt-1">تكفلات مكتملة</p>
          </div>
          <div className="bg-white rounded-xl border border-gray-200 p-4 text-center">
            <p className="text-sm font-medium text-gray-700">
              {profile.status === 'active' ? (
                <span className="text-green-600">نشطة</span>
              ) : (
                <span className="text-red-600">معلقة</span>
              )}
            </p>
            <p className="text-xs text-gray-500 mt-1">حالة المؤسسة</p>
          </div>
          <div className="bg-white rounded-xl border border-gray-200 p-4 text-center col-span-2 sm:col-span-1">
            <p className="text-sm font-medium text-gray-700">
              {profile.created_at ? new Date(profile.created_at).toLocaleDateString('ar-MA') : '-'}
            </p>
            <p className="text-xs text-gray-500 mt-1">تاريخ التسجيل</p>
          </div>
        </div>
      )}

      {/* Profile Form */}
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <div className="flex items-center justify-between p-4 sm:p-6 border-b border-gray-100">
          <h2 className="font-semibold text-gray-900">بيانات المؤسسة</h2>
          {!editing ? (
            <Button variant="secondary" size="sm" onClick={() => setEditing(true)}>
              تعديل
            </Button>
          ) : (
            <div className="flex gap-2">
              <Button variant="secondary" size="sm" onClick={handleCancel} disabled={saving}>
                إلغاء
              </Button>
              <Button size="sm" onClick={handleSave} disabled={saving}>
                {saving ? 'جاري الحفظ...' : 'حفظ'}
              </Button>
            </div>
          )}
        </div>

        <div className="p-4 sm:p-6 space-y-4">
          {/* Name */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">اسم المؤسسة</label>
            {editing ? (
              <Input
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                placeholder="اسم المؤسسة"
              />
            ) : (
              <p className="text-gray-900 bg-gray-50 rounded-lg px-3 py-2.5">{profile?.name || '-'}</p>
            )}
          </div>

          {/* Description */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">وصف المؤسسة</label>
            {editing ? (
              <textarea
                value={form.description}
                onChange={(e) => setForm({ ...form, description: e.target.value })}
                placeholder="وصف نشاط المؤسسة..."
                rows={3}
                className="w-full px-3 py-2.5 border border-gray-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent resize-none"
              />
            ) : (
              <p className="text-gray-900 bg-gray-50 rounded-lg px-3 py-2.5 whitespace-pre-wrap">
                {profile?.description || '-'}
              </p>
            )}
          </div>

          {/* Phone & Email */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">رقم الهاتف</label>
              {editing ? (
                <Input
                  value={form.contact_phone}
                  onChange={(e) => setForm({ ...form, contact_phone: e.target.value })}
                  placeholder="رقم هاتف المؤسسة"
                  dir="ltr"
                />
              ) : (
                <p className="text-gray-900 bg-gray-50 rounded-lg px-3 py-2.5" dir="ltr">
                  {profile?.contact_phone || '-'}
                </p>
              )}
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">البريد الإلكتروني</label>
              {editing ? (
                <Input
                  value={form.contact_email}
                  onChange={(e) => setForm({ ...form, contact_email: e.target.value })}
                  placeholder="البريد الإلكتروني"
                  dir="ltr"
                />
              ) : (
                <p className="text-gray-900 bg-gray-50 rounded-lg px-3 py-2.5" dir="ltr">
                  {profile?.contact_email || '-'}
                </p>
              )}
            </div>
          </div>

          {/* Address */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">العنوان</label>
            {editing ? (
              <Input
                value={form.address}
                onChange={(e) => setForm({ ...form, address: e.target.value })}
                placeholder="عنوان المؤسسة"
              />
            ) : (
              <p className="text-gray-900 bg-gray-50 rounded-lg px-3 py-2.5">{profile?.address || '-'}</p>
            )}
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
