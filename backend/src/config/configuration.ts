import { join } from 'path';
export const configuration = () => ({
  port: parseInt(process.env.PORT || '3000'),
  nodeEnv: process.env.NODE_ENV || 'production',
  dbPath: process.env.DB_PATH,
  maxBodySize: process.env.MAX_BODY_SIZE || '10kb',
  logLevel: process.env.LOG_LEVEL,
  initTestData: process.env.INIT_TEST_DATA === 'true' || false,
  isPkg: (process as any).pkg !== undefined,
  webRoot: join(__dirname, process.env.WEB_ROOT!),
});