'use client';

import React, { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import DashboardLayout from '@/components/DashboardLayout';
import Badge from '@/components/ui/Badge';
import Button from '@/components/ui/Button';
import Textarea from '@/components/ui/Textarea';
import { Card } from '@/components/ui/Card';
import Spinner from '@/components/ui/Spinner';
import { orgApi, ApiError } from '@/lib/api';
import {
  ASSIGNMENT_STATUS_LABELS,
  ASSIGNMENT_STATUS_COLORS,
  CATEGORY_LABELS,
  CATEGORY_ICONS,
} from '@/lib/constants';
import { formatDateTime } from '@/lib/utils';
import type { AssignmentWithRequest, AssignmentStatus, RequestCategory } from '@/lib/types';

export default function AssignmentDetailPage() {
  const params = useParams();
  const router = useRouter();
  const [data, setData] = useState<AssignmentWithRequest | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const [updating, setUpdating] = useState(false);
  const [completionNotes, setCompletionNotes] = useState('');
  const [failureReason, setFailureReason] = useState('');

  useEffect(() => {
    loadData();
  }, [params.id]);

  const loadData = async () => {
    try {
      const result = await orgApi.getAssignment(params.id as string);
      setData(result);
    } catch (err) {
      if (err instanceof ApiError) setError(err.detail);
      else setError('خطأ في تحميل البيانات');
    } finally {
      setLoading(false);
    }
  };

  const handleStatusUpdate = async (status: AssignmentStatus) => {
    setUpdating(true);
    try {
      await orgApi.updateAssignment(params.id as string, {
        status,
        completion_notes: status === 'completed' ? completionNotes || undefined : undefined,
        failure_reason: status === 'failed' ? failureReason || undefined : undefined,
      });
      loadData();
    } catch (err) {
      if (err instanceof ApiError) alert(err.detail);
    } finally {
      setUpdating(false);
    }
  };

  if (loading) {
    return (<DashboardLayout><div className="flex justify-center py-12"><Spinner /></div></DashboardLayout>);
  }

  if (error || !data) {
    return (
      <DashboardLayout>
        <div className="text-center py-12">
          <p className="text-red-600 text-sm">{error || 'التكفل غير موجود'}</p>
          <Button variant="secondary" size="sm" className="mt-4" onClick={() => router.push('/org/assignments')}>العودة</Button>
        </div>
      </DashboardLayout>
    );
  }

  const { assignment, request, contact } = data;

  return (
    <DashboardLayout>
      <div className="mb-4 sm:mb-6">
        <button onClick={() => router.push('/org/assignments')} className="text-xs sm:text-sm text-primary-600 hover:text-primary-700 mb-2 block">
          &larr; العودة للتكفلات
        </button>
        <h1 className="text-lg sm:text-2xl font-bold text-gray-900">تفاصيل التكفل</h1>
      </div>

      {/* Contact Info Banner */}
      {contact && (assignment.status === 'in_progress' || assignment.status === 'completed') && (
        <div className="bg-gradient-to-l from-green-50 to-emerald-50 border border-green-200 rounded-xl sm:rounded-2xl p-3 sm:p-5 mb-4 sm:mb-6">
          <h3 className="font-bold text-green-800 mb-2 sm:mb-3 flex items-center gap-2 text-sm sm:text-base">
            <span>📞</span> معلومات التواصل
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 sm:gap-4">
            {contact.name && (
              <div>
                <span className="text-[10px] sm:text-xs text-green-600 block mb-0.5">اسم التواصل</span>
                <span className="font-medium text-green-900 text-sm">{contact.name}</span>
              </div>
            )}
            {contact.phone && (
              <div>
                <span className="text-[10px] sm:text-xs text-green-600 block mb-0.5">رقم التواصل</span>
                <a href={`tel:${contact.phone}`} dir="ltr" className="font-medium text-green-900 text-sm underline">{contact.phone}</a>
              </div>
            )}
            {contact.inspector_phone && (
              <div>
                <span className="text-[10px] sm:text-xs text-green-600 block mb-0.5">رقم المراقب</span>
                <a href={`tel:${contact.inspector_phone}`} dir="ltr" className="font-medium text-green-900 text-sm underline">{contact.inspector_phone}</a>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Waiting notice */}
      {assignment.status === 'pledged' && (
        <div className="bg-amber-50 border border-amber-200 rounded-xl sm:rounded-2xl p-3 sm:p-4 mb-4 sm:mb-6 flex items-center gap-2 sm:gap-3">
          <span className="text-xl sm:text-2xl">⏳</span>
          <div>
            <p className="font-medium text-amber-800 text-sm">في انتظار موافقة المراقب</p>
            <p className="text-xs text-amber-600">سيتم إبلاغك عند الموافقة</p>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
        {/* Assignment info */}
        <Card>
          <h2 className="text-sm sm:text-lg font-semibold mb-3 sm:mb-4">معلومات التكفل</h2>
          <div className="space-y-3 sm:space-y-4">
            <div className="flex justify-between items-center">
              <span className="text-gray-500 text-xs sm:text-sm">الحالة</span>
              <Badge className={`${ASSIGNMENT_STATUS_COLORS[assignment.status]} text-[10px] sm:text-xs`}>{ASSIGNMENT_STATUS_LABELS[assignment.status]}</Badge>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-gray-500 text-xs sm:text-sm">تاريخ التكفل</span>
              <span className="text-xs sm:text-sm">{formatDateTime(assignment.created_at)}</span>
            </div>
            {assignment.completed_at && (
              <div className="flex justify-between items-center">
                <span className="text-gray-500 text-xs sm:text-sm">تاريخ الإكمال</span>
                <span className="text-xs sm:text-sm">{formatDateTime(assignment.completed_at)}</span>
              </div>
            )}
            {assignment.notes && (
              <div>
                <span className="text-gray-500 text-xs">ملاحظات</span>
                <p className="mt-0.5 text-gray-700 text-sm">{assignment.notes}</p>
              </div>
            )}
            {assignment.completion_notes && (
              <div>
                <span className="text-gray-500 text-xs">ملاحظات الإكمال</span>
                <p className="mt-0.5 text-gray-700 text-sm">{assignment.completion_notes}</p>
              </div>
            )}
            {assignment.failure_reason && (
              <div>
                <span className="text-gray-500 text-xs">سبب الفشل</span>
                <p className="mt-0.5 text-red-600 text-sm">{assignment.failure_reason}</p>
              </div>
            )}
          </div>
        </Card>

        {/* Request info */}
        <Card>
          <h2 className="text-sm sm:text-lg font-semibold mb-3 sm:mb-4">معلومات الطلب</h2>
          <div className="space-y-3 sm:space-y-4">
            <div className="flex justify-between items-center">
              <span className="text-gray-500 text-xs sm:text-sm">التصنيف</span>
              <span className="text-xs sm:text-sm">
                {CATEGORY_ICONS[request.category as RequestCategory]} {CATEGORY_LABELS[request.category as RequestCategory]}
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-gray-500 text-xs sm:text-sm">الاسم</span>
              <span className="text-xs sm:text-sm">{request.requester_name}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-gray-500 text-xs sm:text-sm">الهاتف</span>
              {request.requester_phone ? (
                <a href={`tel:${request.requester_phone}`} dir="ltr" className="text-xs sm:text-sm text-primary-600 underline">{request.requester_phone}</a>
              ) : (
                <span className="text-gray-400 text-[10px] sm:text-xs">غير مسموح</span>
              )}
            </div>
            <div className="flex justify-between items-center">
              <span className="text-gray-500 text-xs sm:text-sm">الكمية</span>
              <span className="text-xs sm:text-sm">{request.quantity}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-gray-500 text-xs sm:text-sm">أفراد الأسرة</span>
              <span className="text-xs sm:text-sm">{request.family_members}</span>
            </div>
            <div>
              <span className="text-gray-500 text-xs">العنوان</span>
              <p className="mt-0.5 text-sm">{request.address}</p>
              {request.city && <p className="text-xs text-gray-500">{request.city} - {request.region}</p>}
            </div>
            {request.is_urgent === 1 && (
              <Badge className="bg-red-100 text-red-800 text-xs">طلب مستعجل</Badge>
            )}
          </div>
        </Card>

        {/* Description */}
        <Card className="lg:col-span-2">
          <h2 className="text-sm sm:text-lg font-semibold mb-2 sm:mb-3">وصف الطلب</h2>
          <p className="text-gray-700 text-sm whitespace-pre-wrap">{request.description}</p>
        </Card>

        {/* Actions */}
        {assignment.status === 'in_progress' && (
          <Card className="lg:col-span-2">
            <h2 className="text-sm sm:text-lg font-semibold mb-3 sm:mb-4">تحديث الحالة</h2>
            <div className="space-y-4">
              {/* Complete */}
              <div className="bg-green-50 rounded-xl p-3 sm:p-4 border border-green-100">
                <Textarea
                  label="ملاحظات الإكمال"
                  placeholder="أضف ملاحظات عن التسليم..."
                  value={completionNotes}
                  onChange={(e) => setCompletionNotes(e.target.value)}
                />
                <Button
                  className="mt-2 w-full sm:w-auto"
                  onClick={() => handleStatusUpdate('completed')}
                  loading={updating}
                >
                  تم التسليم بنجاح
                </Button>
              </div>

              {/* Fail */}
              <div className="bg-red-50 rounded-xl p-3 sm:p-4 border border-red-100">
                <Textarea
                  label="سبب الفشل"
                  placeholder="أضف سبب الفشل..."
                  value={failureReason}
                  onChange={(e) => setFailureReason(e.target.value)}
                />
                <Button
                  variant="danger"
                  className="mt-2 w-full sm:w-auto"
                  onClick={() => handleStatusUpdate('failed')}
                  loading={updating}
                >
                  فشل التسليم
                </Button>
              </div>
            </div>
          </Card>
        )}
      </div>
    </DashboardLayout>
  );
}
