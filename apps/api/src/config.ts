import 'dotenv/config'

export const APP_ENV = process.env.APP_ENV || 'development'
export const PORT = Number(process.env.PORT || 4000)
export const FRONTEND_ORIGIN = process.env.FRONTEND_ORIGIN || 'http://localhost:5173'
export const DATABASE_URL = process.env.DATABASE_URL
export const SESSION_SECRET = process.env.SESSION_SECRET || 'dev-secret'
