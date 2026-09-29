import { Component, inject } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { RoleSessionService } from './core/role-session.service';

@Component({ selector: 'mada-surface', standalone: true, template: `
  <section class="surface-card">
    <div class="surface-icon">{{ session.definition().code }}</div>
    <div>
      <span class="surface-kicker">ANGULAR MIGRATION SURFACE</span>
      <h2>{{ title() }}</h2>
      <p>هذا surface مبدئي للـApp Shell والـSidebar. سيتم نقل الشاشة الفعلية من React وربطها بـASP.NET Core API في الـvertical slice التالي.</p>
      <div class="surface-meta"><span>Role: {{ session.definition().code }}</span><span>Scope: {{ session.definition().scopeLevel }}</span><span>Path: {{ path() }}</span></div>
    </div>
  </section>
`, styles: [`
  :host { display:block; }.surface-card { display:flex; gap:22px; align-items:flex-start; padding:34px; border:1px solid #e4ebf0; border-radius:22px; background:#fff; box-shadow:0 12px 35px rgba(20,36,58,.06); }.surface-icon { display:grid; place-items:center; flex:0 0 68px; height:68px; border-radius:20px; color:#fff; background:#0d9488; font-size:20px; font-weight:900; }.surface-kicker { color:#0d9488; font-size:11px; font-weight:800; letter-spacing:.12em; }.surface-card h2 { margin:8px 0 10px; font-size:28px; letter-spacing:-.04em; }.surface-card p { max-width:670px; margin:0; color:#64748b; line-height:1.8; }.surface-meta { display:flex; flex-wrap:wrap; gap:8px; margin-top:22px; }.surface-meta span { padding:7px 10px; border-radius:9px; color:#476174; background:#f1f6f7; font-size:11px; }@media(max-width:600px){.surface-card{padding:22px;flex-direction:column}.surface-card h2{font-size:24px}}
`]})
export class SurfaceComponent {
  readonly session = inject(RoleSessionService);
  private readonly route = inject(ActivatedRoute);
  path(): string { return this.route.snapshot.url.map((segment) => segment.path).join('/') || '/'; }
  title(): string { const path = this.path(); return path === '/' ? 'ملخص التشغيل' : this.session.definition().navigation.find((item) => item.path === `/${path}`)?.label ?? 'مساحة العمل'; }
}
