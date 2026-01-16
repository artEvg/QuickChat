import { createContext, useContext, useState, useEffect } from "react"
import { AuthContext } from "./AuthContext"
import toast from "react-hot-toast"

export const ChatContext = createContext()

export const ChatProvider = ({ children }) => {
	const [messages, setMessages] = useState([])
	const [users, setUsers] = useState([])
	const [selectedUser, setSelectedUser] = useState(null)
	const [unseenMessages, setUnseenMessages] = useState({})
	const { api, socket } = useContext(AuthContext) // ✅ api вместо axios

	// Получение пользователей
	const getUsers = async () => {
		try {
			const { data } = await api.get("/messages/users") // ✅ api с правильным baseURL
			if (data.success) {
				setUsers(data.users)
				setUnseenMessages(data.unseenMessages)
			}
		} catch (error) {
			toast.error(error.response?.data?.message || error.message)
		}
	}

	// Получение сообщений
	const getMessages = async userId => {
		try {
			const { data } = await api.get(`/messages/${userId}`)
			if (data.success) {
				setMessages(data.messages)
			}
		} catch (error) {
			toast.error(error.response?.data?.message || error.message)
		}
	}

	// Отправка сообщения
	const sendMessage = async messageData => {
		try {
			const { data } = await api.post(
				`/messages/send/${selectedUser._id}`,
				messageData
			)
			if (data.success) {
				setMessages(prev => [...prev, data.newMessage])
			}
		} catch (error) {
			toast.error(error.response?.data?.message || error.message)
		}
	}

	// Socket подписка
	const subscribeToMessages = () => {
		if (!socket) return

		socket.on("newMessage", newMessage => {
			if (selectedUser && newMessage.senderId === selectedUser._id) {
				newMessage.seen = true
				setMessages(prev => [...prev, newMessage])
				api.put(`/messages/mark/${newMessage._id}`).catch(console.error)
			} else {
				setUnseenMessages(prev => ({
					...prev,
					[newMessage.senderId]: (prev[newMessage.senderId] || 0) + 1,
				}))
			}
		})
	}

	const unsubscribeFromMessages = () => {
		if (socket) socket.off("newMessage")
	}

	useEffect(() => {
		subscribeToMessages()
		return unsubscribeFromMessages
	}, [socket, selectedUser])

	const value = {
		messages,
		users,
		selectedUser,
		unseenMessages,
		getUsers,
		getMessages,
		sendMessage,
		setSelectedUser,
		setUnseenMessages,
	}

	return <ChatContext.Provider value={value}>{children}</ChatContext.Provider>
}
