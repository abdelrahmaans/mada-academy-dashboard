-- Private evidence storage for payment and expense attachments.
-- The backend uses the Supabase service-role key server-side; clients never access this bucket directly.
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'private-evidence',
  'private-evidence',
  false,
  10485760,
  array['application/pdf', 'image/jpeg', 'image/png']::text[]
)
on conflict (id) do update
set name = excluded.name,
    public = false,
    file_size_limit = excluded.file_size_limit,
    allowed_mime_types = excluded.allowed_mime_types;
