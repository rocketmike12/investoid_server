import bcrypt from "bcrypt";

import { User } from "../models/user.js";

export const getUser = async function (username, password) {
	const user = await User.findOne({ username }).exec();

	if (!user) {
		throw new Error("login incorrect");
	}

	const match = await bcrypt.compare(password, user.password);

	if (!match) {
		throw new Error("login incorrect");
	}

	return user;
};

export const getOperations = async function (username) {
	const user = await User.findOne({ username }).exec();

	if (!user) {
		throw new Error("login incorrect");
	}

	return user.operations;
};

export const addUser = async function (username, password) {
	const existingUser = await User.findOne({ username }).exec();

	if (existingUser) {
		throw new Error("user already exists");
	}

	const hash = await bcrypt.hash(password, 8);

	const user = await User.create({
		username,
		password: hash,
		balance: 0,
		operations: []
	});

	return user;
};

export const addOperation = async function (username, operation) {
	const user = await User.findOneAndUpdate(
		{ username },
		{
			$push: {
				operations: operation
			}
		},
		{
			new: true
		}
	).exec();

	if (!user) {
		throw new Error("login incorrect");
	}

	return user;
};

export const delOperation = async function (username, operationId) {
	const user = await User.findOneAndUpdate(
		{ username },
		{
			$pull: {
				operations: {
					_id: operationId
				}
			}
		},
		{
			new: true
		}
	).exec();

	if (!user) {
		throw new Error("login incorrect");
	}

	return user;
};
