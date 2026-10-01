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
- Owner decision 2026-10-01: keep and fix — see section 5.

## 5. Fix release — 2026-10-01 (branch `fix/resilience-and-deps`)

### Defects found and fixed (each reproduced before the fix)

| Defect | Evidence before fix | Fix |
|---|---|---|
| Default config could not route any request | On `master`, `ModelResolver` returned **0** candidates for both `default` and `fast`: the client's default aliases named models absent from `MODEL_CATALOG` | Catalog rebuilt from official sources; aliases moved to exported `DEFAULT_ALIASES`; test asserts every alias entry exists |
| `provider:model` split on every colon | `openrouter:qwen/qwen3.8-27b:free` became model `qwen/qwen3.8-27b` | `splitProviderKey()` splits on the first colon only |
| `OPENROUTER_API_KEY` never loaded by the client | Not in the client's key map | Added; `openrouter` in `DEFAULT_PROVIDERS` |
| Backoff returned 0 with `jitterFactor: 0` | Test "calculates increasing delays" failed (0 < 0) | `jitterFactor` = randomized share; 0 = exact exponential delay, 1 (default) = unchanged full jitter |
| Circuit breaker ignored a successful probe | Test "closes after successful probe" failed (stuck open/half-open): open→half-open only happened inside `getState()` | `recordSuccess`/`recordFailure` apply the time-based transition first |
| Circuit breaker counted failures outside `windowMs` | New test "ignores failures older than windowMs" failed on old code | Failures pruned to the window before counting |

### Catalog (sources and values as of 2026-10-01; `limits` are informational, routing does not read them)

| Provider | Models | Limits recorded | Source |
|---|---|---|---|
| Groq | `openai/gpt-oss-120b`, `openai/gpt-oss-20b` | 30 RPM, 1,000 RPD, 8,000 TPM | console.groq.com/docs/rate-limits |
| Gemini | `gemini-3.8-flash`, `gemini-3.5-flash-lite` | none (Google publishes no per-model numbers) | ai.google.dev/gemini-api/docs/pricing ("Free of charge"), /rate-limits |
| Mistral | `mistral-small-2603` (Mistral Small 4, 256k) | none (no longer published) | docs.mistral.ai changelog |
| OpenRouter | `nvidia/nemotron-3-super-120b-a12b:free`, `qwen/qwen3.8-27b:free`, `google/gemma-4-31b-it:free` | 20 RPM, 50 RPD (1,000 RPD after 10 credits purchased) | openrouter.ai/docs/api/reference/limits; IDs from live /api/v1/models |
| Ollama (local) | 6 entries unchanged | self-imposed 30–60 RPM | n/a (your own server) |

Removed: Together AI (no free tier; $5 minimum prepaid — docs.together.ai/docs/billing), Replicate (pay per use — replicate.com/pricing), Groq `mixtral-8x7b-32768` (shut down 2025-03-20 per Groq deprecations), Gemini `gemini-pro` (not on Google's current model list). Provider adapters remain in `src/providers/`.

`commercialUseAllowed` is `false` for all hosted entries: provider terms were not reviewed for commercial use in this change.

### Source conflict found (RateWatch)
- mnfst/awesome-free-llm-apis lists Groq `qwen/qwen3.6-27b`; Groq's official rate-limits page lists `qwen/qwen3.8-27b`. The catalog uses neither Groq Qwen model.

### Dependencies

| Package | Before | After |
|---|---|---|
| vitest, @vitest/ui | ^1.0.0 | ^4.1.11 (5.x requires Node 22.12+; package supports Node 20) |
| @typescript-eslint/eslint-plugin, parser | ^6.0.0 | ^8.71.0 |
| eslint | ^8.45.0 | ^8.57.1 |
| engines.node | >=20 | ^20.19.0 \|\| >=22.12.0 (required by vite 8 via vitest 4) |

`npm audit`: 11 advisories (2 critical) → **0**. Supersedes Dependabot PRs #1–#3 (which target vitest 5).

### Other changes
- `.env.example` regrouped by what the code actually reads.
- `examples/basic-usage.ts`, `tests/unit/integration.test.ts` use current model IDs.
- New `tests/unit/catalog.test.ts` (5 tests); 3 new resilience tests.
- New `.github/workflows/ci.yml`: tsc, vitest, `npm audit --audit-level=high` on Node 20.19 and 22.

### Verification
| Check | Result |
|---|---|
| `vitest run`, Node 20.20.1 and 22.23.3 | 49 passed, 0 failed |
| `tsc --noEmit` and `tsc` build | Clean |
| `npm audit` | 0 vulnerabilities |
| gitleaks | No leaks |
| Live API calls to providers | **Not performed** (no provider keys used) |

### Still open
- ESLint has no config file; `npm run lint` fails with "couldn't find a configuration file" (before and after this change).
- No README.
