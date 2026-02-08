'use client';

import React, { useEffect, useState } from 'react';
import DashboardLayout from '@/components/DashboardLayout';
import { Card } from '@/components/ui/Card';
import Badge from '@/components/ui/Badge';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import Modal from '@/components/ui/Modal';
import Spinner from '@/components/ui/Spinner';
import { adminApi, ApiError } from '@/lib/api';
import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';
import type { AdminListItem } from '@/lib/types';

export default function AdminManagementPage() {
  const { user } = useAuth();
  const router = useRouter();
  const [admins, setAdmins] = useState<AdminListItem[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);

  // Create form
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newName, setNewName] = useState('');
  const [newEmail, setNewEmail] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [newPhone, setNewPhone] = useState('');
  const [createError, setCreateError] = useState('');

  // Success modal
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [createdAdmin, setCreatedAdmin] = useState<{ name: string; email: string; password: string } | null>(null);
  const [infoCopied, setInfoCopied] = useState(false);

  // Redirect if not superadmin
  useEffect(() => {
    if (user && user.role !== 'superadmin') {
      router.push('/admin');
    }
  }, [user, router]);

  useEffect(() => {
    if (user?.role === 'superadmin') {
      loadAdmins();
    }
  }, [user]);

  const loadAdmins = async () => {
    try {
      const res = await adminApi.getAdmins({ limit: 100 });
      setAdmins(res.items);
      setTotal(res.total);
    } catch (err) {
      console.error('Failed to load admins:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setCreateError('');
    setActionLoading(true);

    try {
      await adminApi.createAdmin({
        full_name: newName,
        email: newEmail,
        password: newPassword,
        phone: newPhone || undefined,
      });

      setShowCreateModal(false);

      // Show success modal with credentials
      setCreatedAdmin({
        name: newName,
        email: newEmail,
        password: newPassword,
      });
      setShowSuccessModal(true);

      setNewName('');
      setNewEmail('');
      setNewPassword('');
      setNewPhone('');
      await loadAdmins();
    } catch (err) {
      if (err instanceof ApiError) {
        setCreateError(err.detail);
      } else {
        setCreateError('خطأ في الاتصال بالخادم');
      }
    } finally {
      setActionLoading(false);
    }
  };

  const handleToggleStatus = async (admin: AdminListItem) => {
    const newStatus = admin.status === 'active' ? 'suspended' : 'active';
    const actionText = newStatus === 'suspended' ? 'تعليق' : 'تفعيل';
    if (!confirm(`هل تريد ${actionText} المشرف ${admin.full_name}؟`)) return;
    try {
      await adminApi.updateAdminStatus(admin.id, newStatus);
      await loadAdmins();
    } catch (err) {
      if (err instanceof ApiError) alert(err.detail);
    }
  };

  const handleDelete = async (admin: AdminListItem) => {
    if (!confirm(`هل أنت متأكد من حذف المشرف ${admin.full_name}؟ هذا الإجراء لا يمكن التراجع عنه.`)) return;
    try {
      await adminApi.deleteAdmin(admin.id);
      await loadAdmins();
    } catch (err) {
      if (err instanceof ApiError) alert(err.detail);
    }
  };

  const copyCredentials = async () => {
    if (!createdAdmin) return;
    const text = `المشرف: ${createdAdmin.name}\nالبريد الإلكتروني: ${createdAdmin.email}\nكلمة المرور: ${createdAdmin.password}\n\nرابط الدخول: ${window.location.origin}/login`;
    await navigator.clipboard.writeText(text);
    setInfoCopied(true);
    setTimeout(() => setInfoCopied(false), 2000);
  };

  if (user?.role !== 'superadmin') {
    return null;
  }

  return (
    <DashboardLayout>
      <div className="mb-4 sm:mb-6 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-neutral-dark">المشرفون</h1>
          <p className="text-gray-500 text-sm mt-1">إدارة حسابات المشرفين (الأدمين)</p>
        </div>
        <Button onClick={() => setShowCreateModal(true)} className="w-full sm:w-auto">
          إضافة مشرف
        </Button>
      </div>

      {loading ? (
        <div className="flex justify-center py-12"><Spinner /></div>
      ) : admins.length === 0 ? (
        <Card>
          <div className="text-center py-12 text-gray-400">
            <p className="text-4xl mb-2">🛡️</p>
            <p>لا يوجد مشرفون بعد</p>
            <Button className="mt-4" onClick={() => setShowCreateModal(true)}>
              إضافة أول مشرف
            </Button>
          </div>
        </Card>
      ) : (
        <>
          {/* Mobile: Cards */}
          <div className="sm:hidden space-y-3">
            {admins.map((admin) => (
              <div key={admin.id} className="bg-white rounded-xl border border-gray-200 p-4">
                <div className="flex items-start justify-between mb-2">
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-gray-900">{admin.full_name}</p>
                    <p className="text-xs text-gray-500 mt-0.5" dir="ltr">{admin.email}</p>
                    {admin.phone && <p className="text-xs text-gray-400" dir="ltr">{admin.phone}</p>}
                  </div>
                  <Badge className={admin.status === 'active' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}>
                    {admin.status === 'active' ? 'نشط' : 'معلّق'}
                  </Badge>
                </div>
                <div className="text-xs text-gray-400 mb-3">
                  {admin.last_login ? `آخر دخول: ${new Date(admin.last_login).toLocaleString('ar-MA')}` : 'لم يسجل دخوله بعد'}
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => handleToggleStatus(admin)}
                    className={`text-xs px-3 py-1.5 rounded-lg flex-1 ${admin.status === 'active' ? 'bg-orange-50 text-orange-700' : 'bg-green-50 text-green-700'}`}
                  >
                    {admin.status === 'active' ? 'تعليق' : 'تفعيل'}
                  </button>
                  <button onClick={() => handleDelete(admin)} className="text-xs bg-red-50 text-red-700 px-3 py-1.5 rounded-lg">
                    حذف
                  </button>
                </div>
              </div>
            ))}
            <p className="text-sm text-gray-500 text-center">إجمالي المشرفين: {total}</p>
          </div>

          {/* Desktop: Table */}
          <Card className="hidden sm:block">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-100">
                    <th className="text-right py-3 px-3 text-gray-500 font-medium">الاسم</th>
                    <th className="text-right py-3 px-3 text-gray-500 font-medium">البريد الإلكتروني</th>
                    <th className="text-right py-3 px-3 text-gray-500 font-medium">الهاتف</th>
                    <th className="text-right py-3 px-3 text-gray-500 font-medium">الحالة</th>
                    <th className="text-right py-3 px-3 text-gray-500 font-medium">تاريخ الإنشاء</th>
                    <th className="text-right py-3 px-3 text-gray-500 font-medium">آخر دخول</th>
                    <th className="text-right py-3 px-3 text-gray-500 font-medium">إجراءات</th>
                  </tr>
                </thead>
                <tbody>
                  {admins.map((admin) => (
                    <tr key={admin.id} className="border-b border-gray-50 hover:bg-gray-50/50">
                      <td className="py-3 px-3 font-medium">{admin.full_name}</td>
                      <td className="py-3 px-3 text-gray-600" dir="ltr">{admin.email}</td>
                      <td className="py-3 px-3 text-gray-600" dir="ltr">{admin.phone || '-'}</td>
                      <td className="py-3 px-3">
                        <Badge className={admin.status === 'active' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}>
                          {admin.status === 'active' ? 'نشط' : 'معلّق'}
                        </Badge>
                      </td>
                      <td className="py-3 px-3 text-gray-500 text-xs">{new Date(admin.created_at).toLocaleDateString('ar-MA')}</td>
                      <td className="py-3 px-3 text-gray-500 text-xs">{admin.last_login ? new Date(admin.last_login).toLocaleString('ar-MA') : 'لم يسجل دخوله بعد'}</td>
                      <td className="py-3 px-3">
                        <div className="flex gap-1 flex-wrap">
                          <button onClick={() => handleToggleStatus(admin)} className={`text-xs px-2 py-1 rounded-lg ${admin.status === 'active' ? 'bg-orange-50 text-orange-700 hover:bg-orange-100' : 'bg-green-50 text-green-700 hover:bg-green-100'}`}>
                            {admin.status === 'active' ? 'تعليق' : 'تفعيل'}
                          </button>
                          <button onClick={() => handleDelete(admin)} className="text-xs bg-red-50 text-red-700 hover:bg-red-100 px-2 py-1 rounded-lg">حذف</button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="mt-4 text-sm text-gray-500">إجمالي المشرفين: {total}</div>
          </Card>
        </>
      )}

      {/* Create Admin Modal */}
      <Modal isOpen={showCreateModal} onClose={() => { setShowCreateModal(false); setCreateError(''); }} title="إضافة مشرف جديد">
        <form onSubmit={handleCreate} className="space-y-4">
          {createError && (
            <div className="bg-danger-500/5 border border-danger-500/20 text-danger-500 text-sm p-3 rounded-xl">
              {createError}
            </div>
          )}

          <Input
            label="الاسم الكامل"
            placeholder="اسم المشرف"
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
            required
          />

          <Input
            label="البريد الإلكتروني"
            type="email"
            placeholder="admin@example.com"
            value={newEmail}
            onChange={(e) => setNewEmail(e.target.value)}
            required
            dir="ltr"
          />

          <Input
            label="كلمة المرور"
            type="password"
            placeholder="كلمة مرور قوية"
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
            required
            minLength={6}
          />

          <Input
            label="رقم الهاتف (اختياري)"
            type="tel"
            placeholder="06XXXXXXXX"
            value={newPhone}
            onChange={(e) => setNewPhone(e.target.value)}
            dir="ltr"
          />

          <div className="flex gap-3 pt-2">
            <Button type="submit" className="flex-1" loading={actionLoading}>
              إنشاء المشرف
            </Button>
            <Button type="button" variant="ghost" onClick={() => { setShowCreateModal(false); setCreateError(''); }}>
              إلغاء
            </Button>
          </div>
        </form>
      </Modal>

      {/* Success Modal */}
      <Modal isOpen={showSuccessModal} onClose={() => { setShowSuccessModal(false); setInfoCopied(false); }} title="تم إنشاء المشرف بنجاح">
        <div className="text-center">
          <div className="text-4xl mb-4">✅</div>
          <p className="text-gray-600 mb-6">
            تم إنشاء حساب المشرف <span className="font-bold">{createdAdmin?.name}</span> بنجاح
          </p>

          <div className="bg-gray-50 border border-gray-200 rounded-xl p-4 mb-4 text-right space-y-2">
            <div className="flex justify-between items-center">
              <span className="text-gray-500 text-sm">البريد الإلكتروني:</span>
              <span className="font-mono text-sm" dir="ltr">{createdAdmin?.email}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-gray-500 text-sm">كلمة المرور:</span>
              <span className="font-mono text-sm" dir="ltr">{createdAdmin?.password}</span>
            </div>
          </div>

          <div className="bg-gray-50 border border-gray-200 rounded-xl p-4 mb-6 text-sm text-right">
            <p className="text-gray-500 mb-1">رابط الدخول:</p>
            <p className="text-primary-600 font-inter" dir="ltr">
              {typeof window !== 'undefined' ? window.location.origin : ''}/login
            </p>
          </div>

          <p className="text-sm text-orange-600 bg-orange-50 p-3 rounded-xl mb-6">
            احفظ هذه البيانات! يمكن للمشرف تغيير كلمة المرور لاحقاً من إعدادات حسابه.
          </p>

          <div className="flex gap-3">
            <Button className="flex-1" onClick={copyCredentials}>
              {infoCopied ? 'تم النسخ!' : 'نسخ بيانات الدخول'}
            </Button>
            <Button variant="ghost" className="flex-1" onClick={() => { setShowSuccessModal(false); setInfoCopied(false); }}>
              إغلاق
            </Button>
          </div>
        </div>
      </Modal>
    </DashboardLayout>
  );
}
