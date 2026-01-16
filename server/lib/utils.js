import jwt from "jsonwebtoken"

// Функция для генерации токена пользователя
export const generateToken = userId => {
	const token = jwt.sign({ userId }, process.env.JWT_SECRET)
	return token
}
