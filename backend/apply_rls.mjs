/**
 * Deliberately disabled.
 *
 * This file previously sent an administrative credential to Supabase and
 * installed unrestricted RLS policies. RLS changes must be peer-reviewed and
 * applied manually through the database migration/review process documented in
 * SECURITY.md. It must not be used as an automated deployment script.
 */
console.error(
  'RLS automation is disabled. Follow backend/SECURITY.md to rotate credentials and review/apply tenant-scoped policies.',
);
process.exitCode = 1;
