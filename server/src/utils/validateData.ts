import { Request } from "express";

export const getValidatedData = <T>(req: Request): T => {
  return req.validated as T;
};