import axios from "axios";

const API = import.meta.env.VITE_API_BASE_URL + "/auth";

// Create axios instance with better error handling
const api = axios.create({
    baseURL: import.meta.env.VITE_API_BASE_URL,
    timeout: 10000,
});

export const login = async (data: any) => {
    const response = await api.post("/auth/login", data);
    return response.data;
};

export const registerUser = async (data: any) => {
    const response = await api.post("/auth/register", data);
    return response.data;
};

export const verifyEmail = async (data: any) => {
    const response = await api.post("/auth/verify-email", data);
    return response.data;
};



// Always send accessToken — useGoogleLogin always returns access_token
export const googleLogin = async (accessToken: string) => {
    const res = await api.post("/auth/google", { accessToken });
    return res.data;
};
export const sendOTP = async (email: string) => {
    const response = await api.post("/auth/send-otp", { email });
    return response.data;
};

export const resetPassword = async (data: any) => {
    const response = await api.post("/auth/reset-password", data);
    return response.data;
};

export const getProfile = async (token: string) => {
    const response = await api.get("/auth/profile", {
        headers: { Authorization: `Bearer ${token}` }
    });
    return response.data;
};