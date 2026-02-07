'use client';

import React, { useEffect, useState } from 'react';
import DashboardLayout from '@/components/DashboardLayout';
import { Card } from '@/components/ui/Card';
import Badge from '@/components/ui/Badge';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import Textarea from '@/components/ui/Textarea';
import Select from '@/components/ui/Select';
import Modal from '@/components/ui/Modal';
import Spinner from '@/components/ui/Spinner';
import { adminApi, ApiError } from '@/lib/api';
import { formatDate } from '@/lib/utils';
import type { AdminOrgListItem } from '@/lib/types';

export default function AdminOrganizationsPage() {
  const [orgs, setOrgs] = useState<AdminOrgListItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [statusFilter, setStatusFilter] = useState('');
  const [actionLoading, setActionLoading] = useState(false);

  // Create form
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newName, setNewName] = useState('');
  const [newPhone, setNewPhone] = useState('');
  const [newEmail, setNewEmail] = useState('');
  const [newDescription, setNewDescription] = useState('');
  const [newCity, setNewCity] = useState('');
  const [newRegion, setNewRegion] = useState('');
  const [createError, setCreateError] = useState('');

  // Code display
  const [showCodeModal, setShowCodeModal] = useState(false);
  const [displayCode, setDisplayCode] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [displayPhone, setDisplayPhone] = useState('');
  const [codeCopied, setCodeCopied] = useState(false);
  const [fullInfoCopied, setFullInfoCopied] = useState(false);

  useEffect(() => {
    loadData();
  }, [page, statusFilter]);

  const loadData = async () => {
    setLoading(true);
    try {
      const data = await adminApi.getOrganizations({
        status: statusFilter || undefined,
        page,
        limit: 20,
      });
      setOrgs(data.items);
      setTotal(data.total);
    } catch (err) {
      console.error('Failed to load orgs:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setCreateError('');
    setActionLoading(true);

    try {
      const res = await adminApi.createOrganization({
        name: newName,
        phone: newPhone,
        email: newEmail || undefined,
        description: newDescription || undefined,
        city: newCity || undefined,
        region: newRegion || undefined,
      });
      setShowCreateModal(false);
      setNewName('');
      setNewPhone('');
      setNewEmail('');
      setNewDescription('');
      setNewCity('');
      setNewRegion('');

      // Show the code
      setDisplayCode(res.access_code);
      setDisplayName(res.organization.name);
      setDisplayPhone(newPhone);
      setShowCodeModal(true);

      await loadData();
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

  const handleStatusChange = async (orgId: string, newStatus: string) => {
    try {
      await adminApi.updateOrgStatus(orgId, newStatus);
      await loadData();
    } catch (err) {
      if (err instanceof ApiError) alert(err.detail);
    }
  };

  const handleRegenerateCode = async (org: AdminOrgListItem) => {
    if (!confirm(`هل تريد إعادة توليد كود الدخول لـ ${org.name}؟`)) return;
    try {
      const res = await adminApi.regenerateOrgCode(org.id);
      setDisplayCode(res.access_code);
      setDisplayName(org.name);
      setDisplayPhone(org.contact_phone);
      setShowCodeModal(true);
    } catch (err) {
      if (err instanceof ApiError) alert(err.detail);
    }
  };

  const handleDelete = async (org: AdminOrgListItem) => {
    if (!confirm(`هل أنت متأكد من حذف المؤسسة ${org.name}؟ هذا الإجراء لا يمكن التراجع عنه.`)) return;
    try {
      await adminApi.deleteOrganization(org.id);
      await loadData();
    } catch (err) {
      if (err instanceof ApiError) alert(err.detail);
    }
  };

  const copyCode = async () => {
    await navigator.clipboard.writeText(displayCode);
    setCodeCopied(true);
    setTimeout(() => setCodeCopied(false), 2000);
  };

  const copyFullInfo = async () => {
    const text = `المؤسسة: ${displayName}\nرقم الهاتف: ${displayPhone}\nكود الدخول: ${displayCode}\n\nرابط الدخول: ${window.location.origin}/org-auth`;
    await navigator.clipboard.writeText(text);
    setFullInfoCopied(true);
    setTimeout(() => setFullInfoCopied(false), 2000);
  };

  return (
    <DashboardLayout>
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-neutral-dark">المؤسسات والجمعيات</h1>
          <p className="text-gray-500 mt-1">إنشاء وإدارة حسابات المؤسسات والجمعيات</p>
        </div>
        <Button onClick={() => setShowCreateModal(true)}>
          إضافة مؤسسة
        </Button>
      </div>

      {/* Filter */}
      <div className="mb-6 flex items-center gap-3">
        <Select
          options={[
            { value: '', label: 'جميع الحالات' },
            { value: 'active', label: 'نشط' },
            { value: 'suspended', label: 'معلق' },
          ]}
          value={statusFilter}
          onChange={(e) => { setStatusFilter(e.target.value); setPage(1); }}
          className="max-w-xs"
        />
        <span className="text-sm text-gray-500">{total} مؤسسة</span>
      </div>

      <Card>
        {loading ? (
          <div className="flex justify-center py-12"><Spinner /></div>
        ) : orgs.length === 0 ? (
          <div className="text-center py-12 text-gray-400">
            <p className="text-4xl mb-2">🏢</p>
            <p>لا توجد مؤسسات بعد</p>
            <Button className="mt-4" onClick={() => setShowCreateModal(true)}>
              إضافة أول مؤسسة
            </Button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-100">
                  <th className="text-right py-3 px-3 text-gray-500 font-medium">المؤسسة</th>
                  <th className="text-right py-3 px-3 text-gray-500 font-medium">الهاتف</th>
                  <th className="text-right py-3 px-3 text-gray-500 font-medium">البريد</th>
                  <th className="text-right py-3 px-3 text-gray-500 font-medium">الحالة</th>
                  <th className="text-center py-3 px-3 text-gray-500 font-medium">المنجز</th>
                  <th className="text-right py-3 px-3 text-gray-500 font-medium">التسجيل</th>
                  <th className="text-right py-3 px-3 text-gray-500 font-medium">إجراءات</th>
                </tr>
              </thead>
              <tbody>
                {orgs.map((org) => (
                  <tr key={org.id} className="border-b border-gray-50 hover:bg-gray-50/50">
                    <td className="py-3 px-3 font-medium">{org.name}</td>
                    <td className="py-3 px-3 text-gray-600" dir="ltr">{org.contact_phone}</td>
                    <td className="py-3 px-3 text-gray-500" dir="ltr">{org.contact_email || '-'}</td>
                    <td className="py-3 px-3">
                      <Badge className={
                        org.status === 'active'
                          ? 'bg-green-100 text-green-800'
                          : 'bg-red-100 text-red-800'
                      }>
                        {org.status === 'active' ? 'نشط' : 'معلق'}
                      </Badge>
                    </td>
                    <td className="py-3 px-3 text-center font-medium text-green-600">
                      {org.total_completed}
                    </td>
                    <td className="py-3 px-3 text-gray-500 text-xs">
                      {formatDate(org.created_at)}
                    </td>
                    <td className="py-3 px-3">
                      <div className="flex gap-1 flex-wrap">
                        <button
                          onClick={() => handleStatusChange(org.id, org.status === 'active' ? 'suspended' : 'active')}
                          className={`text-xs px-2 py-1 rounded-lg transition-colors ${
                            org.status === 'active'
                              ? 'bg-orange-50 text-orange-700 hover:bg-orange-100'
                              : 'bg-green-50 text-green-700 hover:bg-green-100'
                          }`}
                        >
                          {org.status === 'active' ? 'تعليق' : 'تفعيل'}
                        </button>
                        <button
                          onClick={() => handleRegenerateCode(org)}
                          className="text-xs bg-blue-50 text-blue-700 hover:bg-blue-100 px-2 py-1 rounded-lg transition-colors"
                        >
                          كود جديد
                        </button>
                        <button
                          onClick={() => handleDelete(org)}
                          className="text-xs bg-red-50 text-red-700 hover:bg-red-100 px-2 py-1 rounded-lg transition-colors"
                        >
                          حذف
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        <div className="mt-4 text-sm text-gray-500">
          إجمالي المؤسسات: {total}
        </div>
      </Card>

      {/* Pagination */}
      {total > 20 && (
        <div className="flex items-center justify-between mt-6">
          <Button variant="secondary" disabled={page <= 1} onClick={() => setPage(page - 1)}>
            السابق
          </Button>
          <span className="text-sm text-gray-500">صفحة {page}</span>
          <Button variant="secondary" disabled={orgs.length < 20} onClick={() => setPage(page + 1)}>
            التالي
          </Button>
        </div>
      )}

      {/* Create Organization Modal */}
      <Modal isOpen={showCreateModal} onClose={() => setShowCreateModal(false)} title="إضافة مؤسسة جديدة">
        <form onSubmit={handleCreate} className="space-y-4">
          {createError && (
            <div className="bg-danger-500/5 border border-danger-500/20 text-danger-500 text-sm p-3 rounded-xl">
              {createError}
            </div>
          )}

          <Input
            label="اسم المؤسسة"
            placeholder="اسم الجمعية أو المؤسسة"
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
            required
          />

          <Input
            label="رقم الهاتف"
            type="tel"
            placeholder="06XXXXXXXX"
            value={newPhone}
            onChange={(e) => setNewPhone(e.target.value)}
            required
            dir="ltr"
          />

          <Input
            label="البريد الإلكتروني (اختياري)"
            type="email"
            placeholder="org@example.com"
            value={newEmail}
            onChange={(e) => setNewEmail(e.target.value)}
            dir="ltr"
          />

          <div className="grid grid-cols-2 gap-3">
            <Input
              label="المدينة (اختياري)"
              placeholder="المدينة"
              value={newCity}
              onChange={(e) => setNewCity(e.target.value)}
            />
            <Input
              label="المنطقة (اختياري)"
              placeholder="المنطقة"
              value={newRegion}
              onChange={(e) => setNewRegion(e.target.value)}
            />
          </div>

          <Textarea
            label="وصف المؤسسة (اختياري)"
            placeholder="نبذة مختصرة عن المؤسسة ونشاطها..."
            value={newDescription}
            onChange={(e) => setNewDescription(e.target.value)}
            rows={3}
          />

          <div className="flex gap-3 pt-2">
            <Button type="submit" className="flex-1" loading={actionLoading}>
              إنشاء المؤسسة
            </Button>
            <Button type="button" variant="ghost" onClick={() => setShowCreateModal(false)}>
              إلغاء
            </Button>
          </div>
        </form>
      </Modal>

      {/* Code Display Modal */}
      <Modal isOpen={showCodeModal} onClose={() => { setShowCodeModal(false); setCodeCopied(false); setFullInfoCopied(false); }} title="بيانات الدخول">
        <div className="text-center">
          <div className="text-4xl mb-4">🔑</div>
          <p className="text-gray-500 mb-2">
            بيانات الدخول لمؤسسة <span className="font-bold">{displayName}</span>
          </p>
          <p className="text-sm text-gray-400 mb-6" dir="ltr">{displayPhone}</p>

          <div className="bg-primary-50 border-2 border-primary-200 rounded-2xl p-6 mb-4">
            <p className="text-xs text-gray-500 mb-2">كود الدخول</p>
            <p className="text-4xl font-mono font-bold text-primary-700 tracking-[0.5em]" dir="ltr">
              {displayCode}
            </p>
          </div>

          <div className="bg-gray-50 border border-gray-200 rounded-xl p-4 mb-6 text-sm text-right">
            <p className="text-gray-500 mb-1">رابط الدخول:</p>
            <p className="text-primary-600 font-inter" dir="ltr">
              {typeof window !== 'undefined' ? window.location.origin : ''}/org-auth
            </p>
          </div>

          <p className="text-sm text-orange-600 bg-orange-50 p-3 rounded-xl mb-6">
            احفظ هذه البيانات! لن يظهر الكود مرة أخرى. يمكنك إعادة توليد كود جديد في أي وقت.
          </p>

          <div className="flex gap-3">
            <Button className="flex-1" onClick={copyCode}>
              {codeCopied ? 'تم النسخ!' : 'نسخ الكود'}
            </Button>
            <Button variant="secondary" className="flex-1" onClick={copyFullInfo}>
              {fullInfoCopied ? 'تم النسخ!' : 'نسخ كل البيانات'}
            </Button>
          </div>

          <Button variant="ghost" className="mt-3 w-full" onClick={() => { setShowCodeModal(false); setCodeCopied(false); setFullInfoCopied(false); }}>
            إغلاق
          </Button>
        </div>
      </Modal>
    </DashboardLayout>
  );
}
