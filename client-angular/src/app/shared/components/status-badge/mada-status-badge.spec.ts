import { TestBed } from '@angular/core/testing';
import { MadaStatusBadge } from './mada-status-badge';

describe('MadaStatusBadge', () => {
  beforeEach(async () => {
    await TestBed.configureTestingModule({ imports: [MadaStatusBadge] }).compileComponents();
  });

  it('normalizes status, translates the known key and maps its presentation tone', () => {
    const fixture = TestBed.createComponent(MadaStatusBadge);
    fixture.componentRef.setInput('status', 'pending approval');
    fixture.detectChanges();
    const host = fixture.nativeElement as HTMLElement;
    expect(host.getAttribute('data-status')).toBe('PENDING_APPROVAL');
    expect(host.textContent).toContain('بانتظار الاعتماد');
    expect(host.querySelector('mada-badge .mada-badge--warning')).toBeTruthy();
  });

  it('uses an explicit custom label and a neutral tone for an unknown state', () => {
    const fixture = TestBed.createComponent(MadaStatusBadge);
    fixture.componentRef.setInput('status', 'UNMAPPED');
    fixture.componentRef.setInput('labelOverride', 'حالة المجال');
    fixture.detectChanges();
    expect((fixture.nativeElement as HTMLElement).textContent).toContain('حالة المجال');
    expect(fixture.nativeElement.querySelector('mada-badge .mada-badge--neutral')).toBeTruthy();
  });
});
