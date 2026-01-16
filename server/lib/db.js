import mongoose from "mongoose"

// Функция для подключения к БД MongoDB

export const connectDB = async () => {
	try {
		mongoose.connection.on("connected", () =>
			console.log("База данных доступна")
		)

		await mongoose.connect(`${process.env.MONGODB_URI}`)
	} catch (error) {
		console.log(error)
	}
}
