import { Component, inject, input, output, signal } from '@angular/core';
import { Router, RouterLink, RouterLinkActive } from '@angular/router';
import { getRoleDefinition, RoleCode, ROLE_DEFINITIONS, RoleDefinition } from '../../core/role-registry';

@Component({
  selector: 'mada-sidebar',
  standalone: true,
  imports: [RouterLink, RouterLinkActive],
  templateUrl: './sidebar.component.html',
  styleUrl: './sidebar.component.scss',
})
export class SidebarComponent {
  private readonly router = inject(Router);
  readonly role = input.required<RoleCode>();
  readonly roleChange = output<RoleCode>();
  readonly roles: readonly RoleDefinition[] = ROLE_DEFINITIONS;
  readonly mobileOpen = signal(false);

  get currentRole(): RoleDefinition {
    return this.roles.find((candidate) => candidate.code === this.role()) ?? this.roles[2];
  }

  get navigation(): readonly RoleDefinition['navigation'][number][] {
    return this.currentRole.navigation;
  }

  selectRole(event: Event): void {
    const nextRole = (event.target as HTMLSelectElement).value as RoleCode;
    this.roleChange.emit(nextRole);
    void this.router.navigateByUrl(getRoleDefinition(nextRole).homePath);
  }

  closeMobile(): void { this.mobileOpen.set(false); }
  toggleMobile(): void { this.mobileOpen.update((value) => !value); }
}
