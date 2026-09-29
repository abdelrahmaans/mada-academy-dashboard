export type RoleCode = 'R00' | 'R01' | 'R02' | 'R03' | 'R04' | 'R05' | 'R06' | 'R07' | 'R08' | 'R09';
export type IdentityKind = 'staff' | 'consumer';
export type ScopeLevel = 'platform' | 'tenant' | 'branch' | 'team' | 'assigned' | 'family' | 'self';

export interface RoleNavigationItem { path: string; label: string; purpose: string; icon: string; }
export interface RoleDefinition {
  code: RoleCode; label: string; identityKind: IdentityKind; scopeLevel: ScopeLevel;
  defaultScopeLabel: string; homePath: string; navigation: readonly RoleNavigationItem[];
}

export const ROLE_DEFINITIONS: readonly RoleDefinition[] = [
  { code: 'R00', label: 'أدمن منصة مدى', identityKind: 'staff', scopeLevel: 'platform', defaultScopeLabel: 'كل الأكاديميات · metadata فقط', homePath: '/platform-console', navigation: [{ path: '/platform-console', label: 'مركز المنصة', purpose: 'tenants, plans, support', icon: '⌘' }] },
  { code: 'R01', label: 'مسؤول الأكاديمية', identityKind: 'staff', scopeLevel: 'tenant', defaultScopeLabel: 'كل فروع الأكاديمية', homePath: '/executive-dashboard', navigation: [{ path: '/executive-dashboard', label: 'اللوحة التنفيذية', purpose: 'academy rollup and decisions', icon: '▦' }, { path: '/academy-owner', label: 'إدارة الأكاديمية', purpose: 'branches, team, tickets', icon: '⌂' }, { path: '/reports', label: 'التقارير', purpose: 'scoped reports and export', icon: '▤' }] },
  { code: 'R02', label: 'مدير الفرع', identityKind: 'staff', scopeLevel: 'branch', defaultScopeLabel: 'فرع واحد', homePath: '/', navigation: [{ path: '/', label: 'ملخص التشغيل', purpose: 'daily branch decisions', icon: '⌂' }, { path: '/branch-operations', label: 'تشغيل الفرع', purpose: 'teams, schedule, conflicts', icon: '⌁' }, { path: '/classes', label: 'الحصص والكورسات', purpose: 'branch learning operations', icon: '▥' }, { path: '/approvals', label: 'الموافقات', purpose: 'branch decisions', icon: '✓' }, { path: '/reports', label: 'التقارير', purpose: 'branch reports', icon: '▤' }] },
  { code: 'R03', label: 'رئيس المدربين', identityKind: 'staff', scopeLevel: 'team', defaultScopeLabel: 'فريق المدربين والجلسات التابعة', homePath: '/head-instructors', navigation: [{ path: '/head-instructors', label: 'ملخص الفريق', purpose: 'quality queue and team overview', icon: '◎' }, { path: '/academic-programs', label: 'البرامج الأكاديمية', purpose: 'curriculum and progress review', icon: '▥' }, { path: '/schedule', label: 'جدول الفريق', purpose: 'sessions in supervision scope', icon: '◷' }] },
  { code: 'R04', label: 'المدرب', identityKind: 'staff', scopeLevel: 'assigned', defaultScopeLabel: 'الجلسات والطلاب المسندون', homePath: '/instructor-desk', navigation: [{ path: '/instructor-desk', label: 'مكتب المدرب', purpose: 'today, attendance, evaluation', icon: '◉' }, { path: '/instructor', label: 'مساحتي الأكاديمية', purpose: 'assigned students and progress', icon: '♧' }] },
  { code: 'R05', label: 'السكرتارية', identityKind: 'staff', scopeLevel: 'branch', defaultScopeLabel: 'التسجيلات والـleads داخل الفرع', homePath: '/secretary-desk', navigation: [{ path: '/secretary-desk', label: 'مكتب الخدمة', purpose: 'lead to enrollment', icon: '✦' }, { path: '/students', label: 'الطلاب', purpose: 'branch operational records', icon: '♙' }, { path: '/schedule', label: 'المجموعات والمواعيد', purpose: 'enrollment availability', icon: '◷' }] },
  { code: 'R06', label: 'المحاسب', identityKind: 'staff', scopeLevel: 'branch', defaultScopeLabel: 'المالية داخل الفروع المصرح بها', homePath: '/finance-desk', navigation: [{ path: '/finance-desk', label: 'المكتب المالي', purpose: 'collections, expenses, reports', icon: '₤' }, { path: '/finance', label: 'الماليات', purpose: 'invoice and correction workflows', icon: '◈' }, { path: '/approvals', label: 'الموافقات', purpose: 'finance decisions', icon: '✓' }] },
  { code: 'R07', label: 'مسؤول التسويق', identityKind: 'staff', scopeLevel: 'tenant', defaultScopeLabel: 'المحتوى والحملات والـmarketing leads', homePath: '/marketing-desk', navigation: [{ path: '/marketing-desk', label: 'مكتب التسويق', purpose: 'campaigns, content, leads', icon: '✧' }] },
  { code: 'R08', label: 'ولي الأمر', identityKind: 'consumer', scopeLevel: 'family', defaultScopeLabel: 'الأطفال المرتبطون فقط', homePath: '/family-portal', navigation: [{ path: '/family-portal', label: 'بوابة الأسرة', purpose: 'children, attendance, evaluations, invoices', icon: '♡' }] },
  { code: 'R09', label: 'الطالب', identityKind: 'consumer', scopeLevel: 'self', defaultScopeLabel: 'حساب الطالب فقط', homePath: '/student-portal', navigation: [{ path: '/student-portal', label: 'مساحة الطالب', purpose: 'learning, sessions, achievements', icon: '✎' }] },
];

export function getRoleDefinition(code: RoleCode): RoleDefinition {
  return ROLE_DEFINITIONS.find((role) => role.code === code) ?? ROLE_DEFINITIONS[2];
}
