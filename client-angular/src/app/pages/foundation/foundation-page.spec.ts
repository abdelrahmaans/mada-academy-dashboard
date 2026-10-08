import { provideRouter } from '@angular/router';
import { TestBed } from '@angular/core/testing';
import { FoundationPage } from './foundation-page';

describe('FoundationPage', () => {
  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [FoundationPage],
      providers: [provideRouter([])],
    }).compileComponents();
  });

  it('keeps the scaffold visibly Arabic, RTL, and not connected to operational data', () => {
    const fixture = TestBed.createComponent(FoundationPage);
    fixture.detectChanges();
    const host = fixture.nativeElement as HTMLElement;

    expect(host.querySelector('main')?.getAttribute('dir')).toBe('rtl');
    expect(host.querySelector('h1')?.textContent).toContain('مرحلة التأسيس');
    expect(host.textContent).toContain('لا يعرض بيانات تشغيلية');
    expect(host.textContent).toContain('React');
    expect(host.querySelector('mada-button[routerLink="/shared-components"]')).toBeTruthy();
    expect(host.querySelectorAll('.foundation__list li')).toHaveLength(4);
  });
});
