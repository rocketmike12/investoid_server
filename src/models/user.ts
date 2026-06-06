import mongoose from "mongoose";
import { OperationSchema } from "./operation.ts";

export const User = mongoose.model(
	"User",
	new mongoose.Schema({
		email: {
			type: String,
			required: true,
			unique: true
		},

		password: {
			type: String,
			required: true
		},

		balance: {
			type: Number,
			default: 0
		},

		operations: [OperationSchema]
	})
);
