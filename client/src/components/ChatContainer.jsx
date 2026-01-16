import { useEffect, useRef, useState, useCallback } from "react"
import assets from "../assets/assets.js"
import { formatMessageTime } from "../lib/utils.js"
import { useContext } from "react"
import { ChatContext } from "../../context/ChatContext.jsx"
import { AuthContext } from "../../context/AuthContext.jsx"
import toast from "react-hot-toast"

const ChatContainer = () => {
	const { messages, selectedUser, setSelectedUser, sendMessage, getMessages } =
		useContext(ChatContext)
	const { authUser } = useContext(AuthContext)
	const scrollEnd = useRef()
	const [input, setInput] = useState("")

	// 🎤 Голосовые сообщения
	const [isRecording, setIsRecording] = useState(false)
	const [mediaRecorder, setMediaRecorder] = useState(null)
	const chunks = useRef([])

	// 🔥 АВТО-ОБНОВЛЕНИЕ каждые 3 сек
	const pollMessages = useCallback(async () => {
		if (selectedUser?._id) {
			try {
				await getMessages(selectedUser._id)
			} catch (error) {
				console.log("Poll error:", error)
			}
		}
	}, [selectedUser?._id, getMessages])

	useEffect(() => {
		let interval
		if (selectedUser?._id) {
			interval = setInterval(pollMessages, 3000)
		}
		return () => {
			if (interval) clearInterval(interval)
		}
	}, [pollMessages])

	// 🎤 НАЧАЛО записи
	const startRecording = async () => {
		try {
			const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
			const recorder = new MediaRecorder(stream)
			chunks.current = []

			recorder.ondataavailable = e => chunks.current.push(e.data)
			recorder.onstop = async () => {
				const audioBlob = new Blob(chunks.current, { type: "audio/webm" })
				const reader = new FileReader()
				reader.onloadend = async () => {
					await sendMessage({ audio: reader.result })
				}
				reader.readAsDataURL(audioBlob)
				stream.getTracks().forEach(track => track.stop())
			}

			recorder.start()
			setMediaRecorder(recorder)
			setIsRecording(true)
		} catch (error) {
			toast.error("Микрофон недоступен")
		}
	}

	// 🎤 СТОП записи
	const stopRecording = () => {
		if (mediaRecorder && isRecording) {
			mediaRecorder.stop()
			setIsRecording(false)
			setMediaRecorder(null)
		}
	}

	// Отправка текста
	const handleSendMessage = async e => {
		e.preventDefault()
		if (input.trim() === "") return null

		try {
			await sendMessage({ text: input.trim() })
			setInput("")
		} catch (error) {
			toast.error("Ошибка отправки")
		}
	}

	// Отправка изображения
	const handleSendImage = async e => {
		const file = e.target.files[0]
		if (!file || !file.type.startsWith("image/")) {
			toast.error("Выберите Изображение")
			return
		}
		const reader = new FileReader()

		reader.onloadend = async () => {
			try {
				await sendMessage({ image: reader.result })
				e.target.value = ""
			} catch (error) {
				toast.error("Ошибка изображения")
			}
		}
		reader.readAsDataURL(file)
	}

	useEffect(() => {
		if (selectedUser) {
			getMessages(selectedUser._id)
		}
	}, [selectedUser])

	useEffect(() => {
		if (scrollEnd.current && messages) {
			scrollEnd.current.scrollIntoView({ behavior: "smooth" })
		}
	}, [messages])

	return selectedUser ? (
		<div className='w-full overflow-scroll relative backdrop-blur-lg'>
			<div className='flex items-center gap-3 py-3 mx-4 border-b border-stone-500'>
				<img
					className='w-8 rounded-full'
					src={selectedUser.profilePic || assets.avatar_icon}
					alt='profile image'
				/>
				<p className='flex-1 text-lg text-white flex items-center gap-2'>
					{selectedUser.fullName}
				</p>
				<img
					onClick={() => setSelectedUser(null)}
					className='md:hidden max-w-7'
					src={assets.arrow_icon}
					alt='arrow icon'
				/>
				<img
					className='max-md:hidden max-w-5'
					src={assets.help_icon}
					alt='help icon'
				/>
			</div>
			<div className='flex flex-col items-center h-[calc(100%-120px)] overflow-y-scroll p-3 pb-6'>
				{messages.map((msg, index) => (
					<div
						key={msg._id || `msg-${index}`}
						className={`flex w-full items-end gap-2 justify-end ${
							msg.senderId !== authUser._id && "flex-row-reverse"
						}`}>
						{msg.audio ? (
							// 🎤 АУДИО
							<div className='w-[230px] p-3 bg-violet-500/30 rounded-lg mb-8'>
								<audio
									controls
									className='w-full h-12'
									src={msg.audio}
								/>
							</div>
						) : msg.image ? (
							<img
								className='w-[230px] border-gray-700 rounded-lg overflow-hidden mb-8'
								src={msg.image}
								alt='Image'
							/>
						) : (
							<p
								className={`p-2 w-[200px] md:text-sm font-light rounded-lg mb-8 break-all bg-violet-500/30 text-white ${
									msg.senderId !== authUser._id
										? "rounded-br-none"
										: "rounded-bl-none"
								}`}>
								{msg.text}
							</p>
						)}
						<div className='text-center text-xs'>
							<img
								className='w-7 rounded-full'
								src={
									msg.senderId === authUser._id
										? authUser?.profilePic || assets.avatar_icon
										: selectedUser.profilePic || assets.avatar_icon
								}
								alt='profile image'
							/>
							<p className='text-gray-500'>
								{formatMessageTime(msg.createdAt)}
							</p>
						</div>
					</div>
				))}
				<div ref={scrollEnd}></div>
			</div>
			<form onSubmit={handleSendMessage}>
				<div className='absolute bottom-0 left-0 right-0 flex items-center gap-3 p-3'>
					<div className='flex-1 flex items-center bg-gray-100/12 px-3 rounded-full'>
						<input
							onChange={e => setInput(e.target.value)}
							value={input}
							onKeyDown={e => (e.key === "Enter" ? handleSendMessage(e) : null)}
							className='flex-1 text-sm p-3 border-none rounded-lg outline-none text-white placeholder-gray-400'
							type='text'
							placeholder='Отправить сообщение'
						/>
						<input
							onChange={handleSendImage}
							type='file'
							id='image'
							accept='image/png, image/jpeg'
							hidden
						/>
						<label htmlFor='image'>
							<img
								className='w-5 mr-2 cursor-pointer'
								src={assets.gallery_icon}
								alt='Gallery icon'
							/>
						</label>
						{/* 🎤 МИКРОФОН */}
						<button
							type='button'
							onMouseDown={startRecording}
							onMouseUp={stopRecording}
							onTouchStart={startRecording}
							onTouchEnd={stopRecording}
							className={`w-10 h-10 rounded-full flex items-center justify-center ml-2 transition-all ${
								isRecording
									? "bg-red-500 shadow-lg shadow-red-500/50"
									: "bg-violet-500/50 hover:bg-violet-500"
							}`}>
							<div
								className={`w-5 h-5 rounded-full transition-all ${
									isRecording ? "scale-125 bg-white animate-pulse" : "bg-white"
								}`}
							/>
						</button>
					</div>
					<button type='submit'>
						<img
							className='w-7 cursor-pointer'
							src={assets.send_button}
							alt='send button'
						/>
					</button>
				</div>
			</form>
		</div>
	) : (
		<div className='flex flex-col items-center justify-center g2 text-gray-500 bg-white/10 max-md:hidden'>
			<img
				className='max-w-16'
				src={assets.logo_icon}
				alt='logo icon'
			/>
			<p className='text-lg font-medium text-white'>
				Общайтесь всегда и везде !
			</p>
		</div>
	)
}

export default ChatContainer
