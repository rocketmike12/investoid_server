import bcrypt from "bcrypt";

import { User } from "../models/user";
import type { Operation } from "../models/operation";

export const getUser = async function (email: string, password: string) {
	const user = await User.findOne({ email }).exec();

	if (!user) {
		throw new Error("login incorrect");
	}

	const match = await bcrypt.compare(password, user.password);

	if (!match) {
		throw new Error("login incorrect");
	}

	return user;
};

export const getOperations = async function (email: string) {
	const user = await User.findOne({ email }).exec();

	if (!user) {
		throw new Error("login incorrect");
	}

	return user.operations;
};

export const addUser = async function (email: string, password: string) {
	const existingUser = await User.findOne({ email }).exec();

	if (existingUser) {
		throw new Error("user already exists");
	}

	const hash = await bcrypt.hash(password, 8);

	const user = await User.create({
		email,
		password: hash,
		balance: 0,
		operations: []
	});

	return user;
};

export const addOperation = async function (email: string, operation: Operation) {
	const user = await User.findOneAndUpdate(
		{ email },
		{
			$push: {
				operations: operation
			}
		},
		{ returnDocument: "after" }
	).exec();

	if (!user) {
		throw new Error("login incorrect");
	}

	return user;
};

export const delOperation = async function (email: string, operationId: string) {
	const user = await User.findOneAndUpdate(
		{ email },
		{
			$pull: {
				operations: {
					_id: operationId
				}
			}
		},
		{ returnDocument: "after" }
	).exec();

	if (!user) {
		throw new Error("login incorrect");
	}

	return user;
};

export const getBalance = async function (email: string) {
	const user = await User.findOne({ email });

	if (!user) {
		throw new Error("login incorrect");
	}

	return user.balance;
};

export const setBalance = async function (email: string, balance: number) {
	const user = await User.findOneAndUpdate(
		{ email },
		{
			$set: {
				balance: balance
			}
		},
		{ returnDocument: "after" }
	).exec();

	if (!user) {
		throw new Error("login incorrect");
	}

	return user;
};
