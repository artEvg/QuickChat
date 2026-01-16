import { useContext, useState, useEffect, useMemo } from "react"
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
		chats, // ✅ Добавляем chats из контекста
	} = useContext(ChatContext)

	const { logout, onlineUsers, authUser } = useContext(AuthContext)

	const [input, setInput] = useState("")
	const [showMenu, setShowMenu] = useState(false)
	const [searchMode, setSearchMode] = useState(false)

	const navigate = useNavigate()

	// ✅ 1. Пользователи с перепиской (из chats или по непрочитанным)
	const usersWithChat = useMemo(() => {
		const chatUserIds =
			chats?.map(chat => chat.members?.find(id => id !== authUser?._id)) || []

		return users.filter(user => {
			if (user._id === authUser?._id) return false

			// Проверяем: есть ли чат ИЛИ непрочитанные ИЛИ выбранный
			const hasChat = chatUserIds.includes(user._id)
			const hasUnseen = unseenMessages[user._id] > 0
			const isSelected = selectedUser?._id === user._id

			return hasChat || hasUnseen || isSelected
		})
	}, [users, chats, unseenMessages, selectedUser, authUser])

	// ✅ 2. Все пользователи для поиска (исключая себя)
	const allUsersForSearch = useMemo(
		() => users.filter(user => user._id !== authUser?._id),
		[users, authUser]
	)

	// ✅ 3. Логика поиска
	const filteredUsers = useMemo(() => {
		if (!input.trim()) {
			setSearchMode(false)
			return usersWithChat
		}

		setSearchMode(true)
		const searchTerm = input.toLowerCase()

		// Сначала пользователи с перепиской
		const chatMatches = usersWithChat.filter(user =>
			user.fullName.toLowerCase().includes(searchTerm)
		)

		// Потом все остальные
		const otherMatches = allUsersForSearch
			.filter(user => !usersWithChat.some(u => u._id === user._id))
			.filter(user => user.fullName.toLowerCase().includes(searchTerm))

		return [...chatMatches, ...otherMatches]
	}, [input, usersWithChat, allUsersForSearch])

	useEffect(() => {
		getUsers()
	}, [onlineUsers])

	return (
		<div
			className={`bg-[#8185B2]/10 h-full p-5 rounded-r-xl overflow-y-scroll text-white ${
				selectedUser ? "max-md:hidden" : ""
			}`}>
			<div className='pb-5'>
				<div className='flex justify-between items-center'>
					<img
						src={assets.logo}
						alt='logo image'
						className='max-w-40 cursor-pointer'
					/>
					<div className='relative py-2'>
						<img
							src={assets.menu_icon}
							alt='menu icon'
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
						type='text'
						className='bg-transparent border-none outline-none text-white text-sm placeholder-[#c8c8c8] flex-1'
						placeholder={
							searchMode
								? "🔍 Ищите пользователей..."
								: "🔍 Найти пользователя..."
						}
					/>
				</div>
			</div>

			<div className='flex flex-col'>
				{filteredUsers.length > 0 ? (
					filteredUsers.map(user => {
						const hasChat = usersWithChat.some(u => u._id === user._id)

						return (
							<div
								onClick={() => {
									setSelectedUser(user)
									setUnseenMessages(prev => ({ ...prev, [user._id]: 0 }))
									if (input) setInput("")
								}}
								key={user._id}
								className={`relative flex items-center gap-2 p-2 pl-4 rounded cursor-pointer max-sm:text-sm transition-all duration-200 hover:bg-[#282142]/30 ${
									selectedUser?._id === user._id ? "bg-[#282142]/50" : ""
								}`}>
								<img
									src={user?.profilePic || assets.avatar_icon}
									alt='user image'
									className='w-[35px] aspect-[1/1] rounded-full ring-1 ring-transparent hover:ring-violet-500/50 transition-all'
								/>
								<div className='flex flex-col leading-5 flex-1'>
									<p className='font-medium'>{user.fullName}</p>
									<div className='flex items-center gap-2'>
										{onlineUsers.includes(user._id) ? (
											<span className='text-green-400 text-xs'>В сети</span>
										) : (
											<span className='text-neutral-400 text-xs'>
												Не в сети
											</span>
										)}
										{!hasChat && input && (
											<span className='text-xs text-violet-400 bg-violet-500/20 px-2 py-0.5 rounded-full'>
												Новый
											</span>
										)}
									</div>
								</div>
								{unseenMessages[user._id] > 0 && (
									<div className='flex items-center gap-1'>
										<p className='text-xs h-5 w-5 flex justify-center items-center rounded-full bg-violet-500/50'>
											{unseenMessages[user._id] > 99
												? "99+"
												: unseenMessages[user._id]}
										</p>
									</div>
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
						<p className='mt-1'>Начните новый чат</p>
					</div>
				)}
			</div>
		</div>
	)
}

export default Sidebar
