import { Component, inject } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { RoleSessionService } from './core/role-session.service';
import { SidebarComponent } from './layout/sidebar/sidebar.component';

@Component({
  selector: 'mada-root',
  standalone: true,
  imports: [RouterOutlet, SidebarComponent],
  templateUrl: './app.component.html',
  styleUrl: './app.component.scss',
})
export class AppComponent {
  readonly roleSession = inject(RoleSessionService);
}
