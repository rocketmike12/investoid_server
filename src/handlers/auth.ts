import jwt from "jsonwebtoken";

import { getUser, addUser, getOperations, addOperation, delOperation } from "../db/db.js";

const validateUserData = function ({ username, password }) {
	return typeof username == "string" && username.length >= 3 && /^[a-zA-Z0-9_]{3,32}$/.test(username) && typeof password == "string" && password.length >= 3;
};

const validateOperationData = function ({ date, category, subcategory, sum }) {
	return !isNaN(new Date(date).getTime()) && typeof category == "string" && category.length > 0 && typeof subcategory == "string" && subcategory.length > 0 && typeof sum == "number";
};

export const cookieOpts =
	process.env.NODE_ENV === "dev" ? { maxAge: 1000 * 60 * 60 * 24 * 2, httpOnly: true, path: "/" } : { maxAge: 1000 * 60 * 60 * 24 * 2, httpOnly: true, path: "/", sameSite: "none", secure: true };

export const authenticateToken = async function (req, res, next) {
	const authCookie = req.cookies["authcookie"];

	if (!authCookie) {
		return res.sendStatus(401);
	}

	try {
		const payload = jwt.verify(authCookie, process.env.ACCESS_TOKEN_SECRET);

		req.user = { username: payload.username };

		next();
	} catch (err) {
		console.error(err);

		return res.sendStatus(403);
	}
};

export const loginHandler = async function (req, res) {
	const { username, password } = req.body;

	try {
		if (!validateUserData({ username, password })) {
			return res.status(400).json({
				error: "invalid data"
			});
		}

		let userData = await getUser(username, password);

		if (!userData) {
			return res.sendStatus(401);
		}

		const token = jwt.sign({ username: userData.username }, process.env.ACCESS_TOKEN_SECRET, { expiresIn: "2d" });
		res.cookie("authcookie", token, cookieOpts);

		return res.status(200).json({
			username: userData.username,
			operations: userData.operations
		});
	} catch (err) {
		console.error(`failed to get user:`, err);
		return res.sendStatus(500);
	}
};

export const registerHandler = async function (req, res) {
	const { username, password } = req.body;

	try {
		if (!validateUserData({ username, password })) {
			return res.status(400).json({
				error: "invalid data"
			});
		}

		const userData = await addUser(username, password);

		const token = jwt.sign({ username: userData.username }, process.env.ACCESS_TOKEN_SECRET, { expiresIn: "2d" });
		res.cookie("authcookie", token, cookieOpts);

		return res.status(200).json({
			username: userData.username,
			operations: userData.operations
		});
	} catch (err) {
		if (err.message === "user already exists") {
			return res.sendStatus(409);
		}

		console.error(`user ${username} not created:`, err);
		return res.sendStatus(500);
	}
};

export const sessionHandler = function (req, res) {
	res.set("Content-Type", "application/json");

	req.user.operations = getOperations(req.user.username);

	const token = jwt.sign({ username: req.user.username }, process.env.ACCESS_TOKEN_SECRET, { expiresIn: "2d" });
	res.cookie("authcookie", token, cookieOpts);

	return res.status(200).json(req.user);
};

export const logoutHandler = async function (_, res) {
	res.clearCookie("authcookie", cookieOpts);

	res.sendStatus(200);
};

export const operationHandler = async (req, res) => {
	try {
		const { operation } = req.body;

		if (!operation) {
			return res.status(400).json({
				error: "operation missing"
			});
		}

		if (!validateOperationData(operation)) {
			return res.status(400).json({
				error: "invalid data"
			});
		}

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

		if (!operationId) {
			return res.status(400).json({
				error: "operationId missing"
			});
		}

		const userData = await delOperation(req.user.username, operationId);

		return res.status(200).json({
			operations: userData.operations
		});
	} catch (err) {
		console.error(`operation not deleted from ${req.user.username}:`, err);
		return res.sendStatus(500);
	}
};
