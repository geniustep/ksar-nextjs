'use client';

import React, { useEffect, useState, useCallback } from 'react';
import DashboardLayout from '@/components/DashboardLayout';
import { Card } from '@/components/ui/Card';
import Badge from '@/components/ui/Badge';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import Select from '@/components/ui/Select';
import Spinner from '@/components/ui/Spinner';
import { adminApi, ApiError } from '@/lib/api';
import type { CitizenListItem } from '@/lib/types';

export default function AdminCitizensPage() {
  const [citizens, setCitizens] = useState<CitizenListItem[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [statusFilter, setStatusFilter] = useState('');
  const [searchQuery, setSearchQuery] = useState('');

  const limit = 20;

  const loadCitizens = useCallback(async () => {
    setLoading(true);
    try {
      const res = await adminApi.getCitizens({
        status: statusFilter || undefined,
        search: searchQuery || undefined,
        page,
        limit,
      });
      setCitizens(res.items);
      setTotal(res.total);
    } catch (err) {
      console.error('Failed to load citizens:', err);
    } finally {
      setLoading(false);
    }
  }, [statusFilter, searchQuery, page]);

  useEffect(() => {
    loadCitizens();
  }, [loadCitizens]);

  const handleStatusChange = async (citizenId: string, newStatus: string) => {
    try {
      await adminApi.updateCitizenStatus(citizenId, newStatus);
      await loadCitizens();
    } catch (err) {
      if (err instanceof ApiError) alert(err.detail);
    }
  };

  const handleDelete = async (citizen: CitizenListItem) => {
    if (!confirm(`هل أنت متأكد من حذف المواطن ${citizen.full_name}؟`)) return;
    try {
      await adminApi.deleteCitizen(citizen.id);
      await loadCitizens();
    } catch (err) {
      if (err instanceof ApiError) alert(err.detail);
    }
  };

  const totalPages = Math.ceil(total / limit);

  return (
    <DashboardLayout>
      <div className="mb-4 sm:mb-6">
        <h1 className="text-xl sm:text-2xl font-bold text-neutral-dark">المواطنون</h1>
        <p className="text-gray-500 text-sm mt-1">إدارة حسابات المواطنين ومتابعة حالاتهم</p>
      </div>

      {/* Filters */}
      <Card className="mb-4 sm:mb-6">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4">
          <Input
            label="بحث"
            placeholder="اسم أو رقم هاتف..."
            value={searchQuery}
            onChange={(e) => { setSearchQuery(e.target.value); setPage(1); }}
          />
          <Select
            label="الحالة"
            value={statusFilter}
            onChange={(e) => { setStatusFilter(e.target.value); setPage(1); }}
            placeholder="جميع الحالات"
            options={[
              { value: 'active', label: 'نشط' },
              { value: 'pending', label: 'معلق' },
              { value: 'suspended', label: 'معطل' },
            ]}
          />
          <div className="flex items-end">
            <p className="text-sm text-gray-500">{total} مواطن</p>
          </div>
        </div>
      </Card>

      {/* Citizens */}
      {loading ? (
        <div className="flex justify-center py-12"><Spinner /></div>
      ) : citizens.length === 0 ? (
        <Card>
          <div className="text-center py-12 text-gray-400">
            <p className="text-4xl mb-2">👥</p>
            <p>لا يوجد مواطنون</p>
          </div>
        </Card>
      ) : (
        <>
          {/* Mobile: Cards */}
          <div className="sm:hidden space-y-3">
            {citizens.map((citizen) => (
              <div key={citizen.id} className="bg-white rounded-xl border border-gray-200 p-4">
                <div className="flex items-start justify-between mb-2">
                  <div>
                    <p className="font-semibold text-gray-900">{citizen.full_name}</p>
                    <p className="text-xs text-gray-500 mt-0.5" dir="ltr">{citizen.phone}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge className={
                      citizen.total_requests > 3 ? 'bg-orange-100 text-orange-800' : citizen.total_requests > 0 ? 'bg-blue-100 text-blue-800' : 'bg-gray-100 text-gray-600'
                    }>
                      {citizen.total_requests} طلب
                    </Badge>
                    <Badge className={
                      citizen.status === 'active' ? 'bg-green-100 text-green-800' : citizen.status === 'pending' ? 'bg-yellow-100 text-yellow-800' : 'bg-red-100 text-red-800'
                    }>
                      {citizen.status === 'active' ? 'نشط' : citizen.status === 'pending' ? 'معلق' : 'معطل'}
                    </Badge>
                  </div>
                </div>
                <div className="flex items-center gap-3 text-xs text-gray-400 mb-3">
                  {citizen.supervisor_name && <span>المراقب: {citizen.supervisor_name}</span>}
                  <span>{new Date(citizen.created_at).toLocaleDateString('ar-MA')}</span>
                </div>
                <div className="flex gap-2">
                  {(citizen.status === 'pending' || citizen.status === 'suspended') && (
                    <button onClick={() => handleStatusChange(citizen.id, 'active')} className="text-xs bg-green-50 text-green-700 px-3 py-1.5 rounded-lg flex-1">
                      تفعيل
                    </button>
                  )}
                  {citizen.status === 'active' && (
                    <button onClick={() => handleStatusChange(citizen.id, 'suspended')} className="text-xs bg-orange-50 text-orange-700 px-3 py-1.5 rounded-lg flex-1">
                      تعطيل
                    </button>
                  )}
                  <button onClick={() => handleDelete(citizen)} className="text-xs bg-red-50 text-red-700 px-3 py-1.5 rounded-lg">
                    حذف
                  </button>
                </div>
              </div>
            ))}
          </div>

          {/* Desktop: Table */}
          <Card className="hidden sm:block">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-100">
                    <th className="text-right py-3 px-3 text-gray-500 font-medium">الاسم</th>
                    <th className="text-right py-3 px-3 text-gray-500 font-medium">الهاتف</th>
                    <th className="text-right py-3 px-3 text-gray-500 font-medium">الحالة</th>
                    <th className="text-center py-3 px-3 text-gray-500 font-medium">الطلبات</th>
                    <th className="text-right py-3 px-3 text-gray-500 font-medium">المراقب</th>
                    <th className="text-right py-3 px-3 text-gray-500 font-medium">التسجيل</th>
                    <th className="text-right py-3 px-3 text-gray-500 font-medium">إجراءات</th>
                  </tr>
                </thead>
                <tbody>
                  {citizens.map((citizen) => (
                    <tr key={citizen.id} className="border-b border-gray-50 hover:bg-gray-50/50">
                      <td className="py-3 px-3 font-medium">{citizen.full_name}</td>
                      <td className="py-3 px-3 text-gray-600" dir="ltr">{citizen.phone}</td>
                      <td className="py-3 px-3">
                        <Badge className={citizen.status === 'active' ? 'bg-green-100 text-green-800' : citizen.status === 'pending' ? 'bg-yellow-100 text-yellow-800' : 'bg-red-100 text-red-800'}>
                          {citizen.status === 'active' ? 'نشط' : citizen.status === 'pending' ? 'معلق' : 'معطل'}
                        </Badge>
                      </td>
                      <td className="py-3 px-3 text-center">
                        <Badge className={citizen.total_requests > 3 ? 'bg-orange-100 text-orange-800' : citizen.total_requests > 0 ? 'bg-blue-100 text-blue-800' : 'bg-gray-100 text-gray-600'}>
                          {citizen.total_requests}
                        </Badge>
                      </td>
                      <td className="py-3 px-3 text-gray-500 text-xs">{citizen.supervisor_name || '-'}</td>
                      <td className="py-3 px-3 text-gray-500 text-xs">{new Date(citizen.created_at).toLocaleDateString('ar-MA')}</td>
                      <td className="py-3 px-3">
                        <div className="flex gap-1 flex-wrap">
                          {(citizen.status === 'pending' || citizen.status === 'suspended') && (
                            <button onClick={() => handleStatusChange(citizen.id, 'active')} className="text-xs bg-green-50 text-green-700 hover:bg-green-100 px-2 py-1 rounded-lg">تفعيل</button>
                          )}
                          {citizen.status === 'active' && (
                            <button onClick={() => handleStatusChange(citizen.id, 'suspended')} className="text-xs bg-orange-50 text-orange-700 hover:bg-orange-100 px-2 py-1 rounded-lg">تعطيل</button>
                          )}
                          <button onClick={() => handleDelete(citizen)} className="text-xs bg-red-50 text-red-700 hover:bg-red-100 px-2 py-1 rounded-lg">حذف</button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>
        </>
      )}

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
    </DashboardLayout>
  );
}
