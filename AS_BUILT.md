# As-Built — free-llm-router

Record date: 2026-10-01 (America/New_York)
Change: branch `chore/remove-stray-windows-path-files` → `master`

Only verified facts are recorded. Open items are listed separately.

## 1. Changes

| File | Change |
|---|---|
| 4 files named `C\uf03aUsersJASONfree-llm-routersrc*.ts` | Removed from the tip of `master` (Windows path written as a file name; exposed a local username) |
| `.gitignore` | `.env.local` rule widened to `.env.*`; `.env.example` explicitly allowed |
| `.env.example` | Header note added; values were already placeholders (`your_..._here`) |
| `.github/workflows/secret-scan.yml` | New. gitleaks 8.21.2 (SHA-256 verified) scans full history on every push/PR |
| `.pre-commit-config.yaml` | New. gitleaks pre-commit hook (v8.21.2) |

### What the removed files contained (compared with `src/` before removal)
- `...srcprovidersopenrouter.ts` — identical to `src/providers/openrouter.ts`.
- `...srccatalog.ts` — `src/catalog.ts` plus 38 lines of OpenRouter catalog entries that are **not** in `src/catalog.ts`.
- `...srcindex.ts` — exports for Ollama, Together AI, Hugging Face, Replicate providers and `MODEL_CATALOG` not in `src/index.ts`.
- `...srcclientfree-llm-router.ts` — an alternative client with different default aliases.

None of these files were compiled (`tsc` compiles `src/` only). Their content remains in git history (commits `b63ff55`, `b117079`).

## 2. Verification (2026-10-01)

| Check | Result |
|---|---|
| `tsc --noEmit` after removal | Clean |
| `vitest run` | 39 passed, 2 failed — same 2 failures as before this change (`tests/unit/resilience.test.ts`: ExponentialBackoff "calculates increasing delays"; CircuitBreaker "closes after successful probe") |
| gitleaks full history | No leaks |
| `git check-ignore .env.production` | Ignored |

## 3. Repository security settings (verified via GitHub API, 2026-10-01)

| Setting | State |
|---|---|
| Visibility | Public |
| Secret scanning / push protection | Enabled |
| Dependabot vulnerability alerts | Enabled |
| Dependabot security updates | Enabled, not paused |
| Branch protection on `master` | Not configured |

## 4. Open items

- The username remains in git history and in the two existing commits' file lists. Only deleting or rewriting the repository removes it.
- 2 failing resilience tests (retry backoff, circuit breaker recovery) — not fixed.
- `npm audit`: 11 dev-dependency advisories (2 critical in `vitest`/`@vitest/ui`), 0 in production dependencies (scan of 2026-10-01).
- `src/providers/openrouter.ts` is registered, but `src/catalog.ts` has no OpenRouter models.
- Owner decision pending on whether this repository is kept.
