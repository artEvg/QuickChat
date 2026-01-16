import { useContext, useState, useEffect, useMemo, useCallback } from "react"
import assets from "../assets/assets.js"
import { useNavigate } from "react-router-dom"
import { AuthContext } from "../../context/AuthContext"
import { ChatContext } from "../../context/ChatContext"

const Sidebar = () => {
	const {
		getUsers,
		users,
		selectedUser,
		setSelectedUser,
		unseenMessages,
		setUnseenMessages,
		messages,
	} = useContext(ChatContext)

	const { logout, authUser } = useContext(AuthContext)

	const [input, setInput] = useState("")
	const [showMenu, setShowMenu] = useState(false)

	// 🔥 localStorage для истории чатов
	const [usersYouWroteTo, setUsersYouWroteTo] = useState(() => {
		try {
			const saved = localStorage.getItem("chatHistory")
			return new Set(saved ? JSON.parse(saved) : [])
		} catch {
			return new Set()
		}
	})

	const navigate = useNavigate()

	// ✅ СОХРАНЕНИЕ в localStorage
	useEffect(() => {
		try {
			localStorage.setItem(
				"chatHistory",
				JSON.stringify(Array.from(usersYouWroteTo))
			)
		} catch (error) {
			console.log("localStorage save error:", error)
		}
	}, [usersYouWroteTo])

	// ✅ 1. Пользователи с перепиской
	const usersWithYourMessages = useMemo(() => {
		console.log("🔍 DEBUG:", {
			totalUsers: users.length,
			chatHistory: Array.from(usersYouWroteTo),
			unseenCount: Object.values(unseenMessages).filter(n => n > 0).length,
		})

		return users.filter(user => {
			if (!user._id || user._id === authUser?._id) return false

			const hasUnseenFromThem = unseenMessages[user._id] > 0
			const youWroteToThem = usersYouWroteTo.has(user._id)
			const isCurrentChat = selectedUser?._id === user._id

			return hasUnseenFromThem || youWroteToThem || isCurrentChat
		})
	}, [users, unseenMessages, usersYouWroteTo, selectedUser, authUser])

	// ✅ 2. Все пользователи для поиска
	const allUsersForSearch = useMemo(
		() => users.filter(user => user._id !== authUser?._id),
		[users, authUser]
	)

	// ✅ 3. Фильтр поиска
	const filteredUsers = useMemo(() => {
		if (!input.trim()) return usersWithYourMessages

		const searchTerm = input.toLowerCase()
		const chatMatches = usersWithYourMessages.filter(user =>
			user.fullName?.toLowerCase().includes(searchTerm)
		)
		const otherMatches = allUsersForSearch
			.filter(user => !usersWithYourMessages.some(u => u._id === user._id))
			.filter(user => user.fullName?.toLowerCase().includes(searchTerm))

		return [...chatMatches, ...otherMatches]
	}, [input, usersWithYourMessages, allUsersForSearch])

	// ✅ Обработка клика
	const handleSelectUser = useCallback(
		user => {
			setSelectedUser(user)
			setUnseenMessages(prev => ({ ...prev, [user._id]: 0 }))

			if (!usersYouWroteTo.has(user._id)) {
				setUsersYouWroteTo(prev => new Set([...prev, user._id]))
			}

			if (input) setInput("")
		},
		[input, usersYouWroteTo, setSelectedUser, setUnseenMessages]
	)

	// ✅ Загрузка пользователей
	useEffect(() => {
		getUsers()
	}, [])

	return (
		<div
			className={`bg-[#8185B2]/10 h-full p-5 rounded-r-xl overflow-y-scroll text-white ${
				selectedUser ? "max-md:hidden" : ""
			}`}>
			{/* Header */}
			<div className='pb-5'>
				<div className='flex justify-between items-center'>
					<img
						src={assets.logo}
						alt='logo'
						className='max-w-40 cursor-pointer'
					/>
					<div className='relative py-2'>
						<img
							src={assets.menu_icon}
							alt='menu'
							className='max-h-5 cursor-pointer'
							onClick={() => setShowMenu(prev => !prev)}
						/>
						{showMenu && (
							<div className='absolute top-full right-0 z-20 w-32 p-5 rounded-md bg-[#282142] border border-gray-600 text-gray-100'>
								<p
									onClick={() => {
										navigate("/profile")
										setShowMenu(false)
									}}
									className='cursor-pointer text-sm'>
									Изменить
								</p>
								<hr className='my-2 border-t border-gray-500' />
								<p
									onClick={() => {
										logout()
										setShowMenu(false)
									}}
									className='cursor-pointer text-sm'>
									Выйти
								</p>
							</div>
						)}
					</div>
				</div>
				<div className='bg-[#282142] rounded-full flex items-center gap-2 py-3 px-4 mt-5'>
					<img
						src={assets.search_icon}
						alt='search'
						className='w-3'
					/>
					<input
						value={input}
						onChange={e => setInput(e.target.value)}
						className='bg-transparent border-none outline-none text-white text-sm placeholder-[#c8c8c8] flex-1'
						placeholder='🔍 Найти пользователя...'
					/>
				</div>
			</div>

			<div className='flex flex-col'>
				{filteredUsers.length > 0 ? (
					filteredUsers.map(user => {
						const hasChat = usersWithYourMessages.some(u => u._id === user._id)
						return (
							<div
								key={user._id}
								onClick={() => handleSelectUser(user)}
								className={`relative flex items-center gap-2 p-2 pl-4 rounded cursor-pointer max-sm:text-sm transition-all hover:bg-[#282142]/30 ${
									selectedUser?._id === user._id ? "bg-[#282142]/50" : ""
								}`}>
								<img
									src={user?.profilePic || assets.avatar_icon}
									alt='user'
									className='w-[35px] aspect-[1/1] rounded-full ring-1 ring-transparent hover:ring-violet-500/50'
								/>
								<div className='flex flex-col leading-5 flex-1'>
									<p className='font-medium'>{user.fullName}</p>
									<div className='flex items-center gap-2'>
										<span className='text-neutral-400 text-xs'>Чат</span>
										{!hasChat && input && (
											<span className='text-xs text-violet-400 bg-violet-500/20 px-2 py-0.5 rounded-full'>
												Новый
											</span>
										)}
									</div>
								</div>
								{unseenMessages[user._id] > 0 && (
									<p className='text-xs h-5 w-5 flex justify-center items-center rounded-full bg-violet-500/50'>
										{unseenMessages[user._id] > 99
											? "99+"
											: unseenMessages[user._id]}
									</p>
								)}
							</div>
						)
					})
				) : input ? (
					<div className='flex flex-col items-center justify-center text-gray-400 text-sm py-10'>
						<p>Пользователь не найден</p>
						<p className='mt-1 text-xs'>Попробуйте другое имя</p>
					</div>
				) : (
					<div className='flex flex-col items-center justify-center text-gray-400 text-sm py-10'>
						<p>Нет переписок</p>
						<p className='mt-1'>Напишите первому!</p>
					</div>
				)}
			</div>
		</div>
	)
}

export default Sidebar
