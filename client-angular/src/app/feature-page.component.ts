import { Component, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute } from '@angular/router';
import { getPageDefinition, MetricCard, PageDefinition } from './core/page-catalog';
import { RoleSessionService } from './core/role-session.service';

@Component({
  selector: 'mada-feature-page',
  standalone: true,
  imports: [FormsModule],
  templateUrl: './feature-page.component.html',
  styleUrl: './feature-page.component.scss',
})
export class FeaturePageComponent {
  readonly session = inject(RoleSessionService);
  private readonly route = inject(ActivatedRoute);
  readonly search = signal('');
  readonly notice = signal('');

  get path(): string { return this.route.snapshot.url.map((segment) => segment.path).join('/') ? `/${this.route.snapshot.url.map((segment) => segment.path).join('/')}` : '/'; }
  get page(): PageDefinition { return getPageDefinition(this.path); }
  get metrics(): readonly MetricCard[] { return this.page.metrics; }
  get filteredRows(): readonly string[][] { const query = this.search().trim().toLowerCase(); return query ? this.page.rows.filter((row) => row.join(' ').toLowerCase().includes(query)) : this.page.rows; }
  get isHub(): boolean { return this.page.kind === 'hub'; }

  doAction(action: string): void { this.notice.set(`${action} · جاهز للربط بالـAPI في المرحلة التالية`); setTimeout(() => this.notice.set(''), 2600); }
  updateSearch(value: string): void { this.search.set(value); }
}
