import { Injectable, inject } from '@angular/core';
import { AuthService } from './auth.service';
import {
  hasPermissions,
  hasRole,
  type AuthorizationPolicy,
  type PermissionKey,
  type StaffRoleCode,
} from './authorization.models';

@Injectable({ providedIn: 'root' })
export class AuthorizationService {
  private readonly auth = inject(AuthService);

  can(policy: AuthorizationPolicy): boolean {
    const roleAllowed = !policy.roles?.length || hasRole(this.auth.me(), policy.roles);
    const permissionsAllowed =
      !policy.permissions?.length ||
      hasPermissions(this.auth.me(), policy.permissions, policy.requireAllPermissions ?? true);
    return roleAllowed && permissionsAllowed;
  }

  hasRole(role: StaffRoleCode): boolean {
    return hasRole(this.auth.me(), [role]);
  }

  hasAnyRole(roles: readonly StaffRoleCode[]): boolean {
    return hasRole(this.auth.me(), roles);
  }

  hasPermission(permission: PermissionKey): boolean {
    return hasPermissions(this.auth.me(), [permission]);
  }
}
