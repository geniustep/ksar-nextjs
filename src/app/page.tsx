'use client';

import React from 'react';
import Link from 'next/link';
import Image from 'next/image';
import Navbar from '@/components/Navbar';

const steps = [
  {
    number: '01',
    title: 'تعبير محترم عن الحاجة',
    description: 'لا "طلب" ولا "استجداء"، بل توضيح وضع إنساني مؤقت عبر رقم هاتفك فقط',
    icon: (
      <svg className="w-7 h-7" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z" />
      </svg>
    ),
  },
  {
    number: '02',
    title: 'دراسة هادئة وسرّية',
    description: 'تتم من طرف جهات خيرية معتمدة بسرية تامة',
    icon: (
      <svg className="w-7 h-7" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75m-3-7.036A11.959 11.959 0 013.598 6 11.99 11.99 0 003 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285z" />
      </svg>
    ),
  },
  {
    number: '03',
    title: 'تكفّل كريم',
    description: 'دون ضجيج، دون إعلان، دون إحراج',
    icon: (
      <svg className="w-7 h-7" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M21 8.25c0-2.485-2.099-4.5-4.688-4.5-1.935 0-3.597 1.126-4.312 2.733-.715-1.607-2.377-2.733-4.313-2.733C5.1 3.75 3 5.765 3 8.25c0 7.22 9 12 9 12s9-4.78 9-12z" />
      </svg>
    ),
  },
  {
    number: '04',
    title: 'متابعة باحترام',
    description: 'عبر رمز خاص، دون أسماء أو كشف هوية',
    icon: (
      <svg className="w-7 h-7" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M2.036 12.322a1.012 1.012 0 010-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178z" />
        <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
      </svg>
    ),
  },
];

const commitments = [
  { icon: '🔐', text: 'جميع المعلومات سرّية وغير متاحة للعموم' },
  { icon: '📁', text: 'لا يتم عرض أي بيانات شخصية للعامة' },
  { icon: '🤝', text: 'لا يصل إلى الطلب إلا الجهة المخوّلة بالتكفّل' },
  { icon: '❌', text: 'لا تصوير، لا نشر، لا استغلال' },
];

export default function HomePage() {
  return (
    <div className="min-h-screen bg-neutral-light">
      <Navbar />

      {/* Hero */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-bl from-primary-600 via-primary-700 to-primary-950" />
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-20 right-20 w-72 h-72 bg-accent-500 rounded-full blur-3xl" />
          <div className="absolute bottom-20 left-20 w-96 h-96 bg-primary-400 rounded-full blur-3xl" />
        </div>
        <div className="relative max-w-7xl mx-auto px-4 py-24 sm:py-32 text-center">
          <div className="animate-fade-in-up">
            <div className="inline-flex items-center gap-2 bg-white/10 backdrop-blur-sm text-white/90 text-sm px-4 py-2 rounded-full mb-8 border border-white/10">
              <span className="w-2 h-2 bg-accent-500 rounded-full animate-pulse" />
              منصة إنسانية تحفظ الكرامة قبل المساعدة
            </div>
          </div>
          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-white mb-6 leading-tight animate-fade-in-up-delay-1">
            كرامة قصر
          </h1>
          <p className="text-lg sm:text-xl text-primary-100 mb-4 max-w-2xl mx-auto animate-fade-in-up-delay-2 leading-relaxed">
            لأن الظرف لا يُسقط الكرامة
          </p>
          <p className="text-base text-primary-200 mb-10 max-w-xl mx-auto animate-fade-in-up-delay-2">
            جسر إنساني محترم بين من يحتاج ومن يُعين، بسرّية وكرامة تامة
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 animate-fade-in-up-delay-3">
            <Link
              href="/citizen/new-request"
              className="px-8 py-3.5 bg-white text-primary-700 rounded-xl font-semibold hover:bg-gray-50 transition-all w-full sm:w-auto text-center shadow-lg hover:shadow-xl"
            >
              الإبلاغ عن وضع إنساني
            </Link>
            <Link
              href="/org"
              className="px-8 py-3.5 border-2 border-white/30 text-white rounded-xl font-semibold hover:bg-white/10 transition-all w-full sm:w-auto text-center backdrop-blur-sm"
            >
              المواكبة الإنسانية
            </Link>
          </div>
        </div>
      </section>

      {/* Message */}
      <section className="py-16 bg-white">
        <div className="max-w-3xl mx-auto px-4 text-center">
          <div className="inline-flex items-center justify-center w-14 h-14 bg-accent-50 rounded-2xl mb-6">
            <svg className="w-7 h-7 text-accent-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 21v-8.25M15.75 21v-8.25M8.25 21v-8.25M3 9l9-6 9 6m-1.5 12V10.332A48.36 48.36 0 0012 9.75c-2.551 0-5.056.2-7.5.582V21M3 21h18M12 6.75h.008v.008H12V6.75z" />
            </svg>
          </div>
          <h2 className="text-2xl sm:text-3xl font-bold text-neutral-dark mb-6">
            الحاجة لا تُسقط الكرامة
          </h2>
          <p className="text-gray-600 leading-loose text-lg">
            كرامة قصر ليست منصة طلب، وليست بابًا للسؤال.
            هي مساحة آمنة وُجدت لأناسٍ كانوا قائمين بأرزاقهم،
            ثم داهمتهم ظروف قاهرة لم يختاروها.
          </p>
        </div>
      </section>

      {/* How it works */}
      <section className="py-20 bg-neutral-light">
        <div className="max-w-7xl mx-auto px-4">
          <div className="text-center mb-14">
            <h2 className="text-3xl font-bold text-neutral-dark mb-3">كيف تعمل كرامة قصر؟</h2>
            <p className="text-gray-500">بأسلوب إنساني محترم، من البداية إلى النهاية</p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {steps.map((step, i) => (
              <div
                key={i}
                className="relative bg-white rounded-2xl p-7 border border-gray-100 hover:border-primary-200 hover:shadow-lg transition-all group"
              >
                <div className="flex items-center gap-3 mb-4">
                  <div className="flex items-center justify-center w-11 h-11 bg-primary-50 text-primary-600 rounded-xl group-hover:bg-primary-600 group-hover:text-white transition-colors">
                    {step.icon}
                  </div>
                  <span className="text-xs font-bold text-primary-300 font-inter">{step.number}</span>
                </div>
                <h3 className="text-base font-semibold text-neutral-dark mb-2">{step.title}</h3>
                <p className="text-gray-500 text-sm leading-relaxed">{step.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Privacy commitments */}
      <section className="py-20 bg-white">
        <div className="max-w-4xl mx-auto px-4">
          <div className="text-center mb-12">
            <div className="inline-flex items-center justify-center w-14 h-14 bg-primary-50 rounded-2xl mb-6">
              <svg className="w-7 h-7 text-primary-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 10.5V6.75a4.5 4.5 0 10-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 002.25-2.25v-6.75a2.25 2.25 0 00-2.25-2.25H6.75a2.25 2.25 0 00-2.25 2.25v6.75a2.25 2.25 0 002.25 2.25z" />
              </svg>
            </div>
            <h2 className="text-3xl font-bold text-neutral-dark mb-3">الخصوصية والسرّية</h2>
            <p className="text-gray-500 max-w-xl mx-auto">
              نلتزم بالتالي التزامًا أخلاقيًا قبل أن يكون تقنيًا
            </p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {commitments.map((item, i) => (
              <div
                key={i}
                className="flex items-start gap-4 bg-neutral-light rounded-xl p-5 border border-gray-100"
              >
                <span className="text-2xl flex-shrink-0">{item.icon}</span>
                <p className="text-gray-700 text-sm leading-relaxed">{item.text}</p>
              </div>
            ))}
          </div>
          <p className="text-center mt-8 text-accent-500 font-semibold text-sm">
            كرامتك ليست ثمنًا للمساعدة
          </p>
        </div>
      </section>

      {/* For whom */}
      <section className="py-20 bg-neutral-light">
        <div className="max-w-4xl mx-auto px-4 text-center">
          <h2 className="text-3xl font-bold text-neutral-dark mb-4">لمن هذه المنصة؟</h2>
          <p className="text-gray-500 mb-10">دون تصنيف، دون وصم، دون أحكام</p>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
            <div className="bg-white rounded-2xl p-6 border border-gray-100">
              <div className="w-12 h-12 bg-primary-50 rounded-xl flex items-center justify-center mx-auto mb-4">
                <svg className="w-6 h-6 text-primary-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 12l8.954-8.955c.44-.439 1.152-.439 1.591 0L21.75 12M4.5 9.75v10.125c0 .621.504 1.125 1.125 1.125H9.75v-4.875c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125V21h4.125c.621 0 1.125-.504 1.125-1.125V9.75M8.25 21h8.25" />
                </svg>
              </div>
              <p className="text-gray-700 text-sm">أسر وجدت نفسها فجأة في مراكز إيواء</p>
            </div>
            <div className="bg-white rounded-2xl p-6 border border-gray-100">
              <div className="w-12 h-12 bg-accent-50 rounded-xl flex items-center justify-center mx-auto mb-4">
                <svg className="w-6 h-6 text-accent-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M20.25 14.15v4.25c0 1.094-.787 2.036-1.872 2.18-2.087.277-4.216.42-6.378.42s-4.291-.143-6.378-.42c-1.085-.144-1.872-1.086-1.872-2.18v-4.25m16.5 0a2.18 2.18 0 00.75-1.661V8.706c0-1.081-.768-2.015-1.837-2.175a48.114 48.114 0 00-3.413-.387m4.5 8.006c-.194.165-.42.295-.673.38A23.978 23.978 0 0112 15.75c-2.648 0-5.195-.429-7.577-1.22a2.016 2.016 0 01-.673-.38m0 0A2.18 2.18 0 013 12.489V8.706c0-1.081.768-2.015 1.837-2.175a48.111 48.111 0 013.413-.387m7.5 0V5.25A2.25 2.25 0 0013.5 3h-3a2.25 2.25 0 00-2.25 2.25v.894m7.5 0a48.667 48.667 0 00-7.5 0" />
                </svg>
              </div>
              <p className="text-gray-700 text-sm">أشخاص فقدوا السكن أو الدخل بسبب ظروف طارئة</p>
            </div>
            <div className="bg-white rounded-2xl p-6 border border-gray-100">
              <div className="w-12 h-12 bg-primary-50 rounded-xl flex items-center justify-center mx-auto mb-4">
                <svg className="w-6 h-6 text-primary-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M18 18.72a9.094 9.094 0 003.741-.479 3 3 0 00-4.682-2.72m.94 3.198l.001.031c0 .225-.012.447-.037.666A11.944 11.944 0 0112 21c-2.17 0-4.207-.576-5.963-1.584A6.062 6.062 0 016 18.719m12 0a5.971 5.971 0 00-.941-3.197m0 0A5.995 5.995 0 0012 12.75a5.995 5.995 0 00-5.058 2.772m0 0a3 3 0 00-4.681 2.72 8.986 8.986 0 003.74.477m.94-3.197a5.971 5.971 0 00-.94 3.197M15 6.75a3 3 0 11-6 0 3 3 0 016 0zm6 3a2.25 2.25 0 11-4.5 0 2.25 2.25 0 014.5 0zm-13.5 0a2.25 2.25 0 11-4.5 0 2.25 2.25 0 014.5 0z" />
                </svg>
              </div>
              <p className="text-gray-700 text-sm">عائلات تضررت من كوارث أو أزمات غير متوقعة</p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20">
        <div className="max-w-4xl mx-auto px-4">
          <div className="bg-gradient-to-bl from-primary-600 via-primary-700 to-primary-900 rounded-3xl p-10 sm:p-14 text-center text-white relative overflow-hidden">
            <div className="absolute top-0 left-0 w-40 h-40 bg-accent-500/10 rounded-full blur-3xl" />
            <div className="absolute bottom-0 right-0 w-60 h-60 bg-primary-400/10 rounded-full blur-3xl" />
            <div className="relative">
              <h2 className="text-3xl font-bold mb-4">أنت لست وحدك</h2>
              <p className="text-primary-100 mb-3 text-lg leading-relaxed max-w-xl mx-auto">
                ما تمرّ به لا يعرّفك، ولا ينتقص منك.
                هذه مرحلة، وستمرّ.
              </p>
              <p className="text-primary-200 mb-8 text-sm">
                وجودك هنا لا يعني أنك ضعيف، بل يعني أنك إنسان واجه ظرفًا صعبًا
              </p>
              <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
                <Link
                  href="/citizen/new-request"
                  className="px-8 py-3.5 bg-white text-primary-700 rounded-xl font-semibold hover:bg-gray-50 transition-all w-full sm:w-auto text-center shadow-lg"
                >
                  قدّم طلبك بكرامة
                </Link>
                <Link
                  href="/about"
                  className="px-8 py-3.5 border-2 border-white/30 text-white rounded-xl font-semibold hover:bg-white/10 transition-all w-full sm:w-auto text-center"
                >
                  تعرّف علينا
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-neutral-dark text-gray-400 py-12">
        <div className="max-w-7xl mx-auto px-4">
          <div className="flex flex-col items-center text-center">
            <div className="flex items-center gap-3 mb-4">
              <Image
                src="/logo.png"
                alt="كرامة قصر"
                width={40}
                height={40}
                className="object-contain brightness-0 invert opacity-80"
              />
              <div>
                <p className="text-lg font-bold text-white font-cairo">كرامة قصر</p>
                <p className="text-xs text-accent-500 font-inter tracking-wider">KKSAR.MA</p>
              </div>
            </div>
            <p className="text-sm mb-2">لأن الظرف لا يُسقط الكرامة</p>
            <div className="flex items-center gap-6 mt-4 text-xs">
              <Link href="/about" className="hover:text-white transition-colors">من نحن</Link>
              <Link href="/org" className="hover:text-white transition-colors">المواكبة الإنسانية</Link>
              <Link href="/citizen/new-request" className="hover:text-white transition-colors">تسجيل وضع</Link>
            </div>
            <div className="border-t border-gray-800 mt-8 pt-6 w-full text-center">
              <p className="text-xs text-gray-500">كرامة قصر - منصة إنسانية تحفظ الكرامة قبل المساعدة</p>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
