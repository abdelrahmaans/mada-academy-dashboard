import { provideRouter } from '@angular/router';
import {
  LucideBarChart3,
  LucideBookOpen,
  LucideBuilding2,
  LucideCalendarDays,
  LucideChevronDown,
  LucideChevronLeft,
  LucideCircleCheck,
  LucideCircleHelp,
  LucideGraduationCap,
  LucideLayoutDashboard,
  LucideLogOut,
  LucideMapPin,
  LucideMenu,
  LucideSettings,
  LucideShieldCheck,
  LucideUserPlus,
  LucideUsers,
  LucideWallet,
  LucideX,
  provideLucideIcons,
} from '@lucide/angular';
import { TestBed } from '@angular/core/testing';
import { SharedComponentsPreview } from './shared-components-preview';

describe('SharedComponentsPreview', () => {
  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [SharedComponentsPreview],
      providers: [
        provideRouter([]),
        provideLucideIcons(
          LucideBarChart3,
          LucideBookOpen,
          LucideBuilding2,
          LucideCalendarDays,
          LucideChevronDown,
          LucideChevronLeft,
          LucideCircleCheck,
          LucideCircleHelp,
          LucideGraduationCap,
          LucideLayoutDashboard,
          LucideLogOut,
          LucideMapPin,
          LucideMenu,
          LucideSettings,
          LucideShieldCheck,
          LucideUserPlus,
          LucideUsers,
          LucideWallet,
          LucideX,
        ),
      ],
    }).compileComponents();
  });

  it('clearly labels preview-only sample navigation and shared status components', async () => {
    const fixture = TestBed.createComponent(SharedComponentsPreview);
    fixture.detectChanges();
    await fixture.whenStable();
    const host = fixture.nativeElement as HTMLElement;
    expect(host.textContent).toContain('معاينة غير LIVE');
    expect(host.textContent).toContain('مدير الفرع · R02');
    expect(host.textContent).toContain('التنقل، النطاق والحالات');
    expect(host.querySelectorAll('mada-status-badge')).toHaveLength(4);
    expect(host.querySelectorAll('.mada-sidebar__nav a')).toHaveLength(9);
  });

  it('opens the mobile sidebar and emits a preview retry action without an API request', () => {
    const fixture = TestBed.createComponent(SharedComponentsPreview);
    fixture.detectChanges();
    const host = fixture.nativeElement as HTMLElement;
    (host.querySelector('.shared-preview__topbar mada-button button') as HTMLButtonElement).click();
    fixture.detectChanges();
    expect(host.querySelector('.mada-sidebar__scrim')).toBeTruthy();

    (host.querySelector('.mada-feedback-state mada-button button') as HTMLButtonElement).click();
    fixture.detectChanges();
    expect(host.textContent).toContain('محاولات المعاينة: 1');
  });
});
