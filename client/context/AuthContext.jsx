import { createContext, useContext, useEffect, useState, useRef } from "react"
import axios from "axios"
import { io } from "socket.io-client"
import { useNavigate } from "react-router-dom"
import toast from "react-hot-toast"

// ✅ Context
export const AuthContext = createContext()

// ✅ Hook
export const useAuth = () => {
	const context = useContext(AuthContext)
	if (!context)
		throw new Error("useAuth must be used within AuthContextProvider")
	return context
}

// ✅ Provider (default export)
export default function AuthContextProvider({ children }) {
	const [user, setUser] = useState(null)
	const [loading, setLoading] = useState(true)
	const socket = useRef()
	const navigate = useNavigate()

	const backendUrl =
		import.meta.env.VITE_BACKEND_URL || "http://localhost:4000/api"

	axios.defaults.withCredentials = true
	axios.defaults.baseURL = backendUrl

	useEffect(() => {
		if (backendUrl.includes("localhost")) {
			socket.current = io(backendUrl.replace("/api", ""), {
				withCredentials: true,
			})
		}

		const savedUser = localStorage.getItem("chat-app-user")
		if (savedUser) {
			setUser(JSON.parse(savedUser))
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
		checkAuthStatus()

		return () => {
			if (socket.current) socket.current.disconnect()
		}
	}, [])

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
		} catch (error) {
			console.error("Logout error:", error)
		} finally {
			setUser(null)
			localStorage.removeItem("chat-app-user")
			if (socket.current) socket.current.disconnect()
			navigate("/")
		}
	}

	return (
		<AuthContext.Provider
			value={{
				user,
				login,
				logout,
				loading,
				socket: socket.current,
				backendUrl,
				onlineUsers: [],
			}}>
			{children}
		</AuthContext.Provider>
	)
}
