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
  const [phoneCounts, setPhoneCounts] = useState<Record<string, number>>({});
  const [showFilters, setShowFilters] = useState(false);

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

      const uniquePhones = Array.from(new Set(res.items.map(r => r.requester_phone)));
      const counts: Record<string, number> = {};
      await Promise.all(
        uniquePhones.map(async (phone) => {
          try {
            const countRes = await inspectorApi.getPhoneRequestCount(phone);
            counts[phone] = countRes.count;
          } catch {
            // Silently handle
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
  const activeFilterCount = [statusFilter, categoryFilter, searchQuery, urgentOnly, mineOnly].filter(Boolean).length;

  return (
    <DashboardLayout>
      <div className="mb-4 sm:mb-6">
        <h1 className="text-lg sm:text-2xl font-bold text-neutral-dark">الطلبات</h1>
        <p className="text-gray-500 text-xs sm:text-base mt-0.5">مراجعة وفلترة الطلبات</p>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-xl border border-gray-100 mb-4 sm:mb-6 overflow-hidden">
        <button
          className="sm:hidden w-full flex items-center justify-between p-3"
          onClick={() => setShowFilters(!showFilters)}
        >
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium text-gray-700">الفلاتر</span>
            {activeFilterCount > 0 && (
              <Badge className="bg-primary-100 text-primary-700 text-[10px]">{activeFilterCount}</Badge>
            )}
          </div>
          <svg className={`w-4 h-4 text-gray-400 transition-transform ${showFilters ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </button>
        <div className={`p-3 pt-0 sm:pt-3 sm:p-4 space-y-3 sm:space-y-0 sm:grid sm:grid-cols-4 sm:gap-4 ${showFilters ? 'block' : 'hidden sm:grid'}`}>
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
          <div className="flex items-end gap-3 sm:gap-4">
            <label className="flex items-center gap-1.5 cursor-pointer">
              <input
                type="checkbox"
                checked={mineOnly}
                onChange={(e) => { setMineOnly(e.target.checked); setPage(1); }}
                className="rounded border-gray-300 text-primary-600 focus:ring-primary-500"
              />
              <span className="text-xs sm:text-sm text-gray-600">طلباتي</span>
            </label>
            <label className="flex items-center gap-1.5 cursor-pointer">
              <input
                type="checkbox"
                checked={urgentOnly}
                onChange={(e) => { setUrgentOnly(e.target.checked); setPage(1); }}
                className="rounded border-gray-300 text-primary-600 focus:ring-primary-500"
              />
              <span className="text-xs sm:text-sm text-gray-600">مستعجلة</span>
            </label>
          </div>
        </div>
      </div>

      {/* Results */}
      <p className="text-xs sm:text-sm text-gray-500 mb-3">{total} طلب</p>

      {loading ? (
        <div className="flex justify-center py-12"><Spinner /></div>
      ) : requests.length === 0 ? (
        <div className="text-center py-12 bg-white rounded-xl border border-gray-100">
          <p className="text-3xl mb-2">📭</p>
          <p className="text-gray-500 text-sm">لا توجد طلبات</p>
        </div>
      ) : (
        <>
          {/* Mobile: Cards */}
          <div className="sm:hidden space-y-2.5">
            {requests.map((req) => (
              <Link key={req.id} href={`/inspector/requests/${req.id}`} className="block">
                <div className="bg-white rounded-xl border border-gray-100 p-3 active:bg-gray-50 transition-colors">
                  <div className="flex items-start justify-between mb-1.5">
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-gray-900 text-sm truncate">{req.requester_name}</p>
                      <p className="text-[10px] text-gray-400 mt-0.5" dir="ltr">
                        {req.requester_phone}
                        {phoneCounts[req.requester_phone] > 1 && (
                          <span className="text-orange-500 mr-1">({phoneCounts[req.requester_phone]} طلبات)</span>
                        )}
                      </p>
                    </div>
                    <div className="flex flex-col items-end gap-1 mr-2">
                      {req.is_flagged === 1 && <Badge className="bg-orange-100 text-orange-800 text-[10px]">⚠️ مشبوه</Badge>}
                      <Badge className={`${REQUEST_STATUS_COLORS[req.status]} text-[10px]`}>{REQUEST_STATUS_LABELS[req.status]}</Badge>
                      {req.is_urgent === 1 && <Badge className="bg-red-100 text-red-800 text-[10px]">مستعجل</Badge>}
                    </div>
                  </div>
                  {req.is_flagged === 1 && req.flag_reason && (
                    <div className="mb-1.5 p-1.5 bg-orange-50 border border-orange-100 rounded-lg">
                      <p className="text-[10px] text-orange-700 leading-relaxed truncate">{req.flag_reason}</p>
                      {req.flagged_by_name && (
                        <p className="text-[9px] text-orange-500 mt-0.5">المراقب: {req.flagged_by_name}</p>
                      )}
                    </div>
                  )}
                  <div className="flex items-center gap-2 text-[10px] text-gray-500 mb-1.5">
                    <span>{CATEGORY_LABELS[req.category as RequestCategory] || req.category}</span>
                    <span className="text-gray-300">|</span>
                    <span>{req.city || '-'}{req.region ? ` - ${req.region}` : ''}</span>
                    {req.pledge_count !== undefined && req.pledge_count > 0 && (
                      <>
                        <span className="text-gray-300">|</span>
                        <span className="text-blue-600">{req.pledge_count} تعهد</span>
                      </>
                    )}
                  </div>
                  <div className="flex items-center gap-1 flex-wrap mb-2">
                    {req.inspector_name && (
                      <span className="text-[10px] text-indigo-600 bg-indigo-50 px-1.5 py-0.5 rounded-md">
                        👁️ {req.inspector_name}
                      </span>
                    )}
                    {req.org_name && (
                      <span className="text-[10px] text-green-700 bg-green-50 px-1.5 py-0.5 rounded-md">
                        🏢 {req.org_name}
                      </span>
                    )}
                  </div>
                  {req.status === 'pending' && (
                    <div className="flex gap-2 pt-2 border-t border-gray-50">
                      <button
                        onClick={(e) => { e.preventDefault(); e.stopPropagation(); handleActivate(req.id); }}
                        disabled={actionLoading === req.id}
                        className="text-xs bg-green-50 text-green-700 px-3 py-1.5 rounded-lg flex-1 disabled:opacity-50"
                      >
                        تفعيل
                      </button>
                      <button
                        onClick={(e) => { e.preventDefault(); e.stopPropagation(); handleReject(req.id); }}
                        disabled={actionLoading === req.id}
                        className="text-xs bg-red-50 text-red-700 px-3 py-1.5 rounded-lg flex-1 disabled:opacity-50"
                      >
                        رفض
                      </button>
                    </div>
                  )}
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
                    <th className="text-right py-3 px-2 text-gray-500 font-medium">الاسم</th>
                    <th className="text-right py-3 px-2 text-gray-500 font-medium">الهاتف</th>
                    <th className="text-center py-3 px-2 text-gray-500 font-medium">طلبات</th>
                    <th className="text-right py-3 px-2 text-gray-500 font-medium">التصنيف</th>
                    <th className="text-right py-3 px-2 text-gray-500 font-medium">المدينة</th>
                    <th className="text-right py-3 px-2 text-gray-500 font-medium">المنطقة</th>
                    <th className="text-right py-3 px-2 text-gray-500 font-medium">المراقب</th>
                    <th className="text-right py-3 px-2 text-gray-500 font-medium">المؤسسة</th>
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
                        <Link href={`/inspector/requests/${req.id}`} className="font-medium text-primary-600 hover:text-primary-700">{req.requester_name}</Link>
                      </td>
                      <td className="py-3 px-2 text-gray-600" dir="ltr">{req.requester_phone}</td>
                      <td className="py-3 px-2 text-center">
                        {phoneCounts[req.requester_phone] !== undefined ? (
                          <Badge className={phoneCounts[req.requester_phone] > 3 ? 'bg-orange-100 text-orange-800' : phoneCounts[req.requester_phone] > 1 ? 'bg-blue-100 text-blue-800' : 'bg-gray-100 text-gray-600'}>
                            {phoneCounts[req.requester_phone]}
                          </Badge>
                        ) : <span className="text-gray-300">-</span>}
                      </td>
                      <td className="py-3 px-2">{CATEGORY_LABELS[req.category as RequestCategory] || req.category}</td>
                      <td className="py-3 px-2 text-gray-600">{req.city || '-'}</td>
                      <td className="py-3 px-2 text-gray-600">{req.region || '-'}</td>
                      <td className="py-3 px-2">
                        {req.inspector_name ? (
                          <span className="text-xs text-indigo-700 bg-indigo-50 px-1.5 py-0.5 rounded-md whitespace-nowrap">{req.inspector_name}</span>
                        ) : (
                          <span className="text-gray-300">-</span>
                        )}
                      </td>
                      <td className="py-3 px-2">
                        {req.org_name ? (
                          <span className="text-xs text-green-700 bg-green-50 px-1.5 py-0.5 rounded-md whitespace-nowrap">{req.org_name}</span>
                        ) : (
                          <span className="text-gray-300">-</span>
                        )}
                      </td>
                      <td className="py-3 px-2 text-center">
                        {req.pledge_count !== undefined && req.pledge_count > 0 ? (
                          <Badge className="bg-blue-100 text-blue-800">{req.pledge_count}</Badge>
                        ) : <span className="text-gray-300">-</span>}
                      </td>
                      <td className="py-3 px-2">
                        {req.is_flagged === 1 && <Badge className="bg-orange-100 text-orange-800 ml-1">⚠️</Badge>}
                        <Badge className={REQUEST_STATUS_COLORS[req.status]}>{REQUEST_STATUS_LABELS[req.status]}</Badge>
                        {req.is_urgent === 1 && <Badge className="bg-red-100 text-red-800 mr-1">مستعجل</Badge>}
                      </td>
                      <td className="py-3 px-2 text-gray-500 text-xs">{new Date(req.created_at).toLocaleDateString('ar-MA')}</td>
                      <td className="py-3 px-2">
                        <div className="flex gap-1">
                          {req.status === 'pending' && (
                            <>
                              <button onClick={() => handleActivate(req.id)} disabled={actionLoading === req.id} className="text-xs bg-green-50 text-green-700 hover:bg-green-100 px-2 py-1 rounded-lg disabled:opacity-50">تفعيل</button>
                              <button onClick={() => handleReject(req.id)} disabled={actionLoading === req.id} className="text-xs bg-red-50 text-red-700 hover:bg-red-100 px-2 py-1 rounded-lg disabled:opacity-50">رفض</button>
                            </>
                          )}
                          <Link href={`/inspector/requests/${req.id}`} className="text-xs bg-primary-50 text-primary-700 hover:bg-primary-100 px-2 py-1 rounded-lg">تفاصيل</Link>
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
