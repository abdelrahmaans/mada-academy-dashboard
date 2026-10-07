import { TestBed } from '@angular/core/testing';
import { App } from './app';

describe('App foundation', () => {
  beforeEach(async () => {
    await TestBed.configureTestingModule({ imports: [App] }).compileComponents();
  });

  it('creates the standalone application root', () => {
    const fixture = TestBed.createComponent(App);
    expect(fixture.componentInstance).toBeTruthy();
  });

  it('clearly marks the Arabic RTL app as foundation-only, not live', async () => {
    const fixture = TestBed.createComponent(App);
    fixture.detectChanges();
    await fixture.whenStable();

    const host = fixture.nativeElement as HTMLElement;
    expect(host.querySelector('main')?.getAttribute('dir')).toBe('rtl');
    expect(host.querySelector('h1')?.textContent).toContain('مرحلة التأسيس');
    expect(host.textContent).toContain('لا يعرض بيانات تشغيلية');
    expect(host.textContent).toContain('React هي المرجع');
  });

  it('uses signal-backed foundation principles', () => {
    const fixture = TestBed.createComponent(App);
    fixture.detectChanges();

    expect(fixture.nativeElement.querySelectorAll('.foundation__list li')).toHaveLength(4);
  });
});
