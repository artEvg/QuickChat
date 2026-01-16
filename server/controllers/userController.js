import cloudinary from "../lib/cloudinary.js"
import { generateToken } from "../lib/utils.js"
import User from "../models/User.js"
import bcrypt from "bcryptjs"

// Регистрация нового пользователя
export const signup = async (req, res) => {
	const { fullName, email, password, bio } = req.body

	try {
		if (!fullName || !email || !password || !bio) {
			return res.json({ success: false, message: "Данные отсутствуют" })
		}
		const user = await User.findOne({ email })

		if (user) {
			return res.json({ success: false, message: "Аккаунт уже существует" })
		}

		const salt = await bcrypt.genSalt(10)
		const hashedPassword = await bcrypt.hash(password, salt)

		const newUser = await User.create({
			fullName,
			email,
			password: hashedPassword,
			bio,
		})

		const token = generateToken(newUser._id)
		res.json({
			success: true,
			userData: newUser,
			token,
			message: "Аккаунт успешно создан",
		})
	} catch (error) {
		console.log(error)
		res.json({
			success: false,
			message: error.message,
		})
	}
}

// Авторизация пользователя
export const login = async (req, res) => {
	try {
		const { email, password } = req.body
		const userData = await User.findOne({ email })

		if (!userData) {
			return res.json({ success: false, message: "Пользователь не найден" })
		}

		const isPasswordCorrect = await bcrypt.compare(password, userData.password)

		if (!isPasswordCorrect) {
			return res.json({ success: false, message: "Неверные данные" })
		}

		const token = generateToken(userData._id)

		res.json({
			success: true,
			userData,
			token,
			message: "Успешный вход",
		})
	} catch (error) {
		console.log(error)
		res.json({
			success: false,
			message: error.message,
		})
	}
}

// Проверка авторизован ли пользователь
export const checkAuth = (req, res) => {
	res.json({ success: true, user: req.user })
}

// Обновление данных профиля
export const updateProfile = async (req, res) => {
	try {
		const { profilePic, bio, fullName } = req.body
		const userId = req.user._id
		let updatedUser

		if (!profilePic) {
			updatedUser = await User.findByIdAndUpdate(
				userId,
				{ bio, fullName },
				{ new: true }
			)
		} else {
			const upload = await cloudinary.uploader.upload(profilePic)
			updatedUser = await User.findByIdAndUpdate(
				userId,
				{
					profilePic: upload.secure_url,
					bio,
					fullName,
				},
				{ new: true }
			)
		}
		res.json({ success: true, user: updatedUser })
	} catch (error) {
		console.log(error)
		res.json({
			success: false,
			message: error.message,
		})
	}
}
