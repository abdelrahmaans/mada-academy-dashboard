import React, { useState } from 'react';
import { Header } from './components/Header';
import { Hero } from './components/Hero';
import { SystemPreview } from './components/SystemPreview';
import { Capabilities } from './components/Capabilities';
import { Audience } from './components/Audience';
import { Workflow } from './components/Workflow';
import { DemoForm } from './components/DemoForm';
import { Footer } from './components/Footer';
import { AdminLoginModal } from './components/AdminLoginModal';

export default function Home() {
  const [adminModalOpen, setAdminModalOpen] = useState(false);

  const scrollToDemo = () => {
    const el = document.getElementById('demo-request');
    if (el) {
      el.scrollIntoView({ behavior: 'smooth' });
    }
  };

  const scrollToPreview = () => {
    const el = document.getElementById('preview');
    if (el) {
      el.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <div className="min-h-screen bg-[#F8FAFC] text-[#14243A] selection:bg-[#0D9488]/20 selection:text-[#0D9488]">
      {/* 1. Header Navigation */}
      <Header 
        onOpenAdminLogin={() => setAdminModalOpen(true)}
        onScrollToDemo={scrollToDemo}
      />

      {/* Main Page Flow */}
      <main>
        {/* 2. Hero Section (Merged Screenshot 1 + Repo) */}
        <Hero 
          onScrollToDemo={scrollToDemo}
          onScrollToPreview={scrollToPreview}
        />

        {/* 3. Interactive Live System Simulation */}
        <section className="py-16 sm:py-20 bg-gradient-to-b from-[#F4F7FA] to-white border-b border-[#14243A]/10">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="mb-6 flex flex-col sm:flex-row sm:items-end justify-between gap-3 text-right">
              <div>
                <div className="flex items-center gap-2 text-xs font-bold text-[#0D9488] mb-2">
                  <span className="w-2 h-2 rounded-full bg-[#0D9488] animate-ping" />
                  <span>محاكاة تفاعلية حية</span>
                  <span aria-hidden="true" className="text-[#14243A]/30">·</span>
                  <span className="font-en text-[#14243A]/60">LIVE OS SIMULATION</span>
                </div>
                <h2 className="text-2xl sm:text-3xl font-black text-[#14243A]">
                  واجهة التشغيل اليومية للأكاديمية
                </h2>
              </div>
              <p className="text-xs sm:text-sm text-[#14243A]/60 font-medium">
                جرّب بنفسك التبديل بين الفروع، منظور الأدوار، وتحديث كشوف الحضور والتقييمات
              </p>
            </div>

            <SystemPreview />
          </div>
        </section>

        {/* 4. Core Capabilities (6 Pillars) */}
        <Capabilities />

        {/* 5. Target Audience (Matching Screenshot 4) */}
        <Audience />

        {/* 6. Operational Workflow (Matching Screenshot 5 Timeline) */}
        <Workflow />

        {/* 7. Request a Demo Form (Matching Screenshot 3 with Live API) */}
        <DemoForm />
      </main>

      {/* 8. Footer (Matching Screenshot 2) */}
      <Footer 
        onOpenAdminLogin={() => setAdminModalOpen(true)}
        onScrollToDemo={scrollToDemo}
      />

      {/* 9. Supervisor / Admin Login Modal */}
      <AdminLoginModal 
        isOpen={adminModalOpen}
        onClose={() => setAdminModalOpen(false)}
      />
    </div>
  );
}
