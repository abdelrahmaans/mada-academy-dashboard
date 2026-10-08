import { TestBed } from '@angular/core/testing';
import { MadaFeedbackState } from './mada-feedback-state';

describe('MadaFeedbackState', () => {
  it('announces errors and emits retry only after an explicit action', async () => {
    await TestBed.configureTestingModule({ imports: [MadaFeedbackState] }).compileComponents();
    const fixture = TestBed.createComponent(MadaFeedbackState);
    fixture.componentRef.setInput('kind', 'error');
    fixture.componentRef.setInput('title', 'تعذر تحميل السجلات');
    fixture.componentRef.setInput('description', 'تحقق من الاتصال ثم أعد المحاولة.');
    const retry = vi.fn();
    fixture.componentInstance.retry.subscribe(retry);
    fixture.detectChanges();

    const section = fixture.nativeElement.querySelector('section') as HTMLElement;
    expect(section.getAttribute('role')).toBe('alert');
    expect(section.getAttribute('aria-live')).toBe('assertive');
    expect(section.textContent).toContain('تعذر تحميل السجلات');
    (section.querySelector('button') as HTMLButtonElement).click();
    expect(retry).toHaveBeenCalledTimes(1);
  });
});
