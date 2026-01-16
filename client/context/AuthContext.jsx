import { createContext, useContext, useEffect, useState, useRef } from "react"
import axios from "axios"
import { io } from "socket.io-client"
import { useNavigate } from "react-router-dom"
import toast from "react-hot-toast"

export const AuthContext = createContext()

export const useAuth = () => {
	const context = useContext(AuthContext)
	if (!context)
		throw new Error("useAuth must be used within AuthContextProvider")
	return context
}

export default function AuthContextProvider({ children }) {
	const [user, setUser] = useState(null)
	const [loading, setLoading] = useState(true)
	const socket = useRef()
	const navigate = useNavigate()

	// ✅ Backend URL
	const backendUrl =
		import.meta.env.VITE_BACKEND_URL || "http://localhost:4000/api"

	axios.defaults.withCredentials = true
	axios.defaults.baseURL = backendUrl

	// Socket.IO
	useEffect(() => {
		if (backendUrl.includes("localhost")) {
			// ✅ Только локально
			socket.current = io(backendUrl.replace("/api", ""), {
				withCredentials: true,
				auth: { userId: user?._id },
			})

			socket.current.on("connect", () => {
				console.log("✅ Socket connected:", socket.current.id)
			})
		}

		return () => {
			if (socket.current) socket.current.disconnect()
		}
	}, [backendUrl])

	const login = async credentials => {
		try {
			const { data } = await axios.post("/user/login", credentials)
			if (data.success) {
				setUser(data.userData)
				localStorage.setItem("chat-app-user", JSON.stringify(data.userData))
				toast.success(data.message)
				navigate("/dashboard")
			}
		} catch (error) {
			toast.error(error.response?.data?.message || "Ошибка входа")
		}
	}

	const signup = async credentials => {
		try {
			const { data } = await axios.post("/user/signup", credentials)
			if (data.success) {
				setUser(data.userData)
				localStorage.setItem("chat-app-user", JSON.stringify(data.userData))
				toast.success(data.message)
				navigate("/dashboard")
			}
		} catch (error) {
			toast.error(error.response?.data?.message || "Ошибка регистрации")
		}
	}

	const logout = async () => {
		try {
			await axios.post("/user/logout")
		} catch (error) {
			console.error("Logout error:", error)
		} finally {
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
		checkAuthStatus()
	}, [])

	const value = {
		user,
		login,
		signup,
		logout,
		loading,
		socket: socket.current,
		backendUrl,
	}

	return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}
