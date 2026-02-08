'use client';

import React, { useEffect, useState, useCallback } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import DashboardLayout from '@/components/DashboardLayout';
import { Card } from '@/components/ui/Card';
import Badge from '@/components/ui/Badge';
import Button from '@/components/ui/Button';
import Spinner from '@/components/ui/Spinner';
import { adminApi, ApiError } from '@/lib/api';
import { ASSIGNMENT_STATUS_LABELS, ASSIGNMENT_STATUS_COLORS, CATEGORY_LABELS, REQUEST_STATUS_LABELS, REQUEST_STATUS_COLORS } from '@/lib/constants';
import type { OrgPledgeItem, RequestCategory, AssignmentStatus, RequestStatus } from '@/lib/types';

export default function AdminOrgPledgesDetailPage() {
  const params = useParams();
  const orgId = params.orgId as string;

  const [orgName, setOrgName] = useState('');
  const [items, setItems] = useState<OrgPledgeItem[]>([]);
  const [stats, setStats] = useState({ total: 0, pledged: 0, in_progress: 0, completed: 0, failed: 0 });
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [cancellingId, setCancellingId] = useState<string | null>(null);
  const limit = 20;

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const res = await adminApi.getOrgPledges(orgId, { page, limit });
      setOrgName(res.organization.name);
      setItems(res.items);
      setStats(res.stats);
      setTotal(res.total);
    } catch (err) {
      console.error('Failed to load pledges:', err);
    } finally {
      setLoading(false);
    }
  }, [orgId, page]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleCancelAssignment = async (assignmentId: string) => {
    if (!confirm('هل أنت متأكد من إلغاء هذا التعهد؟ سيعود الطلب إلى حالته الأولى.')) return;
    setCancellingId(assignmentId);
    try {
      await adminApi.cancelAssignment(assignmentId);
      loadData();
    } catch (err) {
      if (err instanceof ApiError) alert(err.detail);
    } finally {
      setCancellingId(null);
    }
  };

  const totalPages = Math.ceil(total / limit);

  return (
    <DashboardLayout>
      <div className="mb-4 sm:mb-6">
        <Link href="/admin/pledges" className="text-sm text-primary-600 hover:text-primary-700 mb-2 inline-block">
          → العودة لقائمة الجمعيات
        </Link>
        <h1 className="text-xl sm:text-2xl font-bold text-neutral-dark">تعهدات: {orgName}</h1>
        <p className="text-gray-500 text-sm mt-1">{total} تعهد إجمالي</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 mb-6">
        <div className="bg-white rounded-xl border border-gray-200 p-3 text-center">
          <p className="text-xl font-bold text-gray-800">{stats.total}</p>
          <p className="text-[10px] text-gray-500">إجمالي</p>
        </div>
        <div className="bg-blue-50 rounded-xl border border-blue-200 p-3 text-center">
          <p className="text-xl font-bold text-blue-700">{stats.pledged}</p>
          <p className="text-[10px] text-blue-600">تعهد</p>
        </div>
        <div className="bg-orange-50 rounded-xl border border-orange-200 p-3 text-center">
          <p className="text-xl font-bold text-orange-700">{stats.in_progress}</p>
          <p className="text-[10px] text-orange-600">قيد التنفيذ</p>
        </div>
        <div className="bg-green-50 rounded-xl border border-green-200 p-3 text-center">
          <p className="text-xl font-bold text-green-700">{stats.completed}</p>
          <p className="text-[10px] text-green-600">مكتمل</p>
        </div>
        <div className="bg-red-50 rounded-xl border border-red-200 p-3 text-center">
          <p className="text-xl font-bold text-red-700">{stats.failed}</p>
          <p className="text-[10px] text-red-600">فشل</p>
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center py-12"><Spinner /></div>
      ) : items.length === 0 ? (
        <Card>
          <div className="text-center py-12 text-gray-400">
            <p className="text-4xl mb-2">📋</p>
            <p>لا توجد تعهدات لهذه الجمعية</p>
          </div>
        </Card>
      ) : (
        <>
          {/* Mobile: Cards */}
          <div className="sm:hidden space-y-3">
            {items.map((item) => (
              <Link key={item.assignment_id} href={`/admin/requests/${item.request_id}`} className="block">
                <div className="bg-white rounded-xl border border-gray-200 p-4 active:bg-gray-50">
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-gray-900 truncate">{item.requester_name}</p>
                      <p className="text-xs text-gray-400 mt-0.5">{CATEGORY_LABELS[item.category as RequestCategory] || item.category}</p>
                    </div>
                    <Badge className={ASSIGNMENT_STATUS_COLORS[item.assignment_status as AssignmentStatus] || 'bg-gray-100 text-gray-600'}>
                      {ASSIGNMENT_STATUS_LABELS[item.assignment_status as AssignmentStatus] || item.assignment_status}
                    </Badge>
                  </div>
                  <div className="flex items-center gap-2 text-xs text-gray-500">
                    <span>{item.city || '-'}{item.region ? ` - ${item.region}` : ''}</span>
                    {item.inspector_name && (
                      <>
                        <span className="text-gray-300">|</span>
                        <span className="text-indigo-600">👁️ {item.inspector_name}</span>
                      </>
                    )}
                  </div>
                  <div className="mt-2 flex items-center justify-between">
                    <Badge className={REQUEST_STATUS_COLORS[item.request_status as RequestStatus] || 'bg-gray-100'}>
                      {REQUEST_STATUS_LABELS[item.request_status as RequestStatus] || item.request_status}
                    </Badge>
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] text-gray-400">{item.assignment_created_at ? new Date(item.assignment_created_at).toLocaleDateString('ar-MA') : '-'}</span>
                      {item.assignment_status !== 'failed' && (
                        <button
                          onClick={(e) => { e.preventDefault(); e.stopPropagation(); handleCancelAssignment(item.assignment_id); }}
                          disabled={cancellingId === item.assignment_id}
                          className="text-[10px] bg-red-50 text-red-600 hover:bg-red-100 px-2 py-1 rounded-lg font-medium transition-colors disabled:opacity-50"
                        >
                          {cancellingId === item.assignment_id ? '...' : 'إلغاء'}
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              </Link>
            ))}
          </div>

          {/* Desktop: Table */}
          <Card className="hidden sm:block">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-100">
                    <th className="text-right py-3 px-3 text-gray-500 font-medium">المستفيد</th>
                    <th className="text-right py-3 px-3 text-gray-500 font-medium">التصنيف</th>
                    <th className="text-right py-3 px-3 text-gray-500 font-medium">المدينة</th>
                    <th className="text-right py-3 px-3 text-gray-500 font-medium">المراقب</th>
                    <th className="text-center py-3 px-3 text-gray-500 font-medium">حالة التعهد</th>
                    <th className="text-center py-3 px-3 text-gray-500 font-medium">حالة الطلب</th>
                    <th className="text-right py-3 px-3 text-gray-500 font-medium">تاريخ التعهد</th>
                    <th className="text-center py-3 px-3 text-gray-500 font-medium">إجراءات</th>
                  </tr>
                </thead>
                <tbody>
                  {items.map((item) => (
                    <tr key={item.assignment_id} className="border-b border-gray-50 hover:bg-gray-50/50">
                      <td className="py-3 px-3 font-medium">{item.requester_name}</td>
                      <td className="py-3 px-3 text-xs">{CATEGORY_LABELS[item.category as RequestCategory] || item.category}</td>
                      <td className="py-3 px-3 text-gray-600">{item.city || '-'}</td>
                      <td className="py-3 px-3">
                        {item.inspector_name ? (
                          <span className="text-xs text-indigo-700 bg-indigo-50 px-1.5 py-0.5 rounded-md whitespace-nowrap">{item.inspector_name}</span>
                        ) : <span className="text-gray-300">-</span>}
                      </td>
                      <td className="py-3 px-3 text-center">
                        <Badge className={ASSIGNMENT_STATUS_COLORS[item.assignment_status as AssignmentStatus] || 'bg-gray-100'}>
                          {ASSIGNMENT_STATUS_LABELS[item.assignment_status as AssignmentStatus] || item.assignment_status}
                        </Badge>
                      </td>
                      <td className="py-3 px-3 text-center">
                        <Badge className={REQUEST_STATUS_COLORS[item.request_status as RequestStatus] || 'bg-gray-100'}>
                          {REQUEST_STATUS_LABELS[item.request_status as RequestStatus] || item.request_status}
                        </Badge>
                      </td>
                      <td className="py-3 px-3 text-gray-500 text-xs">{item.assignment_created_at ? new Date(item.assignment_created_at).toLocaleDateString('ar-MA') : '-'}</td>
                      <td className="py-3 px-3 text-center">
                        <div className="flex items-center justify-center gap-1.5">
                          <Link href={`/admin/requests/${item.request_id}`} className="text-xs bg-primary-50 text-primary-700 hover:bg-primary-100 px-2.5 py-1.5 rounded-lg transition-colors">
                            تفاصيل
                          </Link>
                          {item.assignment_status !== 'failed' && (
                            <button
                              onClick={() => handleCancelAssignment(item.assignment_id)}
                              disabled={cancellingId === item.assignment_id}
                              className="text-xs bg-red-50 text-red-600 hover:bg-red-100 px-2.5 py-1.5 rounded-lg font-medium transition-colors disabled:opacity-50"
                            >
                              {cancellingId === item.assignment_id ? '...' : 'إلغاء'}
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-center gap-2 mt-4 sm:mt-6">
              <Button variant="ghost" size="sm" onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1}>السابق</Button>
              <span className="text-xs sm:text-sm text-gray-500">صفحة {page} من {totalPages}</span>
              <Button variant="ghost" size="sm" onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page === totalPages}>التالي</Button>
            </div>
          )}
        </>
      )}
    </DashboardLayout>
  );
}
