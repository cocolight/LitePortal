export const configuration = () => ({
  port: parseInt(process.env.PORT, 10) || 8080,
  nodeEnv: process.env.NODE_ENV || 'development',
  dbPath: process.env.DB_PATH || (process.env.NODE_ENV === 'development' ? './data/database.sqlite' : './data/database.sqlite'),
  maxBodySize: process.env.MAX_BODY_SIZE || '10kb',
  logLevel: process.env.LOG_LEVEL || 'debug',
  initTestData: process.env.INIT_TEST_DATA === 'true' || false,
  isPkg: (process as any).pkg !== undefined,
});