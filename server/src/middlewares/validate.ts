import { NextFunction, Request, Response } from 'express';
import { z } from 'zod';

type ValidationShape = {
  body?: unknown;
  query?: unknown;
  params?: unknown;
};

export const validate = <T extends z.ZodTypeAny>(schema: T) => {
  return async (req: Request, _res: Response, next: NextFunction): Promise<void> => {
    try {
      const parsed = await schema.parseAsync({
        body: req.body,
        query: req.query,
        params: req.params,
      });

      const parsedKeys = Object.keys(parsed as ValidationShape);
      const firstKey = parsedKeys[0] as keyof ValidationShape | undefined;

      req.validated =
        parsedKeys.length === 1 && firstKey && firstKey in { body: true, query: true, params: true }
          ? (parsed as ValidationShape)[firstKey]
          : parsed;

      next();
    } catch (error) {
      next(error);
    }
  };
};




