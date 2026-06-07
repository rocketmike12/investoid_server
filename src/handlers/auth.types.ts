import type { Request } from "express";

import mongoose from "mongoose";
import type { Operation } from "../models/operation";

import type { JwtPayload } from "jsonwebtoken";

export interface AuthRequest extends Request {
	user: {
		email: string;
		operations?: mongoose.Types.DocumentArray<Operation>;
	};
}

export interface AuthPayload extends JwtPayload {
	email: string;
}
