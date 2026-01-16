import { useContext, useState } from "react"
import { useNavigate } from "react-router-dom" // ← ДОБАВЬ
import assets from "../assets/assets.js"
import { AuthContext } from "../../context/AuthContext.jsx"

const Login = () => {
	const [currState, setCurrState] = useState("Регистрация")
	const [fullName, setFullName] = useState("")
	const [email, setEmail] = useState("")
	const [password, setPassword] = useState("")
	const [bio, setBio] = useState("")
	const [isDataSubmitted, setIsDataSubmitted] = useState(false)
	const { login } = useContext(AuthContext)
	const navigate = useNavigate() // ← ДОБАВЬ

	const onSubmitHandler = event => {
		event.preventDefault()
		if (currState === "Регистрация" && !isDataSubmitted) {
			setIsDataSubmitted(true)
			return
		}
		login(currState === "Регистрация" ? "signup" : "login", {
			fullName,
			email,
			password,
			bio,
		})
	}

	return (
		<div className='min-h-screen bg-cover bg-center flex items-center justify-center gap-8 sm:justify-evenly max-sm:flex-col backdrop-blur-2xl'>
			<img
				className='w-[min(30vw,250px)]'
				src={assets.logo_big}
				alt='logo image'
			/>
			<form
				onSubmit={onSubmitHandler}
				className='border-2 bg-white/8 text-white border-gray-500 p-6 flex flex-col gap-6 rounded-lg shadow-lg'>
				<h2 className='font-medium text-2xl flex justify-between items-center'>
					{currState}
					{isDataSubmitted && (
						<img
							onClick={() => setIsDataSubmitted(false)}
							className='w-5 cursor-pointer'
							src={assets.arrow_icon}
							alt='arrow icon'
						/>
					)}
				</h2>

				{currState === "Регистрация" && !isDataSubmitted && (
					<input
						onChange={e => setFullName(e.target.value)}
						className='p-2 border border-gray-500 rounded-md focus:outline-none'
						type='text'
						placeholder='Фамилия и Имя'
						required
						value={fullName}
					/>
				)}

				{!isDataSubmitted && (
					<>
						<input
							className='p-2 border border-gray-500 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500'
							type='email'
							placeholder='Электронная почта'
							required
							onChange={e => setEmail(e.target.value)}
							value={email}
						/>
						<input
							className='p-2 border border-gray-500 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500'
							type='password'
							placeholder='Пароль'
							required
							onChange={e => setPassword(e.target.value)}
							value={password}
						/>
					</>
				)}

				{currState === "Регистрация" && isDataSubmitted && (
					<textarea
						onChange={e => setBio(e.target.value)}
						rows={4}
						className='p-2 border border-gray-500 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500'
						placeholder='Описание профиля'
						required
						value={bio}></textarea>
				)}

				{/* 🔥 КНОПКА "ЗАБЫЛИ ПАРОЛЬ?" - ТОЛЬКО при логине */}
				{currState === "Авторизация" && !isDataSubmitted && (
					<div className='text-center'>
						<button
							type='button'
							onClick={() => navigate("/reset-password")}
							className='text-sm text-violet-400 hover:text-violet-300 transition-colors font-medium underline'>
							Забыли пароль?
						</button>
					</div>
				)}

				<button
					type='submit'
					className='py-3 bg-gradient-to-r from-purple-400 to-violet-600 text-white rounded-md cursor-pointer hover:from-purple-500 hover:to-violet-700 transition-all'>
					{currState === "Регистрация" ? "Создать Аккаунт" : "Войти в Аккаунт"}
				</button>

				<div className='flex items-center gap-2 text-sm text-gray-500'>
					<input type='checkbox' />
					<p>Принять условия соглашения и использование сервиса.</p>
				</div>
				<div className='flex flex-col gap-2'>
					{currState === "Регистрация" ? (
						<p className='text-sm text-gray-600'>
							Уже есть аккаунт?{" "}
							<span
								onClick={() => {
									setCurrState("Авторизация")
									setIsDataSubmitted(false)
								}}
								className='font-medium text-violet-500 cursor-pointer hover:text-violet-400 transition-colors'>
								Вход
							</span>
						</p>
					) : (
						<p className='text-sm text-gray-600'>
							Нет аккаунта?{" "}
							<span
								onClick={() => {
									setCurrState("Регистрация")
								}}
								className='font-medium text-violet-500 cursor-pointer hover:text-violet-400 transition-colors'>
								Создать аккаунт
							</span>
						</p>
					)}
				</div>
			</form>
		</div>
	)
}

export default Login
