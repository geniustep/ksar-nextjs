'use client';

import React from 'react';
import Link from 'next/link';
import Navbar from '@/components/Navbar';
import Image from 'next/image';

export default function AboutPage() {
  return (
    <div className="min-h-screen bg-neutral-light">
      <Navbar />

      {/* Hero */}
      <section className="bg-gradient-to-bl from-primary-600 via-primary-700 to-primary-950 text-white py-20">
        <div className="max-w-4xl mx-auto px-4 text-center">
          <h1 className="text-4xl sm:text-5xl font-bold mb-4">كرامة قصر</h1>
          <p className="text-xl text-primary-100">منصة إنسانية تحفظ الكرامة قبل المساعدة</p>
        </div>
      </section>

      {/* Philosophy */}
      <section className="py-16 bg-white">
        <div className="max-w-3xl mx-auto px-4">
          <div className="text-center mb-10">
            <div className="inline-flex items-center justify-center w-14 h-14 bg-accent-50 rounded-2xl mb-6">
              <svg className="w-7 h-7 text-accent-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09zM18.259 8.715L18 9.75l-.259-1.035a3.375 3.375 0 00-2.455-2.456L14.25 6l1.036-.259a3.375 3.375 0 002.455-2.456L18 2.25l.259 1.035a3.375 3.375 0 002.455 2.456L21.75 6l-1.036.259a3.375 3.375 0 00-2.455 2.456zM16.894 20.567L16.5 21.75l-.394-1.183a2.25 2.25 0 00-1.423-1.423L13.5 18.75l1.183-.394a2.25 2.25 0 001.423-1.423l.394-1.183.394 1.183a2.25 2.25 0 001.423 1.423l1.183.394-1.183.394a2.25 2.25 0 00-1.423 1.423z" />
              </svg>
            </div>
            <h2 className="text-3xl font-bold text-neutral-dark mb-2">فلسفة المشروع</h2>
            <p className="text-sm text-accent-500 font-medium">جوهر الفكرة</p>
          </div>
          <div className="space-y-6 text-gray-700 leading-loose text-lg text-center">
            <p>
              كرامة قصر ليست منصة طلب،
              <br />
              وليست بابًا للسؤال،
              <br />
              وليست سجلًّا للفقر.
            </p>
            <p>
              هي مساحة آمنة، وجسر إنساني محترم،
              <br />
              وُجدت لأناسٍ كانوا قائمين بأرزاقهم، معتمدين على أنفسهم،
              <br />
              ثم داهمتهم ظروف قاهرة لم يختاروها.
            </p>
            <div className="bg-accent-50 border border-accent-100 rounded-2xl p-6 mt-8">
              <p className="text-accent-700 font-semibold text-xl">
                الحاجة لا تُسقط الكرامة، والظرف لا يُعرّف الإنسان.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Mission */}
      <section className="py-16 bg-neutral-light">
        <div className="max-w-3xl mx-auto px-4">
          <div className="text-center mb-10">
            <div className="inline-flex items-center justify-center w-14 h-14 bg-primary-50 rounded-2xl mb-6">
              <svg className="w-7 h-7 text-primary-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75m-3-7.036A11.959 11.959 0 013.598 6 11.99 11.99 0 003 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285z" />
              </svg>
            </div>
            <h2 className="text-3xl font-bold text-neutral-dark">رسالة كرامة قصر</h2>
          </div>
          <div className="bg-white rounded-2xl p-8 border border-gray-100 space-y-6 text-gray-700 leading-loose text-center">
            <p className="text-lg">
              في لحظات الشدّة،
              قد يجد الإنسان نفسه في وضع لم يكن يتخيّله يومًا.
            </p>
            <p className="text-lg">
              كرامة قصر وُجدت لتقول له بوضوح:
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 my-6">
              <div className="bg-primary-50 rounded-xl p-4 text-center">
                <p className="text-primary-700 font-semibold">أنت محترم</p>
              </div>
              <div className="bg-primary-50 rounded-xl p-4 text-center">
                <p className="text-primary-700 font-semibold">أنت مصان</p>
              </div>
              <div className="bg-accent-50 rounded-xl p-4 text-center">
                <p className="text-accent-700 font-semibold">معلوماتك أمانة</p>
              </div>
              <div className="bg-accent-50 rounded-xl p-4 text-center">
                <p className="text-accent-700 font-semibold">طلبك ليس ضعفًا بل حقًّا مؤقتًا</p>
              </div>
            </div>
            <div className="pt-4 border-t border-gray-100">
              <p className="text-gray-600">
                نحن لا نعرض قصص الناس،
                ولا ننشر بياناتهم،
                ولا نُحوّل معاناتهم إلى أرقام أو صور.
              </p>
              <p className="font-semibold text-primary-600 mt-4 text-lg">
                كل ما يُقدَّم هنا يبقى هنا.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Privacy */}
      <section className="py-16 bg-white">
        <div className="max-w-3xl mx-auto px-4">
          <div className="text-center mb-10">
            <div className="inline-flex items-center justify-center w-14 h-14 bg-primary-50 rounded-2xl mb-6">
              <svg className="w-7 h-7 text-primary-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 10.5V6.75a4.5 4.5 0 10-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 002.25-2.25v-6.75a2.25 2.25 0 00-2.25-2.25H6.75a2.25 2.25 0 00-2.25 2.25v6.75a2.25 2.25 0 002.25 2.25z" />
              </svg>
            </div>
            <h2 className="text-3xl font-bold text-neutral-dark mb-2">الخصوصية والسرّية</h2>
            <p className="text-gray-500">نلتزم بالتالي التزامًا أخلاقيًا قبل أن يكون تقنيًا</p>
          </div>
          <div className="space-y-4">
            {[
              { icon: '🔐', title: 'سرّية المعلومات', desc: 'جميع المعلومات سرّية وغير متاحة للعموم' },
              { icon: '📁', title: 'حماية البيانات', desc: 'لا يتم عرض أي بيانات شخصية أو قصص إنسانية للعامة' },
              { icon: '🤝', title: 'صلاحيات محدودة', desc: 'لا يصل إلى الطلب إلا الجهة المخوّلة بالتكفّل' },
              { icon: '❌', title: 'منع الاستغلال', desc: 'لا تصوير، لا نشر، لا استغلال' },
            ].map((item, i) => (
              <div key={i} className="flex items-start gap-4 bg-neutral-light rounded-xl p-6 border border-gray-100">
                <span className="text-2xl flex-shrink-0 mt-1">{item.icon}</span>
                <div>
                  <h3 className="font-semibold text-neutral-dark mb-1">{item.title}</h3>
                  <p className="text-gray-600 text-sm">{item.desc}</p>
                </div>
              </div>
            ))}
          </div>
          <div className="text-center mt-8 bg-danger-500/5 border border-danger-500/10 rounded-2xl p-6">
            <p className="text-danger-500 font-semibold text-lg">كرامتك ليست ثمنًا للمساعدة.</p>
          </div>
        </div>
      </section>

      {/* For whom */}
      <section className="py-16 bg-neutral-light">
        <div className="max-w-3xl mx-auto px-4">
          <div className="text-center mb-10">
            <h2 className="text-3xl font-bold text-neutral-dark mb-2">لمن هذه المنصة؟</h2>
            <p className="text-gray-500">دون تصنيف، دون وصم، دون أحكام</p>
          </div>
          <div className="space-y-4">
            <div className="bg-white rounded-xl p-6 border border-gray-100 flex items-center gap-4">
              <div className="w-10 h-10 bg-primary-50 rounded-lg flex items-center justify-center flex-shrink-0">
                <svg className="w-5 h-5 text-primary-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 12l8.954-8.955c.44-.439 1.152-.439 1.591 0L21.75 12M4.5 9.75v10.125c0 .621.504 1.125 1.125 1.125H9.75v-4.875c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125V21h4.125c.621 0 1.125-.504 1.125-1.125V9.75M8.25 21h8.25" />
                </svg>
              </div>
              <p className="text-gray-700">أسر وجدت نفسها فجأة في مراكز إيواء</p>
            </div>
            <div className="bg-white rounded-xl p-6 border border-gray-100 flex items-center gap-4">
              <div className="w-10 h-10 bg-accent-50 rounded-lg flex items-center justify-center flex-shrink-0">
                <svg className="w-5 h-5 text-accent-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v12m-3-2.818l.879.659c1.171.879 3.07.879 4.242 0 1.172-.879 1.172-2.303 0-3.182C13.536 12.219 12.768 12 12 12c-.725 0-1.45-.22-2.003-.659-1.106-.879-1.106-2.303 0-3.182s2.9-.879 4.006 0l.415.33M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <p className="text-gray-700">أشخاص فقدوا السكن أو الدخل بسبب ظروف طارئة</p>
            </div>
            <div className="bg-white rounded-xl p-6 border border-gray-100 flex items-center gap-4">
              <div className="w-10 h-10 bg-primary-50 rounded-lg flex items-center justify-center flex-shrink-0">
                <svg className="w-5 h-5 text-primary-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M18 18.72a9.094 9.094 0 003.741-.479 3 3 0 00-4.682-2.72m.94 3.198l.001.031c0 .225-.012.447-.037.666A11.944 11.944 0 0112 21c-2.17 0-4.207-.576-5.963-1.584A6.062 6.062 0 016 18.719m12 0a5.971 5.971 0 00-.941-3.197m0 0A5.995 5.995 0 0012 12.75a5.995 5.995 0 00-5.058 2.772m0 0a3 3 0 00-4.681 2.72 8.986 8.986 0 003.74.477m.94-3.197a5.971 5.971 0 00-.94 3.197M15 6.75a3 3 0 11-6 0 3 3 0 016 0zm6 3a2.25 2.25 0 11-4.5 0 2.25 2.25 0 014.5 0zm-13.5 0a2.25 2.25 0 11-4.5 0 2.25 2.25 0 014.5 0z" />
                </svg>
              </div>
              <p className="text-gray-700">عائلات تضررت من كوارث أو أزمات غير متوقعة</p>
            </div>
          </div>
        </div>
      </section>

      {/* How it works */}
      <section className="py-16 bg-white">
        <div className="max-w-3xl mx-auto px-4">
          <div className="text-center mb-10">
            <h2 className="text-3xl font-bold text-neutral-dark mb-2">كيف تعمل كرامة قصر؟</h2>
            <p className="text-gray-500">بأسلوب إنساني</p>
          </div>
          <div className="space-y-6">
            {[
              {
                num: 1,
                title: 'تعبير محترم عن الحاجة',
                desc: 'لا "طلب" ولا "استجداء"، بل توضيح وضع إنساني مؤقت.',
                color: 'primary',
              },
              {
                num: 2,
                title: 'دراسة هادئة وسرّية',
                desc: 'تتم من طرف جهات خيرية معتمدة.',
                color: 'accent',
              },
              {
                num: 3,
                title: 'تكفّل كريم',
                desc: 'دون ضجيج، دون إعلان، دون إحراج.',
                color: 'primary',
              },
              {
                num: 4,
                title: 'متابعة باحترام',
                desc: 'عبر رمز خاص، دون أسماء أو كشف هوية.',
                color: 'accent',
              },
            ].map((step) => (
              <div key={step.num} className="flex items-start gap-5">
                <div className={`w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 font-bold text-white ${step.color === 'primary' ? 'bg-primary-600' : 'bg-accent-500'}`}>
                  {step.num}
                </div>
                <div className="pt-1.5">
                  <h3 className="font-semibold text-neutral-dark mb-1">{step.title}</h3>
                  <p className="text-gray-600 text-sm">{step.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Message to help seeker */}
      <section className="py-16">
        <div className="max-w-3xl mx-auto px-4">
          <div className="bg-gradient-to-bl from-primary-600 via-primary-700 to-primary-900 rounded-3xl p-10 sm:p-14 text-center text-white relative overflow-hidden">
            <div className="absolute top-0 left-0 w-40 h-40 bg-accent-500/10 rounded-full blur-3xl" />
            <div className="absolute bottom-0 right-0 w-60 h-60 bg-primary-400/10 rounded-full blur-3xl" />
            <div className="relative">
              <h2 className="text-2xl sm:text-3xl font-bold mb-6">رسالة موجهة لك</h2>
              <div className="space-y-4 text-primary-100 text-lg leading-loose">
                <p>أنت لست وحدك.</p>
                <p>ما تمرّ به لا يعرّفك، ولا ينتقص منك.</p>
                <p>هذه مرحلة، وستمرّ.</p>
                <p>
                  وجودك هنا لا يعني أنك ضعيف،
                  <br />
                  بل يعني أنك إنسان واجه ظرفًا صعبًا.
                </p>
              </div>
              <div className="mt-8 pt-6 border-t border-white/20">
                <p className="text-white font-bold text-xl">وكرامتك... محفوظة كما هي.</p>
              </div>
              <div className="mt-8">
                <Link
                  href="/citizen/new-request"
                  className="inline-block px-8 py-3.5 bg-white text-primary-700 rounded-xl font-semibold hover:bg-gray-50 transition-all shadow-lg"
                >
                  تسجيل وضع
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
              <Link href="/" className="hover:text-white transition-colors">الرئيسية</Link>
              <Link href="/track" className="hover:text-white transition-colors">تتبع طلب</Link>
              <Link href="/citizen/new-request" className="hover:text-white transition-colors">طلب مساعدة</Link>
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
