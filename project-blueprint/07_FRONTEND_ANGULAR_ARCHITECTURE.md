# Frontend Angular Architecture & UI Specifications
**Document ID:** `PLN-07-FRONTEND-ANGULAR`  
**System Codename:** `Project Apex` (Temporary Working Title)  
**Status:** Canonical Reference Blueprint  
**Language:** English  

---

## 1. Modern Angular Architecture (v19/20 Standalone & Signals)

The frontend client is engineered using the latest Angular enterprise paradigms:
* **100% Standalone Components:** `NgModule` is completely eliminated.
* **Signals-First Reactivity:** Components use Angular Signals (`signal`, `computed`, `effect`) for fine-grained DOM updates without unnecessary zone dirty-checks.
* **Data-Driven Dynamic Shell:** A single, responsive application shell adapts dynamically to whichever role logs in.

```text
src/app/
├── core/                              # Singletons & Cross-Cutting Concerns
│   ├── auth/                          # AuthService, TokenStorage, UserSessionSignal
│   ├── guards/                        # AuthGuard, RoleGuard, PermissionGuard
│   ├── interceptors/                  # AuthInterceptor, TenantInterceptor, ErrorInterceptor
│   └── models/                        # Core DTOs, Enums, ApiResponse<T>
│
├── shared/                            # Reusable UI Primitives & Utilities
│   ├── components/                    # Smart UI Components
│   │   ├── dynamic-sidebar/           # Permission-driven role navigation
│   │   ├── data-table/                # Server-paginated, sortable data grid
│   │   ├── decision-dialog/           # Universal approval/rejection modal
│   │   ├── workflow-stepper/          # Multi-stage lifecycle visualization
│   │   ├── metrics-counter/           # Dashboard KPI stat card
│   │   └── notification-center/       # In-app instant notification drawer
│   ├── directives/                    # HasPermissionDirective, RlsScopeDirective
│   └── pipes/                         # CurrencyFormatPipe, ArabicDatePipe
│
└── features/                          # Lazy-Loaded Functional Domains
    ├── platform-admin/                # R00 Console & Academy Bootstrap
    ├── executive/                     # R01 Academy Owner Cockpit & Roles Matrix
    ├── branch-operations/             # R02 Manager Daily Hub & Substitutions
    ├── head-instructors/              # R03 Academic Supervision & Review Queue
    ├── instructor-desk/               # R04 One-Tap Attendance & Rubrics
    ├── secretary-desk/                # R05 Leads Kanban, Fast Enrollment & Shifts
    ├── finance-desk/                  # R06 Invoices, Shift Audits, Payroll Wizard
    ├── marketing-desk/                # R07 Campaigns & Content Planner
    ├── family-portal/                 # R08 Consumer Parent Portal (Children Switcher)
    └── student-portal/                # R09 Student Learner Portal & Badges
```

---

## 2. Core HTTP Interceptors Chain

Angular's modern functional interceptor pipeline guarantees authenticated, tenant-isolated HTTP requests:

```typescript
// 1. Auth & Refresh Interceptor
export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const authService = inject(AuthService);
  const token = authService.accessToken();

  let cloned = req;
  if (token) {
    cloned = req.clone({
      setHeaders: { Authorization: `Bearer ${token}` }
    });
  }

  return next(cloned).pipe(
    catchError((error: HttpErrorResponse) => {
      if (error.status === 401 && !req.url.includes('/auth/')) {
        return authService.handleTokenRefresh().pipe(
          switchMap((newToken) => next(req.clone({
            setHeaders: { Authorization: `Bearer ${newToken}` }
          })))
        );
      }
      return throwError(() => error);
    })
  );
};

// 2. Tenant & Branch Context Interceptor
export const tenantInterceptor: HttpInterceptorFn = (req, next) => {
  const session = inject(UserSessionService);
  const tenantId = session.currentTenantId();
  const branchId = session.currentBranchId();

  let headers = req.headers;
  if (tenantId) headers = headers.set('X-Tenant-Id', tenantId);
  if (branchId) headers = headers.set('X-Branch-Id', branchId);

  return next(req.clone({ headers }));
};

// 3. RFC-7807 Global Error & Toast Interceptor
export const errorInterceptor: HttpInterceptorFn = (req, next) => {
  const toast = inject(ToastService);

  return next(req).pipe(
    catchError((err: HttpErrorResponse) => {
      const problem = err.error as ProblemDetails;
      const message = problem?.detail || problem?.title || 'An unexpected error occurred.';
      toast.error(message);
      return throwError(() => err);
    })
  );
};
```

---

## 3. Dynamic Reusable Sidebar (`<app-dynamic-sidebar>`)

The sidebar is not hardcoded per role. Instead, it is rendered from a reactive navigation tree computed from the user's active permissions:

```typescript
@Component({
  selector: 'app-dynamic-sidebar',
  standalone: true,
  imports: [CommonModule, RouterLink, RouterLinkActive, LucideAngularModule],
  templateUrl: './dynamic-sidebar.component.html'
})
export class DynamicSidebarComponent {
  private readonly permissionService = inject(PermissionService);
  
  // Computed Signal: Updates automatically if Admin updates permissions at runtime!
  readonly navItems = computed(() => {
    return MASTER_NAV_CONFIG.filter(item => 
      !item.requiredPermission || this.permissionService.hasPermission(item.requiredPermission)
    );
  });
}
```

### Administrative Dynamic Control:
When the Academy Owner changes a role's permissions in the `/academy-roles` manager:
1. The backend updates the `TenantRoleOverride` record.
2. An update signal is delivered (or refreshed on next API call).
3. The Angular `PermissionService` updates its internal state signal.
4. The `DynamicSidebarComponent` and all templates using `*appHasPermission="'finance.invoices.create'"` instantly hide or reveal the corresponding UI items without needing a page reload.

---

## 4. Universal Reusable UI Components

### 4.1 Reusable Data Table (`<app-data-table>`)
* **Features:** Server-side pagination, multi-column sorting, debounce search input, row selection, export to CSV/Excel, and empty/skeleton loading states.

### 4.2 Reusable Decision Dialog (`<app-decision-dialog>`)
* **Usage:** Used across all approval workflows (Expense Approval, Student Freeze, Attendance Correction, Invoice Voiding).
* **Guarantees:** Always enforces a mandatory `reason` text area with validation, logs user IP/identity, and displays previous decision timeline.

### 4.3 Workflow Stepper (`<app-workflow-stepper>`)
* **Usage:** Visually renders the state machine progression (e.g., Lead $\rightarrow$ Trial $\rightarrow$ Enrolled; or Scheduled $\rightarrow$ In Progress $\rightarrow$ Completed).

