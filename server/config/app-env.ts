// Force development when NODE_ENV is development to fix split brain issue
export const APP_ENV = process.env.NODE_ENV === "development" ? "development" : (process.env.APP_ENV ?? process.env.NODE_ENV ?? "development").toLowerCase();
export const IS_PROD = APP_ENV === "production";
export const IS_DEV = !IS_PROD;