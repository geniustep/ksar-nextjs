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
import type { InspectorResponse } from '@/lib/types';

export default function AdminInspectorsPage() {
  const [inspectors, setInspectors] = useState<InspectorResponse[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);

  // Create form
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newName, setNewName] = useState('');
  const [newPhone, setNewPhone] = useState('');
  const [createError, setCreateError] = useState('');

  // Code display
  const [showCodeModal, setShowCodeModal] = useState(false);
  const [displayCode, setDisplayCode] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [displayPhone, setDisplayPhone] = useState('');
  const [codeCopied, setCodeCopied] = useState(false);
  const [fullInfoCopied, setFullInfoCopied] = useState(false);
  const [copiedInspectorId, setCopiedInspectorId] = useState<string | null>(null);

  useEffect(() => {
    loadInspectors();
  }, []);

  const loadInspectors = async () => {
    try {
      const res = await adminApi.getInspectors({ limit: 100 });
      setInspectors(res.items);
      setTotal(res.total);
    } catch (err) {
      console.error('Failed to load inspectors:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setCreateError('');
    setActionLoading(true);

    try {
      const res = await adminApi.createInspector({
        full_name: newName,
        phone: newPhone,
      });
      setShowCreateModal(false);

      // Show the code
      setDisplayCode(res.access_code);
      setDisplayName(res.inspector.full_name);
      setDisplayPhone(newPhone);
      setShowCodeModal(true);

      setNewName('');
      setNewPhone('');
      await loadInspectors();
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

  const handleToggleStatus = async (inspector: InspectorResponse) => {
    const newStatus = inspector.status === 'active' ? 'suspended' : 'active';
    try {
      await adminApi.updateInspectorStatus(inspector.id, newStatus);
      await loadInspectors();
    } catch (err) {
      if (err instanceof ApiError) alert(err.detail);
    }
  };

  const handleRegenerateCode = async (inspector: InspectorResponse) => {
    if (!confirm(`هل تريد إعادة توليد كود الدخول لـ ${inspector.full_name}؟`)) return;
    try {
      const res = await adminApi.regenerateInspectorCode(inspector.id);
      setDisplayCode(res.access_code);
      setDisplayName(inspector.full_name);
      setDisplayPhone(inspector.phone || '');
      setShowCodeModal(true);
    } catch (err) {
      if (err instanceof ApiError) alert(err.detail);
    }
  };

  const handleDelete = async (inspector: InspectorResponse) => {
    if (!confirm(`هل أنت متأكد من حذف المراقب ${inspector.full_name}؟`)) return;
    try {
      await adminApi.deleteInspector(inspector.id);
      await loadInspectors();
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
    const text = `المراقب: ${displayName}\nرقم الهاتف: ${displayPhone}\nكود الدخول: ${displayCode}\n\nرابط الدخول: ${window.location.origin}/login (وضع الهاتف)`;
    await navigator.clipboard.writeText(text);
    setFullInfoCopied(true);
    setTimeout(() => setFullInfoCopied(false), 2000);
  };

  const copyInspectorCode = async (inspector: InspectorResponse) => {
    if (!inspector.access_code) return;
    await navigator.clipboard.writeText(inspector.access_code);
    setCopiedInspectorId(inspector.id);
    setTimeout(() => setCopiedInspectorId(null), 2000);
  };

  const showInspectorInfo = (inspector: InspectorResponse) => {
    if (!inspector.access_code) return;
    setDisplayCode(inspector.access_code);
    setDisplayName(inspector.full_name);
    setDisplayPhone(inspector.phone || '');
    setShowCodeModal(true);
  };

  return (
    <DashboardLayout>
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-neutral-dark">المراقبون</h1>
          <p className="text-gray-500 mt-1">إدارة حسابات المراقبين</p>
        </div>
        <Button onClick={() => setShowCreateModal(true)}>
          إضافة مراقب
        </Button>
      </div>

      <Card>
        {loading ? (
          <div className="flex justify-center py-12"><Spinner /></div>
        ) : inspectors.length === 0 ? (
          <div className="text-center py-12 text-gray-400">
            <p className="text-4xl mb-2">👁️</p>
            <p>لا يوجد مراقبون بعد</p>
            <Button className="mt-4" onClick={() => setShowCreateModal(true)}>
              إضافة أول مراقب
            </Button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-100">
                  <th className="text-right py-3 px-3 text-gray-500 font-medium">الاسم</th>
                  <th className="text-right py-3 px-3 text-gray-500 font-medium">الهاتف</th>
                  <th className="text-right py-3 px-3 text-gray-500 font-medium">الكود</th>
                  <th className="text-right py-3 px-3 text-gray-500 font-medium">الحالة</th>
                  <th className="text-right py-3 px-3 text-gray-500 font-medium">تاريخ الإنشاء</th>
                  <th className="text-right py-3 px-3 text-gray-500 font-medium">آخر دخول</th>
                  <th className="text-right py-3 px-3 text-gray-500 font-medium">إجراءات</th>
                </tr>
              </thead>
              <tbody>
                {inspectors.map((inspector) => (
                  <tr key={inspector.id} className="border-b border-gray-50 hover:bg-gray-50/50">
                    <td className="py-3 px-3 font-medium">{inspector.full_name}</td>
                    <td className="py-3 px-3 text-gray-600" dir="ltr">{inspector.phone || '-'}</td>
                    <td className="py-3 px-3">
                      {inspector.access_code ? (
                        <div className="flex items-center gap-1">
                          <span className="font-mono text-xs bg-gray-100 px-2 py-1 rounded" dir="ltr">
                            {inspector.access_code}
                          </span>
                          <button
                            onClick={() => copyInspectorCode(inspector)}
                            className="text-xs text-gray-500 hover:text-primary-600 transition-colors"
                            title="نسخ الكود"
                          >
                            {copiedInspectorId === inspector.id ? '✓' : '📋'}
                          </button>
                        </div>
                      ) : (
                        <span className="text-xs text-gray-400">-</span>
                      )}
                    </td>
                    <td className="py-3 px-3">
                      <Badge className={
                        inspector.status === 'active'
                          ? 'bg-green-100 text-green-800'
                          : 'bg-red-100 text-red-800'
                      }>
                        {inspector.status === 'active' ? 'نشط' : 'معطل'}
                      </Badge>
                    </td>
                    <td className="py-3 px-3 text-gray-500 text-xs">
                      {new Date(inspector.created_at).toLocaleDateString('ar-MA')}
                    </td>
                    <td className="py-3 px-3 text-gray-500 text-xs">
                      {inspector.last_login
                        ? new Date(inspector.last_login).toLocaleString('ar-MA')
                        : 'لم يسجل دخوله بعد'}
                    </td>
                    <td className="py-3 px-3">
                      <div className="flex gap-1 flex-wrap">
                        <button
                          onClick={() => handleToggleStatus(inspector)}
                          className={`text-xs px-2 py-1 rounded-lg transition-colors ${
                            inspector.status === 'active'
                              ? 'bg-orange-50 text-orange-700 hover:bg-orange-100'
                              : 'bg-green-50 text-green-700 hover:bg-green-100'
                          }`}
                        >
                          {inspector.status === 'active' ? 'تعطيل' : 'تفعيل'}
                        </button>
                        {inspector.access_code && (
                          <button
                            onClick={() => showInspectorInfo(inspector)}
                            className="text-xs bg-purple-50 text-purple-700 hover:bg-purple-100 px-2 py-1 rounded-lg transition-colors"
                          >
                            عرض البيانات
                          </button>
                        )}
                        <button
                          onClick={() => handleRegenerateCode(inspector)}
                          className="text-xs bg-blue-50 text-blue-700 hover:bg-blue-100 px-2 py-1 rounded-lg transition-colors"
                        >
                          كود جديد
                        </button>
                        <button
                          onClick={() => handleDelete(inspector)}
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
          إجمالي المراقبين: {total}
        </div>
      </Card>

      {/* Create Inspector Modal */}
      <Modal isOpen={showCreateModal} onClose={() => setShowCreateModal(false)} title="إضافة مراقب جديد">
        <form onSubmit={handleCreate} className="space-y-4">
          {createError && (
            <div className="bg-danger-500/5 border border-danger-500/20 text-danger-500 text-sm p-3 rounded-xl">
              {createError}
            </div>
          )}

          <Input
            label="الاسم الكامل"
            placeholder="اسم المراقب"
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

          <div className="flex gap-3 pt-2">
            <Button type="submit" className="flex-1" loading={actionLoading}>
              إنشاء المراقب
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
            بيانات الدخول لـ <span className="font-bold">{displayName}</span>
          </p>
          {displayPhone && (
            <p className="text-sm text-gray-400 mb-6" dir="ltr">{displayPhone}</p>
          )}

          <div className="bg-primary-50 border-2 border-primary-200 rounded-2xl p-6 mb-4">
            <p className="text-xs text-gray-500 mb-2">كود الدخول</p>
            <p className="text-4xl font-mono font-bold text-primary-700 tracking-[0.5em]" dir="ltr">
              {displayCode}
            </p>
          </div>

          <div className="bg-gray-50 border border-gray-200 rounded-xl p-4 mb-6 text-sm text-right">
            <p className="text-gray-500 mb-1">رابط الدخول:</p>
            <p className="text-primary-600 font-inter" dir="ltr">
              {typeof window !== 'undefined' ? window.location.origin : ''}/login
            </p>
            <p className="text-xs text-gray-400 mt-1">يختار وضع &quot;الدخول بالهاتف&quot;</p>
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
