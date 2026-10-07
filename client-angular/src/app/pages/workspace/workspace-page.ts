import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { Router } from '@angular/router';
import { MadaButton } from '../../shared/components/button/mada-button';
import { MadaCard } from '../../shared/components/card/mada-card';
import { AuthService } from '../../core/auth/auth.service';

@Component({
  selector: 'mada-workspace-page',
  standalone: true,
  imports: [MadaButton, MadaCard],
  templateUrl: './workspace-page.html',
  styleUrl: './workspace-page.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class WorkspacePage {
  readonly auth = inject(AuthService);
  private readonly router = inject(Router);

  logout(): void {
    this.auth.logout().subscribe(() => void this.router.navigateByUrl('/login'));
  }
}
