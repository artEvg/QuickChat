import {
	createContext,
	useContext,
	useState,
	useEffect,
	useCallback,
} from "react"
import { useAuth } from "../context/AuthContext.jsx"
import toast from "react-hot-toast"

export const ChatContext = createContext()

export const useChat = () => {
	const context = useContext(ChatContext)
	if (!context) {
		throw new Error("useChat must be used within ChatProvider")
	}
	return context
}

export const ChatProvider = ({ children }) => {
	const [messages, setMessages] = useState([])
	const [users, setUsers] = useState([])
	const [selectedUser, setSelectedUser] = useState(null)
	const [unseenMessages, setUnseenMessages] = useState({})
	const [chats, setChats] = useState([])

	// ✅ useAuth HOOK вместо useContext(AuthContext)
	const { user: authUser, backendUrl: api, socket } = useAuth()

	// ✅ Axios instance для запросов
	const apiCall = useCallback(
		async (method, url, data) => {
			try {
				const response = await fetch(`${api}${url}`, {
					method,
					headers: { "Content-Type": "application/json" },
					credentials: "include",
					...(data && { body: JSON.stringify(data) }),
				})
				return await response.json()
			} catch (error) {
				console.error("API Error:", error)
				throw error
			}
		},
		[api]
	)

	const getChats = async () => {
		try {
			const { data, success } = await apiCall("GET", "/messages/users")
			if (success) {
				setChats(
					data.users.map(user => ({
						_id: `chat_${user._id}`,
						members: [authUser?._id, user._id],
					}))
				)
			}
		} catch (error) {
			console.error("Ошибка загрузки чатов:", error)
			setChats([])
		}
	}

	// Получение пользователей
	const getUsers = async () => {
		try {
			const { data, success } = await apiCall("GET", "/messages/users")
			if (success) {
				setUsers(data.users)
				setUnseenMessages(data.unseenMessages || {})
				setChats(
					data.users.map(user => ({
						_id: `chat_${user._id}`,
						members: [authUser?._id, user._id],
					}))
				)
			}
		} catch (error) {
			toast.error(error.message || "Ошибка загрузки пользователей")
		}
	}

	// Получение сообщений
	const getMessages = async userId => {
		try {
			const { data, success } = await apiCall("GET", `/messages/${userId}`)
			if (success) {
				setMessages(data.messages)
			}
		} catch (error) {
			toast.error(error.message || "Ошибка загрузки сообщений")
		}
	}

	// Отправка сообщения
	const sendMessage = async messageData => {
		try {
			const { data, success } = await apiCall(
				"POST",
				`/messages/send/${selectedUser._id}`,
				messageData
			)
			if (success) {
				setMessages(prev => [...prev, data.newMessage])
			}
		} catch (error) {
			toast.error(error.message || "Ошибка отправки")
		}
	}

	// Socket подписка
	const subscribeToMessages = useCallback(() => {
		if (!socket) return

		const handleNewMessage = newMessage => {
			if (selectedUser && newMessage.senderId === selectedUser._id) {
				newMessage.seen = true
				setMessages(prev => [...prev, newMessage])
				apiCall("PUT", `/messages/mark/${newMessage._id}`).catch(console.error)
			} else {
				setUnseenMessages(prev => ({
					...prev,
					[newMessage.senderId]: (prev[newMessage.senderId] || 0) + 1,
				}))
			}
		}

		socket.on("newMessage", handleNewMessage)
		return () => socket.off("newMessage", handleNewMessage)
	}, [socket, selectedUser, apiCall])

	// ✅ Загрузка при монтировании
	useEffect(() => {
		if (authUser?._id) {
			getUsers()
		}
	}, [authUser?._id])

	// ✅ Socket подписка
	useEffect(() => {
		let unsubscribe
		if (socket) {
			unsubscribe = subscribeToMessages()
		}
		return unsubscribe
	}, [socket, subscribeToMessages])

	const value = {
		messages,
		users,
		selectedUser,
		unseenMessages,
		chats,
		getUsers,
		getChats,
		getMessages,
		sendMessage,
		setSelectedUser,
		setUnseenMessages,
	}

	return <ChatContext.Provider value={value}>{children}</ChatContext.Provider>
}
