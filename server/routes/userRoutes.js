import express from "express"
import {
	signup,
	login,
	updateProfile,
	checkAuth,
	sendResetOtp, // ← ДОБАВЬ
	resetPassword, // ← ДОБАВЬ
} from "../controllers/userController.js"
import { protectRoute } from "../middleware/auth.js"

const userRouter = express.Router()

userRouter.post("/signup", signup)
userRouter.post("/login", login)
userRouter.put("/update-profile", protectRoute, updateProfile)
userRouter.get("/check", protectRoute, checkAuth)

// 🔐 НОВЫЕ РОУТЫ СБРОСА ПАРОЛЯ
userRouter.post("/send-reset-otp", sendResetOtp)
userRouter.post("/reset-password", resetPassword)

export default userRouter
