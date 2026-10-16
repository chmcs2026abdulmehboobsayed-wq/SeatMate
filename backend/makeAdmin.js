import dotenv from "dotenv";
import mongoose from "mongoose";
import User from "./model/user.js";
import dns from "node:dns";
dns.setServers(["1.1.1.1", "8.8.8.8"]);

dotenv.config();

const makeAdmin = async () => {
    try {
        await mongoose.connect(process.env.MONGODB_URI);

        const result = await User.updateOne(
    { email: "alice1@example.com" },
    { $set: { role: "admin" } }
);

console.log("Admin role updated:", result.modifiedCount);

        console.log("Registered users:");
        

    } catch (error) {
        console.log(error.message);
    } finally {
        await mongoose.disconnect();
    }
};

makeAdmin();