// ALL ERROR LOGGING COMPLETELY REMOVED
// This file will be rebuilt later with proper implementation

export class ClientErrorLogger {
  static getInstance(): ClientErrorLogger {
    return new ClientErrorLogger();
  }

  setup() {
    // NO-OP: All error logging removed
    return;
  }
}

export const clientErrorLogger = ClientErrorLogger.getInstance();