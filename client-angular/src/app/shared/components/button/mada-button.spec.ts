import { TestBed } from '@angular/core/testing';
import { MadaButton } from './mada-button';

describe('MadaButton', () => {
  beforeEach(async () => {
    await TestBed.configureTestingModule({ imports: [MadaButton] }).compileComponents();
  });

  it('renders a native button with the selected visual variant and default type', () => {
    const fixture = TestBed.createComponent(MadaButton);
    fixture.componentRef.setInput('variant', 'secondary');
    fixture.componentRef.setInput('type', 'submit');
    fixture.detectChanges();
    const button = fixture.nativeElement.querySelector('button') as HTMLButtonElement;
    expect(button.type).toBe('submit');
    expect(button.classList.contains('mada-button--secondary')).toBe(true);
  });

  it('emits a click when enabled, and disables clicks while loading', () => {
    const fixture = TestBed.createComponent(MadaButton);
    const clicked = vi.fn();
    fixture.componentInstance.clicked.subscribe(clicked);
    fixture.detectChanges();
    (fixture.nativeElement.querySelector('button') as HTMLButtonElement).click();
    expect(clicked).toHaveBeenCalledTimes(1);

    fixture.componentRef.setInput('loading', true);
    fixture.detectChanges();
    const button = fixture.nativeElement.querySelector('button') as HTMLButtonElement;
    button.click();
    expect(button.disabled).toBe(true);
    expect(button.getAttribute('aria-busy')).toBe('true');
    expect(clicked).toHaveBeenCalledTimes(1);
  });
});
