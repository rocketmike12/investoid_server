import jwt from "jsonwebtoken";

import { addUser, getOperations, addOperation, delOperation } from "../db/db.js";

export const cookieOpts =
	process.env.NODE_ENV === "dev" ? { maxAge: 1000 * 60 * 60 * 24 * 2, httpOnly: true } : { maxAge: 1000 * 60 * 60 * 24 * 2, httpOnly: true, sameSite: "none", secure: true, partitioned: true };

export const authenticateToken = async function (req, res, next) {
	const authCookie = req.cookies["authcookie"];

	if (!authCookie) return res.status(401).send("401 unauthorized");

	jwt.verify(authCookie, process.env.ACCESS_TOKEN_SECRET, async (err, username) => {
		if (err) return res.status(403).send("403 access denied");

		try {
			let operations = await getOperations(username);

			if (!operations) throw new Error(operations);

			req.user = { username: username, operations: operations };
		} catch (err) {
			res.set("Content-Type", "text/plain");

			if (err.message === "login incorrect") {
				return res.status(401).send("401 unauthorized: login incorrect");
			}

			console.error(err);
			return res.status(406).send(err);
		}

		next();
	});
};

export const loginHandler = async function (req, res) {
	const { username, password } = req.body;

	try {
		let userData = await getUser(username, password);

		if (!userData) throw new Error(userData);

		const token = jwt.sign(userData.username, process.env.ACCESS_TOKEN_SECRET);
		res.cookie("authcookie", token, { maxAge: 900000, httpOnly: true });

		return res.status(200).json({ username: userData.username, operations: userData.operations });
	} catch (err) {
		res.set("Content-Type", "text/plain");

		if (err.message === "login incorrect") {
			return res.status(401).send("401 unauthorized: login incorrect");
		}

		console.error(`failed to get user: ${err.message}`);
		return res.sendStatus(500);
	}
};

export const registerHandler = async function (req, res) {
	const { username, password } = req.body;

	try {
		const userData = await addUser(username, password);

		const token = jwt.sign(userData.username, process.env.ACCESS_TOKEN_SECRET);
		res.cookie("authcookie", token, cookieOpts);

		return res.status(200).json({ username: userData.username, operations: userData.operations });
	} catch (err) {
		res.set("Content-Type", "text/plain");

		if (err.message === "user already exists") {
			return res.sendStatus(409);
		}

		console.error(`user ${username} not created: ${err.message}`);
		return res.sendStatus(500);
	}
};

export const sessionHandler = function (req, res) {
	res.set("Content-Type", "text/plain");

	const token = jwt.sign(req.user.username, process.env.ACCESS_TOKEN_SECRET);
	res.cookie("authcookie", token, cookieOpts);

	return res.status(200).json(req.user);
};

export const logoutHandler = async function (_, res) {
	res.set("Content-Type", "text/plain");

	res.clearCookie("authcookie", cookieOpts);

	res.sendStatus(200);
};

export const operationHandler = async (req, res) => {
	try {
		const { operation } = req.body;

		const userData = await addOperation(req.user.username, operation);

		return res.status(200).json({
			operations: userData.operations
		});
	} catch (err) {
		console.error(`operation not added to ${req.user.username}:`, err);

		return res.sendStatus(500);
	}
};

export const delOperationHandler = async (req, res) => {
	try {
		const { operationId } = req.body;

		const userData = await delOperation(req.user.username, operationId);

		return res.status(200).json({
			operations: userData.operations
		});
	} catch (err) {
		console.error(`operation not deleted from ${req.user.username}:`, err);
		return res.sendStatus(500);
	}
};
