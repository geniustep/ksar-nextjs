'use client';

import React, { Suspense, useEffect } from 'react';
import { useRouter } from 'next/navigation';

function CitizenAuthContent() {
  const router = useRouter();

  // Redirect citizens directly to new-request page (citizen registration disabled for security)
  useEffect(() => {
    // Clear any existing auth state for security
    localStorage.removeItem('access_token');
    router.replace('/citizen/new-request');
  }, [router]);

  return (
    <div className="min-h-screen bg-neutral-light flex flex-col items-center justify-center py-12 px-4">
      <div className="w-full max-w-md text-center">
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-10">
          <div className="w-10 h-10 border-4 border-primary-200 border-t-primary-600 rounded-full animate-spin mx-auto" />
          <p className="mt-4 text-gray-500 text-sm">جاري التحويل...</p>
        </div>
      </div>
    </div>
  );
}

export default function CitizenAuthPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-neutral-light flex flex-col items-center justify-center">
          <div className="w-10 h-10 border-4 border-primary-200 border-t-primary-600 rounded-full animate-spin" />
          <p className="mt-4 text-gray-500 text-sm">جاري التحميل...</p>
        </div>
      }
    >
      <CitizenAuthContent />
    </Suspense>
  );
}
