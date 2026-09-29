import { Injectable, signal } from '@angular/core';
import { RoleCode, getRoleDefinition } from './role-registry';

@Injectable({ providedIn: 'root' })
export class RoleSessionService {
  readonly role = signal<RoleCode>('R02');
  readonly definition = signal(getRoleDefinition('R02'));

  setRole(role: RoleCode): void {
    this.role.set(role);
    this.definition.set(getRoleDefinition(role));
  }
}
