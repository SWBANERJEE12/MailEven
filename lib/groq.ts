import Groq from "groq-sdk";

export function createGroqClient(apiKey = process.env.GROQ_API_KEY) {
  return new Groq({ apiKey });
}
