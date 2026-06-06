import express from "express";
import cookieParser from "cookie-parser";
import cors from "cors";

import dotenv from "dotenv";
dotenv.config();

import { connectDb } from "./config/connectDb.ts";
import mongoose from "mongoose";

import { authenticateToken, loginHandler, registerHandler, sessionHandler, logoutHandler, operationHandler, delOperationHandler } from "./handlers/auth.ts";

let whitelist = ["http://localhost:5173", "https://rocketmike12.github.io"];

const corsOpts = {
	origin: function (origin, callback) {
		if (whitelist.includes(origin)) {
			callback(null, true);
		} else {
			// callback(new Error("Not allowed by CORS"));
			callback(null, false);
		}
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
app.post("/api/v0/auth/logout/", authenticateToken, logoutHandler);
app.post("/api/v0/auth/operation/add", authenticateToken, operationHandler);
app.post("/api/v0/auth/operation/del", authenticateToken, delOperationHandler);

mongoose.connection.once("open", () => {
	app.listen(8080, () => {
		console.log("SRV: server is running on :8080");
	});
});
