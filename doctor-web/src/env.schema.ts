import { z } from 'zod';

export const envSchema = z.object({
  HOSTNAME: z.string(),
  PORT: z.coerce.number(),
  NODE_ENV: z.string(),
  OPENAI_API_KEY: z.string().optional(),
});

export type IEnv = z.infer<typeof envSchema>;

export const TEST_ENV: IEnv = {
  HOSTNAME: 'localhost',
  PORT: 8080,
  NODE_ENV: 'test',
};

export function setTestEnv(custom?: IEnv): void {
  for (const [key, value] of Object.entries(custom ?? TEST_ENV)) {
    process.env[key] = String(value);
  }
}
