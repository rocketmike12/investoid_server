import express from "express";
import cookieParser from "cookie-parser";
import cors, { type CorsOptions } from "cors";

import dotenv from "dotenv";
dotenv.config();

import { connectDb } from "./config/connectDb";
import mongoose from "mongoose";

import { authenticateToken, loginHandler, registerHandler, sessionHandler, logoutHandler, addOperationHandler, delOperationHandler, setBalanceHandler } from "./handlers/auth";

let whitelist = ["http://localhost:5173", "https://rocketmike12.github.io"];

const corsOpts: CorsOptions = {
	origin: (origin: string | undefined, callback: (err: Error | null, allow?: boolean) => void) => {
		if (!origin) {
			return callback(null, true);
		}

		if (whitelist.includes(origin)) {
			return callback(null, true);
		}

		return callback(null, false);
	},
	credentials: true
};

const app = express();

app.use(cors(corsOpts));
app.use(express.json());
app.use(cookieParser());

connectDb();

app.post("/api/v0/auth/login/", loginHandler);
app.post("/api/v0/auth/register/", registerHandler);
app.post("/api/v0/auth/session/", authenticateToken, sessionHandler);
app.post("/api/v0/auth/logout/", logoutHandler);
app.post("/api/v0/auth/operation/add/", authenticateToken, addOperationHandler);
app.post("/api/v0/auth/operation/del/", authenticateToken, delOperationHandler);
app.post("/api/v0/auth/balance/", authenticateToken, setBalanceHandler);

mongoose.connection.once("open", () => {
	app.listen(8080, () => {
		console.log("SRV: server is running on :8080");
	});
});
