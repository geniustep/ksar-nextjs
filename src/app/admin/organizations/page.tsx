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
  const [copiedOrgId, setCopiedOrgId] = useState<string | null>(null);
  const [visibleCodeIds, setVisibleCodeIds] = useState<Set<string>>(new Set());

  // Edit modal
  const [showEditModal, setShowEditModal] = useState(false);
  const [editOrg, setEditOrg] = useState<AdminOrgListItem | null>(null);
  const [editName, setEditName] = useState('');
  const [editPhone, setEditPhone] = useState('');
  const [editEmail, setEditEmail] = useState('');
  const [editDescription, setEditDescription] = useState('');
  const [editAddress, setEditAddress] = useState('');
  const [editCity, setEditCity] = useState('');
  const [editRegion, setEditRegion] = useState('');
  const [editServiceTypes, setEditServiceTypes] = useState('');
  const [editCoverageAreas, setEditCoverageAreas] = useState('');
  const [editLoading, setEditLoading] = useState(false);
  const [editError, setEditError] = useState('');

  // Set code modal
  const [showSetCodeModal, setShowSetCodeModal] = useState(false);
  const [setCodeOrg, setSetCodeOrg] = useState<AdminOrgListItem | null>(null);
  const [customCode, setCustomCode] = useState('');
  const [setCodeLoading, setSetCodeLoading] = useState(false);
  const [setCodeError, setSetCodeError] = useState('');

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

  const openSetCodeModal = (org: AdminOrgListItem) => {
    setSetCodeOrg(org);
    setCustomCode('');
    setSetCodeError('');
    setShowSetCodeModal(true);
  };

  const handleSetCode = async (useCustom: boolean) => {
    if (!setCodeOrg) return;
    if (useCustom && (customCode.length < 6 || customCode.length > 20)) {
      setSetCodeError('الكود يجب أن يكون بين 6 و 20 حرف');
      return;
    }
    setSetCodeLoading(true);
    setSetCodeError('');
    try {
      const res = await adminApi.regenerateOrgCode(setCodeOrg.id, useCustom ? customCode : undefined);
      setShowSetCodeModal(false);
      setDisplayCode(res.access_code);
      setDisplayName(setCodeOrg.name);
      setDisplayPhone(setCodeOrg.contact_phone);
      setShowCodeModal(true);
      await loadData();
    } catch (err) {
      if (err instanceof ApiError) {
        setSetCodeError(err.detail);
      } else {
        setSetCodeError('خطأ في الاتصال بالخادم');
      }
    } finally {
      setSetCodeLoading(false);
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

  const openEditModal = (org: AdminOrgListItem) => {
    setEditOrg(org);
    setEditName(org.name || '');
    setEditPhone(org.contact_phone || '');
    setEditEmail(org.contact_email || '');
    setEditDescription(org.description || '');
    setEditAddress(org.address || '');
    setEditCity(org.city || '');
    setEditRegion(org.region || '');
    setEditServiceTypes((org.service_types || []).join(', '));
    setEditCoverageAreas((org.coverage_areas || []).join(', '));
    setEditError('');
    setShowEditModal(true);
  };

  const handleEditSave = async () => {
    if (!editOrg) return;
    setEditLoading(true);
    setEditError('');

    try {
      const data: Record<string, unknown> = {};

      if (editName !== (editOrg.name || '')) data.name = editName;
      if (editPhone !== (editOrg.contact_phone || '')) data.phone = editPhone;
      if (editEmail !== (editOrg.contact_email || '')) data.email = editEmail || null;
      if (editDescription !== (editOrg.description || '')) data.description = editDescription || null;
      if (editAddress !== (editOrg.address || '')) data.address = editAddress || null;
      if (editCity !== (editOrg.city || '')) data.city = editCity || null;
      if (editRegion !== (editOrg.region || '')) data.region = editRegion || null;

      const newServiceTypes = editServiceTypes.split(',').map(s => s.trim()).filter(Boolean);
      const oldServiceTypes = (editOrg.service_types || []).join(', ');
      if (editServiceTypes !== oldServiceTypes) data.service_types = newServiceTypes;

      const newCoverageAreas = editCoverageAreas.split(',').map(s => s.trim()).filter(Boolean);
      const oldCoverageAreas = (editOrg.coverage_areas || []).join(', ');
      if (editCoverageAreas !== oldCoverageAreas) data.coverage_areas = newCoverageAreas;

      if (Object.keys(data).length === 0) {
        setEditError('لم يتم تغيير أي بيانات');
        setEditLoading(false);
        return;
      }

      await adminApi.updateOrganization(editOrg.id, data);
      setShowEditModal(false);
      await loadData();
    } catch (err) {
      if (err instanceof ApiError) {
        setEditError(err.detail);
      } else {
        setEditError('خطأ في الاتصال بالخادم');
      }
    } finally {
      setEditLoading(false);
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

  const copyOrgCode = async (org: AdminOrgListItem) => {
    if (!org.access_code) return;
    await navigator.clipboard.writeText(org.access_code);
    setCopiedOrgId(org.id);
    setTimeout(() => setCopiedOrgId(null), 2000);
  };

  const toggleCodeVisibility = (orgId: string) => {
    setVisibleCodeIds((prev) => {
      const next = new Set(prev);
      if (next.has(orgId)) {
        next.delete(orgId);
      } else {
        next.add(orgId);
      }
      return next;
    });
  };

  return (
    <DashboardLayout>
      <div className="mb-4 sm:mb-6 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-neutral-dark">المؤسسات والجمعيات</h1>
          <p className="text-gray-500 text-sm mt-1">إنشاء وإدارة حسابات المؤسسات والجمعيات</p>
        </div>
        <Button onClick={() => setShowCreateModal(true)} className="w-full sm:w-auto">
          إضافة مؤسسة
        </Button>
      </div>

      {/* Filter */}
      <div className="mb-4 sm:mb-6 flex flex-col sm:flex-row items-start sm:items-center gap-3">
        <Select
          options={[
            { value: '', label: 'جميع الحالات' },
            { value: 'active', label: 'نشط' },
            { value: 'suspended', label: 'معلق' },
          ]}
          value={statusFilter}
          onChange={(e) => { setStatusFilter(e.target.value); setPage(1); }}
          className="w-full sm:max-w-xs"
        />
        <span className="text-sm text-gray-500">{total} مؤسسة</span>
      </div>

      {loading ? (
        <div className="flex justify-center py-12"><Spinner /></div>
      ) : orgs.length === 0 ? (
        <Card>
          <div className="text-center py-12 text-gray-400">
            <p className="text-4xl mb-2">🏢</p>
            <p>لا توجد مؤسسات بعد</p>
            <Button className="mt-4" onClick={() => setShowCreateModal(true)}>
              إضافة أول مؤسسة
            </Button>
          </div>
        </Card>
      ) : (
        <>
          {/* Mobile: Cards */}
          <div className="sm:hidden space-y-3">
            {orgs.map((org) => (
              <div key={org.id} className="bg-white rounded-xl border border-gray-200 p-4">
                <div className="flex items-start justify-between mb-3">
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-gray-900">{org.name}</p>
                    <p className="text-xs text-gray-500 mt-0.5" dir="ltr">{org.contact_phone}</p>
                  </div>
                  <Badge className={org.status === 'active' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}>
                    {org.status === 'active' ? 'نشط' : 'معلق'}
                  </Badge>
                </div>
                <div className="flex items-center gap-3 text-xs text-gray-500 mb-3">
                  <span className="text-green-600 font-medium">{org.total_completed} مكتمل</span>
                  <span className="text-gray-300">|</span>
                  <span>{formatDate(org.created_at)}</span>
                </div>
                {org.access_code && (
                  <div className="flex items-center gap-2 mb-3 bg-gray-50 p-2 rounded-lg">
                    <span className="font-mono text-xs bg-white text-gray-700 px-2 py-1 rounded border border-gray-200 flex-1 text-center" dir="ltr">
                      {visibleCodeIds.has(org.id) ? org.access_code : '••••••••••'}
                    </span>
                    <button onClick={() => toggleCodeVisibility(org.id)} className="text-xs px-2 py-1.5 rounded-lg text-gray-500 hover:bg-gray-200">
                      {visibleCodeIds.has(org.id) ? '🙈' : '👁️'}
                    </button>
                    <button
                      onClick={() => copyOrgCode(org)}
                      className={`text-xs px-2 py-1.5 rounded-lg font-medium ${copiedOrgId === org.id ? 'bg-green-100 text-green-700' : 'bg-white text-gray-600 border border-gray-200'}`}
                    >
                      {copiedOrgId === org.id ? '✓' : '📋'}
                    </button>
                  </div>
                )}
                <div className="flex gap-2 flex-wrap">
                  <button
                    onClick={() => handleStatusChange(org.id, org.status === 'active' ? 'suspended' : 'active')}
                    className={`text-xs px-3 py-1.5 rounded-lg transition-colors flex-1 ${org.status === 'active' ? 'bg-orange-50 text-orange-700' : 'bg-green-50 text-green-700'}`}
                  >
                    {org.status === 'active' ? 'تعليق' : 'تفعيل'}
                  </button>
                  <button onClick={() => openEditModal(org)} className="text-xs bg-purple-50 text-purple-700 px-3 py-1.5 rounded-lg flex-1">
                    تعديل
                  </button>
                  <button onClick={() => openSetCodeModal(org)} className="text-xs bg-blue-50 text-blue-700 px-3 py-1.5 rounded-lg flex-1">
                    تعيين كود
                  </button>
                  <button onClick={() => handleDelete(org)} className="text-xs bg-red-50 text-red-700 px-3 py-1.5 rounded-lg">
                    حذف
                  </button>
                </div>
              </div>
            ))}
          </div>

          {/* Desktop: Table */}
          <Card className="hidden sm:block">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-100">
                    <th className="text-right py-3 px-3 text-gray-500 font-medium">المؤسسة</th>
                    <th className="text-right py-3 px-3 text-gray-500 font-medium">الهاتف</th>
                    <th className="text-right py-3 px-3 text-gray-500 font-medium">الكود</th>
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
                      <td className="py-3 px-3">
                        {org.access_code ? (
                          <div className="flex items-center gap-1.5">
                            <span className="font-mono text-xs bg-gray-100 text-gray-700 px-2.5 py-1.5 rounded-lg font-semibold tracking-wider border border-gray-200 select-none" dir="ltr">
                              {visibleCodeIds.has(org.id) ? org.access_code : '••••••••••'}
                            </span>
                            <button onClick={() => toggleCodeVisibility(org.id)} className="text-xs px-1.5 py-1.5 rounded-lg text-gray-500 hover:bg-gray-100">
                              {visibleCodeIds.has(org.id) ? '🙈' : '👁️'}
                            </button>
                            <button
                              onClick={() => copyOrgCode(org)}
                              className={`text-xs px-2 py-1.5 rounded-lg font-medium ${copiedOrgId === org.id ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-600 hover:bg-primary-50 hover:text-primary-700'}`}
                            >
                              {copiedOrgId === org.id ? '✓ تم' : '📋 نسخ'}
                            </button>
                          </div>
                        ) : (
                          <span className="text-xs text-gray-400">-</span>
                        )}
                      </td>
                      <td className="py-3 px-3">
                        <Badge className={org.status === 'active' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}>
                          {org.status === 'active' ? 'نشط' : 'معلق'}
                        </Badge>
                      </td>
                      <td className="py-3 px-3 text-center font-medium text-green-600">{org.total_completed}</td>
                      <td className="py-3 px-3 text-gray-500 text-xs">{formatDate(org.created_at)}</td>
                      <td className="py-3 px-3">
                        <div className="flex gap-1 flex-wrap">
                          <button
                            onClick={() => handleStatusChange(org.id, org.status === 'active' ? 'suspended' : 'active')}
                            className={`text-xs px-2 py-1 rounded-lg transition-colors ${org.status === 'active' ? 'bg-orange-50 text-orange-700 hover:bg-orange-100' : 'bg-green-50 text-green-700 hover:bg-green-100'}`}
                          >
                            {org.status === 'active' ? 'تعليق' : 'تفعيل'}
                          </button>
                          <button onClick={() => openEditModal(org)} className="text-xs bg-purple-50 text-purple-700 hover:bg-purple-100 px-2 py-1 rounded-lg transition-colors">
                            تعديل
                          </button>
                          <button onClick={() => openSetCodeModal(org)} className="text-xs bg-blue-50 text-blue-700 hover:bg-blue-100 px-2 py-1 rounded-lg transition-colors">
                            تعيين كود
                          </button>
                          <button onClick={() => handleDelete(org)} className="text-xs bg-red-50 text-red-700 hover:bg-red-100 px-2 py-1 rounded-lg transition-colors">
                            حذف
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="mt-4 text-sm text-gray-500">إجمالي المؤسسات: {total}</div>
          </Card>
        </>
      )}

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

      {/* Set Code Modal */}
      <Modal isOpen={showSetCodeModal} onClose={() => setShowSetCodeModal(false)} title={`تعيين كود الدخول - ${setCodeOrg?.name || ''}`}>
        <div>
          {setCodeError && (
            <div className="bg-danger-500/5 border border-danger-500/20 text-danger-500 text-sm p-3 rounded-xl mb-4">
              {setCodeError}
            </div>
          )}

          <div className="bg-gray-50 border border-gray-200 rounded-xl p-4 mb-4">
            <h4 className="text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2">
              <span>✏️</span> كتابة كود مخصص
            </h4>
            <div className="flex gap-2">
              <input
                type="text"
                value={customCode}
                onChange={(e) => setCustomCode(e.target.value.replace(/\s/g, '').slice(0, 20))}
                placeholder="code"
                maxLength={20}
                dir="ltr"
                className="flex-1 rounded-xl border border-gray-300 px-4 py-3 text-center font-mono text-lg tracking-wider focus:border-primary-500 focus:ring-2 focus:ring-primary-100 focus:outline-none"
              />
              <Button
                onClick={() => handleSetCode(true)}
                loading={setCodeLoading}
                disabled={customCode.length < 6 || customCode.length > 20}
                className="whitespace-nowrap"
              >
                تعيين
              </Button>
            </div>
            <p className="text-xs text-gray-400 mt-2">اكتب كود من 6 إلى 20 حرف (أحرف، أرقام، رموز - أي شيء ما عدا المسافات)</p>
          </div>

          <div className="flex items-center gap-3 my-4">
            <div className="flex-1 h-px bg-gray-200" />
            <span className="text-xs text-gray-400 font-medium">أو</span>
            <div className="flex-1 h-px bg-gray-200" />
          </div>

          <Button
            variant="secondary"
            className="w-full"
            onClick={() => handleSetCode(false)}
            loading={setCodeLoading}
          >
            🔄 توليد كود تلقائي
          </Button>

          <Button variant="ghost" className="w-full mt-3" onClick={() => setShowSetCodeModal(false)}>
            إلغاء
          </Button>
        </div>
      </Modal>

      {/* Edit Organization Modal */}
      <Modal isOpen={showEditModal} onClose={() => setShowEditModal(false)} title={`تعديل المؤسسة - ${editOrg?.name || ''}`}>
        <div className="space-y-4">
          {editError && (
            <div className="bg-danger-500/5 border border-danger-500/20 text-danger-500 text-sm p-3 rounded-xl">
              {editError}
            </div>
          )}

          <Input
            label="اسم المؤسسة"
            placeholder="اسم الجمعية أو المؤسسة"
            value={editName}
            onChange={(e) => setEditName(e.target.value)}
          />

          <Input
            label="رقم الهاتف"
            type="tel"
            placeholder="06XXXXXXXX"
            value={editPhone}
            onChange={(e) => setEditPhone(e.target.value)}
            dir="ltr"
          />

          <Input
            label="البريد الإلكتروني"
            type="email"
            placeholder="org@example.com"
            value={editEmail}
            onChange={(e) => setEditEmail(e.target.value)}
            dir="ltr"
          />

          <div className="grid grid-cols-2 gap-3">
            <Input
              label="المدينة"
              placeholder="المدينة"
              value={editCity}
              onChange={(e) => setEditCity(e.target.value)}
            />
            <Input
              label="المنطقة"
              placeholder="المنطقة"
              value={editRegion}
              onChange={(e) => setEditRegion(e.target.value)}
            />
          </div>

          <Input
            label="العنوان"
            placeholder="عنوان المؤسسة"
            value={editAddress}
            onChange={(e) => setEditAddress(e.target.value)}
          />

          <Textarea
            label="وصف المؤسسة"
            placeholder="نبذة مختصرة عن المؤسسة ونشاطها..."
            value={editDescription}
            onChange={(e) => setEditDescription(e.target.value)}
            rows={3}
          />

          <Input
            label="أنواع الخدمات (مفصولة بفاصلة)"
            placeholder="مساعدة اجتماعية, توزيع غذائي, ..."
            value={editServiceTypes}
            onChange={(e) => setEditServiceTypes(e.target.value)}
          />

          <Input
            label="مناطق التغطية (مفصولة بفاصلة)"
            placeholder="المدينة القديمة, الحي الجديد, ..."
            value={editCoverageAreas}
            onChange={(e) => setEditCoverageAreas(e.target.value)}
          />

          <div className="flex gap-3 pt-2">
            <Button className="flex-1" onClick={handleEditSave} loading={editLoading}>
              حفظ التعديلات
            </Button>
            <Button type="button" variant="ghost" onClick={() => setShowEditModal(false)}>
              إلغاء
            </Button>
          </div>
        </div>
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
            <p className="text-3xl sm:text-4xl font-mono font-bold text-primary-700 tracking-[0.3em]" dir="ltr">
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
