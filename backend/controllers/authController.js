import bcrypt from "bcryptjs";
import { v4 as uuidv4 } from "uuid";
import User from "../models/User.js";
import { generateToken } from "../utils/generateToken.js";
// import { sendMail } from "../utils/mailer.js";
// import { OAuth2Client } from "google-auth-library";

// const client = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

// Regular user registration
import { generateUserHash, generateAnonymousName } from "../utils/securityUtils.js";

export const registerUser = async (req, res) => {
    try {
        const { name, email, password } = req.body;

        // Validate USER_HASH_SECRET exists
        if (!process.env.USER_HASH_SECRET) {
            console.error('USER_HASH_SECRET missing in environment');
            return res.status(500).json({ 
                message: "Server configuration error. Please contact administrator." 
            });
        }

        // Validation
        if (!name || !email || !password) {
            return res.status(400).json({ message: "All fields are required" });
        }

        if (password.length < 6) {
            return res.status(400).json({ message: "Password must be at least 6 characters" });
        }

        const exists = await User.findOne({ email });
        if (exists) return res.status(400).json({ message: "Email already exists" });

        const hash = await bcrypt.hash(password, 10);
        
        // Create user - the pre-save middleware will generate userHash automatically
        const user = await User.create({
            name,
            email,
            password: hash,
            isVerified: true,
            role: 'user'
        });

        // Refresh to get the generated hash
        const userWithHash = await User.findById(user._id);

        const token = generateToken(user._id);

        res.status(201).json({
            message: "User registered successfully",
            token,
            user: {
                id: user._id,
                name: user.name,
                email: user.email,
                role: user.role,
                userHash: userWithHash.userHash
            }
        });
    } catch (error) {
        console.error("Registration error:", error);
        
        if (error.message.includes('USER_HASH_SECRET')) {
            return res.status(500).json({ 
                message: "Server security configuration error" 
            });
        }
        
        res.status(500).json({ message: "Server error during registration" });
    }
};
// Admin registration (protected route)
export const registerAdmin = async (req, res) => {
    try {
        const { name, email, password, adminSecret } = req.body;

        // Validate admin secret (you can set this in your .env)
        if (adminSecret !== process.env.ADMIN_SECRET) {
            return res.status(403).json({ message: "Invalid admin secret" });
        }

        // Validation
        if (!name || !email || !password) {
            return res.status(400).json({ message: "All fields are required" });
        }

        if (password.length < 6) {
            return res.status(400).json({ message: "Password must be at least 6 characters" });
        }

        const exists = await User.findOne({ email });
        if (exists) return res.status(400).json({ message: "Email already exists" });

        const hash = await bcrypt.hash(password, 10);

        // Create user as admin
        const user = await User.create({
            name,
            email,
            password: hash,
            isVerified: true,
            role: 'admin'
        });

        console.log("Admin registered:", user.email);

        const token = generateToken(user._id);

        res.status(201).json({
            message: "Admin registered successfully",
            token,
            user: {
                id: user._id,
                name: user.name,
                email: user.email,
                role: user.role
            }
        });
    } catch (error) {
        console.error("Admin registration error:", error);
        res.status(500).json({ message: "Server error during admin registration" });
    }
};

// Login (works for both users and admins)
export const loginUser = async (req, res) => {
    try {
        const { email, password } = req.body;

        if (!email || !password) {
            return res.status(400).json({ message: "Email and password are required" });
        }

        const user = await User.findOne({ email });
        if (!user) return res.status(400).json({ message: "Invalid email or password" });

        const isPasswordValid = await bcrypt.compare(password, user.password);
        if (!isPasswordValid) return res.status(400).json({ message: "Invalid email or password" });

        const token = generateToken(user._id);

        res.json({
            message: "Login successful",
            token,
            user: {
                id: user._id,
                name: user.name,
                email: user.email,
                role: user.role
            }
        });
    } catch (error) {
        console.error("Login error:", error);
        res.status(500).json({ message: "Server error during login" });
    }
};

// Get all users (admin only)
export const getUsers = async (req, res) => {
    try {
        const users = await User.find().select('-password -verifyToken -resetOTP');
        res.json({ users });
    } catch (error) {
        console.error("Get users error:", error);
        res.status(500).json({ message: "Failed to get users" });
    }
};

// Delete user (admin only)
export const deleteUser = async (req, res) => {
    try {
        const { id } = req.params;
        
        // Prevent admin from deleting themselves
        if (id === req.user.id) {
            return res.status(400).json({ message: "Cannot delete your own account" });
        }

        await User.findByIdAndDelete(id);
        res.json({ message: "User deleted successfully" });
    } catch (error) {
        console.error("Delete user error:", error);
        res.status(500).json({ message: "Failed to delete user" });
    }
};

// Your existing verifyEmail, googleLogin, sendOTP, resetPassword, getProfile functions...


export const verifyEmail = async (req, res) => {
    try {
        const { email, token } = req.body;
        const user = await User.findOne({ email, verifyToken: token });
        
        if (!user) return res.status(400).json({ message: "Invalid verification token" });
        
        user.isVerified = true;
        user.verifyToken = null;
        await user.save();
        
        res.json({ message: "Email verified successfully" });
    } catch (error) {
        console.error("Email verification error:", error);
        res.status(500).json({ message: "Server error during verification" });
    }
};



export const googleLogin = async (req, res) => {
    try {
        const { accessToken } = req.body;

        if (!accessToken) {
            return res.status(400).json({ message: "No Google token provided" });
        }

        // Fetch user profile from Google
        const response = await fetch(
            `https://www.googleapis.com/oauth2/v1/userinfo?access_token=${accessToken}`
        );

        if (!response.ok) {
            return res.status(401).json({ message: "Invalid Google token" });
        }

        const profile = await response.json();

        if (!profile.email) {
            return res.status(401).json({ message: "Could not get email from Google" });
        }

        let user = await User.findOne({ email: profile.email });

        if (!user) {
            user = await User.create({
                name: profile.name,
                email: profile.email,
                isVerified: true,
                googleId: profile.id,
                avatar: profile.picture,
                password: null,
                role: 'user'
            });
        }

        const token = generateToken(user._id);

        res.json({
            message: "Google login successful",
            token,
            user: {
                id: user._id,
                name: user.name,
                email: user.email,
                role: user.role
            }
        });

    } catch (error) {
        console.error("Google login error:", error);
        res.status(500).json({ message: "Google login failed" });
    }
};

export const sendOTP = async (req, res) => {
    try {
        const { email } = req.body;
        const user = await User.findOne({ email });
        if (!user) return res.status(400).json({ message: "User not found" });

        const otp = Math.floor(100000 + Math.random() * 900000).toString();
        user.resetOTP = otp;
        user.resetOTPExpires = Date.now() + 600000; // 10 minutes
        await user.save();

        console.log("OTP for", email, ":", otp); // Log OTP for testing
        
        // Temporarily skip email
        // await sendMail({ to: email, subject: "Password Reset OTP", html: `Your OTP: ${otp}` });

        res.json({ message: "OTP sent successfully", otp }); // Return OTP for testing
    } catch (error) {
        console.error("Send OTP error:", error);
        res.status(500).json({ message: "Failed to send OTP" });
    }
};

export const resetPassword = async (req, res) => {
    try {
        const { email, otp, newPassword } = req.body;

        if (!email || !otp || !newPassword) {
            return res.status(400).json({ message: "All fields are required" });
        }

        const user = await User.findOne({
            email,
            resetOTP: otp,
            resetOTPExpires: { $gt: Date.now() }
        });

        if (!user) return res.status(400).json({ message: "Invalid or expired OTP" });

        user.password = await bcrypt.hash(newPassword, 10);
        user.resetOTP = null;
        user.resetOTPExpires = null;
        await user.save();

        res.json({ message: "Password reset successfully" });
    } catch (error) {
        console.error("Reset password error:", error);
        res.status(500).json({ message: "Failed to reset password" });
    }
};

export const getProfile = async (req, res) => {
    try {
        res.json({
            user: {
                id: req.user._id,
                name: req.user.name,
                email: req.user.email,
                role: req.user.role
            }
        });
    } catch (error) {
        console.error("Get profile error:", error);
        res.status(500).json({ message: "Failed to get profile" });
    }
};