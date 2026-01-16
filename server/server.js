import express from "express"
import "dotenv/config"
import cors from "cors"
import { Server } from "socket.io"
import http from "http"
import { connectDB } from "./lib/db.js"
import userRouter from "./routes/userRoutes.js"
import messageRouter from "./routes/messageRoutes.js"

// ГЛОБАЛЬНЫЕ ПЕРЕМЕННЫЕ
export const userSocketMap = {}
export let io = null

// Инициализация Express приложения
const app = express()

// Middleware (ПЕРЕД роутами!)
app.use(express.json({ limit: "4mb" }))
app.use(express.urlencoded({ extended: true }))
app.use(
	cors({
		origin: "*",
		credentials: true,
	})
)

// ✅ Routes (ПЕРЕД wildcard!)
app.use("/api/status", (req, res) => {
	res.json({
		success: true,
		message: "Проверка Успешна",
		timestamp: new Date().toISOString(),
	})
})

app.use("/api/auth", userRouter)
app.use("/api/messages", messageRouter)

// ✅ Wildcard ТОЛЬКО ПОСЛЕ всех роутов
app.use((req, res) => {
	res.status(404).json({
		success: false,
		error: `Route ${req.originalUrl} not found`,
	})
})

// Error handler (ПОСЛЕДНИЙ!)
app.use((err, req, res, next) => {
	console.error(err.stack)
	res.status(500).json({
		success: false,
		error: "Server Error",
	})
})

// ✅ MongoDB подключение
async function initApp() {
	try {
		await connectDB()
		console.log("✅ MongoDB подключен")
	} catch (error) {
		console.error("❌ MongoDB ошибка:", error.message)
	}
}

initApp().catch(console.error)

// ✅ Socket.io ТОЛЬКО ЛОКАЛЬНО (ES modules фикс)
if (process.env.NODE_ENV !== "production") {
	const httpServer = http.createServer(app) // ✅ import http вместо require

	io = new Server(httpServer, {
		cors: { origin: "*" },
		pingTimeout: 20000,
	})

	io.on("connection", socket => {
		const userId = socket.handshake.query.userId
		console.log("👤 Подключился:", userId)

		if (userId) {
			userSocketMap[userId.toString()] = socket.id
			io.emit("getOnlineUsers", Object.keys(userSocketMap))
		}

		socket.on("disconnect", () => {
			console.log("👤 Отключился:", userId)
			delete userSocketMap[userId.toString()]
			io.emit("getOnlineUsers", Object.keys(userSocketMap))
		})
	})

	const PORT = process.env.PORT || 5000
	httpServer.listen(PORT, () => {
		console.log("🚀 Сервер на порту " + PORT)
	})
}

// ✅ Vercel Serverless Export
export default app
