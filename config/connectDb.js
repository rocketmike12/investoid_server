import mongoose from "mongoose";

export const connectDb = async function () {
	try {
		await mongoose.connect(process.env.DATABASE_URI, {});
		console.log("DB : DB connected")
	} catch (err) {
		console.log(`DB : ERR: ${err}`);
	}
};
