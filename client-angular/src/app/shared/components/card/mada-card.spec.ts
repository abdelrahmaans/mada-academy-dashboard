import { TestBed } from '@angular/core/testing';
import { MadaCard } from './mada-card';

describe('MadaCard', () => {
  it('provides an accessible section and composes the requested surface and spacing', async () => {
    await TestBed.configureTestingModule({ imports: [MadaCard] }).compileComponents();
    const fixture = TestBed.createComponent(MadaCard);
    fixture.componentRef.setInput('surface', 'tile');
    fixture.componentRef.setInput('padding', 'compact');
    fixture.componentRef.setInput('label', 'ملخص الفرع');
    fixture.detectChanges();
    const card = fixture.nativeElement.querySelector('section') as HTMLElement;
    expect(card.getAttribute('aria-label')).toBe('ملخص الفرع');
    expect(card.classList.contains('mada-card--tile')).toBe(true);
    expect(card.classList.contains('mada-card--compact')).toBe(true);
  });
});
