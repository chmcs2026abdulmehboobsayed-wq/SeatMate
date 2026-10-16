import mongoose from "mongoose";
import dns from "node:dns";

const connectDB = async () => {
    try {
        const uri = process.env.MONGODB_URI;
        console.log("Node version:", process.version);
        console.log("Mongo URI protocol:", uri?.split(":")[0]);
        console.log("Mongo URI host:", uri?.split("@")[1]?.split("/")[0]);

        if (!uri) {
            throw new Error("MONGODB_URI is missing in .env file");
        }
        
        console.log("DNS servers:", dns.getServers());

try {
    const records = await dns.promises.resolveSrv(
        "_mongodb._tcp.seatmate.rlioags.mongodb.net"
    );
    console.log("SRV records:", records);
} catch (error) {
    console.log("SRV lookup failed:", error.code, error.message);
}
        await mongoose.connect(uri, {
            serverSelectionTimeoutMS: 10000,
            family: 4
});

        console.log("MongoDB Connected Successfully");
    } catch (error) {
        console.error("MongoDB Connection Failed:", error.message);
        process.exit(1);
    }
};

export default connectDB;