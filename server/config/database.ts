type AppEnv = 'production' | 'development';

const APP_ENV = (process.env.APP_ENV || 'development') as AppEnv;

const PROD = process.env.PROD_DATABASE_URL?.trim();
const DEV  = process.env.DEV_DATABASE_URL?.trim();

if (APP_ENV === 'production' && !PROD) {
  throw new Error('PROD_DATABASE_URL is required when APP_ENV=production');
}
if (APP_ENV === 'development' && !DEV) {
  throw new Error('DEV_DATABASE_URL is required when APP_ENV=development');
}

export const DATABASE_URL =
  APP_ENV === 'production' ? (PROD as string) : (DEV as string);

export const getDbHost = () => new URL(DATABASE_URL).host;
export const getAppEnv = () => APP_ENV;