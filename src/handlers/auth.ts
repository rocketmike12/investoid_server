import type { Response, NextFunction, CookieOptions } from "express";
import type { AuthRequest, AuthPayload } from "./auth.types";

import jwt from "jsonwebtoken";

import { getUser, addUser, getOperations, addOperation, delOperation, setBalance, getBalance } from "../db/db";

const validateUserData = function ({ email, password }: { email: string; password: string }) {
	return email.length >= 3 && /^[\w\-\.]+@([\w-]+\.)+[\w-]{2,}$/gm.test(email) && password.length >= 3;
};

const validateOperationData = function ({ date, category, subcategory, sum }: { date: string; category: string; subcategory: string; sum: number }) {
	return /\d\d\.\d\d\.\d\d\d\d/.test(date) && typeof category == "string" && category.length > 0 && typeof subcategory == "string" && subcategory.length > 0 && typeof sum == "number";
};

export const cookieOpts: CookieOptions =
	process.env.NODE_ENV === "dev" ? { maxAge: 1000 * 60 * 60 * 24 * 2, httpOnly: true, path: "/" } : { maxAge: 1000 * 60 * 60 * 24 * 2, httpOnly: true, path: "/", sameSite: "none", secure: true };

export const authenticateToken = async function (req: AuthRequest, res: Response, next: NextFunction) {
	const authCookie = req.cookies["authcookie"];

	if (!authCookie) {
		return res.sendStatus(401);
	}

	try {
		const payload = jwt.verify(authCookie, process.env.ACCESS_TOKEN_SECRET) as AuthPayload;

		req.user = { email: payload.email };

		next();
	} catch (err) {
		console.error(err);

		return res.sendStatus(403);
	}
};

export const loginHandler = async function (req: AuthRequest, res: Response) {
	const { email, password } = req.body;

	try {
		if (!validateUserData({ email, password })) {
			console.log("invalid data");

			return res.status(400).json({
				error: "invalid data"
			});
		}

		let userData = await getUser(email, password);

		if (!userData) {
			return res.sendStatus(401);
		}

		const token = jwt.sign({ email: userData.email }, process.env.ACCESS_TOKEN_SECRET, { expiresIn: "2d" });
		res.cookie("authcookie", token, cookieOpts);

		return res.status(200).json({
			email: userData.email,
			balance: userData.balance + userData.operations.reduce((acc, val) => acc + val.sum, 0),
			operations: userData.operations
		});
	} catch (err) {
		console.error(`failed to get user:`, err);
		return res.sendStatus(500);
	}
};

export const registerHandler = async function (req: AuthRequest, res: Response) {
	const { email, password } = req.body;

	try {
		if (!validateUserData({ email, password })) {
			console.log("invalid data");

			return res.status(400).json({
				error: "invalid data"
			});
		}

		const userData = await addUser(email, password);

		const token = jwt.sign({ email: userData.email }, process.env.ACCESS_TOKEN_SECRET, { expiresIn: "2d" });
		res.cookie("authcookie", token, cookieOpts);

		return res.status(200).json({
			email: userData.email,
			balance: userData.balance + userData.operations.reduce((acc, val) => acc + val.sum, 0),
			operations: userData.operations
		});
	} catch (err: any) {
		if (err.message === "user already exists") {
			console.log("user already exists");

			return res.sendStatus(409);
		}

		console.error(`user ${email} not created:`, err);
		return res.sendStatus(500);
	}
};

export const sessionHandler = async function (req: AuthRequest, res: Response) {
	res.set("Content-Type", "application/json");

	req.user.operations = await getOperations(req.user.email);
	req.user.balance = (await getBalance(req.user.email)) + req.user.operations.reduce((acc, val) => acc + val.sum, 0);

	const token = jwt.sign({ email: req.user.email }, process.env.ACCESS_TOKEN_SECRET, { expiresIn: "2d" });
	res.cookie("authcookie", token, cookieOpts);

	return res.status(200).json({ email: req.user.email, balance: req.user.balance, operations: req.user.operations });
};

export const logoutHandler = async function (_: AuthRequest, res: Response) {
	res.clearCookie("authcookie", cookieOpts);

	res.sendStatus(200);
};

export const addOperationHandler = async (req: AuthRequest, res: Response) => {
	try {
		const { operation } = req.body;

		if (!operation) {
			console.log("operation missing");

			return res.status(400).json({
				error: "operation missing"
			});
		}

		if (!validateOperationData(operation)) {
			console.log("invalid data");

			return res.status(400).json({
				error: "invalid data"
			});
		}

		const userData = await addOperation(req.user.email, operation);
		const balance = await getBalance(req.user.email);

		return res.status(200).json({
			operations: userData.operations,
			balance: balance + userData.operations.reduce((acc, val) => acc + val.sum, 0)
		});
	} catch (err) {
		console.error(`operation not added to ${req.user.email}:`, err);

		return res.sendStatus(500);
	}
};

export const delOperationHandler = async (req: AuthRequest, res: Response) => {
	try {
		const { id } = req.body;

		if (!id) {
			console.log("operation id missing");

			return res.status(400).json({
				error: "operation id missing"
			});
		}

		const userData = await delOperation(req.user.email, id);
		const balance = await getBalance(req.user.email);

		return res.status(200).json({
			operations: userData.operations,
			balance: balance + userData.operations.reduce((acc, val) => acc + val.sum, 0)
		});
	} catch (err) {
		console.error(`operation not deleted from ${req.user.email}:`, err);
		return res.sendStatus(500);
	}
};

export const setBalanceHandler = async (req: AuthRequest, res: Response) => {
	try {
		const { balance } = req.body;

		if (!Number.isInteger(balance)) {
			return res.sendStatus(400);
		}

		const operations = await getOperations(req.user.email);
		operations.forEach(async (operation) => {
			await delOperation(req.user.email, operation._id);
		});

		const userData = await setBalance(req.user.email, balance);

		return res.status(200).json({
			operations: userData.operations,
			balance: balance
		});
	} catch (err) {
		console.error(`operation not deleted from ${req.user.email}:`, err);
		return res.sendStatus(500);
	}
};
