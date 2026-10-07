import { TestBed } from '@angular/core/testing';
import { of } from 'rxjs';
import { describe, expect, it, vi } from 'vitest';
import { InstructorApiService } from './instructor-api.service';
import { InstructorDataService } from './instructor-data.service';

describe('InstructorDataService', () => {
  it('loads sessions and students in parallel into one typed workspace model', () => {
    const api = {
      listSessions: vi.fn(() => of([{ id: 'session-1' }])),
      listStudents: vi.fn(() => of([{ id: 'student-1' }])),
    };
    TestBed.configureTestingModule({
      providers: [{ provide: InstructorApiService, useValue: api }, InstructorDataService],
    });

    TestBed.inject(InstructorDataService)
      .loadWorkspace()
      .subscribe((workspace) => {
        expect(workspace.sessions).toEqual([{ id: 'session-1' }]);
        expect(workspace.students).toEqual([{ id: 'student-1' }]);
        expect(api.listSessions).toHaveBeenCalledOnce();
        expect(api.listStudents).toHaveBeenCalledOnce();
      });
  });
});
