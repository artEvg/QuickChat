import express from "express"
import "dotenv/config"
import cors from "cors"
import http from "http"
import { Server } from "socket.io"
import { connectDB } from "./lib/db.js"
import userRouter from "./routes/userRoutes.js"
import messageRouter from "./routes/messageRoutes.js"

// Создание приложения и http сервера
const app = express()
const server = http.createServer(app)

// Socket.io инициализация
export const io = new Server(server, {
	pingTimeout: 20000,
	cors: {
		origin: "*",
	},
})

// Онлайн пользователи
export const userSocketMap = {}

// Подключение Socket.io
io.on("connection", socket => {
	const userId = socket.handshake.query.userId
	console.log("Пользователь подключился", userId)

	if (userId) userSocketMap[userId.toString()] = socket.id

	// Оповещение онлайн-пользователей для всех подключенных клиентов
	io.emit("getOnlineUsers", Object.keys(userSocketMap))
	socket.on("disconnect", () => {
		console.log("Пользователь Отключился", userId)
		delete userSocketMap[userId.toString()]
		io.emit("getOnlineUsers", Object.keys(userSocketMap))
	})
})

// Middleware установка
app.use(express.json({ limit: "4mb" }))
app.use(cors())

// Пути адресов
app.use("/api/status", (req, res) => res.send("Проверка Успешна"))
app.use("/api/auth", userRouter)
app.use("/api/messages", messageRouter)

// Подключение MongoDB
await connectDB()

const PORT = process.env.PORT || 5000
server.listen(PORT, () => console.log("Сервер запущен на порту " + PORT))
