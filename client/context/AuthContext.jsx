import { createContext, useEffect, useState } from "react"
import axios from "axios"
import toast from "react-hot-toast"
import { io } from "socket.io-client"

const backendUrl =
	import.meta.env.VITE_BACKEND_URL ||
	"https://quick-chat-backend-psi-beryl.vercel.app/api"

// ✅ Создаем AXIOS INSTANCE с правильным baseURL
const api = axios.create({
	baseURL: backendUrl,
	headers: {
		"Content-Type": "application/json",
	},
})

// ✅ Interceptor для автоматического токена
api.interceptors.request.use(config => {
	const token = localStorage.getItem("token")
	if (token) {
		config.headers.Authorization = `Bearer ${token}`
	}
	return config
})

export const AuthContext = createContext()

export const AuthProvider = ({ children }) => {
	const [token, setToken] = useState(localStorage.getItem("token"))
	const [authUser, setAuthUser] = useState(null)
	const [onlineUsers, setOnlineUsers] = useState([])
	const [socket, setSocket] = useState(null)

	// Проверка авторизации
	const checkAuth = async () => {
		try {
			const { data } = await api.get("/auth/check")
			if (data.success) {
				setAuthUser(data.user)
				connectSocket(data.user)
			}
		} catch (error) {
			console.log("Auth check failed:", error.response?.data || error.message)
		}
	}

	// Логин/Регистрация
	const login = async (state, credentials) => {
		try {
			const { data } = await api.post(`/auth/${state}`, credentials)
			if (data.success) {
				setAuthUser(data.userData)
				localStorage.setItem("token", data.token)
				setToken(data.token)
				connectSocket(data.userData)
				toast.success(data.message)
				return data
			} else {
				toast.error(data.message)
			}
		} catch (error) {
			toast.error(error.response?.data?.message || error.message)
		}
	}

	// Выход
	const logout = async () => {
		try {
			await api.post("/auth/logout")
		} catch (error) {
			console.log("Logout error:", error)
		} finally {
			localStorage.removeItem("token")
			setToken(null)
			setAuthUser(null)
			setOnlineUsers([])
			if (socket) socket.disconnect()
			toast.success("Успешный выход")
		}
	}

	// Обновление профиля
	const updateProfile = async body => {
		try {
			const { data } = await api.put("/auth/update-profile", body)
			if (data.success) {
				setAuthUser(data.user)
				toast.success("Профиль успешно обновлен")
			}
		} catch (error) {
			toast.error(error.response?.data?.message || error.message)
		}
	}

	// Socket подключение
	const connectSocket = userData => {
		if (!userData || socket?.connected) return

		const socketUrl = backendUrl.replace("/api", "")
		console.log("🔌 Connecting socket to:", socketUrl)

		const newSocket = io(socketUrl, {
			query: { userId: userData._id },
			// ✅ КЛЮЧЕВОЕ: polling + websocket (Vercel fallback)
			transports: ["polling", "websocket"],
			timeout: 20000,
			reconnection: true,
			reconnectionAttempts: 5,
			reconnectionDelay: 1000,
			forceNew: true,
		})

		newSocket.on("connect", () => {
			console.log("✅ Socket connected:", newSocket.id)
		})

		newSocket.on("disconnect", reason => {
			console.log("🔌 Socket disconnected:", reason)
		})

		newSocket.on("connect_error", error => {
			console.log("⚠️ Socket error (fallback to polling):", error.message)
		})

		newSocket.on("getOnlineUsers", userIds => {
			console.log("👥 Online users:", userIds.length)
			setOnlineUsers(userIds)
		})

		setSocket(newSocket)
	}

	useEffect(() => {
		checkAuth()
	}, [])

	const value = {
		api, // ✅ Передаем api instance вместо axios
		authUser,
		onlineUsers,
		socket,
		login,
		logout,
		updateProfile,
	}

	return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}
