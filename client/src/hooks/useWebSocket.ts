// Keep only a shim for compatibility; everything uses useSocket() now.
export { useSocket as useWebSocket, useSingletonSocket } from "./useSingletonSocket.tsx";