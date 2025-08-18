import { RequestHandler } from "express";
import { APP_ENV, DB_HOST } from "../config/universal-env";

export const universalEnvHeaders: RequestHandler = (_req, res, next) => {
  res.setHeader("X-App-Env", APP_ENV);
  res.setHeader("X-Db-Host", DB_HOST);
  next();
};