import { Request, Response, NextFunction, RequestHandler } from "express";

// Middleware handler factory
export const createMiddlewareHandler = (handler: RequestHandler) => {
  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      // Bind the handler to ensure 'this' context is preserved
      await new Promise<void>((resolve, reject) => {
        const result = handler(req, res, (err?: any) => {
          if (err) return reject(err);
          resolve();
          next();
        });

        // Handle promise returns from handler
        if (result instanceof Promise) {
          result.then(() => resolve()).catch(reject);
        }
      });
    } catch (error) {
      console.error("Middleware error:", error);
      if (!res.headersSent) {
        res.status(500).json({
          error: "Internal server error",
          message:
            error instanceof Error ? error.message : "Unknown error occurred",
        });
      }
      next(error);
    }
  };
};
