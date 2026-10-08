import { provideLucideIcons, LucideMapPin } from '@lucide/angular';
import { TestBed } from '@angular/core/testing';
import { MadaScopeCard } from './mada-scope-card';

describe('MadaScopeCard', () => {
  it('labels a configured display scope and makes preview status explicit', async () => {
    await TestBed.configureTestingModule({
      imports: [MadaScopeCard],
      providers: [provideLucideIcons(LucideMapPin)],
    }).compileComponents();
    const fixture = TestBed.createComponent(MadaScopeCard);
    fixture.componentRef.setInput('level', 'branch');
    fixture.componentRef.setInput('scopeName', 'فرع توضيحي');
    fixture.componentRef.setInput('tenantName', 'أكاديمية مدى');
    fixture.componentRef.setInput('demo', true);
    fixture.detectChanges();

    const section = fixture.nativeElement.querySelector('section') as HTMLElement;
    expect(section.getAttribute('aria-label')).toContain('فرع توضيحي');
    expect(section.getAttribute('data-demo')).toBe('true');
    expect(section.textContent).toContain('أكاديمية مدى');
    expect(section.textContent).toContain('الفرع');
    expect(section.textContent).toContain('معاينة');
  });
});
