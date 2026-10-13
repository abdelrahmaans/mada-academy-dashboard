import React from 'react';
import { Mail, Phone, Lock, ShieldCheck, ArrowUp } from 'lucide-react';

interface FooterProps {
  onOpenAdminLogin: () => void;
  onScrollToDemo: () => void;
}

export const Footer: React.FC<FooterProps> = ({ onOpenAdminLogin, onScrollToDemo }) => {
  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <footer className="bg-[#0B1522] text-white pt-16 pb-12 border-t border-white/10">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* 3 Columns matching Screenshot 2 */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-12 pb-14 border-b border-white/10 text-right">
          
          {/* Column 1: Brand Info matching Screenshot 2 */}
          <div className="space-y-4">
            <h3 className="text-2xl font-black text-white tracking-tight flex items-center justify-end gap-2">
              <span className="text-[#0D9488]">مدى</span>
              <span>أكاديمي</span>
            </h3>
            
            <p className="text-xs sm:text-sm text-white/70 leading-relaxed font-normal max-w-sm ml-auto">
              منصة متكاملة لإدارة الأقسام والفرعيات التعليمية، مصممة لدعم النمو السليم والمنظم للأعمال.
            </p>

            <div className="pt-2 text-xs text-[#0D9488] font-bold flex items-center justify-end gap-1.5">
              <span>نظام تشغيل سحابي B2B</span>
              <ShieldCheck className="w-4 h-4" />
            </div>
          </div>

          {/* Column 2: روابط سريعة matching Screenshot 2 */}
          <div className="space-y-4">
            <h4 className="text-base font-bold text-white">
              روابط سريعة
            </h4>
            <ul className="space-y-2.5 text-xs sm:text-sm text-white/70 font-normal">
              <li>
                <a href="#features" className="hover:text-white hover:underline transition-colors">
                  القدرات
                </a>
              </li>
              <li>
                <a href="#audience" className="hover:text-white hover:underline transition-colors">
                  لمن نخدم
                </a>
              </li>
              <li>
                <a href="#workflow" className="hover:text-white hover:underline transition-colors">
                  سير العمل
                </a>
              </li>
              <li>
                <button 
                  onClick={onScrollToDemo} 
                  className="hover:text-[#0D9488] transition-colors font-semibold"
                >
                  طلب Demo
                </button>
              </li>
              <li>
                <button
                  onClick={onOpenAdminLogin}
                  className="hover:text-white transition-colors flex items-center gap-1.5 justify-end"
                >
                  <span>دخول المشرفين</span>
                  <Lock className="w-3.5 h-3.5 text-[#0D9488]" />
                </button>
              </li>
            </ul>
          </div>

          {/* Column 3: تواصل matching Screenshot 2 */}
          <div className="space-y-4">
            <h4 className="text-base font-bold text-white">
              تواصل
            </h4>
            <div className="space-y-3 text-xs sm:text-sm text-white/70">
              <a 
                href="mailto:info@madaacademy.com" 
                className="flex items-center justify-end gap-2.5 font-en hover:text-white transition-colors"
              >
                <span>info@madaacademy.com</span>
                <Mail className="w-4 h-4 text-[#0D9488]" />
              </a>

              <a 
                href="tel:+966500000000" 
                className="flex items-center justify-end gap-2.5 font-en hover:text-white transition-colors"
              >
                <span>+966 5X XXX XXXX</span>
                <Phone className="w-4 h-4 text-[#0D9488]" />
              </a>

              <p className="text-[11px] text-white/50 pt-2 leading-relaxed">
                ساعات العمل: الأحد إلى الخميس، من 9:00 ص إلى 6:00 م
              </p>
            </div>
          </div>

        </div>

        {/* Bottom Bar matching Screenshot 2 */}
        <div className="pt-8 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-white/50">
          <div className="flex items-center gap-2">
            <span>© 2026 مدى أكاديمي. جميع الحقوق محفوظة.</span>
          </div>

          <div className="flex items-center gap-4">
            <span className="font-en text-[11px]">ENTERPRISE ACADEMY OS · SAUDI ARABIA</span>
            <button
              onClick={scrollToTop}
              className="p-2 rounded-lg bg-white/5 hover:bg-white/10 text-white/70 hover:text-white transition-colors"
              title="العودة لأعلى الصفحة"
            >
              <ArrowUp className="w-4 h-4" />
            </button>
          </div>
        </div>

      </div>
    </footer>
  );
};
