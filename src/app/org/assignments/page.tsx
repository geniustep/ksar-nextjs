'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import DashboardLayout from '@/components/DashboardLayout';
import Badge from '@/components/ui/Badge';
import Button from '@/components/ui/Button';
import Spinner from '@/components/ui/Spinner';
import { orgApi } from '@/lib/api';
import {
  ASSIGNMENT_STATUS_LABELS,
  ASSIGNMENT_STATUS_COLORS,
  ALL_ASSIGNMENT_STATUSES,
} from '@/lib/constants';
import { formatRelativeTime } from '@/lib/utils';
import type { AssignmentResponse, AssignmentStatus } from '@/lib/types';

export default function OrgAssignmentsPage() {
  const [assignments, setAssignments] = useState<AssignmentResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<AssignmentStatus | ''>('');
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [hasMore, setHasMore] = useState(false);

  useEffect(() => {
    loadData();
  }, [statusFilter, page]);

  const loadData = async () => {
    setLoading(true);
    try {
      const data = await orgApi.getMyAssignments({
        status: statusFilter || undefined,
        page,
        limit: 20,
      });
      setAssignments(data.items);
      setTotal(data.total);
      setHasMore(data.has_more);
    } catch (err) {
      console.error('Failed to load assignments:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <DashboardLayout>
      <div className="mb-4 sm:mb-6">
        <h1 className="text-lg sm:text-2xl font-bold text-gray-900">تكفلاتي</h1>
        <p className="text-gray-500 text-xs sm:text-base mt-0.5">إدارة ومتابعة التكفلات الخاصة بمؤسستك</p>
      </div>

      {/* Filters - scrollable pills */}
      <div className="overflow-x-auto -mx-3 px-3 sm:mx-0 sm:px-0 mb-4 sm:mb-6">
        <div className="flex items-center gap-1.5 sm:gap-2 min-w-max sm:min-w-0 sm:flex-wrap">
          {(['' as AssignmentStatus | '', ...ALL_ASSIGNMENT_STATUSES]).map((s) => (
            <button
              key={s}
              onClick={() => { setStatusFilter(s); setPage(1); }}
              className={`px-2.5 sm:px-3 py-1.5 rounded-lg text-[10px] sm:text-xs font-medium transition-colors whitespace-nowrap ${
                statusFilter === s
                  ? 'bg-primary-600 text-white'
                  : 'bg-white text-gray-600 border border-gray-200 hover:bg-gray-50'
              }`}
            >
              {s === '' ? 'الكل' : ASSIGNMENT_STATUS_LABELS[s]}
            </button>
          ))}
        </div>
      </div>

      {/* Assignments list */}
      {loading ? (
        <div className="flex justify-center py-12"><Spinner /></div>
      ) : assignments.length === 0 ? (
        <div className="text-center py-10 bg-white rounded-xl border border-gray-100">
          <p className="text-3xl mb-3">📭</p>
          <p className="text-gray-500 text-sm mb-4">لا توجد تكفلات</p>
          <Link href="/org/requests">
            <Button size="sm">عرض الطلبات المتاحة</Button>
          </Link>
        </div>
      ) : (
        <>
          <div className="space-y-2.5 sm:space-y-3">
            {assignments.map((a) => (
              <Link
                key={a.id}
                href={`/org/assignments/${a.id}`}
                className="block bg-white rounded-xl border border-gray-100 p-3 sm:p-5 hover:shadow-sm transition-shadow active:bg-gray-50"
              >
                <div className="flex items-center justify-between gap-2">
                  <div className="flex-1 min-w-0">
                    <div className="flex flex-wrap items-center gap-1.5 sm:gap-2">
                      <Badge className={`${ASSIGNMENT_STATUS_COLORS[a.status]} text-[10px] sm:text-xs`}>
                        {ASSIGNMENT_STATUS_LABELS[a.status]}
                      </Badge>
                      {a.status === 'pledged' && (
                        <span className="text-[10px] sm:text-xs text-amber-600 bg-amber-50 px-1.5 sm:px-2 py-0.5 rounded-lg">
                          في انتظار الموافقة
                        </span>
                      )}
                      {a.status === 'in_progress' && (
                        <span className="text-[10px] sm:text-xs text-green-600 bg-green-50 px-1.5 sm:px-2 py-0.5 rounded-lg">
                          قيد التنفيذ
                        </span>
                      )}
                    </div>
                    <p className="text-xs sm:text-sm text-gray-500 mt-1.5">
                      رقم التكفل: {a.id.slice(0, 8)}...
                    </p>
                    {a.notes && (
                      <p className="text-xs text-gray-600 mt-0.5 line-clamp-1">{a.notes}</p>
                    )}
                    <p className="text-[10px] sm:text-xs text-gray-400 mt-0.5">
                      {formatRelativeTime(a.created_at)}
                    </p>
                  </div>
                  <span className="text-xs sm:text-sm text-primary-600 flex-shrink-0">التفاصيل &larr;</span>
                </div>
              </Link>
            ))}
          </div>

          {/* Pagination */}
          <div className="flex items-center justify-between mt-4 sm:mt-6">
            <Button variant="secondary" size="sm" disabled={page <= 1} onClick={() => setPage(page - 1)}>السابق</Button>
            <span className="text-xs sm:text-sm text-gray-500">صفحة {page} - {total} تكفل</span>
            <Button variant="secondary" size="sm" disabled={!hasMore} onClick={() => setPage(page + 1)}>التالي</Button>
          </div>
        </>
      )}
    </DashboardLayout>
  );
}
