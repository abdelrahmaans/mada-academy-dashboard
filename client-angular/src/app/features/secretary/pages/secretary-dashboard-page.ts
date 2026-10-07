import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { finalize } from 'rxjs';
import { CommonModule, CurrencyPipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService } from '../../../core/auth/auth.service';
import { AuthorizationService } from '../../../core/auth/authorization.service';
import { SecretaryApiService } from '../data-access/secretary-api.service';
import type { ConsumerAccountType, ConsumerAccountMatch, SecretaryConsumerLinks, SecretaryEnrollment, SecretaryGroup, SecretaryInvoice, SecretaryStudent } from '../models/secretary.models';
import { MadaCard } from '../../../shared/components/card/mada-card';
import { MadaFeedbackState } from '../../../shared/components/feedback-state/mada-feedback-state';
import { MadaPageHeader } from '../../../shared/components/page-header/mada-page-header';
import { MadaScopeCard } from '../../../shared/components/scope-card/mada-scope-card';
import { MadaSidebar, type MadaSidebarItem, type MadaSidebarSection } from '../../../shared/components/sidebar/mada-sidebar';

@Component({
  selector: 'mada-secretary-dashboard-page',
  standalone: true,
  imports: [CommonModule, FormsModule, CurrencyPipe, MadaCard, MadaFeedbackState, MadaPageHeader, MadaScopeCard, MadaSidebar],
  templateUrl: './secretary-dashboard-page.html',
  styleUrl: './secretary-dashboard-page.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SecretaryDashboardPage {
  readonly auth = inject(AuthService);
  readonly authorization = inject(AuthorizationService);
  private readonly api = inject(SecretaryApiService);
  private readonly router = inject(Router);

  readonly students = signal<readonly SecretaryStudent[]>([]);
  readonly invoices = signal<readonly SecretaryInvoice[]>([]);
  readonly groups = signal<readonly SecretaryGroup[]>([]);
  readonly enrollments = signal<readonly SecretaryEnrollment[]>([]);
  readonly studentsLoading = signal(true);
  readonly invoicesLoading = signal(true);
  readonly groupsLoading = signal(true);
  readonly enrollmentsLoading = signal(false);
  readonly studentsError = signal<string | null>(null);
  readonly invoicesError = signal<string | null>(null);
  readonly groupsError = signal<string | null>(null);
  readonly enrollmentsError = signal<string | null>(null);
  readonly studentQuery = signal('');
  readonly invoiceQuery = signal('');
  readonly selectedStudentId = signal<string | null>(null);
  readonly studentFormMode = signal<'create' | 'edit' | null>(null);
  readonly studentFormName = signal('');
  readonly studentFormDateOfBirth = signal('');
  readonly studentMutationLoading = signal(false);
  readonly enrollmentGroupId = signal('');
  readonly enrollmentPrice = signal(0);
  readonly enrollmentMutationId = signal<string | null>(null);
  readonly links = signal<SecretaryConsumerLinks | null>(null);
  readonly linksLoading = signal(false);
  readonly linksError = signal<string | null>(null);
  readonly accountMatches = signal<readonly ConsumerAccountMatch[]>([]);
  readonly lookupLoading = signal(false);
  readonly lookupError = signal<string | null>(null);
  readonly phone = signal('');
  readonly accountType = signal<ConsumerAccountType>('parent');
  readonly relationship = signal('');
  readonly actionMessage = signal<string | null>(null);
  readonly actionError = signal<string | null>(null);
  readonly invitationLoading = signal(false);
  readonly linkingAccountId = signal<string | null>(null);
  readonly mobileMenuOpen = signal(false);

  readonly branchName = computed(() => {
    const me = this.auth.me();
    return me?.branches?.find((branch) => branch.id === me.branchId)?.name ?? 'الفرع المصرح به';
  });
  readonly displayName = computed(() => this.auth.me()?.user?.displayName?.trim() || 'السكرتير');
  readonly filteredStudents = computed(() => {
    const query = this.studentQuery().trim().toLocaleLowerCase('ar-EG');
    if (!query) return this.students();
    return this.students().filter((student) => student.fullName.toLocaleLowerCase('ar-EG').includes(query));
  });
  readonly filteredInvoices = computed(() => {
    const query = this.invoiceQuery().trim().toLocaleLowerCase('ar-EG');
    if (!query) return this.invoices();
    return this.invoices().filter((invoice) =>
      `${invoice.invoiceNumber} ${invoice.studentName ?? ''}`.toLocaleLowerCase('ar-EG').includes(query),
    );
  });
  readonly totalOutstanding = computed(() => this.invoices().reduce((sum, invoice) => sum + invoice.remainingPiastres, 0));
  readonly canInvite = computed(() => this.authorization.hasRole('R05_SECRETARY'));
  readonly sections: readonly MadaSidebarSection[] = [
    {
      label: 'القائمة الرئيسية',
      ariaLabel: 'القائمة الرئيسية للسكرتارية',
      items: [
        { path: '/secretary', label: 'الرئيسية', icon: 'layout-dashboard', exact: true },
        { path: '/secretary', label: 'الطلاب والروابط', icon: 'users' },
        { path: '/secretary', label: 'الفواتير والتحصيل', icon: 'wallet' },
      ],
    },
  ];
  readonly utilityLinks: readonly MadaSidebarItem[] = [{ actionId: 'logout', label: 'تسجيل الخروج', icon: 'log-out' }];

  constructor() {
    if (this.authorization.hasRole('R05_SECRETARY')) this.load();
    else {
      this.studentsLoading.set(false);
      this.invoicesLoading.set(false);
      this.groupsLoading.set(false);
    }
  }

  load(): void {
    this.loadStudents();
    this.loadInvoices();
    this.loadGroups();
  }

  loadGroups(): void {
    this.groupsLoading.set(true);
    this.groupsError.set(null);
    this.api.listGroups().subscribe({
      next: (items) => this.groups.set(items),
      error: (error: unknown) => this.groupsError.set(toMessage(error, 'تعذر تحميل مجموعات الفرع.')),
      complete: () => this.groupsLoading.set(false),
    });
  }

  loadStudents(): void {
    this.studentsLoading.set(true);
    this.studentsError.set(null);
    this.api.listStudents().subscribe({
      next: (items) => {
        this.students.set(items);
        if (!this.selectedStudentId() && items[0]) this.selectStudent(items[0].id);
        const selected = items.find((item) => item.id === this.selectedStudentId());
        if (selected && this.studentFormMode() !== 'create') this.populateStudentForm(selected);
      },
      error: (error: unknown) => this.studentsError.set(toMessage(error, 'تعذر تحميل طلاب الفرع.')),
      complete: () => this.studentsLoading.set(false),
    });
  }

  loadInvoices(): void {
    this.invoicesLoading.set(true);
    this.invoicesError.set(null);
    this.api.listInvoices().subscribe({
      next: (items) => this.invoices.set(items),
      error: (error: unknown) => this.invoicesError.set(toMessage(error, 'تعذر تحميل فواتير الفرع.')),
      complete: () => this.invoicesLoading.set(false),
    });
  }

  selectStudent(studentId: string): void {
    this.selectedStudentId.set(studentId);
    this.links.set(null);
    this.accountMatches.set([]);
    this.lookupError.set(null);
    this.actionMessage.set(null);
    this.actionError.set(null);
    const student = this.students().find((item) => item.id === studentId);
    if (student) this.populateStudentForm(student);
    this.studentFormMode.set(null);
    this.linksLoading.set(true);
    this.linksError.set(null);
    this.api.getConsumerLinks(studentId).subscribe({
      next: (links) => this.links.set(links),
      error: (error: unknown) => this.linksError.set(toMessage(error, 'تعذر تحميل روابط الحساب لهذا الطالب.')),
      complete: () => this.linksLoading.set(false),
    });
    this.loadEnrollments(studentId);
  }

  private populateStudentForm(student: SecretaryStudent): void {
    this.studentFormName.set(student.fullName);
    this.studentFormDateOfBirth.set(student.dateOfBirth ?? '');
  }

  openCreateStudent(): void {
    this.studentFormMode.set('create');
    this.studentFormName.set('');
    this.studentFormDateOfBirth.set('');
    this.actionError.set(null);
    this.actionMessage.set(null);
  }

  openEditStudent(): void {
    const student = this.students().find((item) => item.id === this.selectedStudentId());
    if (!student) return;
    this.populateStudentForm(student);
    this.studentFormMode.set('edit');
    this.actionError.set(null);
    this.actionMessage.set(null);
  }

  cancelStudentForm(): void { this.studentFormMode.set(null); }

  saveStudent(): void {
    const name = this.studentFormName().trim();
    const dateOfBirth = this.studentFormDateOfBirth().trim() || null;
    if (name.length < 2) { this.actionError.set('اكتب اسم الطالب بالكامل.'); return; }
    const editingId = this.studentFormMode() === 'edit' ? this.selectedStudentId() : null;
    this.studentMutationLoading.set(true);
    this.actionError.set(null);
    const request$ = editingId ? this.api.updateStudent(editingId, name, dateOfBirth) : this.api.createStudent(name, dateOfBirth);
    request$.pipe(finalize(() => this.studentMutationLoading.set(false))).subscribe({
      next: (student) => {
        this.studentFormMode.set(null);
        this.loadStudents();
        this.selectStudent(student.id);
        this.actionMessage.set(editingId ? 'تم تحديث بيانات الطالب.' : 'تم إنشاء الطالب داخل نطاق الفرع.');
      },
      error: (error: unknown) => this.actionError.set(toMessage(error, 'تعذر حفظ بيانات الطالب.')),
    });
  }

  loadEnrollments(studentId: string): void {
    this.enrollmentsLoading.set(true);
    this.enrollmentsError.set(null);
    this.api.listEnrollments(studentId).subscribe({
      next: (items) => this.enrollments.set(items),
      error: (error: unknown) => this.enrollmentsError.set(toMessage(error, 'تعذر تحميل تسجيلات الطالب.')),
      complete: () => this.enrollmentsLoading.set(false),
    });
  }

  enrollSelected(): void {
    const studentId = this.selectedStudentId();
    const groupId = this.enrollmentGroupId();
    if (!studentId || !groupId) { this.actionError.set('اختر الطالب والمجموعة أولًا.'); return; }
    this.enrollmentMutationId.set('create');
    this.actionError.set(null);
    this.api.enrollStudent(studentId, groupId, Math.max(0, Number(this.enrollmentPrice()))).pipe(finalize(() => this.enrollmentMutationId.set(null))).subscribe({
      next: () => { this.actionMessage.set('تم تسجيل الطالب في المجموعة.'); this.enrollmentGroupId.set(''); this.loadStudents(); this.loadEnrollments(studentId); this.loadGroups(); },
      error: (error: unknown) => this.actionError.set(toMessage(error, 'تعذر إضافة التسجيل.')),
    });
  }

  cancelEnrollment(enrollment: SecretaryEnrollment): void {
    const studentId = this.selectedStudentId();
    if (!studentId || enrollment.status !== 'ACTIVE') return;
    this.enrollmentMutationId.set(enrollment.id);
    this.actionError.set(null);
    this.api.cancelEnrollment(studentId, enrollment.id).pipe(finalize(() => this.enrollmentMutationId.set(null))).subscribe({
      next: () => { this.actionMessage.set('تم إلغاء التسجيل مع الاحتفاظ بسجل العملية.'); this.loadStudents(); this.loadEnrollments(studentId); this.loadGroups(); },
      error: (error: unknown) => this.actionError.set(toMessage(error, 'تعذر إلغاء التسجيل.')),
    });
  }

  lookupAccounts(): void {
    const studentId = this.selectedStudentId();
    const phone = this.phone().trim();
    if (!studentId || !phone) {
      this.lookupError.set('اختر طالبًا واكتب رقم الهاتف أولًا.');
      return;
    }
    this.lookupLoading.set(true);
    this.lookupError.set(null);
    this.accountMatches.set([]);
    this.api.searchConsumerAccounts(studentId, phone, this.accountType()).subscribe({
      next: (matches) => this.accountMatches.set(matches),
      error: (error: unknown) => this.lookupError.set(toMessage(error, 'تعذر البحث عن الحساب.')),
      complete: () => this.lookupLoading.set(false),
    });
  }

  linkAccount(match: ConsumerAccountMatch): void {
    const studentId = this.selectedStudentId();
    if (!studentId) return;
    this.linkingAccountId.set(match.id);
    this.actionError.set(null);
    const request$ = match.accountType === 'parent'
      ? this.api.linkGuardian(studentId, match.id, this.relationship().trim() || 'ولي أمر')
      : this.api.linkStudentAccount(studentId, match.id);
    request$.pipe(finalize(() => this.linkingAccountId.set(null))).subscribe({
      next: () => {
        this.actionMessage.set('تم ربط الحساب بنجاح داخل نطاق الفرع.');
        this.accountMatches.set([]);
        this.selectStudent(studentId);
      },
      error: (error: unknown) => this.actionError.set(toMessage(error, 'تعذر ربط الحساب.')),
    });
  }

  inviteConsumer(): void {
    const studentId = this.selectedStudentId();
    const phone = this.phone().trim();
    if (!studentId || !phone) {
      this.actionError.set('اختر طالبًا واكتب رقم الهاتف أولًا.');
      return;
    }
    if (this.accountType() === 'parent' && !this.relationship().trim()) {
      this.actionError.set('اكتب صلة القرابة لدعوة ولي الأمر.');
      return;
    }
    this.invitationLoading.set(true);
    this.actionError.set(null);
    this.actionMessage.set(null);
    this.api.createConsumerInvitation(studentId, phone, this.accountType(), this.relationship()).pipe(finalize(() => this.invitationLoading.set(false))).subscribe({
      next: (delivery) => {
        this.actionMessage.set(`تم إنشاء الدعوة وإرسالها إلى ${delivery.maskedPhone}. لا يتم عرض رمز التحقق في هذه الواجهة.`);
      },
      error: (error: unknown) => this.actionError.set(toMessage(error, 'تعذر إنشاء دعوة consumer.')),
    });
  }

  handleSidebarAction(item: MadaSidebarItem): void {
    if ('actionId' in item && item.actionId === 'logout') {
      this.auth.logout().subscribe(() => void this.router.navigateByUrl('/login'));
    }
  }

  closeMenu(): void { this.mobileMenuOpen.set(false); }
  openMenu(): void { this.mobileMenuOpen.set(true); }
  go(path: string): void { this.closeMenu(); void this.router.navigateByUrl(path); }
}

function toMessage(error: unknown, fallback: string): string {
  if (typeof error === 'object' && error !== null && 'message' in error && typeof error.message === 'string') return error.message;
  return fallback;
}
