import React, { useState } from 'react';
import { Menu, X, Lock } from 'lucide-react';

interface HeaderProps {
  onOpenAdminLogin: () => void;
  onScrollToDemo: () => void;
}

export const Header: React.FC<HeaderProps> = ({ onOpenAdminLogin, onScrollToDemo }) => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <header className="sticky top-0 z-40 w-full bg-white/90 backdrop-blur-md border-b border-[#14243A]/10 transition-all">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-20 gap-6">
          
          {/* Brand Logo - Matching Screenshot 1 & 2 */}
          <a 
            href="#" 
            className="flex items-center gap-3 group focus-visible:ring-2 focus-visible:ring-[#0D9488] rounded-lg p-1"
            aria-label="الرئيسية - مدى أكاديمي"
          >
            {/* Geometric Brand Icon from screenshots */}
            <div className="w-10 h-10 rounded-xl bg-[#14243A] flex flex-col items-center justify-center gap-1 shadow-sm group-hover:bg-[#1B2F4A] transition-colors">
              <span className="w-5 h-1 rounded-full bg-[#0D9488]" />
              <span className="w-4 h-1 rounded-full bg-white" />
              <span className="w-3 h-1 rounded-full bg-[#D49A2D]" />
            </div>
            <div className="flex flex-col text-right">
              <span className="text-lg font-black tracking-tight text-[#14243A] leading-tight">
                MADA
              </span>
              <span className="text-[10px] font-bold tracking-widest text-[#14243A]/70 uppercase">
                ACADEMY
              </span>
            </div>
          </a>

          {/* Navigation Links - Matching Modern Global Standards */}
          <nav className="hidden lg:flex items-center gap-6 xl:gap-8 text-sm font-semibold text-[#14243A]/80">
            <a 
              href="#roles" 
              className="hover:text-[#0D9488] transition-colors hover:underline underline-offset-8 decoration-[#0D9488] decoration-2"
            >
              حلول الأدوار
            </a>
            <a 
              href="#features" 
              className="hover:text-[#0D9488] transition-colors hover:underline underline-offset-8 decoration-[#0D9488] decoration-2"
            >
              المزايا
            </a>
            <a 
              href="#preview" 
              className="hover:text-[#0D9488] transition-colors hover:underline underline-offset-8 decoration-[#0D9488] decoration-2 flex items-center gap-1.5"
            >
              <span>المحاكي المباشر</span>
              <span className="w-2 h-2 rounded-full bg-[#0D9488] animate-ping" />
            </a>
            <a 
              href="#pricing" 
              className="hover:text-[#0D9488] transition-colors hover:underline underline-offset-8 decoration-[#0D9488] decoration-2 font-bold text-[#0D9488]"
            >
              الباقات والأسعار
            </a>
            <a 
              href="#faq" 
              className="hover:text-[#0D9488] transition-colors hover:underline underline-offset-8 decoration-[#0D9488] decoration-2"
            >
              الأسئلة الشائعة
            </a>
          </nav>

          {/* Left Action Buttons - Supervisor Login & Demo CTA */}
          <div className="flex items-center gap-4 shrink-0">
            <button
              onClick={onOpenAdminLogin}
              className="hidden sm:flex items-center gap-2 text-xs font-bold text-[#14243A]/80 hover:text-[#14243A] py-2 px-3 rounded-lg hover:bg-[#14243A]/5 transition-colors"
            >
              <Lock className="w-3.5 h-3.5 text-[#0D9488]" />
              <span>دخول المشرفين</span>
            </button>

            <button
              onClick={onScrollToDemo}
              className="py-2.5 px-5 text-xs sm:text-sm font-bold text-white bg-[#0D9488] hover:bg-[#0B7D72] active:scale-[0.98] transition-all rounded-lg shadow-sm hover:shadow-md focus-visible:ring-2 focus-visible:ring-[#0D9488]"
            >
              اطلب Demo
            </button>

            {/* Mobile menu trigger */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="md:hidden p-2 text-[#14243A]/80 hover:text-[#14243A] rounded-lg hover:bg-[#14243A]/5 transition-colors"
              aria-label={mobileMenuOpen ? 'إغلاق القائمة' : 'فتح القائمة'}
              aria-expanded={mobileMenuOpen}
            >
              {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Drawer */}
      {mobileMenuOpen && (
        <div className="md:hidden border-t border-[#14243A]/10 bg-white/98 backdrop-blur-lg px-5 py-5 space-y-4 shadow-lg">
          <nav className="flex flex-col space-y-3 text-sm font-semibold text-[#14243A]">
            <a
              href="#roles"
              onClick={() => setMobileMenuOpen(false)}
              className="p-2.5 rounded-lg hover:bg-[#F4F7FA] transition-colors"
            >
              حلول الأدوار
            </a>
            <a
              href="#features"
              onClick={() => setMobileMenuOpen(false)}
              className="p-2.5 rounded-lg hover:bg-[#F4F7FA] transition-colors"
            >
              المزايا
            </a>
            <a
              href="#preview"
              onClick={() => setMobileMenuOpen(false)}
              className="p-2.5 rounded-lg hover:bg-[#F4F7FA] transition-colors flex items-center justify-between"
            >
              <span>المحاكي المباشر</span>
              <span className="text-[10px] font-bold bg-[#0D9488]/10 text-[#0D9488] px-2 py-0.5 rounded-full">حي</span>
            </a>
            <a
              href="#pricing"
              onClick={() => setMobileMenuOpen(false)}
              className="p-2.5 rounded-lg hover:bg-[#F4F7FA] transition-colors font-bold text-[#0D9488]"
            >
              الباقات والأسعار
            </a>
            <a
              href="#faq"
              onClick={() => setMobileMenuOpen(false)}
              className="p-2.5 rounded-lg hover:bg-[#F4F7FA] transition-colors"
            >
              الأسئلة الشائعة
            </a>
            <button
              onClick={() => {
                setMobileMenuOpen(false);
                onOpenAdminLogin();
              }}
              className="flex items-center gap-2 p-2.5 text-right rounded-lg hover:bg-[#F4F7FA] text-[#14243A] transition-colors border-t border-[#14243A]/10 pt-4"
            >
              <Lock className="w-4 h-4 text-[#0D9488]" />
              <span>دخول المشرفين</span>
            </button>
          </nav>
        </div>
      )}
    </header>
  );
};
