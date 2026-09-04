# `.control-room/state/` — private, and empty in every checkout

Nothing in this directory is in the repository. It holds:

| | |
|---|---|
| `operators.json` | who may reach the Control Room, their roles, and — under the development provider only — a scrypt hash of their password. |
| `sessions/` | live sessions, keyed by the SHA-256 of a token that is never itself stored. |
| `audit/` | the approval trail: who decided what, when, against which exact version, and on which evidence. Hash-chained. |
| `reviews/` | change requests left on proposals. Review annotations, not approval states. |
| `pending/` | in-flight OIDC logins: state, nonce and PKCE verifier, for the length of one login. |

`.gitignore` keeps all of it out of git, and the leading dot in `.control-room`
keeps the whole directory out of what GitHub Pages serves. **Neither is a
security control on its own**, and nothing here relies on one being: every
privileged request to the server is authenticated and then authorized, whether
or not anybody ever finds it.

This file is the only tracked thing under here, so that the reasoning is in the
repository even though nothing it describes is.

Created by `node .control-room/cli.mjs provision`. There is no default account:
the server refuses to start until somebody creates the first administrator.
See `docs/CONTROL-ROOM.md`.
