'use client';

import React from 'react';
import Link from 'next/link';
import Navbar from '@/components/Navbar';

export default function OrgPage() {
  return (
    <div className="min-h-screen bg-neutral-light">
      <Navbar />

      {/* Hero - المواكبة الإنسانية */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-bl from-primary-600 via-primary-700 to-primary-950" />
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-20 right-20 w-72 h-72 bg-accent-500 rounded-full blur-3xl" />
          <div className="absolute bottom-20 left-20 w-96 h-96 bg-primary-400 rounded-full blur-3xl" />
        </div>
        <div className="relative max-w-4xl mx-auto px-4 py-24 sm:py-32 text-center">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-white/10 backdrop-blur-sm rounded-2xl mb-6 text-4xl">
            🤝
          </div>
          <h1 className="text-4xl sm:text-5xl font-bold text-white mb-4">
            المواكبة الإنسانية
          </h1>
          <p className="text-lg text-primary-100 mb-8 max-w-2xl mx-auto">
            مساحة مخصّصة للمؤسسات الخيرية والجمعيات الراغبة في التكفّل بطلبات المساعدة بسرّية واحترام
          </p>
          <Link
            href="/login?redirect=/org/requests"
            className="inline-flex items-center gap-2 px-8 py-3.5 bg-white text-primary-700 rounded-xl font-semibold hover:bg-gray-50 transition-all shadow-lg hover:shadow-xl"
          >
            دخول المؤسسات
          </Link>
        </div>
      </section>

      {/* محتوى للمؤسسات */}
      <section className="py-16 bg-white">
        <div className="max-w-3xl mx-auto px-4">
          <h2 className="text-2xl font-bold text-neutral-dark mb-6 text-center">
            لماذا المواكبة الإنسانية؟
          </h2>
          <div className="space-y-4 text-gray-700 leading-relaxed">
            <p>
              عبر هذه المساحة يمكن للمؤسسات المعتمدة استعراض الطلبات الإنسانية المسجّلة،
              واختيار من ترغب في مواكبته وتكفّله، دون كشف هوية المستفيد للعموم.
            </p>
            <p>
              نلتزم معكم بسرّية تامة واحترام كامل للكرامة. التكفّل يتم بشكل منظّم ومتابَع،
              مع إمكانية التواصل عبر المنصة عند الحاجة.
            </p>
          </div>
          <div className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link
              href="/login?redirect=/org/requests"
              className="px-6 py-3 bg-primary-600 text-white rounded-xl font-semibold hover:bg-primary-700 transition-colors"
            >
              تسجيل الدخول للمؤسسة
            </Link>
            <Link
              href="/"
              className="px-6 py-3 border border-gray-300 text-gray-700 rounded-xl font-semibold hover:bg-gray-50 transition-colors"
            >
              العودة للرئيسية
            </Link>
          </div>
        </div>
      </section>

      {/* Footer minimal */}
      <footer className="bg-neutral-dark text-gray-400 py-8">
        <div className="max-w-7xl mx-auto px-4 text-center">
          <p className="text-sm">كرامة قصر - المواكبة الإنسانية للمؤسسات</p>
          <Link href="/" className="text-xs text-accent-500 hover:text-accent-400 mt-2 inline-block">
            الرئيسية
          </Link>
        </div>
      </footer>
    </div>
  );
}
