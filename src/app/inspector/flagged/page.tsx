'use client';

import React, { useEffect, useState, useCallback } from 'react';
import Link from 'next/link';
import DashboardLayout from '@/components/DashboardLayout';
import { Card } from '@/components/ui/Card';
import Badge from '@/components/ui/Badge';
import Button from '@/components/ui/Button';
import Spinner from '@/components/ui/Spinner';
import { inspectorApi } from '@/lib/api';
import {
  REQUEST_STATUS_LABELS,
  REQUEST_STATUS_COLORS,
  CATEGORY_LABELS,
} from '@/lib/constants';
import type { RequestResponse, RequestCategory } from '@/lib/types';

export default function FlaggedRequestsPage() {
  const [requests, setRequests] = useState<RequestResponse[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const limit = 20;

  const loadRequests = useCallback(async () => {
    setLoading(true);
    try {
      const res = await inspectorApi.getFlaggedRequests({ page, limit });
      setRequests(res.items);
      setTotal(res.total);
    } catch (err) {
      console.error('Failed to load flagged requests:', err);
    } finally {
      setLoading(false);
    }
  }, [page]);

  useEffect(() => {
    loadRequests();
  }, [loadRequests]);

  const totalPages = Math.ceil(total / limit);

  return (
    <DashboardLayout>
      <div className="mb-4 sm:mb-6">
        <h1 className="text-lg sm:text-2xl font-bold text-neutral-dark flex items-center gap-2">
          <span>⚠️</span> الطلبات المشبوهة
        </h1>
        <p className="text-gray-500 text-xs sm:text-base mt-0.5">
          متابعة الطلبات التي أُبلغ عنها بوجود شك
        </p>
      </div>

      <p className="text-xs sm:text-sm text-gray-500 mb-3">{total} طلب مشبوه</p>

      {loading ? (
        <div className="flex justify-center py-12"><Spinner /></div>
      ) : requests.length === 0 ? (
        <div className="text-center py-12 bg-white rounded-xl border border-gray-100">
          <p className="text-3xl mb-2">✅</p>
          <p className="text-gray-500 text-sm">لا توجد طلبات مشبوهة حالياً</p>
        </div>
      ) : (
        <>
          {/* Mobile: Cards */}
          <div className="sm:hidden space-y-2.5">
            {requests.map((req) => (
              <Link key={req.id} href={`/inspector/requests/${req.id}`} className="block">
                <div className="bg-white rounded-xl border border-orange-200 p-3 active:bg-orange-50/50 transition-colors">
                  <div className="flex items-start justify-between mb-1.5">
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-gray-900 text-sm truncate">{req.requester_name}</p>
                      <p className="text-[10px] text-gray-400 mt-0.5" dir="ltr">{req.requester_phone}</p>
                    </div>
                    <div className="flex flex-col items-end gap-1 mr-2">
                      <Badge className="bg-orange-100 text-orange-800 text-[10px]">⚠️ مشبوه</Badge>
                      <Badge className={`${REQUEST_STATUS_COLORS[req.status]} text-[10px]`}>
                        {REQUEST_STATUS_LABELS[req.status]}
                      </Badge>
                    </div>
                  </div>

                  {/* Flag reason */}
                  <div className="p-2 bg-orange-50 border border-orange-100 rounded-lg mb-1.5">
                    <p className="text-[10px] text-orange-700 leading-relaxed">{req.flag_reason || '-'}</p>
                    {req.flagged_by_name && (
                      <p className="text-[9px] text-orange-500 mt-1">
                        أبلغ عنه: <span className="font-medium">{req.flagged_by_name}</span>
                        {req.flagged_at && (
                          <span className="mr-1"> - {new Date(req.flagged_at).toLocaleDateString('ar-MA')}</span>
                        )}
                      </p>
                    )}
                  </div>

                  <div className="flex items-center gap-2 text-[10px] text-gray-500">
                    <span>{CATEGORY_LABELS[req.category as RequestCategory] || req.category}</span>
                    <span className="text-gray-300">|</span>
                    <span>{req.city || '-'}{req.region ? ` - ${req.region}` : ''}</span>
                    {req.inspector_name && (
                      <>
                        <span className="text-gray-300">|</span>
                        <span className="text-indigo-600">👁️ {req.inspector_name}</span>
                      </>
                    )}
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
                    <th className="text-right py-3 px-2 text-gray-500 font-medium">الاسم</th>
                    <th className="text-right py-3 px-2 text-gray-500 font-medium">التصنيف</th>
                    <th className="text-right py-3 px-2 text-gray-500 font-medium">المدينة</th>
                    <th className="text-right py-3 px-2 text-gray-500 font-medium">سبب التنبيه</th>
                    <th className="text-right py-3 px-2 text-gray-500 font-medium">أبلغ عنه</th>
                    <th className="text-right py-3 px-2 text-gray-500 font-medium">المراقب المكلف</th>
                    <th className="text-right py-3 px-2 text-gray-500 font-medium">الحالة</th>
                    <th className="text-right py-3 px-2 text-gray-500 font-medium">تاريخ التنبيه</th>
                    <th className="text-right py-3 px-2 text-gray-500 font-medium">إجراء</th>
                  </tr>
                </thead>
                <tbody>
                  {requests.map((req) => (
                    <tr key={req.id} className="border-b border-gray-50 hover:bg-orange-50/30">
                      <td className="py-3 px-2">
                        <Link href={`/inspector/requests/${req.id}`} className="font-medium text-primary-600 hover:text-primary-700">
                          {req.requester_name}
                        </Link>
                        <p className="text-[10px] text-gray-400" dir="ltr">{req.requester_phone}</p>
                      </td>
                      <td className="py-3 px-2 text-gray-600">{CATEGORY_LABELS[req.category as RequestCategory] || req.category}</td>
                      <td className="py-3 px-2 text-gray-600">{req.city || '-'}</td>
                      <td className="py-3 px-2">
                        <p className="text-xs text-orange-700 max-w-[200px] truncate" title={req.flag_reason || ''}>
                          {req.flag_reason || '-'}
                        </p>
                      </td>
                      <td className="py-3 px-2">
                        {req.flagged_by_name ? (
                          <span className="text-xs text-orange-700 bg-orange-50 px-1.5 py-0.5 rounded-md whitespace-nowrap">
                            {req.flagged_by_name}
                          </span>
                        ) : <span className="text-gray-300">-</span>}
                      </td>
                      <td className="py-3 px-2">
                        {req.inspector_name ? (
                          <span className="text-xs text-indigo-700 bg-indigo-50 px-1.5 py-0.5 rounded-md whitespace-nowrap">
                            {req.inspector_name}
                          </span>
                        ) : <span className="text-gray-300">-</span>}
                      </td>
                      <td className="py-3 px-2">
                        <Badge className={REQUEST_STATUS_COLORS[req.status]}>{REQUEST_STATUS_LABELS[req.status]}</Badge>
                      </td>
                      <td className="py-3 px-2 text-gray-500 text-xs">
                        {req.flagged_at ? new Date(req.flagged_at).toLocaleDateString('ar-MA') : '-'}
                      </td>
                      <td className="py-3 px-2">
                        <Link href={`/inspector/requests/${req.id}`} className="text-xs bg-primary-50 text-primary-700 hover:bg-primary-100 px-2 py-1 rounded-lg">
                          تفاصيل
                        </Link>
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
