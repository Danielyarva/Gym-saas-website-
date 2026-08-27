import path from 'node:path';
import dotenv from 'dotenv';

// Loaded before any test file's own imports run (Jest's setupFilesAfterEnv
// timing), so src/config/env.ts validates against the test database's
// config, never the developer's local .env.
dotenv.config({ path: path.resolve(__dirname, '../.env.test'), override: true });
