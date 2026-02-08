'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import DashboardLayout from '@/components/DashboardLayout';
import Badge from '@/components/ui/Badge';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import Select from '@/components/ui/Select';
import Spinner from '@/components/ui/Spinner';
import { adminApi, ApiError } from '@/lib/api';
import {
  CATEGORY_LABELS,
  CATEGORY_ICONS,
  REQUEST_STATUS_LABELS,
  REQUEST_STATUS_COLORS,
  ALL_CATEGORIES,
  ALL_REQUEST_STATUSES,
} from '@/lib/constants';
import { formatRelativeTime } from '@/lib/utils';
import type { RequestResponse, RequestStatus, RequestCategory } from '@/lib/types';

export default function AdminRequestsPage() {
  const [requests, setRequests] = useState<RequestResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [hasMore, setHasMore] = useState(false);
  const [showFilters, setShowFilters] = useState(false);

  const [filters, setFilters] = useState({
    status: '',
    category: '',
    search: '',
    is_urgent: '',
  });

  useEffect(() => {
    loadData();
  }, [page, filters]);

  const loadData = async () => {
    setLoading(true);
    try {
      const data = await adminApi.getRequests({
        status: (filters.status as RequestStatus) || undefined,
        category: (filters.category as RequestCategory) || undefined,
        search: filters.search || undefined,
        is_urgent: filters.is_urgent === 'true' ? true : filters.is_urgent === 'false' ? false : undefined,
        page,
        limit: 20,
      });
      setRequests(data.items);
      setTotal(data.total);
      setHasMore(data.has_more);
    } catch (err) {
      console.error('Failed to load requests:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('هل أنت متأكد من حذف هذا الطلب؟')) return;
    try {
      await adminApi.deleteRequest(id);
      loadData();
    } catch (err) {
      if (err instanceof ApiError) alert(err.detail);
    }
  };

  const activeFilterCount = [filters.status, filters.category, filters.search, filters.is_urgent].filter(Boolean).length;

  return (
    <DashboardLayout>
      <div className="mb-4 sm:mb-6">
        <h1 className="text-xl sm:text-2xl font-bold text-gray-900">إدارة الطلبات</h1>
        <p className="text-gray-500 text-sm mt-1">عرض وإدارة جميع طلبات المساعدة</p>
      </div>

      {/* Filters - collapsible on mobile */}
      <div className="bg-white rounded-xl border border-gray-200 mb-4 sm:mb-6 overflow-hidden">
        {/* Mobile filter toggle */}
        <button
          className="sm:hidden w-full flex items-center justify-between p-4"
          onClick={() => setShowFilters(!showFilters)}
        >
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium text-gray-700">الفلاتر</span>
            {activeFilterCount > 0 && (
              <Badge className="bg-primary-100 text-primary-700 text-xs">{activeFilterCount}</Badge>
            )}
          </div>
          <svg className={`w-5 h-5 text-gray-400 transition-transform ${showFilters ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </button>

        <div className={`p-4 pt-0 sm:pt-4 space-y-3 sm:space-y-0 sm:grid sm:grid-cols-5 sm:gap-3 ${showFilters ? 'block' : 'hidden sm:grid'}`}>
          <Input
            placeholder="بحث بالاسم أو الهاتف..."
            value={filters.search}
            onChange={(e) => { setFilters({ ...filters, search: e.target.value }); setPage(1); }}
          />
          <Select
            options={[{ value: '', label: 'جميع الحالات' }, ...ALL_REQUEST_STATUSES.map((s) => ({ value: s, label: REQUEST_STATUS_LABELS[s] }))]}
            value={filters.status}
            onChange={(e) => { setFilters({ ...filters, status: e.target.value }); setPage(1); }}
          />
          <Select
            options={[{ value: '', label: 'جميع التصنيفات' }, ...ALL_CATEGORIES.map((c) => ({ value: c, label: CATEGORY_LABELS[c] }))]}
            value={filters.category}
            onChange={(e) => { setFilters({ ...filters, category: e.target.value }); setPage(1); }}
          />
          <Select
            options={[{ value: '', label: 'الكل' }, { value: 'true', label: 'مستعجل فقط' }, { value: 'false', label: 'عادي فقط' }]}
            value={filters.is_urgent}
            onChange={(e) => { setFilters({ ...filters, is_urgent: e.target.value }); setPage(1); }}
          />
          <Button
            variant="secondary"
            onClick={() => { setFilters({ status: '', category: '', search: '', is_urgent: '' }); setPage(1); }}
            className="w-full sm:w-auto"
          >
            مسح الفلاتر
          </Button>
        </div>
      </div>

      {/* Total */}
      <p className="text-sm text-gray-500 mb-3">{total} طلب</p>

      {/* Content */}
      {loading ? (
        <div className="flex justify-center py-12"><Spinner /></div>
      ) : requests.length === 0 ? (
        <div className="text-center py-12 bg-white rounded-xl border border-gray-200">
          <p className="text-4xl mb-2">📭</p>
          <p className="text-gray-500">لا توجد طلبات مطابقة</p>
        </div>
      ) : (
        <>
          {/* Mobile: Cards */}
          <div className="sm:hidden space-y-3">
            {requests.map((req) => (
              <Link key={req.id} href={`/admin/requests/${req.id}`} className="block">
                <div className="bg-white rounded-xl border border-gray-200 p-4 active:bg-gray-50 transition-colors">
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-gray-900 truncate">{req.requester_name}</p>
                      <p className="text-xs text-gray-400 mt-0.5" dir="ltr">{req.requester_phone}</p>
                    </div>
                    <div className="flex flex-col items-end gap-1 mr-2">
                      <Badge className={`${REQUEST_STATUS_COLORS[req.status]} text-xs`}>
                        {REQUEST_STATUS_LABELS[req.status]}
                      </Badge>
                      {req.is_urgent === 1 && (
                        <Badge className="bg-red-100 text-red-800 text-xs">مستعجل</Badge>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-3 text-xs text-gray-500">
                    <span>{CATEGORY_ICONS[req.category]} {CATEGORY_LABELS[req.category]}</span>
                    <span className="text-gray-300">|</span>
                    <span>{req.city || '-'}{req.region ? ` - ${req.region}` : ''}</span>
                    <span className="text-gray-300">|</span>
                    <span>{formatRelativeTime(req.created_at)}</span>
                  </div>
                  {req.inspector_name && (
                    <div className="flex items-center gap-1 mt-2">
                      <span className="text-[10px] text-indigo-600 bg-indigo-50 px-1.5 py-0.5 rounded-md">
                        👁️ {req.inspector_name}
                      </span>
                    </div>
                  )}
                  <div className="flex items-center justify-between mt-3 pt-2 border-t border-gray-50">
                    <span className="text-xs text-gray-400">الأولوية: <span className={`font-bold ${req.is_urgent ? 'text-red-600' : 'text-gray-700'}`}>{req.priority_score}</span></span>
                    <button
                      onClick={(e) => { e.preventDefault(); e.stopPropagation(); handleDelete(req.id); }}
                      className="text-xs text-red-500 hover:text-red-700"
                    >
                      حذف
                    </button>
                  </div>
                </div>
              </Link>
            ))}
          </div>

          {/* Desktop: Table */}
          <div className="hidden sm:block bg-white rounded-xl border border-gray-200 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-gray-50 text-gray-500 border-b">
                    <th className="text-right px-4 py-3">الاسم</th>
                    <th className="text-right px-4 py-3">التصنيف</th>
                    <th className="text-center px-4 py-3">الحالة</th>
                    <th className="text-center px-4 py-3">الأولوية</th>
                    <th className="text-right px-4 py-3">المدينة</th>
                    <th className="text-right px-4 py-3">المنطقة</th>
                    <th className="text-right px-4 py-3">المراقب</th>
                    <th className="text-right px-4 py-3">التاريخ</th>
                    <th className="text-center px-4 py-3">إجراءات</th>
                  </tr>
                </thead>
                <tbody>
                  {requests.map((req) => (
                    <tr key={req.id} className="border-b border-gray-50 hover:bg-gray-50">
                      <td className="px-4 py-3">
                        <div>
                          <span className="font-medium">{req.requester_name}</span>
                          <p className="text-xs text-gray-400" dir="ltr">{req.requester_phone}</p>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <span>{CATEGORY_ICONS[req.category]} {CATEGORY_LABELS[req.category]}</span>
                      </td>
                      <td className="px-4 py-3 text-center">
                        <Badge className={REQUEST_STATUS_COLORS[req.status]}>
                          {REQUEST_STATUS_LABELS[req.status]}
                        </Badge>
                      </td>
                      <td className="px-4 py-3 text-center">
                        <span className={`font-medium ${req.is_urgent ? 'text-red-600' : ''}`}>
                          {req.priority_score}{req.is_urgent === 1 && ' !'}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-500">{req.city || '-'}</td>
                      <td className="px-4 py-3 text-sm text-gray-500">{req.region || '-'}</td>
                      <td className="px-4 py-3">
                        {req.inspector_name ? (
                          <span className="text-xs text-indigo-700 bg-indigo-50 px-1.5 py-0.5 rounded-md whitespace-nowrap">{req.inspector_name}</span>
                        ) : (
                          <span className="text-sm text-gray-300">-</span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-400">{formatRelativeTime(req.created_at)}</td>
                      <td className="px-4 py-3 text-center">
                        <div className="flex items-center justify-center gap-1">
                          <Link href={`/admin/requests/${req.id}`}>
                            <Button variant="ghost" size="sm">تفاصيل</Button>
                          </Link>
                          <Button variant="ghost" size="sm" className="text-red-600 hover:bg-red-50" onClick={() => handleDelete(req.id)}>
                            حذف
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Pagination */}
          <div className="flex items-center justify-between mt-4 sm:mt-6">
            <Button variant="secondary" size="sm" disabled={page <= 1} onClick={() => setPage(page - 1)}>
              السابق
            </Button>
            <span className="text-sm text-gray-500">صفحة {page}</span>
            <Button variant="secondary" size="sm" disabled={!hasMore} onClick={() => setPage(page + 1)}>
              التالي
            </Button>
          </div>
        </>
      )}
    </DashboardLayout>
  );
}
