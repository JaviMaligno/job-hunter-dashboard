# Dependency security update (23 October 2026)

Use Node24.22.1 and `npm ci --ignore-scripts` with the committed npm lock.
Next/eslint-config-next15.5.28 and next-auth5 beta32 use corrected supported
parents. The scoped Next override uses patched PostCSS8 without forcing a major.
Application authentication configuration, routes and data operations are unchanged.

Frozen installation, TypeScript and lint pass; lint retains one existing image
optimization warning. The offline authentication contract exercises the real
Auth.js provider handler and existing application credentials/JWT/session
callbacks using synthetic users and a mocked backend. It never exchanges OAuth
tokens or calls the real backend. Next builds run only in Ready CI, not locally.

Fresh public OSV queries still match braces3.0.3 (GHSA-vfj7-8cjw-p6xm), with no
published fixed release, and selector-parser6.1.5 (GHSA-rj75-hqrm-r3gf).
The latter is a database discrepancy: the maintainer's
[6.1.5 release](https://raw.githubusercontent.com/postcss/postcss-selector-parser/6.1.5/CHANGELOG.md)
backports this CVE's linear-time fix to the supported security-only6 branch.
The published tarball matches the lock integrity and contains the fix. Keep the
raw OSV finding visible; no parser major, dependency, route or runtime changes
are needed to apply a fix already present in6.1.5.
This is bounded advisory coverage, not a universal vulnerability-free claim.

No merge, manual deployment, real account login or provider operation is part of
this source patch. The pre-existing Keepalive workflow remains disabled.
