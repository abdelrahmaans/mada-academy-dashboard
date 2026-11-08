# Project Identity

## Working identity

| Field | Temporary value | Rule |
|---|---|---|
| Working product name | Academy Ops Platform | Internal placeholder only |
| Short code | `aop` | May be replaced after naming approval |
| Product category | Academy Management ERP / Academy Operating System | Stable category, not a brand name |
| Default language | English for engineering; Arabic-first product UX | Technical docs are English; UI must support Arabic RTL |
| Logo | Not selected | Do not create a final logo from the temporary name |
| Domain | Not selected | No production domain may be tied to the placeholder |
| Package namespace | `AcademyOps` | Temporary namespace; change only through an approved migration |

## Name replacement procedure

When the final name is approved:

1. Add a decision record with the approved name, spelling, Arabic transliteration, owner, date, and legal/domain checks.
2. Update this file first.
3. Update repository name, solution name, namespaces, package names, API title, OpenAPI metadata, environment variables, Docker image names, deployment identifiers, telemetry service names, and documentation links.
4. Add a compatibility period for old API headers, storage prefixes, migration names, and deep links where necessary.
5. Never rename database tables or storage paths only for aesthetics if it would risk data loss; use an explicit migration.
6. Update the frontend brand configuration from one source of truth.
7. Replace the placeholder logo only after the brand decision is approved.
8. Run a repository-wide search for the old temporary name and record intentional historical matches.

## Logo rules

The logo is a product asset, not a developer placeholder. Until approved:

- Use a neutral temporary wordmark or text-only placeholder.
- Do not encode the temporary name into favicon metadata that will be difficult to replace.
- Keep logo usage behind a `BrandConfig`/design-token boundary.
- Store approved logo variants separately: light, dark, monochrome, small mark, and app icon.
- Provide minimum size, clear space, contrast, RTL/Arabic lockup, and usage restrictions.
- The logo must not be used to imply that the temporary name is final.

## Brand configuration boundary

```text
BrandConfig
├── productName
├── shortName
├── logoMark
├── logoWordmark
├── supportEmail
├── legalName
├── primaryDomain
├── privacyUrl
└── termsUrl
```

The frontend reads brand configuration from one typed source. Pages must not hard-code the brand name or logo path.
