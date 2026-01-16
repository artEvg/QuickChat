import { useEffect, useRef, useState, useCallback } from "react"
import assets from "../assets/assets.js"
import { formatMessageTime } from "../lib/utils.js"
import { useContext } from "react"
import { ChatContext } from "../../context/ChatContext.jsx"
import { AuthContext } from "../../context/AuthContext.jsx"
import toast from "react-hot-toast"

const ChatContainer = () => {
	const {
		messages,
		selectedUser,
		setSelectedUser,
		sendMessage,
		getMessages,
		unseenMessages,
		setUnseenMessages,
	} = useContext(ChatContext)

	const { authUser } = useContext(AuthContext)
	const scrollEnd = useRef()
	const [input, setInput] = useState("")
	const [isTyping, setIsTyping] = useState(false)

	// 🔥 АВТО-ОБНОВЛЕНИЕ каждые 3 секунды
	const pollMessages = useCallback(async () => {
		if (selectedUser?._id && !isTyping) {
			try {
				await getMessages(selectedUser._id)
			} catch (error) {
				console.log("Poll error:", error)
			}
		}
	}, [selectedUser?._id, getMessages, isTyping])

	// ✅ Polling каждые 3 сек
	useEffect(() => {
		let interval
		if (selectedUser?._id) {
			interval = setInterval(pollMessages, 3000)
		}
		return () => {
			if (interval) clearInterval(interval)
		}
	}, [pollMessages])

	// ✅ Загрузка при смене пользователя
	useEffect(() => {
		if (selectedUser?._id) {
			getMessages(selectedUser._id)
		}
	}, [selectedUser?._id, getMessages])

	// ✅ Авто-скролл вниз
	useEffect(() => {
		if (scrollEnd.current) {
			scrollEnd.current.scrollIntoView({ behavior: "smooth" })
		}
	}, [messages])

	// ✅ Отправка текста
	const handleSendMessage = async e => {
		e.preventDefault()
		if (!input.trim()) return

		setIsTyping(true)
		try {
			await sendMessage({ text: input.trim() })
			setInput("")
		} catch (error) {
			toast.error("Ошибка отправки")
		} finally {
			setTimeout(() => setIsTyping(false), 1000)
		}
	}

	// ✅ Отправка изображения
	const handleSendImage = async e => {
		const file = e.target.files[0]
		if (!file || !file.type.startsWith("image/")) {
			toast.error("Выберите изображение")
			return
		}

		setIsTyping(true)
		const reader = new FileReader()
		reader.onloadend = async () => {
			try {
				await sendMessage({ image: reader.result })
				e.target.value = ""
			} catch (error) {
				toast.error("Ошибка отправки изображения")
			} finally {
				setTimeout(() => setIsTyping(false), 1000)
			}
		}
		reader.readAsDataURL(file)
	}

	if (!selectedUser) {
		return (
			<div className='flex flex-col items-center justify-center gap-2 text-gray-500 bg-white/10 max-md:hidden h-full'>
				<img
					className='max-w-16 opacity-70'
					src={assets.logo_icon}
					alt='logo icon'
				/>
				<p className='text-lg font-medium text-white'>
					Общайтесь всегда и везде!
				</p>
			</div>
		)
	}

	return (
		<div className='w-full h-full flex flex-col backdrop-blur-lg'>
			{/* Header */}
			<div className='flex items-center gap-3 py-4 px-4 border-b border-stone-500/50 bg-black/20 backdrop-blur-sm'>
				<img
					className='w-10 h-10 rounded-full object-cover ring-2 ring-violet-500/30'
					src={selectedUser.profilePic || assets.avatar_icon}
					alt='profile image'
				/>
				<div className='flex-1 min-w-0'>
					<p className='text-lg font-medium text-white truncate'>
						{selectedUser.fullName}
					</p>
					<p className='text-xs text-gray-400'>Чат обновляется автоматически</p>
				</div>
				<img
					onClick={() => setSelectedUser(null)}
					className='md:hidden w-6 h-6 cursor-pointer opacity-70 hover:opacity-100 transition-all'
					src={assets.arrow_icon}
					alt='back'
				/>
				<img
					className='max-md:hidden w-5 h-5 opacity-50 hover:opacity-100 cursor-pointer transition-all'
					src={assets.help_icon}
					alt='help'
				/>
			</div>

			{/* Messages */}
			<div className='flex-1 flex flex-col overflow-hidden'>
				<div className='flex-1 overflow-y-auto p-4 pb-20 space-y-4'>
					{messages.length === 0 ? (
						<div className='flex flex-col items-center justify-center h-full text-gray-400'>
							<p className='text-lg'>Начните переписку</p>
							<p className='text-sm mt-1'>Сообщения появляются автоматически</p>
						</div>
					) : (
						messages.map((msg, index) => (
							<div
								key={msg._id || `msg-${index}`}
								className={`flex w-full items-end gap-3 ${
									msg.senderId !== authUser?._id && "flex-row-reverse"
								}`}>
								{msg.image ? (
									<img
										className='max-w-xs md:max-w-md max-h-64 w-auto h-auto rounded-2xl object-cover shadow-lg ring-1 ring-white/20'
										src={msg.image}
										alt='Image'
									/>
								) : (
									<div
										className={`max-w-xs md:max-w-md p-4 rounded-2xl shadow-lg ring-1 ring-white/20 break-words text-sm ${
											msg.senderId === authUser?._id
												? "bg-gradient-to-r from-violet-500/90 to-purple-600/90 rounded-bl-none"
												: "bg-white/10 rounded-br-none backdrop-blur-sm"
										}`}>
										<p className='text-white'>{msg.text}</p>
									</div>
								)}
								<div className='flex flex-col items-center gap-1 w-10 flex-shrink-0'>
									<img
										className='w-9 h-9 rounded-full object-cover ring-2 ring-white/30'
										src={
											msg.senderId === authUser?._id
												? authUser?.profilePic || assets.avatar_icon
												: selectedUser.profilePic || assets.avatar_icon
										}
										alt='avatar'
									/>
									<p className='text-xs text-gray-400'>
										{formatMessageTime(msg.createdAt)}
									</p>
								</div>
							</div>
						))
					)}
					<div ref={scrollEnd} />

					{/* 🔥 "печатает..." анимация */}
					{isTyping && (
						<div className='flex items-center gap-3 py-4'>
							<div className='flex gap-1'>
								<div className='w-3 h-3 bg-violet-400/50 rounded-full animate-bounce'></div>
								<div
									className='w-3 h-3 bg-violet-400/50 rounded-full animate-bounce'
									style={{ animationDelay: "0.1s" }}></div>
								<div
									className='w-3 h-3 bg-violet-400/50 rounded-full animate-bounce'
									style={{ animationDelay: "0.2s" }}></div>
							</div>
							<p className='text-sm text-gray-400'>печатает...</p>
						</div>
					)}
				</div>
			</div>

			{/* Input */}
			<form
				onSubmit={handleSendMessage}
				className='p-4 bg-black/20 backdrop-blur-sm border-t border-stone-500/30'>
				<div className='flex items-center gap-3'>
					<input
						onChange={e => setInput(e.target.value)}
						value={input}
						onKeyDown={e =>
							e.key === "Enter" && !e.shiftKey && handleSendMessage(e)
						}
						className='flex-1 bg-white/10 backdrop-blur-sm px-5 py-3 rounded-2xl border border-white/20 outline-none text-white placeholder-gray-300 text-sm resize-none max-h-20'
						type='text'
						placeholder='Напишите сообщение...'
						disabled={isTyping}
					/>

					<label className='w-12 h-12 flex items-center justify-center bg-white/10 rounded-2xl border border-white/20 cursor-pointer hover:bg-white/20 transition-all'>
						<input
							onChange={handleSendImage}
							type='file'
							id='image'
							accept='image/png, image/jpeg, image/gif'
							className='hidden'
							disabled={isTyping}
						/>
						<img
							className='w-6 h-6 opacity-80'
							src={assets.gallery_icon}
							alt='gallery'
						/>
					</label>

					<button
						type='submit'
						disabled={!input.trim() || isTyping}
						className={`w-12 h-12 rounded-2xl flex items-center justify-center transition-all ${
							input.trim() && !isTyping
								? "bg-gradient-to-r from-violet-500 to-purple-600 shadow-lg hover:shadow-xl hover:scale-105"
								: "bg-white/10 opacity-50 cursor-not-allowed"
						}`}>
						<img
							className={`w-6 h-6 transition-transform ${
								input.trim() && !isTyping ? "rotate-0" : "rotate-45"
							}`}
							src={assets.send_button}
							alt='send'
						/>
					</button>
				</div>
			</form>
		</div>
	)
}

export default ChatContainer
