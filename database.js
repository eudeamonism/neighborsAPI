import mongoose from "mongoose";
import dotenv from "dotenv/config";

export const connectToDatabase = async () => {
  try {
    mongoose.set("strictQuery", false);

    const connect = await mongoose.connect(process.env.DB_URI, {
      useUnifiedTopology: true,
    });

    console.log("Connected to database");
  } catch (error) {
    console.log(`Error connecting to database: ${error.message}`);
  }
};
