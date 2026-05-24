import mongoose from "mongoose";
import { OperationSchema } from "./operation";

export const User = mongoose.model(
	"User",
	new mongoose.Schema({
		username: {
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
