import cors from "cors";
import { CORS_ORIGINS } from "../config/universal-env";

export const universalCorsMiddleware = cors({
  origin: CORS_ORIGINS.length ? CORS_ORIGINS : true,
  credentials: true,
});