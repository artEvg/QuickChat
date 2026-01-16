import cloudinary from "../lib/cloudinary.js"
import { generateToken } from "../lib/utils.js"
import User from "../models/User.js"
import bcrypt from "bcryptjs"
import nodemailer from "nodemailer"

// ✅ ПРАВИЛЬНАЯ настройка Nodemailer (createTransport НЕ createTransporter)
const transporter = nodemailer.createTransport({
	host: "smtp.yandex.ru",
	port: 587,
	secure: false,
	auth: {
		user: process.env.SMTP_USER,
		pass: process.env.SMTP_PASS,
	},
})

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

export const logout = async (req, res) => {
	try {
		res.clearCookie("token")
		res.json({ success: true, message: "Выход успешен" })
	} catch (error) {
		res.json({ success: false, message: error.message })
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

// 🔥 ОТПРАВКА КОДА СБРОСА ПАРОЛЯ
export const sendResetOtp = async (req, res) => {
	try {
		const { email } = req.body
		if (!email) {
			return res.json({ success: false, message: "Требуется email" })
		}

		const user = await User.findOne({ email })
		if (!user) {
			return res.json({ success: false, message: "Пользователь не найден" })
		}

		// Генерация 6-значного OTP
		const otp = String(Math.floor(100000 + Math.random() * 900000)).padStart(
			6,
			"0"
		)

		// Сохранение OTP в БД (15 минут)
		user.resetOtp = otp
		user.resetOtpExpireAt = Date.now() + 15 * 60 * 1000
		await user.save()

		// Красивый HTML шаблон прямо в коде
		const htmlTemplate = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="UTF-8">
        <title>Сброс пароля</title>
        <style>
          body { 
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; 
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); 
            padding: 20px; 
            margin: 0; 
          }
          .container { 
            max-width: 500px; 
            margin: 0 auto; 
            background: white; 
            border-radius: 20px; 
            box-shadow: 0 20px 40px rgba(0,0,0,0.1); 
            overflow: hidden; 
          }
          .header { 
            background: linear-gradient(135deg, #EF4444 0%, #DC2626 100%); 
            color: white; 
            padding: 30px; 
            text-align: center; 
          }
          .otp { 
            font-size: 36px; 
            font-weight: bold; 
            color: #EF4444; 
            letter-spacing: 10px; 
            padding: 25px; 
            background: #fee2e2; 
            border-radius: 15px; 
            text-align: center; 
            margin: 30px 40px; 
            box-shadow: 0 10px 20px rgba(239,68,68,0.2);
          }
          .content { padding: 40px; text-align: center; }
          .footer { 
            background: #f8fafc; 
            padding: 20px; 
            text-align: center; 
            color: #64748b; 
            font-size: 14px; 
          }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>🔐 Сброс пароля</h1>
          </div>
          <div class="content">
            <h2>Ваш код восстановления</h2>
            <p>Мы получили запрос на сброс пароля для аккаунта:</p>
            <p style="color: #374151; font-size: 16px;"><strong>${email}</strong></p>
            <div class="otp">${otp}</div>
            <p style="color: #64748b; font-size: 14px;">
              Этот код действителен в течение <strong>15 минут</strong>.<br>
              Не передавайте его третьим лицам.
            </p>
          </div>
          <div class="footer">
            Если вы не запрашивали сброс пароля, просто проигнорируйте это письмо.
          </div>
        </div>
      </body>
      </html>
    `

		const mailOptions = {
			from: `"Chat App" <${process.env.SENDER_EMAIL}>`,
			to: email,
			subject: "🔐 Сброс пароля - Ваш код подтверждения",
			html: htmlTemplate,
		}

		await transporter.sendMail(mailOptions)

		console.log(`✅ OTP ${otp} отправлен на ${email}`)

		res.json({
			success: true,
			message: "Код отправлен на вашу почту (проверьте папку Спам)",
		})
	} catch (error) {
		console.error("❌ SMTP Error:", error)
		res.json({
			success: false,
			message: "Ошибка отправки email. Проверьте настройки SMTP.",
		})
	}
}

// 🔥 СБРОС ПАРОЛЯ
export const resetPassword = async (req, res) => {
	try {
		const { email, otp, newPassword } = req.body

		if (!email || !otp || !newPassword) {
			return res.json({
				success: false,
				message: "Требуются все поля: email, код, пароль",
			})
		}

		if (newPassword.length < 6) {
			return res.json({
				success: false,
				message: "Пароль должен содержать минимум 6 символов",
			})
		}

		const user = await User.findOne({ email })
		if (!user) {
			return res.json({ success: false, message: "Пользователь не найден" })
		}

		// Проверка OTP
		if (!user.resetOtp || user.resetOtp !== otp) {
			return res.json({ success: false, message: "Неверный код подтверждения" })
		}

		// Проверка срока действия (15 минут)
		if (user.resetOtpExpireAt < Date.now()) {
			return res.json({
				success: false,
				message: "Код истек. Запросите новый.",
			})
		}

		// Хеширование нового пароля
		const salt = await bcrypt.genSalt(10)
		const hashedPassword = await bcrypt.hash(newPassword, salt)

		// Обновление пароля + очистка OTP
		user.password = hashedPassword
		user.resetOtp = undefined
		user.resetOtpExpireAt = undefined
		await user.save()

		console.log(`✅ Пароль успешно обновлен для ${email}`)

		res.json({
			success: true,
			message: "Пароль успешно обновлен! Теперь вы можете войти в аккаунт.",
		})
	} catch (error) {
		console.error("❌ Reset password error:", error)
		res.json({ success: false, message: error.message })
	}
}
