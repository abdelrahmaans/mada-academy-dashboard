import { buildExpenseInput, buildInvoiceInput, buildPaymentInput, parseAmountPiastres, SingleFlightGuard } from './finance-mutations';

describe('finance mutation builders', () => {
  it('converts valid pound amounts to integer piastres and rejects invalid values', () => {
    expect(parseAmountPiastres('1500.25')).toBe(150025);
    expect(parseAmountPiastres('0')).toBeNull();
    expect(parseAmountPiastres('1.234')).toBeNull();
  });

  it('requires a reference for non-cash wallet methods and respects remaining balance', () => {
    expect(buildPaymentInput('50', 5000, 'INSTAPAY', '2026-10-08', '', '')).toBeNull();
    expect(buildPaymentInput('60', 5000, 'CASH', '2026-10-08', '', '')).toBeNull();
    expect(buildPaymentInput('50', 5000, 'CASH', '2026-10-08', '', '')).toMatchObject({ amountPiastres: 5000, method: 'CASH' });
  });

  it('builds invoice and expense payloads without accepting client scope fields', () => {
    expect(buildInvoiceInput('student-1', 'اشتراك', '100', '2026-10-20')).toEqual({ studentId: 'student-1', dueDate: '2026-10-20', lines: [{ description: 'اشتراك', amountPiastres: 10000 }] });
    expect(buildExpenseInput('مستلزمات', '25.50', '2026-10-08')).toEqual({ description: 'مستلزمات', category: 'OPERATIONS', amountPiastres: 2550, spentOn: '2026-10-08' });
    expect(JSON.stringify(buildInvoiceInput('student-1', 'اشتراك', '100', '2026-10-20'))).not.toContain('branchId');
  });

  it('allows only one in-flight mutation', () => {
    const guard = new SingleFlightGuard();
    expect(guard.tryAcquire()).toBe(true);
    expect(guard.tryAcquire()).toBe(false);
    guard.release();
    expect(guard.tryAcquire()).toBe(true);
  });
});
