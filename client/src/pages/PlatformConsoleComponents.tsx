/**
 * PlatformConsoleComponents.tsx
 * Shared sub-components for Platform Console (R00):
 * - Metric: metric KPI card
 * - MemberTable: platform members and security session actions
 * - ActivityTable: audit and event stream list
 */

import React from "react";
import { Activity, Clock3, RefreshCw, UserRoundX } from "lucide-react";
import {
  type PlatformMember,
  type PlatformActivity,
} from "@/lib/apiClient";
import {
  fmtNumber,
  fmtDate,
} from "./PlatformConsoleTypes";

export function Metric({
  icon,
  label,
  value,
  note,
  isCurrency = false,
}: {
  icon: React.ReactNode;
  label: string;
  value: number;
  note: string;
  isCurrency?: boolean;
}) {
  return (
    <article className="pc-live-metric">
      <span>{icon}</span>
      <div>
        <small>{label}</small>
        <strong>
          {fmtNumber(value)}
          {isCurrency ? " ج.م" : ""}
        </strong>
        <em>{note}</em>
      </div>
    </article>
  );
}

export function MemberTable({
  rows,
  busyKey,
  onDisable,
  onRestore,
  onRevoke,
}: {
  rows: PlatformMember[];
  busyKey?: string | null;
  onDisable: (member: PlatformMember) => void;
  onRestore: (member: PlatformMember) => void;
  onRevoke: (member: PlatformMember) => void;
}) {
  return (
    <div className="pc-live-table-wrap">
      <table className="pc-live-table pc-live-member-table">
        <thead>
          <tr>
            <th>المستخدم</th>
            <th>الدور / العضوية</th>
            <th>آخر دخول</th>
            <th>آخر جلسة / نشطة</th>
            <th>إجراءات أمنية</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((member) => (
            <tr key={member.membershipId}>
              <th scope="row">
                <strong>{member.name ?? "بدون اسم"}</strong>
                <small>
                  {member.maskedEmail ?? "لا يوجد بريد"} · {member.maskedPhone}
                </small>
              </th>
              <td>
                {member.roleCode}
                <small>
                  {member.membershipStatus} · الحساب {member.userStatus}
                </small>
              </td>
              <td>{fmtDate(member.lastLoginAt)}</td>
              <td>
                {fmtDate(member.lastSessionAt)}
                <small>
                  {fmtNumber(member.activeSessions)} جلسة refresh نشطة
                </small>
              </td>
              <td>
                <div className="pc-live-row-actions">
                  {member.membershipStatus === "REVOKED" ? (
                    <button
                      type="button"
                      onClick={() => onRestore(member)}
                      disabled={busyKey === `member:${member.membershipId}`}
                    >
                      إعادة العضوية
                    </button>
                  ) : (
                    <button
                      type="button"
                      className="danger"
                      onClick={() => onDisable(member)}
                      disabled={
                        busyKey === `member:${member.membershipId}` ||
                        member.roleCode === "R00_PLATFORM_ADMIN"
                      }
                    >
                      <UserRoundX size={14} /> تعطيل
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={() => onRevoke(member)}
                    disabled={busyKey === `sessions:${member.userId}`}
                  >
                    <RefreshCw size={13} /> تدوير الجلسات
                  </button>
                </div>
              </td>
            </tr>
          ))}
          {rows.length === 0 && (
            <tr>
              <td colSpan={5} className="pc-live-empty-cell">
                لا يوجد مستخدمون مطابقون في الأكاديمية المحددة.
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}

export function ActivityTable({ rows }: { rows: PlatformActivity[] }) {
  return (
    <div className="pc-live-activity-list">
      {rows.map((item) => (
        <article key={item.id}>
          <span className="pc-live-activity-icon">
            <Activity size={15} />
          </span>
          <div>
            <strong>{item.action}</strong>
            <small>
              {item.tenantName ?? "الأكاديمية"} · {item.targetType} · {item.targetId}
              {item.reason ? ` · السبب: ${item.reason}` : ""}
            </small>
            <small>بواسطة {item.actorName ?? "system"}</small>
          </div>
          <time>
            <Clock3 size={13} />
            {fmtDate(item.createdAt)}
          </time>
        </article>
      ))}
      {rows.length === 0 && (
        <p className="pc-live-empty">
          لا توجد أحداث تدقيق مسجلة حتى الآن.
        </p>
      )}
    </div>
  );
}
