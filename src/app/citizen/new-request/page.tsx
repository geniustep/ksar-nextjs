'use client';

import React, { Suspense, useState, useRef, useCallback, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import DashboardLayout from '@/components/DashboardLayout';
import Button from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { citizenApi, otpApi, ApiError } from '@/lib/api';
import { useAuth } from '@/contexts/AuthContext';
import { CATEGORY_LABELS, CATEGORY_ICONS } from '@/lib/constants';
import type { RequestCategory } from '@/lib/types';

// Storage key for pending request (for guest flow)
const PENDING_REQUEST_KEY = 'pending_request_data';

// Steps for authenticated users (5 steps)
const STEPS_AUTH = [
  { id: 1, title: 'نوع المساعدة', icon: '📋' },
  { id: 2, title: 'تفاصيل الطلب', icon: '✏️' },
  { id: 3, title: 'معلومات الأسرة', icon: '👨‍👩‍👧‍👦' },
  { id: 4, title: 'الموقع', icon: '📍' },
  { id: 5, title: 'مراجعة وإرسال', icon: '✅' },
];

// Steps for guest users (6 steps - includes phone registration)
const STEPS_GUEST = [
  { id: 1, title: 'نوع المساعدة', icon: '📋' },
  { id: 2, title: 'تفاصيل الطلب', icon: '✏️' },
  { id: 3, title: 'معلومات الأسرة', icon: '👨‍👩‍👧‍👦' },
  { id: 4, title: 'الموقع', icon: '📍' },
  { id: 5, title: 'مراجعة', icon: '✅' },
  { id: 6, title: 'رقم الهاتف', icon: '📱' },
];

// Legacy - for backward compatibility
const STEPS = [
  { id: 1, title: 'نوع المساعدة', icon: '📋' },
  { id: 2, title: 'تفاصيل الطلب', icon: '✏️' },
  { id: 3, title: 'معلومات الأسرة', icon: '👨‍👩‍👧‍👦' },
  { id: 4, title: 'الموقع', icon: '📍' },
  { id: 5, title: 'مراجعة وإرسال', icon: '✅' },
];

const CATEGORY_COLORS: Record<RequestCategory, string> = {
  food: 'from-orange-400 to-orange-500 hover:from-orange-500 hover:to-orange-600',
  water: 'from-blue-400 to-blue-500 hover:from-blue-500 hover:to-blue-600',
  shelter: 'from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700',
  medicine: 'from-red-400 to-red-500 hover:from-red-500 hover:to-red-600',
  clothes: 'from-purple-400 to-purple-500 hover:from-purple-500 hover:to-purple-600',
  blankets: 'from-indigo-400 to-indigo-500 hover:from-indigo-500 hover:to-indigo-600',
  baby_supplies: 'from-pink-400 to-pink-500 hover:from-pink-500 hover:to-pink-600',
  hygiene: 'from-teal-400 to-teal-500 hover:from-teal-500 hover:to-teal-600',
  other: 'from-gray-400 to-gray-500 hover:from-gray-500 hover:to-gray-600',
};

const CATEGORY_BG_SELECTED: Record<RequestCategory, string> = {
  food: 'ring-orange-500 bg-orange-50',
  water: 'ring-blue-500 bg-blue-50',
  shelter: 'ring-amber-500 bg-amber-50',
  medicine: 'ring-red-500 bg-red-50',
  clothes: 'ring-purple-500 bg-purple-50',
  blankets: 'ring-indigo-500 bg-indigo-50',
  baby_supplies: 'ring-pink-500 bg-pink-50',
  hygiene: 'ring-teal-500 bg-teal-50',
  other: 'ring-gray-500 bg-gray-50',
};

type AllCategories = RequestCategory[];
const ALL_CATEGORIES: AllCategories = [
  'food', 'water', 'shelter', 'medicine', 'clothes',
  'blankets', 'baby_supplies', 'hygiene', 'other',
];

function NewRequestContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { isAuthenticated, isLoading: authLoading } = useAuth();
  const fromGuest = searchParams.get('from') === 'guest';
  const hasAutoSubmitted = useRef(false);

  const [step, setStep] = useState(1);
  const [form, setForm] = useState({
    category: '' as RequestCategory | '',
    description: '',
    quantity: '1',
    family_members: '1',
    address: '',
    city: '',
    region: '',
    latitude: null as number | null,
    longitude: null as number | null,
    is_urgent: false,
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState<{ tracking_code: string; message: string } | null>(null);
  const [copied, setCopied] = useState(false);
  
  // Phone registration state (for guest flow)
  const [phoneNumber, setPhoneNumber] = useState('');
  const [registerLoading, setRegisterLoading] = useState(false);
  const [autoSubmitting, setAutoSubmitting] = useState(false);

  // Voice recording state
  const [isRecording, setIsRecording] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);
  const [audioBlob, setAudioBlob] = useState<Blob | null>(null);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [isTranscribing, setIsTranscribing] = useState(false);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  // GPS state
  const [gpsLoading, setGpsLoading] = useState(false);
  const [gpsError, setGpsError] = useState('');

  // Image state
  const [images, setImages] = useState<{ file: File; url: string }[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);

  // Cleanup audio URL on unmount
  useEffect(() => {
    return () => {
      if (audioUrl) URL.revokeObjectURL(audioUrl);
    };
  }, [audioUrl]);

  // Load pending request data from sessionStorage and auto-submit if from guest flow
  useEffect(() => {
    if (hasAutoSubmitted.current) return;
    
    try {
      const savedData = sessionStorage.getItem(PENDING_REQUEST_KEY);
      if (savedData) {
        const pendingData = JSON.parse(savedData);
        
        // Check if data is not too old (24 hours max)
        const maxAge = 24 * 60 * 60 * 1000; // 24 hours in ms
        if (Date.now() - pendingData.timestamp > maxAge) {
          sessionStorage.removeItem(PENDING_REQUEST_KEY);
          return;
        }

        // Load form data
        setForm({
          category: pendingData.category || '',
          description: pendingData.description || '',
          quantity: pendingData.quantity || '1',
          family_members: pendingData.family_members || '1',
          address: pendingData.address || '',
          city: pendingData.city || '',
          region: pendingData.region || '',
          latitude: pendingData.latitude || null,
          longitude: pendingData.longitude || null,
          is_urgent: pendingData.is_urgent || false,
        });

        // Set to last step for review
        if (pendingData.category && pendingData.description) {
          setStep(5);
        }

        // If authenticated and coming from guest flow, auto-submit the request
        if (isAuthenticated && fromGuest && pendingData.category && pendingData.description) {
          hasAutoSubmitted.current = true;
          setAutoSubmitting(true);
          
          // Submit after a short delay to show the user what's happening
          setTimeout(() => {
            submitRequestDirect(pendingData);
          }, 500);
        }
      }
    } catch {
      // Ignore parsing errors
    }
  }, [fromGuest, isAuthenticated]);

  // Direct submit function for auto-submit
  const submitRequestDirect = async (data: typeof form) => {
    setError('');
    setLoading(true);

    try {
      const result = await citizenApi.createRequest({
        category: data.category as RequestCategory,
        description: data.description,
        quantity: parseInt(data.quantity) || 1,
        family_members: parseInt(data.family_members) || 1,
        address: data.address || undefined,
        city: data.city || undefined,
        region: data.region || undefined,
        latitude: data.latitude ?? undefined,
        longitude: data.longitude ?? undefined,
        is_urgent: data.is_urgent,
      });
      
      // Clear the pending request data on success
      sessionStorage.removeItem(PENDING_REQUEST_KEY);
      
      setSuccess({
        tracking_code: result.tracking_code,
        message: result.message,
      });
    } catch (err) {
      if (err instanceof ApiError) {
        setError(err.detail);
      } else {
        setError('⚠️ خطأ في الاتصال بالخادم. تحقق من اتصال الإنترنت وحاول مجدداً.');
      }
    } finally {
      setLoading(false);
      setAutoSubmitting(false);
    }
  };

  // ====== Voice Recording ======
  const startRecording = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      chunksRef.current = [];

      mediaRecorder.ondataavailable = (e) => {
        if (e.data.size > 0) chunksRef.current.push(e.data);
      };

      mediaRecorder.onstop = () => {
        const blob = new Blob(chunksRef.current, { type: 'audio/webm' });
        setAudioBlob(blob);
        const url = URL.createObjectURL(blob);
        setAudioUrl(url);
        stream.getTracks().forEach((t) => t.stop());
      };

      mediaRecorder.start();
      setIsRecording(true);
      setRecordingTime(0);
      timerRef.current = setInterval(() => {
        setRecordingTime((prev) => prev + 1);
      }, 1000);
    } catch {
      setError('⚠️ لم يتم السماح بالوصول للميكروفون. يرجى تفعيل إذن الميكروفون.');
    }
  }, []);

  const stopRecording = useCallback(() => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      mediaRecorderRef.current.stop();
    }
    setIsRecording(false);
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
  }, []);

  const deleteRecording = useCallback(() => {
    if (audioUrl) URL.revokeObjectURL(audioUrl);
    setAudioBlob(null);
    setAudioUrl(null);
    setRecordingTime(0);
  }, [audioUrl]);

  const transcribeAudio = useCallback(async () => {
    if (!audioBlob) return;
    setIsTranscribing(true);
    try {
      // Use the Web Speech API for transcription if available
      // Otherwise, append a message that the audio was recorded
      if ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window) {
        // For browser speech recognition, we'd need live recognition
        // Since we have a recorded blob, we inform the user
        setForm((prev) => ({
          ...prev,
          description: prev.description
            ? prev.description + '\n\n🎤 [تم تسجيل رسالة صوتية]'
            : '🎤 [تم تسجيل رسالة صوتية - يرجى إضافة وصف مكتوب أيضاً]',
        }));
      } else {
        setForm((prev) => ({
          ...prev,
          description: prev.description
            ? prev.description + '\n\n🎤 [تم تسجيل رسالة صوتية]'
            : '🎤 [تم تسجيل رسالة صوتية - يرجى إضافة وصف مكتوب أيضاً]',
        }));
      }
    } finally {
      setIsTranscribing(false);
    }
  }, [audioBlob]);

  // ====== GPS Location with Reverse Geocoding ======
  const getLocation = useCallback(() => {
    if (!navigator.geolocation) {
      setGpsError('⚠️ المتصفح لا يدعم تحديد الموقع');
      return;
    }
    setGpsLoading(true);
    setGpsError('');
    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const lat = position.coords.latitude;
        const lng = position.coords.longitude;
        
        setForm((prev) => ({
          ...prev,
          latitude: lat,
          longitude: lng,
        }));

        // Reverse Geocoding using Nominatim (OpenStreetMap)
        try {
          const response = await fetch(
            `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&accept-language=ar`
          );
          const data = await response.json();
          
          if (data && data.address) {
            const addr = data.address;
            setForm((prev) => ({
              ...prev,
              city: addr.city || addr.town || addr.village || addr.municipality || prev.city,
              region: addr.suburb || addr.neighbourhood || addr.district || addr.quarter || prev.region,
              address: data.display_name?.split(',').slice(0, 3).join('،') || prev.address,
            }));
          }
        } catch {
          // Silently fail - coordinates are still saved
          console.log('Reverse geocoding failed, but coordinates saved');
        }
        
        setGpsLoading(false);
      },
      (err) => {
        setGpsLoading(false);
        switch (err.code) {
          case err.PERMISSION_DENIED:
            setGpsError('⚠️ تم رفض إذن الموقع. يرجى تفعيل GPS والسماح بالوصول.');
            break;
          case err.POSITION_UNAVAILABLE:
            setGpsError('⚠️ الموقع غير متاح حالياً');
            break;
          case err.TIMEOUT:
            setGpsError('⚠️ انتهت مهلة تحديد الموقع، حاول مجدداً');
            break;
          default:
            setGpsError('⚠️ خطأ في تحديد الموقع');
        }
      },
      { enableHighAccuracy: true, timeout: 15000, maximumAge: 0 }
    );
  }, []);

  // ====== Image Handling ======
  const handleImageSelect = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;

    const newImages: { file: File; url: string }[] = [];
    for (let i = 0; i < files.length && images.length + newImages.length < 5; i++) {
      const file = files[i];
      if (file.type.startsWith('image/')) {
        newImages.push({
          file,
          url: URL.createObjectURL(file),
        });
      }
    }
    setImages((prev) => [...prev, ...newImages]);
    // Reset input
    if (e.target) e.target.value = '';
  }, [images.length]);

  const removeImage = useCallback((index: number) => {
    setImages((prev) => {
      const removed = prev[index];
      if (removed) URL.revokeObjectURL(removed.url);
      return prev.filter((_, i) => i !== index);
    });
  }, []);

  // Cleanup image URLs on unmount
  useEffect(() => {
    return () => {
      images.forEach((img) => URL.revokeObjectURL(img.url));
    };
  }, []);

  // ====== Form Submit ======
  // Handle phone registration and submit for guests
  const handlePhoneRegisterAndSubmit = async () => {
    if (!phoneNumber || phoneNumber.length < 10) {
      setError('⚠️ يرجى إدخال رقم هاتف صحيح');
      return;
    }

    setError('');
    setRegisterLoading(true);

    try {
      // Step 1: Register with phone number
      const registerResult = await otpApi.phoneRegister({
        phone: phoneNumber,
        full_name: undefined, // Optional
      });

      // Step 2: Save the token
      localStorage.setItem('access_token', registerResult.access_token);

      // Step 3: Submit the request
      const result = await citizenApi.createRequest({
        category: form.category as RequestCategory,
        description: form.description || undefined,
        quantity: parseInt(form.quantity) || 1,
        family_members: parseInt(form.family_members) || 1,
        address: form.address || undefined,
        city: form.city || undefined,
        region: form.region || undefined,
        latitude: form.latitude ?? undefined,
        longitude: form.longitude ?? undefined,
        is_urgent: form.is_urgent,
      });

      setSuccess({
        tracking_code: result.tracking_code,
        message: result.message,
      });
    } catch (err) {
      if (err instanceof ApiError) {
        setError(err.detail);
      } else {
        setError('⚠️ خطأ في الاتصال بالخادم. تحقق من اتصال الإنترنت وحاول مجدداً.');
      }
    } finally {
      setRegisterLoading(false);
    }
  };

  const handleSubmit = async () => {
    if (!form.category) {
      setError('⚠️ يرجى اختيار نوع المساعدة أولاً');
      setStep(1);
      return;
    }
    // Description is now optional - only validate if provided
    // No validation for description anymore

    // If not authenticated, go to step 6 for phone registration
    if (!isAuthenticated) {
      setStep(6);
      return;
    }

    setError('');
    setLoading(true);

    try {
      const result = await citizenApi.createRequest({
        category: form.category as RequestCategory,
        description: form.description,
        quantity: parseInt(form.quantity) || 1,
        family_members: parseInt(form.family_members) || 1,
        address: form.address || undefined,
        city: form.city || undefined,
        region: form.region || undefined,
        latitude: form.latitude ?? undefined,
        longitude: form.longitude ?? undefined,
        is_urgent: form.is_urgent,
      });
      
      // Clear the pending request data on success
      sessionStorage.removeItem(PENDING_REQUEST_KEY);
      
      setSuccess({
        tracking_code: result.tracking_code,
        message: result.message,
      });
    } catch (err) {
      if (err instanceof ApiError) {
        setError(err.detail);
      } else {
        setError('⚠️ خطأ في الاتصال بالخادم. تحقق من اتصال الإنترنت وحاول مجدداً.');
      }
    } finally {
      setLoading(false);
    }
  };

  const copyTrackingCode = () => {
    if (success) {
      navigator.clipboard.writeText(success.tracking_code).then(() => {
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      });
    }
  };

  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  // ====== Success Screen ======
  if (success) {
    const successContent = (
      <div className="max-w-lg mx-auto py-8 px-4">
        <div className="bg-white rounded-2xl shadow-lg border border-green-100 overflow-hidden">
          {/* Success header */}
          <div className="bg-gradient-to-l from-green-500 to-emerald-600 p-8 text-center">
            <div className="w-20 h-20 bg-white/20 backdrop-blur-sm rounded-full flex items-center justify-center mx-auto mb-4">
              <span className="text-5xl">🎉</span>
            </div>
            <h2 className="text-2xl font-bold text-white mb-1">تم إرسال طلبك بنجاح!</h2>
            <p className="text-green-100 text-sm">{success.message}</p>
          </div>

          {/* Tracking code */}
          <div className="p-6">
            <div className="bg-gradient-to-l from-blue-50 to-indigo-50 rounded-xl p-5 mb-5 border border-blue-100">
              <p className="text-sm text-gray-500 mb-2 flex items-center gap-2">
                <span>🔑</span> رمز المتابعة الخاص بك
              </p>
              <div className="flex items-center gap-3">
                <p className="text-3xl font-mono font-bold text-primary-600 flex-1 tracking-wider">
                  {success.tracking_code}
                </p>
                <button
                  onClick={copyTrackingCode}
                  className="shrink-0 bg-white border border-gray-200 rounded-lg px-3 py-2 text-sm hover:bg-gray-50 transition-colors flex items-center gap-1.5"
                >
                  {copied ? (
                    <>
                      <span>✅</span> تم النسخ
                    </>
                  ) : (
                    <>
                      <span>📋</span> نسخ
                    </>
                  )}
                </button>
              </div>
            </div>

            <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 mb-6 flex items-start gap-3">
              <span className="text-2xl shrink-0">💡</span>
              <div>
                <p className="text-sm font-medium text-amber-800">مهم! احتفظ برمز المتابعة</p>
                <p className="text-xs text-amber-600 mt-1">
                  ستحتاج هذا الرمز لمتابعة حالة طلبك. التقط صورة للشاشة أو اكتبه في مكان آمن.
                </p>
              </div>
            </div>

            <div className="flex flex-col gap-3">
              <Button
                onClick={() => router.push('/citizen')}
                className="w-full text-base py-3"
                size="lg"
              >
                🏠 العودة لطلباتي
              </Button>
              <Button
                variant="secondary"
                className="w-full"
                onClick={() => {
                  setSuccess(null);
                  setStep(1);
                  setPhoneNumber('');
                  setForm({
                    category: '',
                    description: '',
                    quantity: '1',
                    family_members: '1',
                    address: '',
                    city: '',
                    region: '',
                    latitude: null,
                    longitude: null,
                    is_urgent: false,
                  });
                  deleteRecording();
                }}
              >
                ➕ تقديم طلب جديد
              </Button>
            </div>
          </div>
        </div>
      </div>
    );

    // If user just registered (step 6), show success without DashboardLayout
    if (step === 6) {
      return (
        <div className="min-h-screen bg-neutral-light">
          {/* Simple header for new users */}
          <div className="bg-gradient-to-bl from-primary-600 via-primary-700 to-primary-950 py-6 px-4">
            <div className="max-w-2xl mx-auto">
              <div className="flex items-center gap-3">
                <Image
                  src="/logo.png"
                  alt="كرامة قصر"
                  width={40}
                  height={40}
                  className="object-contain"
                />
                <div>
                  <h1 className="text-xl font-bold text-white">كرامة قصر</h1>
                  <p className="text-primary-200 text-xs">KKSAR.MA</p>
                </div>
              </div>
            </div>
          </div>
          {successContent}
        </div>
      );
    }

    // For authenticated users, use DashboardLayout
    return (
      <DashboardLayout>
        {successContent}
      </DashboardLayout>
    );
  }

  // ====== Step Navigation ======
  const canGoNext = () => {
    switch (step) {
      case 1:
        return form.category !== '';
      case 2:
        // Description is optional now - can always proceed
        return true;
      case 3:
        return true;
      case 4:
        return true;
      case 5:
        return true;
      case 6:
        // Phone number required for guest registration
        return phoneNumber.length >= 10;
      default:
        return false;
    }
  };

  // Get the correct steps based on authentication status
  const currentSteps = isAuthenticated ? STEPS_AUTH : STEPS_GUEST;
  const totalSteps = currentSteps.length;

  const nextStep = () => {
    if (step < 5 && canGoNext()) {
      setError('');
      setStep(step + 1);
    }
  };

  const prevStep = () => {
    if (step > 1) {
      setError('');
      setStep(step - 1);
    }
  };

  // ====== Auto-submitting Screen ======
  if (autoSubmitting && !success && !error) {
    return (
      <DashboardLayout>
        <div className="max-w-lg mx-auto py-12">
          <Card className="text-center">
            <div className="flex flex-col items-center py-8">
              <div className="w-16 h-16 border-4 border-primary-200 border-t-primary-600 rounded-full animate-spin mb-6"></div>
              <h2 className="text-xl font-bold text-gray-900 mb-2">جاري إرسال طلبك...</h2>
              <p className="text-gray-500">يرجى الانتظار قليلاً</p>
            </div>
          </Card>
        </div>
      </DashboardLayout>
    );
  }

  // ====== Guest View (Not authenticated) ======
  if (!authLoading && !isAuthenticated) {
    return (
      <div className="min-h-screen bg-neutral-light">
        {/* Header */}
        <div className="bg-gradient-to-bl from-primary-600 via-primary-700 to-primary-950 py-8 px-4">
          <div className="max-w-2xl mx-auto">
            <Link href="/" className="inline-flex items-center gap-2 text-white/80 hover:text-white transition-colors mb-4">
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 19.5L3 12m0 0l7.5-7.5M3 12h18" />
              </svg>
              <span>العودة للرئيسية</span>
            </Link>
            <div className="flex items-center gap-3">
              <Image
                src="/logo.png"
                alt="كرامة قصر"
                width={50}
                height={50}
                className="object-contain"
              />
              <div>
                <h1 className="text-2xl font-bold text-white">طلب مساعدة جديد</h1>
                <p className="text-primary-200 text-sm">أملأ البيانات ثم سجّل برقم هاتفك</p>
              </div>
            </div>
          </div>
        </div>

        {/* Form Section */}
        <div className="max-w-2xl mx-auto px-4 py-8">
          {/* Info Banner */}
          <div className="bg-accent-50 border border-accent-100 rounded-2xl p-4 mb-6">
            <div className="flex items-start gap-3">
              <div className="flex-shrink-0 w-10 h-10 bg-accent-100 rounded-xl flex items-center justify-center">
                <svg className="w-5 h-5 text-accent-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <div>
                <h3 className="font-semibold text-accent-700 mb-1">كيف يعمل هذا؟</h3>
                <ol className="text-sm text-accent-600 space-y-1 list-decimal list-inside">
                  <li>أملأ بيانات طلبك أدناه</li>
                  <li>عند الإرسال، ستُسجّل برقم هاتفك فقط (OTP)</li>
                  <li>سيُرسل طلبك ويُعطى لك رمز متابعة</li>
                </ol>
              </div>
            </div>
          </div>

          {/* Progress Steps */}
          <div className="mb-6">
            <div className="flex items-center justify-between relative">
              <div className="absolute top-5 right-5 left-5 h-1 bg-gray-200 rounded-full -z-0" />
              <div
                className="absolute top-5 right-5 h-1 bg-gradient-to-l from-primary-500 to-accent-500 rounded-full -z-0 transition-all duration-500"
                style={{ width: `${((step - 1) / (STEPS_GUEST.length - 1)) * (100 - 5)}%` }}
              />

              {STEPS_GUEST.map((s) => (
                <button
                  key={s.id}
                  onClick={() => {
                    if (s.id < step) setStep(s.id);
                  }}
                  className={`relative z-10 flex flex-col items-center gap-1.5 ${
                    s.id < step ? 'cursor-pointer' : s.id === step ? '' : 'cursor-default'
                  }`}
                >
                  <div
                    className={`w-10 h-10 rounded-full flex items-center justify-center text-lg font-bold transition-all duration-300 ${
                      s.id < step
                        ? 'bg-accent-500 text-white shadow-md'
                        : s.id === step
                        ? 'bg-primary-600 text-white shadow-lg ring-4 ring-primary-100 scale-110'
                        : 'bg-gray-100 text-gray-400'
                    }`}
                  >
                    {s.id < step ? '✓' : s.icon}
                  </div>
                  <span
                    className={`text-xs font-medium hidden sm:block ${
                      s.id === step ? 'text-primary-700' : s.id < step ? 'text-accent-600' : 'text-gray-400'
                    }`}
                  >
                    {s.title}
                  </span>
                </button>
              ))}
            </div>
          </div>

          {/* Error display */}
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 text-sm p-4 rounded-xl mb-4 flex items-center gap-2 animate-pulse">
              <span className="text-lg">❌</span>
              <span>{error}</span>
            </div>
          )}

          {/* Step Content - Same as authenticated view */}
          <Card className="overflow-hidden">
            {/* Step 1 */}
            {step === 1 && (
              <div>
                <div className="text-center mb-6">
                  <span className="text-4xl mb-2 block">📋</span>
                  <h2 className="text-xl font-bold text-gray-900">ما نوع الوضع الذي تمرّ به حاليًا؟</h2>
                  <p className="text-gray-500 text-sm mt-1">اختر ما يعبّر عن وضعك، وسيتم التعامل معه بسرّية واحترام.</p>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                  {ALL_CATEGORIES.map((cat) => (
                    <button
                      key={cat}
                      type="button"
                      onClick={() => {
                        setForm({ ...form, category: cat });
                        setError('');
                      }}
                      className={`relative p-4 rounded-xl border-2 transition-all duration-200 text-center group ${
                        form.category === cat
                          ? `${CATEGORY_BG_SELECTED[cat]} ring-2 border-transparent scale-[1.02] shadow-md`
                          : 'border-gray-100 hover:border-gray-200 hover:shadow-sm bg-white'
                      }`}
                    >
                      <div
                        className={`w-14 h-14 rounded-xl bg-gradient-to-bl ${CATEGORY_COLORS[cat]} flex items-center justify-center mx-auto mb-2 shadow-sm group-hover:shadow-md transition-shadow`}
                      >
                        <span className="text-2xl filter drop-shadow-sm">
                          {CATEGORY_ICONS[cat]}
                        </span>
                      </div>
                      <span className="text-sm font-medium text-gray-700 block">
                        {CATEGORY_LABELS[cat]}
                      </span>
                      {form.category === cat && (
                        <div className="absolute -top-1.5 -left-1.5 w-6 h-6 bg-green-500 rounded-full flex items-center justify-center text-white text-xs shadow-sm">
                          ✓
                        </div>
                      )}
                    </button>
                  ))}
                </div>

                {/* Urgent toggle */}
                <div className="mt-6 pt-5 border-t border-gray-100">
                  <button
                    type="button"
                    onClick={() => setForm({ ...form, is_urgent: !form.is_urgent })}
                    className={`w-full flex items-center gap-3 p-4 rounded-xl border-2 transition-all ${
                      form.is_urgent
                        ? 'border-red-300 bg-red-50 shadow-sm'
                        : 'border-gray-100 bg-white hover:border-gray-200'
                    }`}
                  >
                    <div
                      className={`w-12 h-12 rounded-xl flex items-center justify-center transition-colors ${
                        form.is_urgent ? 'bg-red-500' : 'bg-gray-100'
                      }`}
                    >
                      <span className="text-2xl">{form.is_urgent ? '🚨' : '⏰'}</span>
                    </div>
                    <div className="text-right flex-1">
                      <p className={`font-medium ${form.is_urgent ? 'text-red-700' : 'text-gray-700'}`}>
                        طلب مستعجل
                      </p>
                      <p className="text-xs text-gray-500 mt-0.5">
                        فعّل هذا الخيار إذا كان الأمر طارئاً ويحتاج استجابة سريعة
                      </p>
                    </div>
                    <div
                      className={`w-12 h-7 rounded-full transition-colors relative ${
                        form.is_urgent ? 'bg-red-500' : 'bg-gray-300'
                      }`}
                    >
                      <div
                        className={`absolute top-0.5 w-6 h-6 bg-white rounded-full shadow-md transition-all ${
                          form.is_urgent ? 'right-0.5' : 'right-[calc(100%-1.625rem)]'
                        }`}
                      />
                    </div>
                  </button>
                </div>
              </div>
            )}

            {/* Step 2 */}
            {step === 2 && (
              <div>
                <div className="text-center mb-6">
                  <span className="text-4xl mb-2 block">✏️</span>
                  <h2 className="text-xl font-bold text-gray-900">صف احتياجك</h2>
                  <p className="text-gray-500 text-sm mt-1">يمكنك الكتابة أو التسجيل صوتياً أو إضافة صور</p>
                </div>

                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center gap-1.5">
                    <span>📝</span> وصف الاحتياج <span className="text-gray-400 font-normal">(اختياري)</span>
                  </label>
                  <textarea
                    value={form.description}
                    onChange={(e) => setForm({ ...form, description: e.target.value })}
                    placeholder="مثال: نحتاج مواد غذائية أساسية (أرز، زيت، سكر) لعائلة مكونة من 5 أشخاص..."
                    className="w-full rounded-xl border border-gray-300 px-4 py-3 text-sm shadow-sm focus:border-primary-500 focus:ring-2 focus:ring-primary-100 focus:outline-none placeholder:text-gray-400 min-h-[100px] resize-y"
                    rows={4}
                  />
                </div>

                {/* Voice Recording Section */}
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center gap-1.5">
                    <span>🎤</span> تسجيل صوتي <span className="text-gray-400 font-normal">(اختياري)</span>
                  </label>
                  
                  {!audioBlob ? (
                    <div className="flex flex-col items-center gap-3 p-4 bg-gray-50 rounded-xl border border-gray-200">
                      {isRecording ? (
                        <>
                          <div className="flex items-center gap-3">
                            <div className="w-4 h-4 bg-red-500 rounded-full animate-pulse"></div>
                            <span className="text-lg font-mono text-red-600">{formatTime(recordingTime)}</span>
                          </div>
                          <button
                            type="button"
                            onClick={stopRecording}
                            className="flex items-center gap-2 px-6 py-3 bg-red-500 text-white rounded-xl hover:bg-red-600 transition-colors shadow-md"
                          >
                            <span className="text-xl">⏹️</span>
                            <span className="font-medium">إيقاف التسجيل</span>
                          </button>
                        </>
                      ) : (
                        <button
                          type="button"
                          onClick={startRecording}
                          className="flex items-center gap-2 px-6 py-3 bg-primary-600 text-white rounded-xl hover:bg-primary-700 transition-colors shadow-md"
                        >
                          <span className="text-xl">🎤</span>
                          <span className="font-medium">ابدأ التسجيل</span>
                        </button>
                      )}
                      <p className="text-xs text-gray-500">اضغط لتسجيل رسالة صوتية</p>
                    </div>
                  ) : (
                    <div className="p-4 bg-green-50 rounded-xl border border-green-200">
                      <div className="flex items-center gap-3 mb-3">
                        <span className="text-2xl">✅</span>
                        <span className="text-green-700 font-medium">تم تسجيل رسالة صوتية</span>
                      </div>
                      {audioUrl && (
                        <audio src={audioUrl} controls className="w-full mb-3" />
                      )}
                      <div className="flex gap-2">
                        <button
                          type="button"
                          onClick={transcribeAudio}
                          disabled={isTranscribing}
                          className="flex-1 px-4 py-2 bg-primary-100 text-primary-700 rounded-lg hover:bg-primary-200 transition-colors text-sm font-medium disabled:opacity-50"
                        >
                          {isTranscribing ? 'جاري الإضافة...' : '📝 إضافة للوصف'}
                        </button>
                        <button
                          type="button"
                          onClick={deleteRecording}
                          className="px-4 py-2 bg-red-100 text-red-700 rounded-lg hover:bg-red-200 transition-colors text-sm font-medium"
                        >
                          🗑️ حذف
                        </button>
                      </div>
                    </div>
                  )}
                </div>

                {/* Image Upload Section */}
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center gap-1.5">
                    <span>📷</span> صور <span className="text-gray-400 font-normal">(اختياري - حد أقصى 5 صور)</span>
                  </label>
                  
                  {/* Hidden file inputs */}
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    multiple
                    onChange={handleImageSelect}
                    className="hidden"
                  />
                  <input
                    ref={cameraInputRef}
                    type="file"
                    accept="image/*"
                    capture="environment"
                    onChange={handleImageSelect}
                    className="hidden"
                  />

                  {/* Image preview grid */}
                  {images.length > 0 && (
                    <div className="grid grid-cols-3 sm:grid-cols-5 gap-2 mb-3">
                      {images.map((img, index) => (
                        <div key={index} className="relative aspect-square rounded-lg overflow-hidden border border-gray-200 group">
                          <img
                            src={img.url}
                            alt={`صورة ${index + 1}`}
                            className="w-full h-full object-cover"
                          />
                          <button
                            type="button"
                            onClick={() => removeImage(index)}
                            className="absolute top-1 right-1 w-6 h-6 bg-red-500 text-white rounded-full flex items-center justify-center text-xs opacity-0 group-hover:opacity-100 transition-opacity shadow-md"
                          >
                            ✕
                          </button>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Upload buttons */}
                  {images.length < 5 && (
                    <div className="flex gap-2">
                      <button
                        type="button"
                        onClick={() => cameraInputRef.current?.click()}
                        className="flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl hover:bg-gray-100 transition-colors text-sm font-medium text-gray-700"
                      >
                        <span className="text-xl">📸</span>
                        <span>أخذ صورة</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => fileInputRef.current?.click()}
                        className="flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl hover:bg-gray-100 transition-colors text-sm font-medium text-gray-700"
                      >
                        <span className="text-xl">🖼️</span>
                        <span>تحميل صور</span>
                      </button>
                    </div>
                  )}
                  <p className="text-xs text-gray-500 mt-2 text-center">يمكنك إضافة صور توضح احتياجك</p>
                </div>
              </div>
            )}

            {/* Step 3 */}
            {step === 3 && (
              <div>
                <div className="text-center mb-6">
                  <span className="text-4xl mb-2 block">👨‍👩‍👧‍👦</span>
                  <h2 className="text-xl font-bold text-gray-900">معلومات الأسرة</h2>
                  <p className="text-gray-500 text-sm mt-1">ساعدنا نفهم احتياجك بشكل أفضل</p>
                </div>

                <div className="space-y-5">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center gap-1.5">
                      <span>📦</span> الكمية المطلوبة
                    </label>
                    <div className="flex items-center gap-3 bg-gray-50 rounded-xl p-3 border border-gray-200">
                      <button
                        type="button"
                        onClick={() => setForm({ ...form, quantity: String(Math.max(1, parseInt(form.quantity) - 1)) })}
                        className="w-11 h-11 bg-white border border-gray-300 rounded-lg text-xl font-bold text-gray-600 hover:bg-gray-100 transition-colors flex items-center justify-center shadow-sm"
                      >
                        −
                      </button>
                      <input
                        type="number"
                        value={form.quantity}
                        onChange={(e) => setForm({ ...form, quantity: e.target.value })}
                        min="1"
                        max="100"
                        className="flex-1 text-center text-2xl font-bold bg-white border border-gray-200 rounded-lg py-2 focus:outline-none focus:ring-2 focus:ring-primary-200"
                      />
                      <button
                        type="button"
                        onClick={() => setForm({ ...form, quantity: String(Math.min(100, parseInt(form.quantity) + 1)) })}
                        className="w-11 h-11 bg-white border border-gray-300 rounded-lg text-xl font-bold text-gray-600 hover:bg-gray-100 transition-colors flex items-center justify-center shadow-sm"
                      >
                        +
                      </button>
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center gap-1.5">
                      <span>👥</span> عدد أفراد الأسرة
                    </label>
                    <div className="flex items-center gap-3 bg-gray-50 rounded-xl p-3 border border-gray-200">
                      <button
                        type="button"
                        onClick={() => setForm({ ...form, family_members: String(Math.max(1, parseInt(form.family_members) - 1)) })}
                        className="w-11 h-11 bg-white border border-gray-300 rounded-lg text-xl font-bold text-gray-600 hover:bg-gray-100 transition-colors flex items-center justify-center shadow-sm"
                      >
                        −
                      </button>
                      <input
                        type="number"
                        value={form.family_members}
                        onChange={(e) => setForm({ ...form, family_members: e.target.value })}
                        min="1"
                        max="50"
                        className="flex-1 text-center text-2xl font-bold bg-white border border-gray-200 rounded-lg py-2 focus:outline-none focus:ring-2 focus:ring-primary-200"
                      />
                      <button
                        type="button"
                        onClick={() => setForm({ ...form, family_members: String(Math.min(50, parseInt(form.family_members) + 1)) })}
                        className="w-11 h-11 bg-white border border-gray-300 rounded-lg text-xl font-bold text-gray-600 hover:bg-gray-100 transition-colors flex items-center justify-center shadow-sm"
                      >
                        +
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Step 4 */}
            {step === 4 && (
              <div>
                <div className="text-center mb-6">
                  <span className="text-4xl mb-2 block">📍</span>
                  <h2 className="text-xl font-bold text-gray-900">أين تحتاج المساعدة؟</h2>
                  <p className="text-gray-500 text-sm mt-1">حدد موقعك حتى نتمكن من الوصول إليك</p>
                </div>

                <div className="space-y-4">
                  <button
                    type="button"
                    onClick={getLocation}
                    disabled={gpsLoading}
                    className={`w-full p-5 rounded-xl border-2 transition-all flex items-center gap-4 ${
                      form.latitude && form.longitude
                        ? 'border-green-300 bg-green-50'
                        : 'border-dashed border-blue-300 bg-blue-50 hover:bg-blue-100 hover:border-blue-400'
                    }`}
                  >
                    <div
                      className={`w-14 h-14 rounded-xl flex items-center justify-center shrink-0 ${
                        form.latitude && form.longitude
                          ? 'bg-green-500'
                          : 'bg-gradient-to-bl from-blue-500 to-blue-600'
                      }`}
                    >
                      {gpsLoading ? (
                        <svg className="animate-spin h-6 w-6 text-white" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                        </svg>
                      ) : (
                        <span className="text-2xl">{form.latitude && form.longitude ? '✅' : '📡'}</span>
                      )}
                    </div>
                    <div className="text-right flex-1">
                      <p className="font-medium text-gray-800">
                        {gpsLoading
                          ? 'جاري تحديد موقعك...'
                          : form.latitude && form.longitude
                          ? 'تم تحديد موقعك ✅'
                          : '📍 اضغط لتحديد موقعك تلقائياً'}
                      </p>
                      {form.latitude && form.longitude ? (
                        <p className="text-xs text-green-600 mt-1 font-mono">
                          {form.latitude.toFixed(4)}, {form.longitude.toFixed(4)}
                        </p>
                      ) : (
                        <p className="text-xs text-gray-500 mt-1">سيتم استخدام GPS لتحديد إحداثيات موقعك بدقة</p>
                      )}
                    </div>
                  </button>

                  {gpsError && (
                    <div className="bg-amber-50 border border-amber-200 text-amber-700 text-xs p-3 rounded-lg">
                      {gpsError}
                    </div>
                  )}

                  <div className="relative flex items-center gap-4 my-2">
                    <div className="flex-1 border-t border-gray-200" />
                    <span className="text-xs text-gray-400">أو أدخل العنوان يدوياً</span>
                    <div className="flex-1 border-t border-gray-200" />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1.5 flex items-center gap-1.5">
                      <span>🏘️</span> العنوان التفصيلي
                    </label>
                    <input
                      type="text"
                      value={form.address}
                      onChange={(e) => setForm({ ...form, address: e.target.value })}
                      placeholder="مثال: شارع الملك فهد، حي السلام، بجانب المسجد الكبير"
                      className="w-full rounded-xl border border-gray-300 px-4 py-3 text-sm shadow-sm focus:border-primary-500 focus:ring-2 focus:ring-primary-100 focus:outline-none placeholder:text-gray-400"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1.5">المدينة</label>
                      <input
                        type="text"
                        value={form.city}
                        onChange={(e) => setForm({ ...form, city: e.target.value })}
                        placeholder="المدينة"
                        className="w-full rounded-xl border border-gray-300 px-4 py-3 text-sm shadow-sm focus:border-primary-500 focus:ring-2 focus:ring-primary-100 focus:outline-none placeholder:text-gray-400"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1.5">المنطقة / الحي</label>
                      <input
                        type="text"
                        value={form.region}
                        onChange={(e) => setForm({ ...form, region: e.target.value })}
                        placeholder="المنطقة"
                        className="w-full rounded-xl border border-gray-300 px-4 py-3 text-sm shadow-sm focus:border-primary-500 focus:ring-2 focus:ring-primary-100 focus:outline-none placeholder:text-gray-400"
                      />
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Step 5 - Review */}
            {step === 5 && (
              <div>
                <div className="text-center mb-6">
                  <span className="text-4xl mb-2 block">✅</span>
                  <h2 className="text-xl font-bold text-gray-900">مراجعة الطلب</h2>
                  <p className="text-gray-500 text-sm mt-1">تأكد من صحة المعلومات قبل المتابعة</p>
                </div>

                <div className="space-y-3">
                  <div className="bg-gray-50 rounded-xl p-4 flex items-center gap-3">
                    <div className={`w-12 h-12 rounded-xl bg-gradient-to-bl ${form.category ? CATEGORY_COLORS[form.category as RequestCategory] : 'from-gray-400 to-gray-500'} flex items-center justify-center shadow-sm`}>
                      <span className="text-xl">{form.category ? CATEGORY_ICONS[form.category as RequestCategory] : '❓'}</span>
                    </div>
                    <div className="flex-1">
                      <p className="text-xs text-gray-500">نوع المساعدة</p>
                      <p className="font-medium text-gray-800">{form.category ? CATEGORY_LABELS[form.category as RequestCategory] : 'غير محدد'}</p>
                    </div>
                    {form.is_urgent && (
                      <span className="bg-red-100 text-red-700 text-xs px-2.5 py-1 rounded-full font-medium">🚨 مستعجل</span>
                    )}
                  </div>

                  <div className="bg-gray-50 rounded-xl p-4">
                    <p className="text-xs text-gray-500 mb-1">📝 وصف الاحتياج</p>
                    <p className="text-sm text-gray-700 leading-relaxed">{form.description || 'لم يتم إضافة وصف'}</p>
                  </div>

                  <div className="bg-gray-50 rounded-xl p-4 grid grid-cols-2 gap-3">
                    <div>
                      <p className="text-xs text-gray-500">📦 الكمية</p>
                      <p className="font-medium text-gray-800">{form.quantity}</p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500">👥 أفراد الأسرة</p>
                      <p className="font-medium text-gray-800">{form.family_members}</p>
                    </div>
                  </div>

                  <div className="bg-gray-50 rounded-xl p-4">
                    <p className="text-xs text-gray-500 mb-1">📍 الموقع</p>
                    <div className="text-sm text-gray-700">
                      {form.address && <p>{form.address}</p>}
                      {(form.city || form.region) && <p>{[form.city, form.region].filter(Boolean).join(' - ')}</p>}
                      {form.latitude && form.longitude && <p className="text-xs text-green-600">📡 تم تحديد الإحداثيات</p>}
                      {!form.address && !form.city && !form.region && !form.latitude && <p className="text-gray-400">لم يتم تحديد الموقع</p>}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Step 6 - Phone Registration (Guest only) */}
            {step === 6 && (
              <div>
                <div className="text-center mb-6">
                  <span className="text-4xl mb-2 block">📱</span>
                  <h2 className="text-xl font-bold text-gray-900">أدخل رقم هاتفك</h2>
                  <p className="text-gray-500 text-sm mt-1">لإرسال طلبك والحصول على رمز المتابعة</p>
                </div>

                <div className="bg-gradient-to-l from-primary-50 to-blue-50 rounded-xl p-5 border border-primary-100 mb-4">
                  <div className="flex items-start gap-3">
                    <div className="flex-shrink-0 w-10 h-10 bg-primary-100 rounded-xl flex items-center justify-center">
                      <span className="text-xl">🔒</span>
                    </div>
                    <div>
                      <h3 className="font-semibold text-primary-700 mb-1">تسجيل آمن وسريع</h3>
                      <p className="text-sm text-primary-600">
                        رقم هاتفك هو معرّفك الوحيد. لن نشاركه مع أي جهة.
                      </p>
                    </div>
                  </div>
                </div>

                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center gap-1.5">
                    <span>📞</span> رقم الهاتف
                  </label>
                  <input
                    type="tel"
                    value={phoneNumber}
                    onChange={(e) => setPhoneNumber(e.target.value.replace(/[^0-9+]/g, ''))}
                    placeholder="مثال: 0612345678"
                    className="w-full rounded-xl border border-gray-300 px-4 py-4 text-lg text-center shadow-sm focus:border-primary-500 focus:ring-2 focus:ring-primary-100 focus:outline-none placeholder:text-gray-400 font-mono tracking-wider"
                    dir="ltr"
                    maxLength={15}
                  />
                  <p className="text-xs text-gray-500 mt-2 text-center">
                    أدخل رقم هاتفك بدون رمز الدولة أو مع رمز الدولة (+212)
                  </p>
                </div>

                {error && (
                  <div className="bg-red-50 border border-red-200 text-red-700 text-sm p-4 rounded-xl mb-4 flex items-center gap-2">
                    <span className="text-lg">❌</span>
                    <span>{error}</span>
                  </div>
                )}
              </div>
            )}

            {/* Navigation Buttons */}
            <div className="flex gap-3 mt-8 pt-5 border-t border-gray-100">
              {step > 1 && (
                <Button type="button" variant="secondary" onClick={prevStep} className="flex-1" size="lg">
                  → السابق
                </Button>
              )}

              {step < 5 ? (
                <Button
                  type="button"
                  onClick={nextStep}
                  disabled={!canGoNext()}
                  className={`flex-1 ${step === 1 && 'w-full'}`}
                  size="lg"
                >
                  التالي ←
                </Button>
              ) : step === 5 ? (
                <Button
                  type="button"
                  onClick={() => setStep(6)}
                  className="flex-1 !bg-gradient-to-l from-primary-500 to-primary-600 hover:from-primary-600 hover:to-primary-700 !shadow-lg"
                  size="lg"
                >
                  التالي - رقم الهاتف ←
                </Button>
              ) : (
                <Button
                  type="button"
                  onClick={handlePhoneRegisterAndSubmit}
                  loading={registerLoading}
                  disabled={!canGoNext()}
                  className="flex-1 !bg-gradient-to-l from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 !shadow-lg"
                  size="lg"
                >
                  🤲 إرسال الطلب
                </Button>
              )}
            </div>
          </Card>

          {/* Already have account */}
          <div className="mt-6 text-center">
            <p className="text-gray-500 text-sm mb-2">لديك حساب مسبق؟</p>
            <Link href="/login" className="text-primary-600 hover:text-primary-700 font-medium text-sm">
              الدخول بالبريد الإلكتروني
            </Link>
          </div>

          {/* Trust message */}
          <div className="mt-6 bg-white border border-gray-100 rounded-2xl p-4 text-center">
            <p className="text-sm text-gray-500">معلوماتك محمية وسرّية - كرامتك محفوظة</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <DashboardLayout>
      <div className="max-w-2xl mx-auto px-4 pb-8">
        {/* Header */}
        <div className="mb-6">
          <button
            onClick={() => router.push('/citizen')}
            className="text-sm text-primary-600 hover:text-primary-700 mb-3 flex items-center gap-1.5 transition-colors"
          >
            <span>→</span> العودة للرئيسية
          </button>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <span>🤲</span> طلب مساعدة جديد
          </h1>
          <p className="text-gray-500 mt-1 text-sm">نحن هنا لمساعدتك. أملأ الخطوات التالية بسهولة</p>
        </div>

        {/* Progress Steps */}
        <div className="mb-8">
          <div className="flex items-center justify-between relative">
            {/* Progress bar background */}
            <div className="absolute top-5 right-5 left-5 h-1 bg-gray-200 rounded-full -z-0" />
            <div
              className="absolute top-5 right-5 h-1 bg-gradient-to-l from-primary-500 to-accent-500 rounded-full -z-0 transition-all duration-500"
              style={{ width: `${((step - 1) / (STEPS.length - 1)) * (100 - 5)}%` }}
            />

            {STEPS.map((s) => (
              <button
                key={s.id}
                onClick={() => {
                  // Allow going back to completed steps only
                  if (s.id < step) setStep(s.id);
                }}
                className={`relative z-10 flex flex-col items-center gap-1.5 ${
                  s.id < step ? 'cursor-pointer' : s.id === step ? '' : 'cursor-default'
                }`}
              >
                <div
                  className={`w-10 h-10 rounded-full flex items-center justify-center text-lg font-bold transition-all duration-300 ${
                    s.id < step
                      ? 'bg-accent-500 text-white shadow-md'
                      : s.id === step
                      ? 'bg-primary-600 text-white shadow-lg ring-4 ring-primary-100 scale-110'
                      : 'bg-gray-100 text-gray-400'
                  }`}
                >
                  {s.id < step ? '✓' : s.icon}
                </div>
                <span
                  className={`text-xs font-medium hidden sm:block ${
                    s.id === step ? 'text-primary-700' : s.id < step ? 'text-accent-600' : 'text-gray-400'
                  }`}
                >
                  {s.title}
                </span>
              </button>
            ))}
          </div>
        </div>

        {/* Error display */}
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 text-sm p-4 rounded-xl mb-4 flex items-center gap-2 animate-pulse">
            <span className="text-lg">❌</span>
            <span>{error}</span>
          </div>
        )}

        {/* Step Content */}
        <Card className="overflow-hidden">
          {/* ===== Step 1: Category Selection ===== */}
          {step === 1 && (
            <div>
              <div className="text-center mb-6">
                <span className="text-4xl mb-2 block">📋</span>
                <h2 className="text-xl font-bold text-gray-900">ما نوع الوضع الذي تمرّ به حاليًا؟</h2>
                <p className="text-gray-500 text-sm mt-1">اختر ما يعبّر عن وضعك، وسيتم التعامل معه بسرّية واحترام.</p>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                {ALL_CATEGORIES.map((cat) => (
                  <button
                    key={cat}
                    type="button"
                    onClick={() => {
                      setForm({ ...form, category: cat });
                      setError('');
                    }}
                    className={`relative p-4 rounded-xl border-2 transition-all duration-200 text-center group ${
                      form.category === cat
                        ? `${CATEGORY_BG_SELECTED[cat]} ring-2 border-transparent scale-[1.02] shadow-md`
                        : 'border-gray-100 hover:border-gray-200 hover:shadow-sm bg-white'
                    }`}
                  >
                    <div
                      className={`w-14 h-14 rounded-xl bg-gradient-to-bl ${CATEGORY_COLORS[cat]} flex items-center justify-center mx-auto mb-2 shadow-sm group-hover:shadow-md transition-shadow`}
                    >
                      <span className="text-2xl filter drop-shadow-sm">
                        {CATEGORY_ICONS[cat]}
                      </span>
                    </div>
                    <span className="text-sm font-medium text-gray-700 block">
                      {CATEGORY_LABELS[cat]}
                    </span>
                    {form.category === cat && (
                      <div className="absolute -top-1.5 -left-1.5 w-6 h-6 bg-green-500 rounded-full flex items-center justify-center text-white text-xs shadow-sm">
                        ✓
                      </div>
                    )}
                  </button>
                ))}
              </div>

              {/* Urgent toggle */}
              <div className="mt-6 pt-5 border-t border-gray-100">
                <button
                  type="button"
                  onClick={() => setForm({ ...form, is_urgent: !form.is_urgent })}
                  className={`w-full flex items-center gap-3 p-4 rounded-xl border-2 transition-all ${
                    form.is_urgent
                      ? 'border-red-300 bg-red-50 shadow-sm'
                      : 'border-gray-100 bg-white hover:border-gray-200'
                  }`}
                >
                  <div
                    className={`w-12 h-12 rounded-xl flex items-center justify-center transition-colors ${
                      form.is_urgent ? 'bg-red-500' : 'bg-gray-100'
                    }`}
                  >
                    <span className="text-2xl">{form.is_urgent ? '🚨' : '⏰'}</span>
                  </div>
                  <div className="text-right flex-1">
                    <p className={`font-medium ${form.is_urgent ? 'text-red-700' : 'text-gray-700'}`}>
                      طلب مستعجل
                    </p>
                    <p className="text-xs text-gray-500 mt-0.5">
                      فعّل هذا الخيار إذا كان الأمر طارئاً ويحتاج استجابة سريعة
                    </p>
                  </div>
                  <div
                    className={`w-12 h-7 rounded-full transition-colors relative ${
                      form.is_urgent ? 'bg-red-500' : 'bg-gray-300'
                    }`}
                  >
                    <div
                      className={`absolute top-0.5 w-6 h-6 bg-white rounded-full shadow-md transition-all ${
                        form.is_urgent ? 'right-0.5' : 'right-[calc(100%-1.625rem)]'
                      }`}
                    />
                  </div>
                </button>
              </div>
            </div>
          )}

          {/* ===== Step 2: Description, Voice & Images ===== */}
          {step === 2 && (
            <div>
              <div className="text-center mb-6">
                <span className="text-4xl mb-2 block">✏️</span>
                <h2 className="text-xl font-bold text-gray-900">صف احتياجك</h2>
                <p className="text-gray-500 text-sm mt-1">يمكنك الكتابة أو التسجيل صوتياً أو إضافة صور</p>
              </div>

              {/* Text description */}
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center gap-1.5">
                  <span>📝</span> وصف الاحتياج <span className="text-gray-400 font-normal">(اختياري)</span>
                </label>
                <textarea
                  value={form.description}
                  onChange={(e) => setForm({ ...form, description: e.target.value })}
                  placeholder="مثال: نحتاج مواد غذائية أساسية (أرز، زيت، سكر) لعائلة مكونة من 5 أشخاص..."
                  className="w-full rounded-xl border border-gray-300 px-4 py-3 text-sm shadow-sm focus:border-primary-500 focus:ring-2 focus:ring-primary-100 focus:outline-none placeholder:text-gray-400 min-h-[100px] resize-y"
                  rows={4}
                />
              </div>

              {/* Voice Recording */}
              <div className="bg-gradient-to-l from-violet-50 to-purple-50 rounded-xl p-5 border border-violet-100 mb-4">
                <p className="text-sm font-medium text-violet-800 mb-3 flex items-center gap-2">
                  <span className="text-xl">🎙️</span> تسجيل صوتي <span className="text-violet-500 font-normal">(اختياري)</span>
                </p>

                {!audioUrl ? (
                  <div className="flex flex-col items-center">
                    {isRecording ? (
                      <>
                        {/* Recording in progress */}
                        <div className="flex items-center gap-4 mb-3">
                          <div className="w-4 h-4 bg-red-500 rounded-full animate-pulse" />
                          <span className="text-2xl font-mono font-bold text-red-600">
                            {formatTime(recordingTime)}
                          </span>
                        </div>
                        <button
                          type="button"
                          onClick={stopRecording}
                          className="w-16 h-16 bg-red-500 hover:bg-red-600 rounded-full flex items-center justify-center shadow-lg transition-all hover:scale-105 active:scale-95"
                        >
                          <div className="w-6 h-6 bg-white rounded-sm" />
                        </button>
                        <p className="text-xs text-gray-500 mt-2">اضغط لإيقاف التسجيل</p>
                      </>
                    ) : (
                      <>
                        <button
                          type="button"
                          onClick={startRecording}
                          className="w-16 h-16 bg-gradient-to-bl from-violet-500 to-purple-600 hover:from-violet-600 hover:to-purple-700 rounded-full flex items-center justify-center shadow-lg transition-all hover:scale-105 active:scale-95"
                        >
                          <span className="text-3xl">🎤</span>
                        </button>
                        <p className="text-xs text-gray-500 mt-2">اضغط لبدء التسجيل الصوتي</p>
                      </>
                    )}
                  </div>
                ) : (
                  <div className="space-y-3">
                    {/* Audio playback */}
                    <div className="bg-white rounded-lg p-3 flex items-center gap-3 border border-violet-200">
                      <span className="text-2xl">🎵</span>
                      <audio src={audioUrl} controls className="flex-1 h-10" />
                      <span className="text-xs text-gray-500">{formatTime(recordingTime)}</span>
                    </div>
                    <div className="flex gap-2">
                      <button
                        type="button"
                        onClick={transcribeAudio}
                        disabled={isTranscribing}
                        className="flex-1 bg-violet-600 hover:bg-violet-700 text-white text-sm py-2.5 px-4 rounded-lg transition-colors flex items-center justify-center gap-2 disabled:opacity-50"
                      >
                        {isTranscribing ? (
                          <>
                            <svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
                              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                            </svg>
                            جاري المعالجة...
                          </>
                        ) : (
                          <>✅ إرفاق التسجيل</>
                        )}
                      </button>
                      <button
                        type="button"
                        onClick={deleteRecording}
                        className="bg-red-100 hover:bg-red-200 text-red-700 text-sm py-2.5 px-4 rounded-lg transition-colors flex items-center gap-1"
                      >
                        🗑️ حذف
                      </button>
                    </div>
                  </div>
                )}
              </div>

              {/* Image Upload Section */}
              <div className="bg-gradient-to-l from-blue-50 to-sky-50 rounded-xl p-5 border border-blue-100">
                <p className="text-sm font-medium text-blue-800 mb-3 flex items-center gap-2">
                  <span className="text-xl">📷</span> صور <span className="text-blue-500 font-normal">(اختياري - حد أقصى 5 صور)</span>
                </p>
                
                {/* Hidden file inputs */}
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  multiple
                  onChange={handleImageSelect}
                  className="hidden"
                />
                <input
                  ref={cameraInputRef}
                  type="file"
                  accept="image/*"
                  capture="environment"
                  onChange={handleImageSelect}
                  className="hidden"
                />

                {/* Image preview grid */}
                {images.length > 0 && (
                  <div className="grid grid-cols-3 sm:grid-cols-5 gap-2 mb-3">
                    {images.map((img, index) => (
                      <div key={index} className="relative aspect-square rounded-lg overflow-hidden border border-blue-200 group">
                        <img
                          src={img.url}
                          alt={`صورة ${index + 1}`}
                          className="w-full h-full object-cover"
                        />
                        <button
                          type="button"
                          onClick={() => removeImage(index)}
                          className="absolute top-1 right-1 w-6 h-6 bg-red-500 text-white rounded-full flex items-center justify-center text-xs opacity-0 group-hover:opacity-100 transition-opacity shadow-md"
                        >
                          ✕
                        </button>
                      </div>
                    ))}
                  </div>
                )}

                {/* Upload buttons */}
                {images.length < 5 && (
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() => cameraInputRef.current?.click()}
                      className="flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-white border border-blue-200 rounded-xl hover:bg-blue-50 transition-colors text-sm font-medium text-blue-700"
                    >
                      <span className="text-xl">📸</span>
                      <span>أخذ صورة</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      className="flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-white border border-blue-200 rounded-xl hover:bg-blue-50 transition-colors text-sm font-medium text-blue-700"
                    >
                      <span className="text-xl">🖼️</span>
                      <span>تحميل صور</span>
                    </button>
                  </div>
                )}
                <p className="text-xs text-gray-500 mt-2 text-center">يمكنك إضافة صور توضح احتياجك</p>
              </div>
            </div>
          )}

          {/* ===== Step 3: Family Info ===== */}
          {step === 3 && (
            <div>
              <div className="text-center mb-6">
                <span className="text-4xl mb-2 block">👨‍👩‍👧‍👦</span>
                <h2 className="text-xl font-bold text-gray-900">معلومات الأسرة</h2>
                <p className="text-gray-500 text-sm mt-1">ساعدنا نفهم احتياجك بشكل أفضل</p>
              </div>

              <div className="space-y-5">
                {/* Quantity */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center gap-1.5">
                    <span>📦</span> الكمية المطلوبة
                  </label>
                  <div className="flex items-center gap-3 bg-gray-50 rounded-xl p-3 border border-gray-200">
                    <button
                      type="button"
                      onClick={() => setForm({ ...form, quantity: String(Math.max(1, parseInt(form.quantity) - 1)) })}
                      className="w-11 h-11 bg-white border border-gray-300 rounded-lg text-xl font-bold text-gray-600 hover:bg-gray-100 transition-colors flex items-center justify-center shadow-sm"
                    >
                      −
                    </button>
                    <input
                      type="number"
                      value={form.quantity}
                      onChange={(e) => setForm({ ...form, quantity: e.target.value })}
                      min="1"
                      max="100"
                      className="flex-1 text-center text-2xl font-bold bg-white border border-gray-200 rounded-lg py-2 focus:outline-none focus:ring-2 focus:ring-primary-200"
                    />
                    <button
                      type="button"
                      onClick={() => setForm({ ...form, quantity: String(Math.min(100, parseInt(form.quantity) + 1)) })}
                      className="w-11 h-11 bg-white border border-gray-300 rounded-lg text-xl font-bold text-gray-600 hover:bg-gray-100 transition-colors flex items-center justify-center shadow-sm"
                    >
                      +
                    </button>
                  </div>
                </div>

                {/* Family members */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center gap-1.5">
                    <span>👥</span> عدد أفراد الأسرة
                  </label>
                  <div className="flex items-center gap-3 bg-gray-50 rounded-xl p-3 border border-gray-200">
                    <button
                      type="button"
                      onClick={() => setForm({ ...form, family_members: String(Math.max(1, parseInt(form.family_members) - 1)) })}
                      className="w-11 h-11 bg-white border border-gray-300 rounded-lg text-xl font-bold text-gray-600 hover:bg-gray-100 transition-colors flex items-center justify-center shadow-sm"
                    >
                      −
                    </button>
                    <input
                      type="number"
                      value={form.family_members}
                      onChange={(e) => setForm({ ...form, family_members: e.target.value })}
                      min="1"
                      max="50"
                      className="flex-1 text-center text-2xl font-bold bg-white border border-gray-200 rounded-lg py-2 focus:outline-none focus:ring-2 focus:ring-primary-200"
                    />
                    <button
                      type="button"
                      onClick={() => setForm({ ...form, family_members: String(Math.min(50, parseInt(form.family_members) + 1)) })}
                      className="w-11 h-11 bg-white border border-gray-300 rounded-lg text-xl font-bold text-gray-600 hover:bg-gray-100 transition-colors flex items-center justify-center shadow-sm"
                    >
                      +
                    </button>
                  </div>
                </div>

                {/* Quick family size buttons */}
                <div>
                  <p className="text-xs text-gray-500 mb-2">اختيار سريع:</p>
                  <div className="flex flex-wrap gap-2">
                    {[
                      { label: 'شخص واحد 🧑', value: '1' },
                      { label: 'زوجان 👫', value: '2' },
                      { label: 'عائلة صغيرة 👨‍👩‍👦', value: '3' },
                      { label: 'عائلة متوسطة 👨‍👩‍👧‍👦', value: '5' },
                      { label: 'عائلة كبيرة 👨‍👩‍👧‍👦+', value: '8' },
                    ].map((opt) => (
                      <button
                        key={opt.value}
                        type="button"
                        onClick={() => setForm({ ...form, family_members: opt.value })}
                        className={`px-3 py-2 rounded-lg text-xs font-medium transition-all border ${
                          form.family_members === opt.value
                            ? 'bg-primary-50 border-primary-300 text-primary-700 shadow-sm'
                            : 'bg-white border-gray-200 text-gray-600 hover:border-gray-300'
                        }`}
                      >
                        {opt.label}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ===== Step 4: Location ===== */}
          {step === 4 && (
            <div>
              <div className="text-center mb-6">
                <span className="text-4xl mb-2 block">📍</span>
                <h2 className="text-xl font-bold text-gray-900">أين تحتاج المساعدة؟</h2>
                <p className="text-gray-500 text-sm mt-1">حدد موقعك حتى نتمكن من الوصول إليك</p>
              </div>

              <div className="space-y-4">
                {/* GPS Button */}
                <button
                  type="button"
                  onClick={getLocation}
                  disabled={gpsLoading}
                  className={`w-full p-5 rounded-xl border-2 transition-all flex items-center gap-4 ${
                    form.latitude && form.longitude
                      ? 'border-green-300 bg-green-50'
                      : 'border-dashed border-blue-300 bg-blue-50 hover:bg-blue-100 hover:border-blue-400'
                  }`}
                >
                  <div
                    className={`w-14 h-14 rounded-xl flex items-center justify-center shrink-0 ${
                      form.latitude && form.longitude
                        ? 'bg-green-500'
                        : 'bg-gradient-to-bl from-blue-500 to-blue-600'
                    }`}
                  >
                    {gpsLoading ? (
                      <svg className="animate-spin h-6 w-6 text-white" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                      </svg>
                    ) : (
                      <span className="text-2xl">
                        {form.latitude && form.longitude ? '✅' : '📡'}
                      </span>
                    )}
                  </div>
                  <div className="text-right flex-1">
                    <p className="font-medium text-gray-800">
                      {gpsLoading
                        ? 'جاري تحديد موقعك...'
                        : form.latitude && form.longitude
                        ? 'تم تحديد موقعك ✅'
                        : '📍 اضغط لتحديد موقعك تلقائياً'}
                    </p>
                    {form.latitude && form.longitude ? (
                      <p className="text-xs text-green-600 mt-1 font-mono">
                        {form.latitude.toFixed(4)}, {form.longitude.toFixed(4)}
                      </p>
                    ) : (
                      <p className="text-xs text-gray-500 mt-1">
                        سيتم استخدام GPS لتحديد إحداثيات موقعك بدقة
                      </p>
                    )}
                  </div>
                </button>

                {gpsError && (
                  <div className="bg-amber-50 border border-amber-200 text-amber-700 text-xs p-3 rounded-lg">
                    {gpsError}
                  </div>
                )}

                <div className="relative flex items-center gap-4 my-2">
                  <div className="flex-1 border-t border-gray-200" />
                  <span className="text-xs text-gray-400">أو أدخل العنوان يدوياً</span>
                  <div className="flex-1 border-t border-gray-200" />
                </div>

                {/* Manual address fields */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5 flex items-center gap-1.5">
                    <span>🏘️</span> العنوان التفصيلي
                  </label>
                  <input
                    type="text"
                    value={form.address}
                    onChange={(e) => setForm({ ...form, address: e.target.value })}
                    placeholder="مثال: شارع الملك فهد، حي السلام، بجانب المسجد الكبير"
                    className="w-full rounded-xl border border-gray-300 px-4 py-3 text-sm shadow-sm focus:border-primary-500 focus:ring-2 focus:ring-primary-100 focus:outline-none placeholder:text-gray-400"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1.5 flex items-center gap-1.5">
                      <span>🏙️</span> المدينة
                    </label>
                    <input
                      type="text"
                      value={form.city}
                      onChange={(e) => setForm({ ...form, city: e.target.value })}
                      placeholder="المدينة"
                      className="w-full rounded-xl border border-gray-300 px-4 py-3 text-sm shadow-sm focus:border-primary-500 focus:ring-2 focus:ring-primary-100 focus:outline-none placeholder:text-gray-400"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1.5 flex items-center gap-1.5">
                      <span>🏡</span> المنطقة / الحي
                    </label>
                    <input
                      type="text"
                      value={form.region}
                      onChange={(e) => setForm({ ...form, region: e.target.value })}
                      placeholder="المنطقة"
                      className="w-full rounded-xl border border-gray-300 px-4 py-3 text-sm shadow-sm focus:border-primary-500 focus:ring-2 focus:ring-primary-100 focus:outline-none placeholder:text-gray-400"
                    />
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ===== Step 5: Review ===== */}
          {step === 5 && (
            <div>
              <div className="text-center mb-6">
                <span className="text-4xl mb-2 block">✅</span>
                <h2 className="text-xl font-bold text-gray-900">مراجعة الطلب</h2>
                <p className="text-gray-500 text-sm mt-1">تأكد من صحة المعلومات قبل الإرسال</p>
              </div>

              <div className="space-y-3">
                {/* Category */}
                <div className="bg-gray-50 rounded-xl p-4 flex items-center gap-3">
                  <div className={`w-12 h-12 rounded-xl bg-gradient-to-bl ${form.category ? CATEGORY_COLORS[form.category as RequestCategory] : 'from-gray-400 to-gray-500'} flex items-center justify-center shadow-sm`}>
                    <span className="text-xl">
                      {form.category ? CATEGORY_ICONS[form.category as RequestCategory] : '❓'}
                    </span>
                  </div>
                  <div className="flex-1">
                    <p className="text-xs text-gray-500">نوع المساعدة</p>
                    <p className="font-medium text-gray-800">
                      {form.category ? CATEGORY_LABELS[form.category as RequestCategory] : 'غير محدد'}
                    </p>
                  </div>
                  {form.is_urgent && (
                    <span className="bg-red-100 text-red-700 text-xs px-2.5 py-1 rounded-full font-medium flex items-center gap-1">
                      🚨 مستعجل
                    </span>
                  )}
                  <button
                    type="button"
                    onClick={() => setStep(1)}
                    className="text-primary-600 text-xs hover:underline"
                  >
                    تعديل
                  </button>
                </div>

                {/* Description */}
                <div className="bg-gray-50 rounded-xl p-4">
                  <div className="flex items-center justify-between mb-1">
                    <p className="text-xs text-gray-500 flex items-center gap-1">
                      <span>📝</span> وصف الاحتياج
                    </p>
                    <button
                      type="button"
                      onClick={() => setStep(2)}
                      className="text-primary-600 text-xs hover:underline"
                    >
                      تعديل
                    </button>
                  </div>
                  <p className="text-sm text-gray-700 leading-relaxed">
                    {form.description || 'لم يتم إضافة وصف'}
                  </p>
                  {audioUrl && (
                    <div className="mt-2 flex items-center gap-2 text-xs text-violet-600">
                      <span>🎤</span> تم إرفاق تسجيل صوتي
                    </div>
                  )}
                </div>

                {/* Family info */}
                <div className="bg-gray-50 rounded-xl p-4 flex items-center gap-3">
                  <div className="flex-1 grid grid-cols-2 gap-3">
                    <div>
                      <p className="text-xs text-gray-500 flex items-center gap-1">
                        <span>📦</span> الكمية
                      </p>
                      <p className="font-medium text-gray-800">{form.quantity}</p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500 flex items-center gap-1">
                        <span>👥</span> أفراد الأسرة
                      </p>
                      <p className="font-medium text-gray-800">{form.family_members}</p>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => setStep(3)}
                    className="text-primary-600 text-xs hover:underline"
                  >
                    تعديل
                  </button>
                </div>

                {/* Location */}
                <div className="bg-gray-50 rounded-xl p-4">
                  <div className="flex items-center justify-between mb-1">
                    <p className="text-xs text-gray-500 flex items-center gap-1">
                      <span>📍</span> الموقع
                    </p>
                    <button
                      type="button"
                      onClick={() => setStep(4)}
                      className="text-primary-600 text-xs hover:underline"
                    >
                      تعديل
                    </button>
                  </div>
                  <div className="text-sm text-gray-700 space-y-1">
                    {form.address && <p>{form.address}</p>}
                    {(form.city || form.region) && (
                      <p>
                        {[form.city, form.region].filter(Boolean).join(' - ')}
                      </p>
                    )}
                    {form.latitude && form.longitude && (
                      <p className="text-xs text-green-600 flex items-center gap-1">
                        <span>📡</span> تم تحديد الإحداثيات
                      </p>
                    )}
                    {!form.address && !form.city && !form.region && !form.latitude && (
                      <p className="text-gray-400">لم يتم تحديد الموقع (سيُستخدم عنوان حسابك)</p>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Navigation Buttons */}
          <div className="flex gap-3 mt-8 pt-5 border-t border-gray-100">
            {step > 1 && (
              <Button
                type="button"
                variant="secondary"
                onClick={prevStep}
                className="flex-1"
                size="lg"
              >
                → السابق
              </Button>
            )}

            {step < 5 ? (
              <Button
                type="button"
                onClick={nextStep}
                disabled={!canGoNext()}
                className={`flex-1 ${step === 1 && 'w-full'}`}
                size="lg"
              >
                التالي ←
              </Button>
            ) : (
              <Button
                type="button"
                onClick={handleSubmit}
                loading={loading}
                className="flex-1 !bg-gradient-to-l from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 !shadow-lg"
                size="lg"
              >
                🤲 إرسال الطلب
              </Button>
            )}
          </div>
        </Card>

        {/* Help text at bottom */}
        <div className="text-center mt-6">
          <p className="text-xs text-gray-400 flex items-center justify-center gap-1.5">
            <span>🔒</span> معلوماتك محمية وسرية بالكامل
          </p>
        </div>
      </div>
    </DashboardLayout>
  );
}

export default function NewRequestPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-neutral-light flex flex-col items-center justify-center">
          <div className="w-10 h-10 border-4 border-primary-200 border-t-primary-600 rounded-full animate-spin" />
          <p className="mt-4 text-gray-500 text-sm">جاري التحميل...</p>
        </div>
      }
    >
      <NewRequestContent />
    </Suspense>
  );
}
