import mongoose from "mongoose";

export interface Operation {
	_id?: string;
	date: string;
	description: string;
	category: string;
	subcategory: string;
	sum: number;
}

export const OperationSchema = new mongoose.Schema<Operation>(
	{
		date: { type: String, required: true },
		description: { type: String, required: true },
		category: { type: String, required: true },
		subcategory: { type: String, required: true },
		sum: { type: Number, required: true }
	},
	{ _id: true }
);
