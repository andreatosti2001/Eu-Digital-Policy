# `.control-room/` — the private control plane

The human observation, review and governance interface for the agent system.
**`docs/CONTROL-ROOM.md` is the reference document**; this is the map of the directory.

```
node .control-room/cli.mjs check       # configuration, registry, and every refusal
node .control-room/cli.mjs provision --subject "you@example.org" --role administrator --by "your name"
node .control-room/cli.mjs serve       # http://127.0.0.1:7802
node --test .control-room/selftest.mjs
```

## Why the leading dot

Deployment is GitHub Pages serving `main` at the repository root with no `_config.yml`, no
`.nojekyll` and no exclude list, so `agent/`, `docs/` and `tools/` are published beside
`index.html`. The one exclusion that exists is Jekyll's documented default: a path whose
segments begin with `.` or `_` is not served. It is why `.agents/` has never appeared in the
published surface and `agent/` always has, and `agent/implement/boundary.mjs` calls it "a real
boundary, and it is the only one this repository has."

**It is not a hidden route, and it is not what protects the data.** Every privileged request
authenticates and then authorizes, server-side, whether or not anybody finds the server.
Protocol §10 is explicit that a hidden route, a hidden link, `robots.txt`, a frontend check and
an unlisted page are not security mechanisms, and none of them is relied on here.

## The files

| | |
|---|---|
| `config.mjs` | The environment contract, and every refusal that runs before the first request. A default is not a control, so each dangerous combination is a refusal to start. |
| `identity.mjs` | The operator registry, roles and provisioning. Contains no account: there is no default administrator, and the server refuses to start until somebody creates one. |
| `authn.mjs` | Sessions, the OIDC provider (authorization code + PKCE, full `id_token` verification), and the development-only local provider. |
| `authz.mjs` | Deny-by-default permissions. The permission needed to approve is computed from the proposal's own autonomy class. |
| `audit.mjs` | The hash-chained approval trail. Who decided what, when, against which exact version, on which evidence. |
| `decide.mjs` | The one place a human decision enters through HTTP. Seven server-side gates; writes one line to the decision ledger and publishes nothing. |
| `views.mjs` | Live system · review queue · website health, assembled server-side. |
| `server.mjs` | `node:http`. The route table is data, so the suite can assert what is absent. |
| `boundary.mjs` | Is the private control plane actually outside the public website? Asked of the real tree. |
| `cli.mjs` | What a person runs on the machine. Provisioning lives here so the Control Room cannot grant itself a role. |
| `ui/` | The client. It renders what the server assembled and decides nothing. |
| `state/` | Private, git-ignored, empty in every checkout. See its own README. |
| `config.example.env` | Placeholders only. The only configuration file in the repository. |
| `selftest.mjs` | The sixteen proofs SESSION 21 requires, against a running server. |

## What it cannot do

Approve, reject, request changes — and nothing else. No deploy, no delete, no apply, no
publish, no shell, no arbitrary write; `server.mjs` imports nothing that could write to the
tree, and `selftest.mjs` asserts it. Approving records an authorization in
`agent/implement/decisions/decisions.jsonl` and changes nothing else; the Implementation Agent
re-derives that authorization independently before anything reaches the site.

`docs/CONTROL-ROOM.md` §11 lists what none of this proves. Read it before quoting any of it.
