import mongoose from "mongoose"
import dotenv from "dotenv"

dotenv.config();

if (!process.env.MONGO_URI) {
    throw new Error(
        "Please provide MONGODB_URI"
    )
}

const connectDB = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI)
    } catch (error) {
        console.log('MongoDB connection failed!!', error);
        process.exit(1);
    }
}

export default connectDB;