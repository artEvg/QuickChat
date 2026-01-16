import { useContext, useState, useEffect } from "react"
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
	} = useContext(ChatContext)

	const { logout, onlineUsers, authUser } = useContext(AuthContext)

	const [input, setInput] = useState("")
	const [showMenu, setShowMenu] = useState(false)

	const navigate = useNavigate()

	// ✅ ИСПРАВЛЕНО: Показываем ТОЛЬКО тех, с кем есть переписка (непрочитанные или выбранный)
	const usersWithChat = users.filter(user => {
		if (user._id === authUser?._id) return false // Исключаем себя

		// Показываем если есть непрочитанные СЮДА или это выбранный пользователь
		return unseenMessages[user._id] > 0 || selectedUser?._id === user._id
	})

	const filteredUsers = input
		? usersWithChat.filter(user =>
				user.fullName.toLowerCase().includes(input.toLowerCase())
		  )
		: usersWithChat

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
						placeholder='Найти пользователя'
					/>
				</div>
			</div>
			<div className='flex flex-col'>
				{filteredUsers.length > 0 ? (
					filteredUsers.map(user => (
						<div
							onClick={() => {
								setSelectedUser(user)
								setUnseenMessages(prev => ({ ...prev, [user._id]: 0 }))
							}}
							key={user._id} // ✅ Фиксим key - используем только _id
							className={`relative flex items-center gap-2 p-2 pl-4 rounded cursor-pointer max-sm:text-sm ${
								selectedUser?._id === user._id ? "bg-[#282142]/50" : ""
							}`}>
							<img
								src={user?.profilePic || assets.avatar_icon}
								alt='user image'
								className='w-[35px] aspect-[1/1] rounded-full'
							/>
							<div className='flex flex-col leading-5'>
								<p>{user.fullName}</p>
								{onlineUsers.includes(user._id) ? (
									<span className='text-green-400 text-xs'>В сети</span>
								) : (
									<span className='text-neutral-400 text-xs'>Нет на месте</span>
								)}
							</div>
							{unseenMessages[user._id] > 0 && (
								<p className='absolute top-4 right-4 text-xs h5 w-5 flex justify-center items-center rounded-full bg-violet-500/50'>
									{unseenMessages[user._id]}
								</p>
							)}
						</div>
					))
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
