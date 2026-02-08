'use client';

import React, { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import DashboardLayout from '@/components/DashboardLayout';
import Badge from '@/components/ui/Badge';
import Button from '@/components/ui/Button';
import Select from '@/components/ui/Select';
import Input from '@/components/ui/Input';
import Textarea from '@/components/ui/Textarea';
import { Card } from '@/components/ui/Card';
import Spinner from '@/components/ui/Spinner';
import { adminApi, ApiError } from '@/lib/api';
import {
  REQUEST_STATUS_LABELS,
  REQUEST_STATUS_COLORS,
  CATEGORY_LABELS,
  CATEGORY_ICONS,
  ASSIGNMENT_STATUS_LABELS,
  ASSIGNMENT_STATUS_COLORS,
  ALL_REQUEST_STATUSES,
} from '@/lib/constants';
import { formatDateTime } from '@/lib/utils';
import type { RequestDetailResponse, RequestStatus, RequestCategory, AssignmentStatus } from '@/lib/types';

export default function AdminRequestDetailPage() {
  const params = useParams();
  const router = useRouter();
  const [request, setRequest] = useState<RequestDetailResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Edit form
  const [editStatus, setEditStatus] = useState('');
  const [editPriority, setEditPriority] = useState('');
  const [editUrgent, setEditUrgent] = useState('');
  const [editNotes, setEditNotes] = useState('');
  const [saving, setSaving] = useState(false);
  const [saveMsg, setSaveMsg] = useState('');
  const [cancellingId, setCancellingId] = useState<string | null>(null);

  useEffect(() => {
    loadRequest();
  }, [params.id]);

  const loadRequest = async () => {
    try {
      const data = await adminApi.getRequest(params.id as string);
      setRequest(data);
      setEditStatus(data.status);
      setEditPriority(String(data.priority_score));
      setEditUrgent(data.is_urgent ? 'true' : 'false');
      setEditNotes(data.admin_notes || '');
    } catch (err) {
      if (err instanceof ApiError) setError(err.detail);
      else setError('خطأ في تحميل البيانات');
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    setSaveMsg('');
    try {
      await adminApi.updateRequest(params.id as string, {
        status: editStatus as RequestStatus,
        priority_score: parseInt(editPriority),
        is_urgent: editUrgent === 'true',
        admin_notes: editNotes || undefined,
      });
      setSaveMsg('تم الحفظ بنجاح');
      loadRequest();
    } catch (err) {
      if (err instanceof ApiError) alert(err.detail);
    } finally {
      setSaving(false);
    }
  };

  const handleCancelAssignment = async (assignmentId: string) => {
    if (!confirm('هل أنت متأكد من إلغاء هذا التعهد؟ سيعود الطلب إلى حالته الأولى.')) return;
    setCancellingId(assignmentId);
    try {
      await adminApi.cancelAssignment(assignmentId);
      loadRequest();
    } catch (err) {
      if (err instanceof ApiError) alert(err.detail);
    } finally {
      setCancellingId(null);
    }
  };

  const handleDelete = async () => {
    if (!confirm('هل أنت متأكد من حذف هذا الطلب نهائياً؟')) return;
    try {
      await adminApi.deleteRequest(params.id as string);
      router.push('/admin/requests');
    } catch (err) {
      if (err instanceof ApiError) alert(err.detail);
    }
  };

  if (loading) {
    return (
      <DashboardLayout>
        <div className="flex justify-center py-12"><Spinner /></div>
      </DashboardLayout>
    );
  }

  if (error || !request) {
    return (
      <DashboardLayout>
        <div className="text-center py-12">
          <p className="text-red-600">{error || 'الطلب غير موجود'}</p>
          <Button variant="secondary" className="mt-4" onClick={() => router.push('/admin/requests')}>
            العودة
          </Button>
        </div>
      </DashboardLayout>
    );
  }

  const statusOptions = ALL_REQUEST_STATUSES.map((s) => ({
    value: s,
    label: REQUEST_STATUS_LABELS[s],
  }));

  return (
    <DashboardLayout>
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-4 sm:mb-6 gap-3">
        <div>
          <button
            onClick={() => router.push('/admin/requests')}
            className="text-sm text-primary-600 hover:text-primary-700 mb-2 block"
          >
            &larr; العودة للطلبات
          </button>
          <h1 className="text-xl sm:text-2xl font-bold text-gray-900">تفاصيل الطلب</h1>
        </div>
        <Button variant="danger" size="sm" onClick={handleDelete}>
          حذف الطلب
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
        {/* Request info */}
        <Card>
          <h2 className="text-lg font-semibold mb-4">بيانات الطلب</h2>
          <div className="space-y-3">
            <div className="flex justify-between items-center">
              <span className="text-gray-500 text-sm">الاسم</span>
              <span className="font-medium">{request.requester_name}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-gray-500 text-sm">الهاتف</span>
              <span dir="ltr" className="font-mono text-sm">{request.requester_phone}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-gray-500 text-sm">التصنيف</span>
              <span>{CATEGORY_ICONS[request.category]} {CATEGORY_LABELS[request.category]}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-gray-500 text-sm">الحالة</span>
              <Badge className={REQUEST_STATUS_COLORS[request.status]}>
                {REQUEST_STATUS_LABELS[request.status]}
              </Badge>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-gray-500 text-sm">الأولوية</span>
              <span className={`font-bold ${request.is_urgent ? 'text-red-600' : ''}`}>
                {request.priority_score}/100
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-gray-500 text-sm">الكمية</span>
              <span>{request.quantity}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-gray-500 text-sm">أفراد الأسرة</span>
              <span>{request.family_members}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-gray-500 text-sm">مستعجل</span>
              <span>{request.is_urgent ? '🔴 نعم' : 'لا'}</span>
            </div>
          </div>
        </Card>

        {/* Location */}
        <Card>
          <h2 className="text-lg font-semibold mb-4">الموقع</h2>
          <div className="space-y-3">
            <div>
              <span className="text-gray-500 text-sm">العنوان</span>
              <p className="mt-1 text-gray-900">{request.address || '-'}</p>
            </div>
            {request.city && (
              <div className="flex justify-between">
                <span className="text-gray-500 text-sm">المدينة</span>
                <span>{request.city}</span>
              </div>
            )}
            {request.region && (
              <div className="flex justify-between">
                <span className="text-gray-500 text-sm">المنطقة</span>
                <span>{request.region}</span>
              </div>
            )}
            {request.latitude && request.longitude && (
              <div className="flex justify-between">
                <span className="text-gray-500 text-sm">الإحداثيات</span>
                <span dir="ltr" className="text-xs font-mono">{request.latitude}, {request.longitude}</span>
              </div>
            )}
            <div className="pt-3 border-t space-y-2 text-sm">
              <div className="flex justify-between text-gray-400">
                <span>تاريخ الإنشاء</span>
                <span>{formatDateTime(request.created_at)}</span>
              </div>
              {request.updated_at && (
                <div className="flex justify-between text-gray-400">
                  <span>آخر تحديث</span>
                  <span>{formatDateTime(request.updated_at)}</span>
                </div>
              )}
              {request.completed_at && (
                <div className="flex justify-between text-gray-400">
                  <span>تاريخ الإكمال</span>
                  <span>{formatDateTime(request.completed_at)}</span>
                </div>
              )}
            </div>
          </div>
        </Card>

        {/* Description */}
        <Card className="lg:col-span-2">
          <h2 className="text-lg font-semibold mb-3">الوصف</h2>
          <p className="text-gray-700 whitespace-pre-wrap text-sm sm:text-base">{request.description || '-'}</p>
        </Card>

        {/* Assignments */}
        {request.assignments && request.assignments.length > 0 && (
          <Card className="lg:col-span-2">
            <h2 className="text-lg font-semibold mb-3">التكفلات</h2>
            <div className="space-y-2">
              {request.assignments.map((a) => (
                <div key={a.id} className="flex items-center justify-between gap-3 p-3 bg-gray-50 rounded-xl">
                  <div className="flex items-center gap-3">
                    <Badge className={ASSIGNMENT_STATUS_COLORS[a.status as AssignmentStatus]}>
                      {ASSIGNMENT_STATUS_LABELS[a.status as AssignmentStatus]}
                    </Badge>
                    <span className="text-sm text-gray-500">{formatDateTime(a.created_at)}</span>
                  </div>
                  {a.status !== 'failed' && (
                    <button
                      onClick={() => handleCancelAssignment(a.id)}
                      disabled={cancellingId === a.id}
                      className="text-xs bg-red-50 text-red-600 hover:bg-red-100 px-3 py-1.5 rounded-lg font-medium transition-colors disabled:opacity-50"
                    >
                      {cancellingId === a.id ? 'جاري...' : 'إلغاء التعهد'}
                    </button>
                  )}
                </div>
              ))}
            </div>
          </Card>
        )}

        {/* Admin edit form */}
        <Card className="lg:col-span-2">
          <h2 className="text-lg font-semibold mb-4">تحديث الطلب</h2>
          {saveMsg && (
            <div className="bg-green-50 border border-green-200 text-green-700 text-sm p-3 rounded-xl mb-4">
              {saveMsg}
            </div>
          )}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-4">
            <Select
              label="الحالة"
              options={statusOptions}
              value={editStatus}
              onChange={(e) => setEditStatus(e.target.value)}
            />
            <Input
              label="نقاط الأولوية (0-100)"
              type="number"
              min="0"
              max="100"
              value={editPriority}
              onChange={(e) => setEditPriority(e.target.value)}
            />
            <Select
              label="مستعجل"
              options={[
                { value: 'false', label: 'لا' },
                { value: 'true', label: 'نعم' },
              ]}
              value={editUrgent}
              onChange={(e) => setEditUrgent(e.target.value)}
            />
          </div>
          <Textarea
            label="ملاحظات الإدارة"
            placeholder="أضف ملاحظات..."
            value={editNotes}
            onChange={(e) => setEditNotes(e.target.value)}
            className="mb-4"
          />
          <Button onClick={handleSave} loading={saving}>
            حفظ التغييرات
          </Button>
        </Card>
      </div>
    </DashboardLayout>
  );
}
