import { RequestHandler } from "express";

export const universalEnvHeaders: RequestHandler = (_req, res, next) => {
  res.setHeader("X-App-Env", "development");
  res.setHeader("X-Db-Host", "lucky-poem");
  next();
};