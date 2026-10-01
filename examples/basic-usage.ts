import { FreeLLMRouter } from '../src/client/free-llm-router';

async function main() {
  const router = new FreeLLMRouter({
    apiKeys: {
      groq: process.env.GROQ_API_KEY,
      mistral: process.env.MISTRAL_API_KEY,
      gemini: process.env.GOOGLE_API_KEY,
    },
    aliases: {
      fast: ['groq:openai/gpt-oss-120b', 'mistral:mistral-small-3.1-24b-instruct'],
      default: ['mistral:mistral-small-3.1-24b-instruct', 'gemini:gemini-2.5-flash'],
    },
  });

  const response = await router.chat.completions.create({
    model: 'fast',
    messages: [{ role: 'user', content: 'What is 2+2?' }],
    temperature: 0.7,
    max_tokens: 100,
  });

  console.log('Response:', response.choices[0].message);
  console.log('Provider used:', response.x_router?.provider);
}

main().catch(console.error);
