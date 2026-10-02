# free-llm-router

Multi-provider LLM API router with automatic waterfall failover for free-tier services.

**Status:** ✅ Phase 1 complete · Phase 2 (resilience) shipped with 6 defect fixes · 49 tests passing · 0 npm vulnerabilities

## Quick Start

```bash
# Install
npm install

# Set up credentials
cp .env.example .env
# Edit .env: add your GROQ_API_KEY, GOOGLE_API_KEY, MISTRAL_API_KEY, OPENROUTER_API_KEY

# Run tests
npm test

# Try it
npm run dev
```

## Usage

```typescript
import { FreeLLMRouter } from 'free-llm-router';

const router = new FreeLLMRouter({
  apiKeys: {
    groq: process.env.GROQ_API_KEY,
    gemini: process.env.GOOGLE_API_KEY,
    mistral: process.env.MISTRAL_API_KEY,
    openrouter: process.env.OPENROUTER_API_KEY,
  },
  aliases: {
    fast: ['groq:openai/gpt-oss-20b', 'gemini:gemini-3.5-flash-lite'],
    default: ['groq:openai/gpt-oss-120b', 'gemini:gemini-3.8-flash', 'mistral:mistral-small-2603'],
  },
});

const response = await router.chat.completions.create({
  model: 'default',
  messages: [{ role: 'user', content: 'Hello!' }],
});

console.log(response.choices[0].message.content);
console.log(response.x_router);
```

## Supported Providers (Free Tier)

| Provider | Models | Rate Limits |
|----------|--------|------------|
| **Groq** | `openai/gpt-oss-120b`, `openai/gpt-oss-20b` | 30 RPM, 1,000 RPD, 8,000 TPM |
| **Gemini** | `gemini-3.8-flash`, `gemini-3.5-flash-lite` | None published |
| **Mistral** | `mistral-small-2603` | None published |
| **OpenRouter** | `nvidia/nemotron-3-super-120b-a12b:free`, `qwen/qwen3.8-27b:free` | 20 RPM, 50 RPD |
| **Ollama** (local) | 6 models (configurable) | Self-managed |

## Resilience (Phase 2 — Shipped 2026-10-01)

### Exponential Backoff

```typescript
const router = new FreeLLMRouter({
  apiKeys: { /* ... */ },
  resilience: {
    backoff: {
      initialDelayMs: 500,
      maxDelayMs: 30_000,
      jitterFactor: 1.0,
    },
  },
});
```

### Circuit Breaker

```typescript
const router = new FreeLLMRouter({
  apiKeys: { /* ... */ },
  resilience: {
    circuitBreaker: {
      failureThreshold: 5,
      windowMs: 60_000,
      halfOpenTimeoutMs: 30_000,
    },
  },
});
```

## Configuration

```typescript
interface FreeLLMRouterConfig {
  apiKeys: Record<string, string>;
  aliases?: Record<string, string[]>;
  resilience?: {
    backoff?: { initialDelayMs, maxDelayMs, jitterFactor };
    circuitBreaker?: { failureThreshold, windowMs, halfOpenTimeoutMs };
  };
  timeout?: number;
  deadline?: number;
}
```

## Development

```bash
npm run type-check
npm run format
npm run build
npm run test:ui
npm run test:coverage
```

## Architecture

- **Providers** — HTTP adapters for OpenAI-compatible APIs
- **Router** — Waterfall orchestrator with deadline budgeting
- **Resilience** — Exponential backoff, circuit breaker
- **Client** — OpenAI SDK-compatible interface

See [AS_BUILT.md](./AS_BUILT.md) for defect fixes and verification.

## License

MIT
