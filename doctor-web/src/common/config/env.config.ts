import { ConfigModuleOptions } from '@nestjs/config';
import { z } from 'zod';

export function getConfigOptions<T extends z.ZodRawShape>(
  schema: z.ZodObject<T>,
): ConfigModuleOptions {
  return {
    cache: true,
    isGlobal: true,
    validate:
      process.env.NODE_ENV === 'test' ? undefined : (env) => schema.parse(env),
  };
}
