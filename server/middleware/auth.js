import User from "../models/User.js"
import jwt from "jsonwebtoken"

// Middleware для защиты адресов
export const protectRoute = async (req, res, next) => {
	try {
		let token
		if (
			req.headers.authorization &&
			req.headers.authorization.startsWith("Bearer")
		) {
			token = req.headers.authorization.split(" ")[1]
		} else if (req.headers.token) {
			token = req.headers.token
		}
		const decoded = jwt.verify(token, process.env.JWT_SECRET)
		const user = await User.findById(decoded.userId).select("-password")
		if (!user)
			return res.json({ success: false, message: "Пользователь не найден" })

		req.user = user
		next()
	} catch (error) {
		console.log(error.message)
		res.json({ success: false, message: error.message })
	}
}
