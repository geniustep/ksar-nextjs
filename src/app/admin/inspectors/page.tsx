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
  const [visibleCodeIds, setVisibleCodeIds] = useState<Set<string>>(new Set());

  // Set code modal
  const [showSetCodeModal, setShowSetCodeModal] = useState(false);
  const [setCodeInspector, setSetCodeInspector] = useState<InspectorResponse | null>(null);
  const [customCode, setCustomCode] = useState('');
  const [setCodeLoading, setSetCodeLoading] = useState(false);
  const [setCodeError, setSetCodeError] = useState('');

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

  const openSetCodeModal = (inspector: InspectorResponse) => {
    setSetCodeInspector(inspector);
    setCustomCode('');
    setSetCodeError('');
    setShowSetCodeModal(true);
  };

  const handleSetCode = async (useCustom: boolean) => {
    if (!setCodeInspector) return;

    if (useCustom && (customCode.length < 6 || customCode.length > 20)) {
      setSetCodeError('الكود يجب أن يكون بين 6 و 20 حرف');
      return;
    }

    setSetCodeLoading(true);
    setSetCodeError('');
    try {
      const res = await adminApi.regenerateInspectorCode(
        setCodeInspector.id,
        useCustom ? customCode : undefined
      );
      setShowSetCodeModal(false);
      setDisplayCode(res.access_code);
      setDisplayName(setCodeInspector.full_name);
      setDisplayPhone(setCodeInspector.phone || '');
      setShowCodeModal(true);
      await loadInspectors();
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

  const toggleCodeVisibility = (inspectorId: string) => {
    setVisibleCodeIds((prev) => {
      const next = new Set(prev);
      if (next.has(inspectorId)) {
        next.delete(inspectorId);
      } else {
        next.add(inspectorId);
      }
      return next;
    });
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
      <div className="mb-4 sm:mb-6 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-neutral-dark">المراقبون</h1>
          <p className="text-gray-500 text-sm mt-1">إدارة حسابات المراقبين</p>
        </div>
        <Button onClick={() => setShowCreateModal(true)} className="w-full sm:w-auto">
          إضافة مراقب
        </Button>
      </div>

      {loading ? (
        <div className="flex justify-center py-12"><Spinner /></div>
      ) : inspectors.length === 0 ? (
        <Card>
          <div className="text-center py-12 text-gray-400">
            <p className="text-4xl mb-2">👁️</p>
            <p>لا يوجد مراقبون بعد</p>
            <Button className="mt-4" onClick={() => setShowCreateModal(true)}>
              إضافة أول مراقب
            </Button>
          </div>
        </Card>
      ) : (
        <>
          {/* Mobile: Cards */}
          <div className="sm:hidden space-y-3">
            {inspectors.map((inspector) => (
              <div key={inspector.id} className="bg-white rounded-xl border border-gray-200 p-4">
                <div className="flex items-start justify-between mb-2">
                  <div>
                    <p className="font-semibold text-gray-900">{inspector.full_name}</p>
                    <p className="text-xs text-gray-500 mt-0.5" dir="ltr">{inspector.phone || '-'}</p>
                  </div>
                  <Badge className={inspector.status === 'active' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}>
                    {inspector.status === 'active' ? 'نشط' : 'معطل'}
                  </Badge>
                </div>
                <div className="text-xs text-gray-400 mb-3">
                  {inspector.last_login ? `آخر دخول: ${new Date(inspector.last_login).toLocaleString('ar-MA')}` : 'لم يسجل دخوله بعد'}
                </div>
                {inspector.access_code && (
                  <div className="flex items-center gap-2 mb-3 bg-gray-50 p-2 rounded-lg">
                    <span className="font-mono text-xs bg-white text-gray-700 px-2 py-1 rounded border border-gray-200 flex-1 text-center" dir="ltr">
                      {visibleCodeIds.has(inspector.id) ? inspector.access_code : '••••••••••'}
                    </span>
                    <button onClick={() => toggleCodeVisibility(inspector.id)} className="text-xs px-2 py-1.5 rounded-lg text-gray-500">
                      {visibleCodeIds.has(inspector.id) ? '🙈' : '👁️'}
                    </button>
                    <button
                      onClick={() => copyInspectorCode(inspector)}
                      className={`text-xs px-2 py-1.5 rounded-lg font-medium ${copiedInspectorId === inspector.id ? 'bg-green-100 text-green-700' : 'bg-white text-gray-600 border border-gray-200'}`}
                    >
                      {copiedInspectorId === inspector.id ? '✓' : '📋'}
                    </button>
                  </div>
                )}
                <div className="flex gap-2 flex-wrap">
                  <button
                    onClick={() => handleToggleStatus(inspector)}
                    className={`text-xs px-3 py-1.5 rounded-lg flex-1 ${inspector.status === 'active' ? 'bg-orange-50 text-orange-700' : 'bg-green-50 text-green-700'}`}
                  >
                    {inspector.status === 'active' ? 'تعطيل' : 'تفعيل'}
                  </button>
                  {inspector.access_code && (
                    <button onClick={() => showInspectorInfo(inspector)} className="text-xs bg-purple-50 text-purple-700 px-3 py-1.5 rounded-lg">
                      بيانات
                    </button>
                  )}
                  <button onClick={() => openSetCodeModal(inspector)} className="text-xs bg-blue-50 text-blue-700 px-3 py-1.5 rounded-lg">
                    كود
                  </button>
                  <button onClick={() => handleDelete(inspector)} className="text-xs bg-red-50 text-red-700 px-3 py-1.5 rounded-lg">
                    حذف
                  </button>
                </div>
              </div>
            ))}
            <p className="text-sm text-gray-500 text-center">إجمالي المراقبين: {total}</p>
          </div>

          {/* Desktop: Table */}
          <Card className="hidden sm:block">
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
                          <div className="flex items-center gap-1.5">
                            <span className="font-mono text-xs bg-gray-100 text-gray-700 px-2.5 py-1.5 rounded-lg font-semibold tracking-wider border border-gray-200 select-none" dir="ltr">
                              {visibleCodeIds.has(inspector.id) ? inspector.access_code : '••••••••••'}
                            </span>
                            <button onClick={() => toggleCodeVisibility(inspector.id)} className="text-xs px-1.5 py-1.5 rounded-lg text-gray-500 hover:bg-gray-100">
                              {visibleCodeIds.has(inspector.id) ? '🙈' : '👁️'}
                            </button>
                            <button
                              onClick={() => copyInspectorCode(inspector)}
                              className={`text-xs px-2 py-1.5 rounded-lg font-medium ${copiedInspectorId === inspector.id ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-600 hover:bg-primary-50 hover:text-primary-700'}`}
                            >
                              {copiedInspectorId === inspector.id ? '✓ تم' : '📋 نسخ'}
                            </button>
                          </div>
                        ) : (
                          <span className="text-xs text-gray-400">-</span>
                        )}
                      </td>
                      <td className="py-3 px-3">
                        <Badge className={inspector.status === 'active' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}>
                          {inspector.status === 'active' ? 'نشط' : 'معطل'}
                        </Badge>
                      </td>
                      <td className="py-3 px-3 text-gray-500 text-xs">{new Date(inspector.created_at).toLocaleDateString('ar-MA')}</td>
                      <td className="py-3 px-3 text-gray-500 text-xs">{inspector.last_login ? new Date(inspector.last_login).toLocaleString('ar-MA') : 'لم يسجل دخوله بعد'}</td>
                      <td className="py-3 px-3">
                        <div className="flex gap-1 flex-wrap">
                          <button onClick={() => handleToggleStatus(inspector)} className={`text-xs px-2 py-1 rounded-lg ${inspector.status === 'active' ? 'bg-orange-50 text-orange-700 hover:bg-orange-100' : 'bg-green-50 text-green-700 hover:bg-green-100'}`}>
                            {inspector.status === 'active' ? 'تعطيل' : 'تفعيل'}
                          </button>
                          {inspector.access_code && (
                            <button onClick={() => showInspectorInfo(inspector)} className="text-xs bg-purple-50 text-purple-700 hover:bg-purple-100 px-2 py-1 rounded-lg">عرض البيانات</button>
                          )}
                          <button onClick={() => openSetCodeModal(inspector)} className="text-xs bg-blue-50 text-blue-700 hover:bg-blue-100 px-2 py-1 rounded-lg">تعيين كود</button>
                          <button onClick={() => handleDelete(inspector)} className="text-xs bg-red-50 text-red-700 hover:bg-red-100 px-2 py-1 rounded-lg">حذف</button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="mt-4 text-sm text-gray-500">إجمالي المراقبين: {total}</div>
          </Card>
        </>
      )}

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

      {/* Set Code Modal */}
      <Modal isOpen={showSetCodeModal} onClose={() => setShowSetCodeModal(false)} title={`تعيين كود الدخول - ${setCodeInspector?.full_name || ''}`}>
        <div>
          {setCodeError && (
            <div className="bg-danger-500/5 border border-danger-500/20 text-danger-500 text-sm p-3 rounded-xl mb-4">
              {setCodeError}
            </div>
          )}

          {/* Option 1: Custom code */}
          <div className="bg-gray-50 border border-gray-200 rounded-xl p-4 mb-4">
            <h4 className="text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2">
              <span>✏️</span> كتابة كود مخصص
            </h4>
            <div className="flex gap-2">
              <input
                type="text"
                value={customCode}
                onChange={(e) => setCustomCode(e.target.value.replace(/\s/g, '').slice(0, 20))}
                placeholder="مثال: ,,07Genius"
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

          {/* Separator */}
          <div className="flex items-center gap-3 my-4">
            <div className="flex-1 h-px bg-gray-200" />
            <span className="text-xs text-gray-400 font-medium">أو</span>
            <div className="flex-1 h-px bg-gray-200" />
          </div>

          {/* Option 2: Auto-generate */}
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
            <p className="text-3xl sm:text-4xl font-mono font-bold text-primary-700 tracking-[0.3em]" dir="ltr">
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
