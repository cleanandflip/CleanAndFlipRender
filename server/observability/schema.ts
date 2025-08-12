import { z } from "zod";

export const errorEventSchema = z.object({
  message: z.string().min(1),
  stack: z.string().optional(),
  level: z.enum(["error","warn","info"]).default("error"),
  env: z.string().default(process.env.NODE_ENV || "development"),
  url: z.string().url().optional(),
  userAgent: z.string().optional(),
  tags: z.record(z.string()).optional(),
  extra: z.record(z.any()).optional(),
  // allow either ISO string or number (ms)
  timestamp: z.union([z.string(), z.number()]).optional(),
  // resource failures (img/script) & network info
  resource: z.object({
    kind: z.enum(["img","script","css","fetch","xhr"]).optional(),
    src: z.string().optional(),
    status: z.number().optional(),
  }).optional(),
  // test flag
  test: z.boolean().optional(),
});