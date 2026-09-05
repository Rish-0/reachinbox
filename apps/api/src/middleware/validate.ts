import { Request, Response, NextFunction } from 'express';
import { ZodSchema, ZodError } from 'zod';

/**
 * Express middleware factory for Zod validation.
 * Validates req.body (or req.query for GET requests) against the provided schema.
 */
export function validate(schema: ZodSchema, source: 'body' | 'query' = 'body') {
  return (req: Request, res: Response, next: NextFunction): void => {
    try {
      const data = source === 'body' ? req.body : req.query;
      const result = schema.parse(data);

      // Replace with parsed (coerced/defaulted) values
      if (source === 'body') {
        req.body = result;
      } else {
        (req as any).validatedQuery = result;
      }

      next();
    } catch (error) {
      if (error instanceof ZodError) {
        res.status(400).json({
          success: false,
          error: 'Validation failed',
          details: error.errors.map((e) => ({
            field: e.path.join('.'),
            message: e.message,
          })),
        });
        return;
      }
      next(error);
    }
  };
}
