import { randomUUID } from "node:crypto";
import type { AuthPrincipal } from "../auth/types";

export type AuditEventInput = {
  action: string; targetType: string; targetId: string; tenantId?: string; branchId?: string;
  fromStatus?: string; toStatus?: string; reason?: string; before?: unknown; after?: unknown;
};

export type AuditEvent = AuditEventInput & { id: string; actorId: string; actorRole?: string; requestId: string; createdAt: string };

export interface AuditSink { append(event: AuditEvent): Promise<void>; }
export class DevAuditSink implements AuditSink {
  readonly events: AuditEvent[] = [];
  async append(event: AuditEvent) { this.events.push(event); }
}

export class AuditService {
  constructor(private readonly sink: AuditSink) {}
  async record(principal: AuthPrincipal, input: AuditEventInput, requestId = randomUUID()) {
    await this.sink.append({ ...input, id: randomUUID(), actorId: principal.sub, actorRole: principal.role, requestId, createdAt: new Date().toISOString() });
  }
}
