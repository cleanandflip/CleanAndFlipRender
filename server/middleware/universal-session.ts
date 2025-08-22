import session from "express-session";
import PgSimple from "connect-pg-simple";
import { universalPool } from "../db/universal-pool";
import { APP_ENV } from "../config/env";
const SESSION_SECRET = process.env.SESSION_SECRET!;

const PgSession = PgSimple(session);

const baseConfig: session.SessionOptions = {
	name: 'sid',
	secret: SESSION_SECRET || 'dev-secret',
	resave: false,
	saveUninitialized: false,
	cookie: {
		secure: false,
		sameSite: 'lax'
	}
};

export const universalSessionMiddleware = universalPool
	? session({
		...baseConfig,
		store: new PgSession({
			pool: universalPool,
			tableName: "sessions",
			createTableIfMissing: true,
		}),
	})
	: session(baseConfig);