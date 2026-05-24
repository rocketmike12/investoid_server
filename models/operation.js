import mongoose from "mongoose";

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
