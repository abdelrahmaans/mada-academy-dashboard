import type { FinancePaymentInput } from '../models/finance.models';

const MAX_AMOUNT_PIASTRES = 2_147_483_647;

export class SingleFlightGuard {
  private inFlight = false;
  tryAcquire(): boolean {
    if (this.inFlight) return false;
    this.inFlight = true;
    return true;
  }
  release(): void { this.inFlight = false; }
}

export function parseAmountPiastres(value: string): number | null {
  const normalized = value.trim();
  if (!/^(?:\d+(?:\.\d{0,2})?|\.\d{1,2})$/.test(normalized)) return null;
  const [whole = '0', fraction = ''] = normalized.split('.');
  const amount = Number(whole) * 100 + Number(fraction.padEnd(2, '0'));
  return Number.isSafeInteger(amount) && amount > 0 && amount <= MAX_AMOUNT_PIASTRES ? amount : null;
}

export function buildPaymentInput(amount: string, remainingPiastres: number, method: FinancePaymentInput['method'], receivedOn: string, externalReference: string, note: string): FinancePaymentInput | null {
  const amountPiastres = parseAmountPiastres(amount);
  const reference = externalReference.trim();
  if (amountPiastres === null || amountPiastres > remainingPiastres || !receivedOn) return null;
  if ((method === 'INSTAPAY' || method === 'VODAFONE_CASH') && !reference) return null;
  return { amountPiastres, method, receivedOn, ...(reference ? { externalReference: reference } : {}), ...(note.trim() ? { note: note.trim() } : {}) };
}

export function buildInvoiceInput(studentId: string, description: string, amount: string, dueDate: string) {
  const amountPiastres = parseAmountPiastres(amount);
  if (!studentId || !description.trim() || amountPiastres === null || !dueDate) return null;
  return { studentId, dueDate, lines: [{ description: description.trim(), amountPiastres }] };
}

export function buildExpenseInput(description: string, amount: string, spentOn: string) {
  const amountPiastres = parseAmountPiastres(amount);
  if (!description.trim() || amountPiastres === null) return null;
  return { description: description.trim(), category: 'OPERATIONS', amountPiastres, ...(spentOn ? { spentOn } : {}) };
}
