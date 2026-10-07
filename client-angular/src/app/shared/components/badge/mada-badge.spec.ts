import { TestBed } from '@angular/core/testing';
import { MadaBadge } from './mada-badge';

describe('MadaBadge', () => {
  it('renders the selected semantic tone, label and projected content', async () => {
    await TestBed.configureTestingModule({ imports: [MadaBadge] }).compileComponents();
    const fixture = TestBed.createComponent(MadaBadge);
    fixture.componentRef.setInput('tone', 'success');
    fixture.componentRef.setInput('label', 'حالة التسجيل');
    fixture.detectChanges();

    const badge = fixture.nativeElement.querySelector('span') as HTMLSpanElement;
    expect(badge.classList.contains('mada-badge--success')).toBe(true);
    expect(badge.getAttribute('aria-label')).toBe('حالة التسجيل');
  });
});
