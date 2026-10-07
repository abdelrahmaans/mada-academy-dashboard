# Feature areas

Add a domain folder only when implementing a reviewed vertical slice. Suggested shape: `feature-name/{data-access,models,pages,ui}`; keep components standalone and focused. Route role surfaces to authorized workflows, but do not duplicate business authorization by role in the browser.

Candidate areas: `identity`, `academy`, `operations`, `scheduling`, `evaluations`, `finance`, `consumers`, `marketing`. Marketing must remain visibly Preview until the backend has a complete live API. Guardian and student routes must consume only linked records; evaluations are consumer-visible only after publication.
