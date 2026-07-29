declare global {
  namespace Express {
    interface Request {
      /** Correlates client errors with one server log entry. */
      requestId: string;
    }
  }
}

export {};
