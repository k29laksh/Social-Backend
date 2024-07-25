import mongoose from "mongoose";
export const dbconnect = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log("mongodb connected successfully");
  } catch (error) {
    console.log(error, "mongodb connection failed");
  }
};
