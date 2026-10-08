import { Component } from '@angular/core';
import { Router, provideRouter } from '@angular/router';
import {
  LucideBarChart3,
  LucideBookOpen,
  LucideCalendarDays,
  LucideChevronDown,
  LucideChevronLeft,
  LucideCircleCheck,
  LucideCircleHelp,
  LucideGraduationCap,
  LucideLayoutDashboard,
  LucideLogOut,
  LucideSettings,
  LucideShieldCheck,
  LucideUserPlus,
  LucideUsers,
  LucideX,
  provideLucideIcons,
} from '@lucide/angular';
import { TestBed } from '@angular/core/testing';
import { MadaSidebar, type MadaSidebarSection } from './mada-sidebar';

@Component({ standalone: true, template: '' })
class RouteStub {}

const branchSections: readonly MadaSidebarSection[] = [
  {
    label: 'القائمة الرئيسية',
    ariaLabel: 'تنقل مدير الفرع',
    items: [
      { path: '/', label: 'الرئيسية', icon: 'layout-dashboard', exact: true },
      { path: '/students', label: 'الطلاب', icon: 'users' },
      { path: '/schedule', label: 'الجدول', icon: 'calendar-days' },
    ],
  },
];

describe('MadaSidebar', () => {
  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [MadaSidebar],
      providers: [
        provideRouter([
          { path: '', pathMatch: 'full', component: RouteStub },
          { path: 'students', component: RouteStub },
        ]),
        provideLucideIcons(
          LucideBarChart3,
          LucideBookOpen,
          LucideCalendarDays,
          LucideChevronDown,
          LucideChevronLeft,
          LucideCircleCheck,
          LucideCircleHelp,
          LucideGraduationCap,
          LucideLayoutDashboard,
          LucideLogOut,
          LucideSettings,
          LucideShieldCheck,
          LucideUserPlus,
          LucideUsers,
          LucideX,
        ),
      ],
    }).compileComponents();
  });

  it('uses configured role-specific navigation and updates active-link semantics on navigation', async () => {
    await TestBed.inject(Router).navigateByUrl('/');
    const fixture = TestBed.createComponent(MadaSidebar);
    fixture.componentRef.setInput('ariaLabel', 'تنقل مدير الفرع');
    fixture.componentRef.setInput('roleLabel', 'مدير الفرع');
    fixture.componentRef.setInput('roleCode', 'R02');
    fixture.componentRef.setInput('homePath', '/');
    fixture.componentRef.setInput('sections', branchSections);
    fixture.detectChanges();
    await fixture.whenStable();

    const host = fixture.nativeElement as HTMLElement;
    expect(host.querySelector('aside')?.getAttribute('aria-label')).toBe('تنقل مدير الفرع');
    expect(host.textContent).toContain('مدير الفرع · R02');
    expect(host.querySelectorAll('nav a')).toHaveLength(3);
    expect(host.textContent).not.toContain('المكتب المالي');

    (host.querySelector('a[href="/students"]') as HTMLAnchorElement).click();
    await fixture.whenStable();
    fixture.detectChanges();
    expect(host.querySelector('[aria-current="page"]')?.textContent).toContain('الطلاب');
  });

  it('renders commands as actions, not routes, and emits close for an accessible mobile scrim', () => {
    const fixture = TestBed.createComponent(MadaSidebar);
    fixture.componentRef.setInput('ariaLabel', 'تنقل مدير الفرع');
    fixture.componentRef.setInput('roleLabel', 'مدير الفرع');
    fixture.componentRef.setInput('roleCode', 'R02');
    fixture.componentRef.setInput('homePath', '/');
    fixture.componentRef.setInput('sections', branchSections);
    fixture.componentRef.setInput('utilityLinks', [
      { actionId: 'logout', label: 'تسجيل الخروج', icon: 'log-out' },
    ]);
    fixture.componentRef.setInput('open', true);
    const closed = vi.fn();
    const activated = vi.fn();
    fixture.componentInstance.closed.subscribe(closed);
    fixture.componentInstance.itemActivated.subscribe(activated);
    fixture.detectChanges();

    const host = fixture.nativeElement as HTMLElement;
    expect(host.querySelector('.mada-sidebar__scrim')?.getAttribute('aria-label')).toBe(
      'إغلاق القائمة',
    );
    expect(host.querySelector('.mada-sidebar__action')).toBeTruthy();
    expect(host.querySelector('.mada-sidebar__bottom a')).toBeNull();
    (host.querySelector('.mada-sidebar__action') as HTMLButtonElement).click();
    expect(activated).toHaveBeenCalledWith({
      actionId: 'logout',
      label: 'تسجيل الخروج',
      icon: 'log-out',
    });
    expect(closed).toHaveBeenCalledTimes(1);
    (host.querySelector('.mada-sidebar__scrim') as HTMLButtonElement).click();
    expect(closed).toHaveBeenCalledTimes(2);
  });
});
