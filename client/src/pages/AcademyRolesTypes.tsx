import React from "react";
import { Users } from "lucide-react";
import type { AcademyRoleDefinition } from "@/lib/apiClient";

export type RoleTab = "members" | "matrix";

export interface NewMemberForm {
  fullName: string;
  email: string;
  phone: string;
  password: string;
  roleCode: string;
  branchId: string;
}

export const roleLabel = (roles: AcademyRoleDefinition[], code: string): string =>
  roles.find((role) => role.code === code)?.label ?? code;

export const isBranchRole = (roles: AcademyRoleDefinition[], code: string): boolean =>
  roles.find((role) => role.code === code)?.scopeLevel === "BRANCH";

export function PanelTitle({
  icon,
  title,
  note,
}: {
  icon: React.ReactNode;
  title: string;
  note: string;
}) {
  return (
    <div className="academy-roles-panel-title">
      <div>
        <span>{icon}</span>
        <h2>{title}</h2>
      </div>
      <small>{note}</small>
    </div>
  );
}

export function Metric({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode;
  label: string;
  value: number;
}) {
  return (
    <div className="academy-role-metric">
      <span>{icon}</span>
      <div>
        <strong>{value}</strong>
        <small>{label}</small>
      </div>
    </div>
  );
}

export const PERMISSION_ARABIC_LABELS: Record<string, string> = {
  "students.read": "عرض الطلاب والتسجيلات",
  "students.create": "إضافة وتعديل الطلاب",
  "sessions.read": "عرض جميع جلسات الفرع",
  "sessions.create": "إنشاء وجدولة الجلسات",
  "sessions.assigned.read": "عرض الجلسات المسندة فقط",
  "attendance.read": "عرض كشوف الحضور",
  "attendance.write": "تسجيل الحضور والغياب",
  "evaluations.write": "رصد التقييمات",
  "evaluations.review": "مراجعة واعتماد التقييمات",
  "finance.read": "الاطلاع المالي العام",
  "finance.summary.read": "ملخص مالي سريع",
  "invoices.read": "عرض الفواتير والمستحقات",
  "invoices.create": "إنشاء الفواتير والخصومات",
  "payments.create": "تسجيل سندات القبض",
  "payments.evidence.read": "فحص إيصالات الدفع",
  "payments.evidence.write": "تأكيد إيصالات الدفع",
  "finance.expenses.read": "عرض المصروفات التشغيلية",
  "finance.expenses.write": "تسجيل طلب صرف",
  "finance.expenses.approve": "اعتماد وصرف المصروفات",
  "marketing.read": "عرض الليدز والحملات",
  "marketing.write": "إدارة التسويق والمحتوى",
  "academy.read": "عرض بيانات الأكاديمية",
  "academy.update": "تعديل إعدادات الأكاديمية",
  "branch.read": "عرض الفروع",
  "branch.create": "إنشاء الفروع",
  "classrooms.manage": "إدارة القاعات والمقاعد",
  "staff.read": "عرض فريق العمل",
  "staff.invite": "إضافة أعضاء الفريق",
  "roles.read": "عرض الصلاحيات",
  "roles.manage": "تخصيص الصلاحيات",
  "reports.read": "التقارير التنفيذية",
};

export function Empty({ text }: { text: string }) {
  return (
    <div className="academy-roles-empty">
      <Users size={22} />
      <span>{text}</span>
    </div>
  );
}
