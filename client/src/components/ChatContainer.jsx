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

	const [isRecording, setIsRecording] = useState(false)
	const [mediaRecorder, setMediaRecorder] = useState(null)
	const chunks = useRef([])

	// 🎵 Состояние аудио
	const audioRefs = useRef({})
	const [currentTimes, setCurrentTimes] = useState({})
	const [isPlaying, setIsPlaying] = useState({}) // ✅ Анимация волны

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

	// 🎤 Запись голосовых
	const startRecording = async () => {
		try {
			const stream = await navigator.mediaDevices.getUserMedia({
				audio: {
					echoCancellation: true,
					noiseSuppression: true,
					sampleRate: 44100,
				},
			})

			const recorder = new MediaRecorder(stream, {
				mimeType: "audio/webm;codecs=opus",
			})

			chunks.current = []

			recorder.ondataavailable = e => {
				if (e.data.size > 0) chunks.current.push(e.data)
			}

			recorder.onstop = async () => {
				const audioBlob = new Blob(chunks.current, {
					type: "audio/webm;codecs=opus",
				})

				const audioContext = new (window.AudioContext ||
					window.webkitAudioContext)()
				const arrayBuffer = await audioBlob.arrayBuffer()
				const audioBuffer = await audioContext.decodeAudioData(arrayBuffer)
				const duration = Math.round(audioBuffer.duration)

				const reader = new FileReader()
				reader.onloadend = async () => {
					try {
						await sendMessage({
							audio: reader.result,
							audioDuration: duration,
						})
					} catch (error) {
						toast.error("Ошибка отправки аудио")
					}
				}
				reader.readAsDataURL(audioBlob)

				stream.getTracks().forEach(track => track.stop())
				audioContext.close()
			}

			recorder.start(250)
			setMediaRecorder(recorder)
			setIsRecording(true)
		} catch (error) {
			toast.error("Микрофон недоступен")
		}
	}

	const stopRecording = () => {
		if (mediaRecorder && isRecording) {
			mediaRecorder.stop()
			setIsRecording(false)
			setMediaRecorder(null)
		}
	}

	// 🎵 Toggle play/pause + управление анимацией
	const togglePlayPause = msgId => {
		const audio = audioRefs.current[msgId]
		if (!audio) return

		if (audio.paused || audio.ended) {
			audio.play().catch(e => console.log("Play error:", e))
			setIsPlaying(prev => ({ ...prev, [msgId]: true }))
		} else {
			audio.pause()
			setIsPlaying(prev => ({ ...prev, [msgId]: false }))
		}
	}

	const formatTime = seconds => {
		if (!seconds || isNaN(seconds)) return "0:00"
		const mins = Math.floor(seconds / 60)
		const secs = Math.floor(seconds % 60)
		return `${mins}:${secs.toString().padStart(2, "0")}`
	}

	// 📊 Отслеживание времени + события аудио
	useEffect(() => {
		const handleTimeUpdate = msgId => {
			const audio = audioRefs.current[msgId]
			if (audio) {
				setCurrentTimes(prev => ({
					...prev,
					[msgId]: audio.currentTime,
				}))
			}
		}

		const handlePlay = msgId => {
			setIsPlaying(prev => ({ ...prev, [msgId]: true }))
		}

		const handlePause = msgId => {
			setIsPlaying(prev => ({ ...prev, [msgId]: false }))
		}

		const handleEnded = msgId => {
			setIsPlaying(prev => ({ ...prev, [msgId]: false }))
			setCurrentTimes(prev => ({ ...prev, [msgId]: 0 }))
		}

		messages.forEach(msg => {
			const msgId = msg._id || `msg-${messages.indexOf(msg)}`
			const audio = audioRefs.current[msgId]

			if (audio && msg.audio) {
				audio.removeEventListener("timeupdate", () => handleTimeUpdate(msgId))
				audio.removeEventListener("play", () => handlePlay(msgId))
				audio.removeEventListener("pause", () => handlePause(msgId))
				audio.removeEventListener("ended", () => handleEnded(msgId))

				audio.addEventListener("timeupdate", () => handleTimeUpdate(msgId))
				audio.addEventListener("play", () => handlePlay(msgId))
				audio.addEventListener("pause", () => handlePause(msgId))
				audio.addEventListener("ended", () => handleEnded(msgId))
			}
		})

		return () => {
			messages.forEach(msg => {
				const msgId = msg._id || `msg-${messages.indexOf(msg)}`
				const audio = audioRefs.current[msgId]
				if (audio) {
					audio.removeEventListener("timeupdate", () => {})
					audio.removeEventListener("play", () => {})
					audio.removeEventListener("pause", () => {})
					audio.removeEventListener("ended", () => {})
				}
			})
		}
	}, [messages])

	const handleSendMessage = async e => {
		e.preventDefault()
		if (input.trim() === "") return
		try {
			await sendMessage({ text: input.trim() })
			setInput("")
		} catch (error) {
			toast.error("Ошибка отправки")
		}
	}

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
				{messages.map((msg, index) => {
					const msgId = msg._id || `msg-${index}`
					const currentTime = currentTimes[msgId] || 0
					const totalDuration = msg.audioDuration || 0
					const progress = totalDuration
						? (currentTime / totalDuration) * 100
						: 0
					const playing = isPlaying[msgId] || false

					return (
						<div
							key={msgId}
							className={`flex w-full items-end gap-2 justify-end ${
								msg.senderId !== authUser._id && "flex-row-reverse"
							}`}>
							{msg.audio ? (
								<div className='w-[230px] p-3 bg-violet-500/30 rounded-lg mb-8'>
									<div className='bg-white/10 backdrop-blur-sm rounded-xl p-4 border border-white/20 hover:bg-white/15 transition-all'>
										{/* 🎵 ЗВУКОВАЯ ВОЛНА - АНИМИРУЕТСЯ при воспроизведении */}
										<div className='flex items-center justify-between mb-3'>
											<div
												className={`flex items-center gap-1 w-20 transition-all duration-300 ${
													playing ? "animate-pulse" : ""
												}`}>
												<div
													className={`w-1 h-[6px] bg-gradient-to-r from-violet-400 to-purple-500 rounded-full transition-all ${
														playing ? "animate-wave1" : "opacity-50"
													}`}
												/>
												<div
													className={`w-0.5 h-[10px] bg-violet-400/80 rounded-full transition-all ${
														playing ? "animate-wave2" : "opacity-50 scale-75"
													}`}
												/>
												<div
													className={`w-1.5 h-[8px] bg-purple-500/80 rounded-full transition-all ${
														playing ? "animate-wave3" : "opacity-50"
													}`}
												/>
												<div
													className={`w-0.5 h-[12px] bg-violet-400/70 rounded-full transition-all ${
														playing ? "animate-wave4" : "opacity-50 scale-75"
													}`}
												/>
												<div
													className={`w-1 h-[6px] bg-purple-500 rounded-full transition-all ${
														playing ? "animate-wave1 delay-200" : "opacity-50"
													}`}
												/>
											</div>
											<span className='text-xs text-gray-300 font-mono font-medium'>
												{formatTime(currentTime)} / {formatTime(totalDuration)}
											</span>
										</div>

										{/* 📊 ПРОГРЕСС */}
										<div className='relative mb-4'>
											<audio
												ref={el => {
													if (el) audioRefs.current[msgId] = el
												}}
												src={msg.audio}
												preload='metadata'
												className='absolute inset-0 w-full h-full opacity-0 pointer-events-none'
											/>
											<div className='w-full bg-white/10 rounded-full h-2 overflow-hidden cursor-pointer hover:bg-white/20 transition-all group'>
												<div
													className='h-full bg-gradient-to-r from-violet-400 via-purple-500 to-pink-500 rounded-full shadow-sm transition-all duration-300 ease-linear relative overflow-hidden'
													style={{ width: `${progress}%` }}
												/>
											</div>
										</div>

										{/* 🎮 PLAY/PAUSE */}
										<div className='flex items-center justify-center'>
											<button
												onClick={() => togglePlayPause(msgId)}
												className={`w-16 h-16 rounded-2xl flex items-center justify-center shadow-xl transition-all duration-200 hover:scale-110 backdrop-blur-sm border-2 ${
													playing
														? "bg-gradient-to-r from-red-500 to-pink-500 hover:from-red-600 hover:to-pink-600 border-red-400/50 shadow-red-500/25"
														: "bg-gradient-to-r from-violet-500 to-purple-600 hover:from-violet-600 hover:to-purple-700 border-white/30 shadow-purple-500/25 hover:shadow-2xl"
												}`}
												title={playing ? "Pause" : "Play"}>
												<svg
													className='w-8 h-8 text-white drop-shadow-lg transition-transform hover:scale-110'
													fill='currentColor'
													viewBox='0 0 20 20'>
													{playing ? (
														// ⏸️ PAUSE icon
														<path
															fillRule='evenodd'
															d='M18 10a8 8 0 11-16 0 8 8 0 0116 0zM7 8a1 1 0 012 0v4a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v4a1 1 0 102 0V8a1 1 0 00-1-1z'
															clipRule='evenodd'
														/>
													) : (
														// ▶️ PLAY icon
														<path
															fillRule='evenodd'
															d='M10 18a8 8 0 100-16 8 8 0 000 16zM9.555 7.168A1 1 0 008 8v4a1 1 0 001.555.832l3-2a1 1 0 000-1.664l-3-2z'
															clipRule='evenodd'
														/>
													)}
												</svg>
											</button>
										</div>
									</div>
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
					)
				})}
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
