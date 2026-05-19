import { Request, Response } from "express";

export type RequestWithBody<T> = Request<any, any, T>;
export type RequestWithParams<T> = Request<T>;
export type RequestWithQuery<T> = Request<any, any, any, T>;

export type ResponseWithBody<T> = Response<T>;