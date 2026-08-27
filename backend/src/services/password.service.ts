import argon2 from 'argon2';
import { env } from '../config/env';

const argon2Options = {
  type: argon2.argon2id,
  memoryCost: env.ARGON2_MEMORY_COST_KIB,
  timeCost: env.ARGON2_TIME_COST,
  parallelism: env.ARGON2_PARALLELISM,
};

export const passwordService = {
  hash(plainPassword: string): Promise<string> {
    return argon2.hash(plainPassword, argon2Options);
  },

  verify(passwordHash: string, plainPassword: string): Promise<boolean> {
    return argon2.verify(passwordHash, plainPassword);
  },
};
