import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { LucideDynamicIcon } from '@lucide/angular';
import { AuthService } from '../../core/auth/auth.service';
import type { AccountType } from '../../core/auth/auth.models';

@Component({
  selector: 'mada-login-page',
  standalone: true,
  imports: [LucideDynamicIcon, ReactiveFormsModule],
  templateUrl: './login-page.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class LoginPage {
  readonly auth = inject(AuthService);
  private readonly router = inject(Router);

  readonly showPassword = signal(false);
  readonly submittedError = signal<string | null>(null);
  readonly form = new FormGroup({
    accountType: new FormControl<AccountType>('staff', { nonNullable: true }),
    phone: new FormControl('', { nonNullable: true, validators: [Validators.required] }),
    password: new FormControl('', { nonNullable: true, validators: [Validators.required] }),
  });

  submit(): void {
    this.submittedError.set(null);
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      this.submittedError.set('أدخل رقم الهاتف وكلمة المرور.');
      return;
    }

    const { phone, password, accountType } = this.form.getRawValue();
    this.auth.login(phone.trim(), password, accountType).subscribe({
      next: () => void this.router.navigateByUrl('/workspace'),
      error: () =>
        this.submittedError.set(this.auth.error() ?? 'رقم الهاتف أو كلمة المرور غير صحيحة.'),
    });
  }
}
