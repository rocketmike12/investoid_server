import mongoose from "mongoose";
import { OperationSchema } from "./operation";

const UserSchema = new mongoose.Schema({
	email: { type: String, required: true, unique: true },
	password: { type: String, required: true },
	balance: { type: Number, default: 0 },
	operations: { type: [OperationSchema], default: [] }
});

export const User = mongoose.model("User", UserSchema);
