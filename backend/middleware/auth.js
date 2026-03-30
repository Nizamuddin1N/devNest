import jwt from "jsonwebtoken";
import User from "../models/User.js";
import { generateUserHash } from "../utils/securityUtils.js";

export const protect = async (req, res, next) => {
    try {
        const token = req.headers.authorization?.split(" ")[1];
        if (!token) {
            return res.status(401).json({ message: "Not authorized, no token" });
        }

        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        const user = await User.findById(decoded.id).select("-password");
        
        if (!user) {
            return res.status(401).json({ message: "User not found" });
        }

        if (!user.userHash) {
            try {
                user.userHash = generateUserHash(user._id.toString(), user.email);
                await user.save();
            } catch (hashError) {
                console.error('Error generating userHash:', hashError);
                return res.status(500).json({ message: "User security configuration error" });
            }
        }

        req.user = user;
        next();
    } catch (error) {
        // Handle specific JWT errors cleanly (no more stack trace spam)
        if (error.name === "TokenExpiredError") {
            return res.status(401).json({ message: "Token expired", code: "TOKEN_EXPIRED" });
        }
        if (error.name === "JsonWebTokenError") {
            return res.status(401).json({ message: "Invalid token", code: "TOKEN_INVALID" });
        }
        console.error("Auth middleware error:", error);
        return res.status(401).json({ message: "Not authorized, token failed" });
    }
};