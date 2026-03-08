import { type Request, type Response, type NextFunction } from 'express';

export type AsyncFunction = (
  req: Request,
  res: Response,
  next: NextFunction,
) => Promise<Response | void>;

export default (execution: AsyncFunction) =>
  (req: Request, res: Response, next: NextFunction) => {
    execution(req, res, next).catch(next);
  };
