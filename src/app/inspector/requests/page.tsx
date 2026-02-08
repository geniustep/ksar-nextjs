'use client';

import React, { Suspense, useEffect, useState, useCallback } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import DashboardLayout from '@/components/DashboardLayout';
import { Card } from '@/components/ui/Card';
import Badge from '@/components/ui/Badge';
import Button from '@/components/ui/Button';
import Select from '@/components/ui/Select';
import Input from '@/components/ui/Input';
import Spinner from '@/components/ui/Spinner';
import { inspectorApi, ApiError } from '@/lib/api';
import {
  REQUEST_STATUS_LABELS,
  REQUEST_STATUS_COLORS,
  CATEGORY_LABELS,
  ALL_REQUEST_STATUSES,
  ALL_CATEGORIES,
} from '@/lib/constants';
import type { RequestResponse, RequestStatus, RequestCategory } from '@/lib/types';

export default function InspectorRequestsPage() {
  return (
    <Suspense fallback={
      <DashboardLayout>
        <div className="flex justify-center py-12"><Spinner /></div>
      </DashboardLayout>
    }>
      <InspectorRequestsContent />
    </Suspense>
  );
}

function InspectorRequestsContent() {
  const searchParams = useSearchParams();
  const initialStatus = searchParams.get('status') as RequestStatus | null;

  const [requests, setRequests] = useState<RequestResponse[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  // Phone request counts
  const [phoneCounts, setPhoneCounts] = useState<Record<string, number>>({});

  // Filters
  const [statusFilter, setStatusFilter] = useState<string>(initialStatus || '');
  const [categoryFilter, setCategoryFilter] = useState<string>('');
  const [searchQuery, setSearchQuery] = useState('');
  const [urgentOnly, setUrgentOnly] = useState(false);
  const [mineOnly, setMineOnly] = useState(false);

  const limit = 20;

  const loadRequests = useCallback(async () => {
    setLoading(true);
    try {
      const res = await inspectorApi.getRequests({
        status: statusFilter ? (statusFilter as RequestStatus) : undefined,
        category: categoryFilter ? (categoryFilter as RequestCategory) : undefined,
        search: searchQuery || undefined,
        is_urgent: urgentOnly ? true : undefined,
        mine_only: mineOnly ? true : undefined,
        page,
        limit,
      });
      setRequests(res.items);
      setTotal(res.total);

      // Load phone counts for unique phone numbers
      const uniquePhones = Array.from(new Set(res.items.map(r => r.requester_phone)));
      const counts: Record<string, number> = {};
      await Promise.all(
        uniquePhones.map(async (phone) => {
          try {
            const countRes = await inspectorApi.getPhoneRequestCount(phone);
            counts[phone] = countRes.count;
          } catch {
            // Silently handle - count won't show
          }
        })
      );
      setPhoneCounts(counts);
    } catch (err) {
      console.error('Failed to load requests:', err);
    } finally {
      setLoading(false);
    }
  }, [statusFilter, categoryFilter, searchQuery, urgentOnly, mineOnly, page]);

  useEffect(() => {
    loadRequests();
  }, [loadRequests]);

  const handleActivate = async (requestId: string) => {
    setActionLoading(requestId);
    try {
      await inspectorApi.activateRequest(requestId);
      await loadRequests();
    } catch (err) {
      if (err instanceof ApiError) alert(err.detail);
    } finally {
      setActionLoading(null);
    }
  };

  const handleReject = async (requestId: string) => {
    if (!confirm('هل أنت متأكد من رفض هذا الطلب؟')) return;
    setActionLoading(requestId);
    try {
      await inspectorApi.rejectRequest(requestId);
      await loadRequests();
    } catch (err) {
      if (err instanceof ApiError) alert(err.detail);
    } finally {
      setActionLoading(null);
    }
  };

  const totalPages = Math.ceil(total / limit);

  return (
    <DashboardLayout>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-neutral-dark">الطلبات</h1>
        <p className="text-gray-500 mt-1">مراجعة وفلترة الطلبات</p>
      </div>

      {/* Filters */}
      <Card className="mb-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Select
            label="الحالة"
            value={statusFilter}
            onChange={(e) => { setStatusFilter(e.target.value); setPage(1); }}
            placeholder="جميع الحالات"
            options={ALL_REQUEST_STATUSES.map((s) => ({ value: s, label: REQUEST_STATUS_LABELS[s] }))}
          />

          <Select
            label="التصنيف"
            value={categoryFilter}
            onChange={(e) => { setCategoryFilter(e.target.value); setPage(1); }}
            placeholder="جميع التصنيفات"
            options={ALL_CATEGORIES.map((c) => ({ value: c, label: CATEGORY_LABELS[c] }))}
          />

          <Input
            label="بحث"
            placeholder="اسم أو رقم هاتف..."
            value={searchQuery}
            onChange={(e) => { setSearchQuery(e.target.value); setPage(1); }}
          />

          <div className="flex items-end gap-4">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={mineOnly}
                onChange={(e) => { setMineOnly(e.target.checked); setPage(1); }}
                className="rounded border-gray-300 text-primary-600 focus:ring-primary-500"
              />
              <span className="text-sm text-gray-600">طلباتي فقط</span>
            </label>
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={urgentOnly}
                onChange={(e) => { setUrgentOnly(e.target.checked); setPage(1); }}
                className="rounded border-gray-300 text-primary-600 focus:ring-primary-500"
              />
              <span className="text-sm text-gray-600">المستعجلة فقط</span>
            </label>
          </div>
        </div>
      </Card>

      {/* Results */}
      <Card>
        <div className="flex items-center justify-between mb-4">
          <p className="text-sm text-gray-500">{total} طلب</p>
        </div>

        {loading ? (
          <div className="flex justify-center py-12"><Spinner /></div>
        ) : requests.length === 0 ? (
          <div className="text-center py-12 text-gray-400">
            <p className="text-4xl mb-2">📭</p>
            <p>لا توجد طلبات</p>
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-100">
                    <th className="text-right py-3 px-2 text-gray-500 font-medium">الاسم</th>
                    <th className="text-right py-3 px-2 text-gray-500 font-medium">الهاتف</th>
                    <th className="text-center py-3 px-2 text-gray-500 font-medium">طلبات</th>
                    <th className="text-right py-3 px-2 text-gray-500 font-medium">التصنيف</th>
                    <th className="text-right py-3 px-2 text-gray-500 font-medium">المنطقة</th>
                    <th className="text-center py-3 px-2 text-gray-500 font-medium">تعهدات</th>
                    <th className="text-right py-3 px-2 text-gray-500 font-medium">الحالة</th>
                    <th className="text-right py-3 px-2 text-gray-500 font-medium">التاريخ</th>
                    <th className="text-right py-3 px-2 text-gray-500 font-medium">إجراءات</th>
                  </tr>
                </thead>
                <tbody>
                  {requests.map((req) => (
                    <tr key={req.id} className="border-b border-gray-50 hover:bg-gray-50/50">
                      <td className="py-3 px-2">
                        <Link href={`/inspector/requests/${req.id}`} className="font-medium text-primary-600 hover:text-primary-700">
                          {req.requester_name}
                        </Link>
                      </td>
                      <td className="py-3 px-2 text-gray-600" dir="ltr">{req.requester_phone}</td>
                      <td className="py-3 px-2 text-center">
                        {phoneCounts[req.requester_phone] !== undefined ? (
                          <Badge className={
                            phoneCounts[req.requester_phone] > 3
                              ? 'bg-orange-100 text-orange-800'
                              : phoneCounts[req.requester_phone] > 1
                                ? 'bg-blue-100 text-blue-800'
                                : 'bg-gray-100 text-gray-600'
                          }>
                            {phoneCounts[req.requester_phone]}
                          </Badge>
                        ) : (
                          <span className="text-gray-300">-</span>
                        )}
                      </td>
                      <td className="py-3 px-2">
                        {CATEGORY_LABELS[req.category as RequestCategory] || req.category}
                      </td>
                      <td className="py-3 px-2 text-gray-600">{req.region || '-'}</td>
                      <td className="py-3 px-2 text-center">
                        {(req.pledge_count !== undefined && req.pledge_count > 0) ? (
                          <Badge className="bg-blue-100 text-blue-800">{req.pledge_count}</Badge>
                        ) : (
                          <span className="text-gray-300">-</span>
                        )}
                      </td>
                      <td className="py-3 px-2">
                        <Badge className={REQUEST_STATUS_COLORS[req.status]}>
                          {REQUEST_STATUS_LABELS[req.status]}
                        </Badge>
                        {req.is_urgent === 1 && (
                          <Badge className="bg-red-100 text-red-800 mr-1">مستعجل</Badge>
                        )}
                      </td>
                      <td className="py-3 px-2 text-gray-500 text-xs">
                        {new Date(req.created_at).toLocaleDateString('ar-MA')}
                      </td>
                      <td className="py-3 px-2">
                        <div className="flex gap-1">
                          {req.status === 'pending' && (
                            <>
                              <button
                                onClick={() => handleActivate(req.id)}
                                disabled={actionLoading === req.id}
                                className="text-xs bg-green-50 text-green-700 hover:bg-green-100 px-2 py-1 rounded-lg transition-colors disabled:opacity-50"
                              >
                                تفعيل
                              </button>
                              <button
                                onClick={() => handleReject(req.id)}
                                disabled={actionLoading === req.id}
                                className="text-xs bg-red-50 text-red-700 hover:bg-red-100 px-2 py-1 rounded-lg transition-colors disabled:opacity-50"
                              >
                                رفض
                              </button>
                            </>
                          )}
                          <Link
                            href={`/inspector/requests/${req.id}`}
                            className="text-xs bg-primary-50 text-primary-700 hover:bg-primary-100 px-2 py-1 rounded-lg transition-colors"
                          >
                            تفاصيل
                          </Link>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex items-center justify-center gap-2 mt-6">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setPage(p => Math.max(1, p - 1))}
                  disabled={page === 1}
                >
                  السابق
                </Button>
                <span className="text-sm text-gray-500">
                  صفحة {page} من {totalPages}
                </span>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                  disabled={page === totalPages}
                >
                  التالي
                </Button>
              </div>
            )}
          </>
        )}
      </Card>
    </DashboardLayout>
  );
}
