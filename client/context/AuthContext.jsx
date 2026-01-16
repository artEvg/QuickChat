// AuthContext.jsx - ПОЛНАЯ ВЕРСИЯ
import { createContext, useContext, useEffect, useState, useRef } from "react"
import axios from "axios"
import { io } from "socket.io-client"
import { useNavigate } from "react-router-dom"

const AuthContext = createContext()

export const useAuth = () => useContext(AuthContext)

export default function AuthContextProvider({ children }) {
	const [user, setUser] = useState(null)
	const [loading, setLoading] = useState(true)
	const socket = useRef()
	const navigate = useNavigate()

	// ✅ ЛОКАЛЬНЫЙ URL ТОЛЬКО
	const backendUrl =
		import.meta.env.VITE_BACKEND_URL || "http://localhost:4000/api"

	axios.defaults.withCredentials = true
	axios.defaults.baseURL = backendUrl

	// ✅ Socket.IO - ТОЛЬКО ЛОКАЛЬНО
	useEffect(() => {
		if (!socket.current) {
			socket.current = io(backendUrl.replace("/api", ""), {
				withCredentials: true,
				auth: { userId: user?._id },
			})

			socket.current.on("connect", () => {
				console.log("✅ Socket connected:", socket.current.id)
			})

			socket.current.on("connect_error", error => {
				console.warn("⚠️ Socket error (fallback to polling):", error.message)
			})
		}

		return () => {
			if (socket.current) {
				socket.current.disconnect()
			}
		}
	}, [backendUrl])

	const login = async (endpoint, credentials) => {
		try {
			const { data } = await axios.post(`/user/${endpoint}`, credentials)
			if (data.success) {
				setUser(data.userData)
				localStorage.setItem("chat-app-user", JSON.stringify(data.userData))
				toast.success(data.message)
				navigate("/dashboard")
			}
		} catch (error) {
			toast.error(error.response?.data?.message || "Ошибка авторизации")
		}
	}

	const logout = async () => {
		try {
			await axios.post("/user/logout")
			setUser(null)
			localStorage.removeItem("chat-app-user")
			if (socket.current) socket.current.disconnect()
			toast.success("Выход выполнен")
			navigate("/")
		} catch (error) {
			console.error("Logout error:", error)
			// Принудительный выход даже при ошибке
			setUser(null)
			localStorage.removeItem("chat-app-user")
			if (socket.current) socket.current.disconnect()
			navigate("/")
		}
	}

	const checkAuthStatus = async () => {
		try {
			const { data } = await axios.get("/user/check")
			if (data.success) {
				setUser(data.user)
				localStorage.setItem("chat-app-user", JSON.stringify(data.user))
			}
		} catch (error) {
			console.log("Not authenticated")
		} finally {
			setLoading(false)
		}
	}

	useEffect(() => {
		const savedUser = localStorage.getItem("chat-app-user")
		if (savedUser) {
			setUser(JSON.parse(savedUser))
		}
		checkAuthStatus()
	}, [])

	return (
		<AuthContext.Provider
			value={{
				user,
				login,
				logout,
				loading,
				socket: socket.current,
				backendUrl,
			}}>
			{children}
		</AuthContext.Provider>
	)
}
