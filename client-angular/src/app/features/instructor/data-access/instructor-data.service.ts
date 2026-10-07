import { Injectable, inject } from '@angular/core';
import { forkJoin, map, type Observable } from 'rxjs';
import { InstructorApiService } from './instructor-api.service';
import type { InstructorWorkspaceData } from '../models/instructor.models';

@Injectable({ providedIn: 'root' })
export class InstructorDataService {
  private readonly api = inject(InstructorApiService);

  loadWorkspace(from?: string, to?: string): Observable<InstructorWorkspaceData> {
    return forkJoin({
      sessions: this.api.listSessions(from, to),
      students: this.api.listStudents(),
    }).pipe(
      map(({ sessions, students }) => ({
        sessions,
        students,
        attendanceBySession: {},
      })),
    );
  }

  loadAttendance(sessionId: string) {
    return this.api.getAttendance(sessionId);
  }
}
