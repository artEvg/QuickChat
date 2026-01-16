import express from "express"
import {
	signup,
	login,
	updateProfile,
	checkAuth,
	sendResetOtp,
	resetPassword,
	logout,
} from "../controllers/userController.js"
import { protectRoute } from "../middleware/auth.js"

const userRouter = express.Router()

userRouter.post("/signup", signup)
userRouter.post("/login", login)
userRouter.put("/update-profile", protectRoute, updateProfile)
userRouter.get("/check", protectRoute, checkAuth)
userRouter.post("/logout", protectRoute, logout)
userRouter.post("/send-reset-otp", sendResetOtp)
userRouter.post("/reset-password", resetPassword)

export default userRouter
