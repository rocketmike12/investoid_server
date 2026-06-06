import mongoose from "mongoose";

export type Operation = {
	date: Date;
	category: string;
	subcategory: string;
	sum: number;
};

export const OperationSchema = new mongoose.Schema({
	date: {
		type: Date,
		required: true
	},

	category: {
		type: String,
		required: true
	},

	subcategory: {
		type: String,
		required: true
	},

	sum: {
		type: Number,
		required: true
	}
});
