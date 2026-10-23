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

Fresh public OSV name/version queries still match unfixed braces3 and
postcss-selector-parser6, whose correction requires a separately verified parent
major migration. No incompatible transitive override hides these findings.
This is bounded advisory coverage, not a universal vulnerability-free claim.

No merge, manual deployment, real account login or provider operation is part of
this source patch. The pre-existing Keepalive workflow remains disabled.
