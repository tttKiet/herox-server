import { Request, RequestHandler, Response } from "express";
import redis, {
  setupCache,
  closeRedisConnection,
  setCache,
  getCache,
  deleteCache,
  hasCache,
  expireCache,
  getTTL,
  incrementCounter,
  hashCache,
} from "./redis/index";

export {
  redis,
  setupCache,
  closeRedisConnection,
  setCache,
  getCache,
  deleteCache,
  hasCache,
  expireCache,
  getTTL,
  incrementCounter,
  hashCache,
};

export interface IResApiGpm<T> {
  success: boolean;
  data: T;
  message: string;
}

export interface IResStartProfileGpm {
  success: boolean;
  profile_id: string;
  browser_location: string;
  remote_debugging_address: string;
  driver_path: string;
}

export type IFunctionHandler<Params extends Record<string, any> = {}> = (
  req: Request<Params>,
  res: Response
) => void | Promise<Response<any>>;
