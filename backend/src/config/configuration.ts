import { join } from 'path';

export const configuration = () => ({
  port: parseInt(process.env.PORT || '3000'),
  nodeEnv: process.env.NODE_ENV || 'development',
  dbPath: process.env.DB_PATH || './data/liteportal.sqlite',
  maxBodySize: process.env.MAX_BODY_SIZE || '10kb',
  logLevel: process.env.LOG_LEVEL,
  initData: process.env.INIT_DATA === 'true' || false,
  isPkg: (process as any).pkg !== undefined,
  webRoot: process.env.WEB_ROOT || 'public',
  rootDir: join(__dirname, '..'),
});