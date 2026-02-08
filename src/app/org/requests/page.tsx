'use client';

import React, { useEffect, useState } from 'react';
import DashboardLayout from '@/components/DashboardLayout';
import Badge from '@/components/ui/Badge';
import Button from '@/components/ui/Button';
import Select from '@/components/ui/Select';
import Spinner from '@/components/ui/Spinner';
import Modal from '@/components/ui/Modal';
import Textarea from '@/components/ui/Textarea';
import { orgApi, ApiError } from '@/lib/api';
import { CATEGORY_LABELS, CATEGORY_ICONS, ALL_CATEGORIES } from '@/lib/constants';
import { formatRelativeTime } from '@/lib/utils';
import type { RequestResponse, OrgStats, RequestCategory } from '@/lib/types';

export default function OrgRequestsPage() {
  const [requests, setRequests] = useState<RequestResponse[]>([]);
  const [stats, setStats] = useState<OrgStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [categoryFilter, setCategoryFilter] = useState('');
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [hasMore, setHasMore] = useState(false);

  const [pledgeModal, setPledgeModal] = useState<string | null>(null);
  const [pledgeNotes, setPledgeNotes] = useState('');
  const [pledging, setPledging] = useState(false);

  useEffect(() => {
    loadData();
  }, [categoryFilter, page]);

  const loadData = async () => {
    setLoading(true);
    try {
      const [reqData, statsData] = await Promise.all([
        orgApi.getAvailableRequests({
          category: categoryFilter as RequestCategory || undefined,
          page,
          limit: 20,
        }),
        orgApi.getStats(),
      ]);
      setRequests(reqData.items);
      setTotal(reqData.total);
      setHasMore(reqData.has_more);
      setStats(statsData);
    } catch (err) {
      console.error('Failed to load data:', err);
    } finally {
      setLoading(false);
    }
  };

  const handlePledge = async () => {
    if (!pledgeModal) return;
    setPledging(true);
    try {
      await orgApi.createAssignment({
        request_id: pledgeModal,
        notes: pledgeNotes || undefined,
      });
      setPledgeModal(null);
      setPledgeNotes('');
      loadData();
    } catch (err) {
      if (err instanceof ApiError) alert(err.detail);
    } finally {
      setPledging(false);
    }
  };

  const categoryOptions = [
    { value: '', label: 'جميع التصنيفات' },
    ...ALL_CATEGORIES.map((c) => ({ value: c, label: CATEGORY_LABELS[c] })),
  ];

  return (
    <DashboardLayout>
      <div className="mb-4 sm:mb-6">
        <h1 className="text-lg sm:text-2xl font-bold text-gray-900">الطلبات المتاحة</h1>
        <p className="text-gray-500 text-xs sm:text-base mt-0.5">طلبات المساعدة المتاحة للتكفل بها</p>
      </div>

      {/* Stats - compact */}
      {stats && (
        <div className="grid grid-cols-2 gap-2.5 sm:gap-4 mb-4 sm:mb-6">
          <div className="bg-white rounded-xl border border-gray-100 p-3 sm:p-5">
            <p className="text-[10px] sm:text-sm text-gray-500 mb-0.5">إجمالي التكفلات</p>
            <p className="text-lg sm:text-3xl font-bold text-primary-600">{stats.data.total_assignments}</p>
          </div>
          <div className="bg-white rounded-xl border border-gray-100 p-3 sm:p-5">
            <p className="text-[10px] sm:text-sm text-gray-500 mb-0.5">مكتمل</p>
            <p className="text-lg sm:text-3xl font-bold text-green-600">{stats.data.total_completed}</p>
          </div>
          <div className="bg-white rounded-xl border border-gray-100 p-3 sm:p-5">
            <p className="text-[10px] sm:text-sm text-gray-500 mb-0.5">قيد التنفيذ</p>
            <p className="text-lg sm:text-3xl font-bold text-orange-600">{stats.data.by_status?.in_progress || 0}</p>
          </div>
          <div className="bg-white rounded-xl border border-gray-100 p-3 sm:p-5">
            <p className="text-[10px] sm:text-sm text-gray-500 mb-0.5">المتاحة</p>
            <p className="text-lg sm:text-3xl font-bold text-blue-600">{total}</p>
          </div>
        </div>
      )}

      {/* Filter */}
      <div className="mb-4 sm:mb-6">
        <Select
          options={categoryOptions}
          value={categoryFilter}
          onChange={(e) => { setCategoryFilter(e.target.value); setPage(1); }}
          className="w-full sm:max-w-xs"
        />
      </div>

      {/* Requests */}
      {loading ? (
        <div className="flex justify-center py-12"><Spinner /></div>
      ) : requests.length === 0 ? (
        <div className="text-center py-10 bg-white rounded-xl border border-gray-100">
          <p className="text-3xl mb-2">📭</p>
          <p className="text-gray-500 text-sm">لا توجد طلبات متاحة حالياً</p>
        </div>
      ) : (
        <>
          <div className="space-y-2.5 sm:space-y-3">
            {requests.map((req) => (
              <div key={req.id} className="bg-white rounded-xl border border-gray-100 p-3 sm:p-5">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 sm:gap-3">
                  <div className="flex-1">
                    {/* Category + badges */}
                    <div className="flex flex-wrap items-center gap-1.5 sm:gap-2 mb-1.5 sm:mb-2">
                      <span className="text-sm sm:text-lg">{CATEGORY_ICONS[req.category]}</span>
                      <span className="font-medium text-xs sm:text-base">{CATEGORY_LABELS[req.category]}</span>
                      {req.is_urgent === 1 && <Badge className="bg-red-100 text-red-800 text-[10px] sm:text-xs">مستعجل</Badge>}
                      <Badge className="bg-purple-100 text-purple-800 text-[10px] sm:text-xs">أولوية: {req.priority_score}</Badge>
                      {(req.pledge_count !== undefined && req.pledge_count > 0) && (
                        <Badge className="bg-blue-100 text-blue-800 text-[10px] sm:text-xs">{req.pledge_count} تعهد</Badge>
                      )}
                    </div>
                    {/* Description */}
                    <p className="text-gray-700 text-xs sm:text-sm line-clamp-2 mb-1.5 sm:mb-2">{req.description}</p>
                    {/* Info row */}
                    <div className="flex flex-wrap items-center gap-2 sm:gap-4 text-[10px] sm:text-xs text-gray-400">
                      <span>{req.requester_name}</span>
                      {req.city && <span>{req.city}</span>}
                      {req.region && <span>{req.region}</span>}
                      <span>أسرة: {req.family_members}</span>
                      <span>{formatRelativeTime(req.created_at)}</span>
                    </div>
                  </div>

                  <div className="flex-shrink-0 mt-2 sm:mt-0">
                    {req.already_pledged ? (
                      <Badge className="bg-green-100 text-green-700 px-3 py-1.5 sm:px-4 sm:py-2 text-xs">
                        ✓ تم التعهد
                      </Badge>
                    ) : (
                      <Button onClick={() => setPledgeModal(req.id)} size="sm" className="w-full sm:w-auto">
                        تعهد بالطلب
                      </Button>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Pagination */}
          <div className="flex items-center justify-between mt-4 sm:mt-6">
            <Button variant="secondary" size="sm" disabled={page <= 1} onClick={() => setPage(page - 1)}>السابق</Button>
            <span className="text-xs sm:text-sm text-gray-500">صفحة {page} - {total} طلب</span>
            <Button variant="secondary" size="sm" disabled={!hasMore} onClick={() => setPage(page + 1)}>التالي</Button>
          </div>
        </>
      )}

      {/* Pledge Modal */}
      <Modal isOpen={!!pledgeModal} onClose={() => { setPledgeModal(null); setPledgeNotes(''); }} title="التعهد بالطلب">
        <div className="space-y-4">
          <p className="text-gray-600 text-sm">هل تريد التعهد بهذا الطلب؟ سيتم إرسال تعهدك للمراقب للموافقة عليه.</p>
          <Textarea label="ملاحظات (اختياري)" placeholder="أضف ملاحظات..." value={pledgeNotes} onChange={(e) => setPledgeNotes(e.target.value)} />
          <div className="flex gap-3">
            <Button onClick={handlePledge} loading={pledging} className="flex-1">تأكيد التعهد</Button>
            <Button variant="secondary" onClick={() => setPledgeModal(null)}>إلغاء</Button>
          </div>
        </div>
      </Modal>
    </DashboardLayout>
  );
}
