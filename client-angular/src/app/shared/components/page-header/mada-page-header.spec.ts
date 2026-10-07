import { TestBed } from '@angular/core/testing';
import { MadaPageHeader } from './mada-page-header';

describe('MadaPageHeader', () => {
  it('renders the page heading hierarchy and optional copy', async () => {
    await TestBed.configureTestingModule({ imports: [MadaPageHeader] }).compileComponents();
    const fixture = TestBed.createComponent(MadaPageHeader);
    fixture.componentRef.setInput('title', 'إدارة الطلاب');
    fixture.componentRef.setInput('eyebrow', 'تشغيل الفرع');
    fixture.componentRef.setInput('description', 'طلاب الفرع المحدد فقط.');
    fixture.detectChanges();

    const host = fixture.nativeElement as HTMLElement;
    expect(host.querySelector('h1')?.textContent).toBe('إدارة الطلاب');
    expect(host.textContent).toContain('تشغيل الفرع');
    expect(host.textContent).toContain('طلاب الفرع المحدد فقط.');
  });
});
