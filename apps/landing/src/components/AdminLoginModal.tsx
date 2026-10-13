import React, { useState } from 'react';
import { Lock, X, ArrowLeft, ShieldCheck, Building2, ExternalLink } from 'lucide-react';
import { DASHBOARD_URL } from '../lib/publicApi';

interface AdminLoginModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const AdminLoginModal: React.FC<AdminLoginModalProps> = ({ isOpen, onClose }) => {
  const [workspace, setWorkspace] = useState('alrowad');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [status, setStatus] = useState<'idle' | 'loading' | 'success'>('idle');

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setStatus('loading');
    setTimeout(() => {
      // In production or live deploy, redirect to dashboard login
      window.location.href = DASHBOARD_URL;
    }, 1000);
  };

  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#14243A]/70 backdrop-blur-sm transition-opacity"
      role="dialog"
      aria-modal="true"
      aria-labelledby="admin-login-title"
    >
      {/* Backdrop */}
      <div className="absolute inset-0" onClick={onClose} />

      <div className="relative w-full max-w-md bg-white border border-[#14243A]/10 shadow-2xl p-6 sm:p-8 rounded-2xl z-10 text-right">
        <div className="flex items-center justify-between pb-4 border-b border-[#14243A]/10">
          <button
            onClick={onClose}
            className="p-1.5 text-[#14243A]/50 hover:text-[#14243A] hover:bg-[#14243A]/5 rounded-lg transition-colors"
            aria-label="إغلاق النافذة"
          >
            <X className="w-5 h-5" />
          </button>
          <div className="flex items-center gap-2.5">
            <div>
              <h2 id="admin-login-title" className="text-base font-bold text-[#14243A]">
                بوابة مديري ومشرفي الأكاديمية
              </h2>
              <p className="text-xs text-[#14243A]/60">
                تسجيل دخول الإدارة المعتمدة
              </p>
            </div>
            <div className="w-9 h-9 rounded-xl bg-[#14243A]/5 border border-[#14243A]/10 flex items-center justify-center text-[#14243A]">
              <Lock className="w-4 h-4 text-[#0D9488]" />
            </div>
          </div>
        </div>

        {status === 'success' ? (
          <div className="py-6 text-center space-y-4">
            <div className="w-12 h-12 mx-auto rounded-full bg-[#0D9488]/10 text-[#0D9488] flex items-center justify-center">
              <ShieldCheck className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-base font-bold text-[#14243A]">جاري التحقق من الصلاحيات...</h3>
              <p className="text-xs text-[#14243A]/70 mt-1">
                يتم ربط الجلسة بنطاق الأكاديمية: <span className="font-en font-medium text-[#14243A]">{workspace}.mada.academy</span>
              </p>
            </div>
            <p className="text-xs text-[#14243A]/50 bg-[#F4F7FA] p-3 rounded-xl border border-[#14243A]/5">
              جاري الانتقال إلى لوحة التحكم الرئيسية...
            </p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="mt-5 space-y-4">
            <div>
              <label className="block text-xs font-bold text-[#14243A] mb-1.5">
                نطاق الأكاديمية (Workspace)
              </label>
              <div className="flex items-center rounded-xl border border-[#14243A]/15 bg-[#F8FAFC] px-3 focus-within:border-[#0D9488] focus-within:bg-white focus-within:ring-2 focus-within:ring-[#0D9488]/20 transition-all">
                <input
                  type="text"
                  value={workspace}
                  onChange={(e) => setWorkspace(e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, ''))}
                  className="w-full bg-transparent py-2.5 px-2 text-xs text-[#14243A] font-en focus:outline-none"
                  placeholder="academy-slug"
                  required
                />
                <span className="text-[11px] font-en text-[#14243A]/50 shrink-0 font-medium">.mada.academy</span>
                <Building2 className="w-4 h-4 text-[#14243A]/40 shrink-0 mr-1.5" />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-[#14243A] mb-1.5">
                البريد الإلكتروني المهني
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="admin@academy.edu.sa"
                className="w-full py-2.5 px-3 text-xs text-[#14243A] font-en rounded-xl border border-[#14243A]/15 bg-white focus:outline-none focus:border-[#0D9488] focus:ring-2 focus:ring-[#0D9488]/20 transition-all"
                required
              />
            </div>

            <div>
              <div className="flex items-center justify-between mb-1.5">
                <a href="#reset" onClick={(e) => { e.preventDefault(); }} className="text-[11px] text-[#0D9488] hover:underline">
                  نسيت كلمة المرور؟
                </a>
                <label className="text-xs font-bold text-[#14243A]">كلمة المرور</label>
              </div>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••••••"
                className="w-full py-2.5 px-3 text-xs text-[#14243A] font-en rounded-xl border border-[#14243A]/15 bg-white focus:outline-none focus:border-[#0D9488] focus:ring-2 focus:ring-[#0D9488]/20 transition-all"
                required
              />
            </div>

            <div className="p-3 bg-[#F8FAFC] rounded-xl border border-[#14243A]/5 space-y-1">
              <div className="flex items-center gap-1.5 text-[11px] font-bold text-[#14243A]/80 justify-end">
                <span>عزل الصلاحيات مفعل تلقائيًا</span>
                <ShieldCheck className="w-3.5 h-3.5 text-[#0D9488]" />
              </div>
              <p className="text-[11px] text-[#14243A]/60 leading-relaxed">
                يتم تحديد الفروع والمجموعات المسموحة بناءً على التعيين المعتمد في نظام المؤسسة.
              </p>
            </div>

            <button
              type="submit"
              disabled={status === 'loading'}
              className="w-full py-3 px-4 bg-[#14243A] text-white text-xs font-bold rounded-xl hover:bg-[#1C3250] transition-all flex items-center justify-center gap-2 shadow-sm disabled:opacity-50"
            >
              {status === 'loading' ? (
                <span>جاري المصادقة...</span>
              ) : (
                <>
                  <ArrowLeft className="w-4 h-4" />
                  <span>دخول لوحة التحكم</span>
                </>
              )}
            </button>

            {/* Direct jump to dashboard link */}
            <div className="pt-2 text-center">
              <a
                href={DASHBOARD_URL}
                className="inline-flex items-center gap-1.5 text-[11px] text-[#0D9488] hover:underline font-semibold"
              >
                <span>الانتقال مباشرة لشاشة تسجيل الدخول</span>
                <ExternalLink className="w-3 h-3" />
              </a>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};
