/**
 * FinanceDeskViews - Modular composite export
 * Sub-views and shared building blocks are organized under client/src/components/finance/
 */
export {
  PAYMENT_METHOD_LABELS,
  STATUS_LABEL,
  EXPENSE_LABEL,
  VIEW_TITLES,
  VIEW_COPY,
  money,
  invoiceStatus,
  NavButton,
  Kpi,
  PanelTitle,
} from "./finance/FinanceShared";

export { Overview } from "./finance/FinanceOverviewView";
export { Collections } from "./finance/FinanceCollectionsView";
export { Expenses } from "./finance/FinanceExpensesView";
export { Reports } from "./finance/FinanceReportsView";
export { ShiftsView } from "./finance/FinanceShiftsView";
export { PayrollView } from "./finance/FinancePayrollView";
