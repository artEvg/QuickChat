import React, { useContext, useState, useRef } from "react"
import { useNavigate } from "react-router-dom"
import { assets } from "../assets/assets.js"
import { AppContext } from "../context/AppContext.jsx"
import axios from "axios"
import toast from "react-hot-toast"

const ResetPassword = () => {
	axios.defaults.withCredentials = true
	const { backendUrl } = useContext(AppContext)
	const navigate = useNavigate()

	const [email, setEmail] = useState("")
	const [newPassword, setNewPassword] = useState("")
	const [isEmailSent, setIsEmailSent] = useState(false)
	const [otp, setOtp] = useState("")
	const [isOtpSubmitted, setIsOtpSubmitted] = useState(false)

	const inputRefs = useRef([])

	const handleInput = (e, index) => {
		if (e.target.value.length > 0 && index < inputRefs.current.length - 1) {
			inputRefs.current[index + 1].focus()
		}
	}

	const handleKeyDown = (e, index) => {
		if (e.key === "Backspace" && e.target.value === "" && index > 0) {
			inputRefs.current[index - 1].focus()
		}
	}

	const handlePaste = e => {
		e.preventDefault()
		const paste = e.clipboardData.getData("text").slice(0, 6)
		const pasteArray = paste.split("")
		pasteArray.forEach((char, idx) => {
			if (inputRefs.current[idx]) {
				inputRefs.current[idx].value = char
			}
		})
		inputRefs.current[5]?.focus()
	}

	const onSubmitEmail = async e => {
		e.preventDefault()
		try {
			const { data } = await axios.post(
				backendUrl + "/api/auth/send-reset-otp",
				{ email }
			)
			toast.success(data.message)
			if (data.success) setIsEmailSent(true)
		} catch (error) {
			toast.error(error.response?.data?.message || "Ошибка отправки")
		}
	}

	const onSubmitOtp = async e => {
		e.preventDefault()
		const otpArray = inputRefs.current.map(el => el.value)
		setOtp(otpArray.join(""))
		setIsOtpSubmitted(true)
	}

	const onSubmitNewPassword = async e => {
		e.preventDefault()
		try {
			const { data } = await axios.post(
				backendUrl + "/api/auth/reset-password",
				{
					email,
					otp,
					newPassword,
				}
			)
			toast.success(data.message)
			if (data.success) navigate("/login")
		} catch (error) {
			toast.error(error.response?.data?.message || "Ошибка сброса")
		}
	}

	return (
		<div className='flex items-center justify-center min-h-screen bg-gradient-to-br from-violet-500 via-purple-500 to-pink-500 px-4 py-12'>
			<img
				className='absolute left-4 top-4 w-12 sm:w-16 cursor-pointer hover:scale-110 transition-all z-10'
				onClick={() => navigate("/")}
				src={assets.logo || assets.logo_icon}
				alt='logo'
			/>

			{!isEmailSent && (
				<form
					onSubmit={onSubmitEmail}
					className='w-full max-w-md bg-white/10 backdrop-blur-xl rounded-3xl p-8 shadow-2xl border border-white/20'>
					<h1 className='text-2xl md:text-3xl font-bold text-white text-center mb-6 bg-gradient-to-r from-white to-gray-200 bg-clip-text text-transparent'>
						Сброс пароля
					</h1>
					<p className='text-center mb-8 text-gray-200 text-sm leading-relaxed'>
						Введите вашу почту. Мы отправим вам код для восстановления.
					</p>
					<div className='mb-8 flex items-center gap-3 px-5 py-4 rounded-2xl bg-white/10 border border-white/20 hover:bg-white/20 transition-all'>
						<img
							className='w-5 h-5 opacity-80'
							src={assets.mail_icon}
							alt='Mail'
						/>
						<input
							className='bg-transparent w-full outline-none text-white text-lg placeholder-gray-300 font-medium'
							type='email'
							placeholder='Ваша почта'
							value={email}
							onChange={e => setEmail(e.target.value)}
							required
						/>
					</div>
					<button className='w-full py-4 bg-gradient-to-r from-violet-500 to-purple-600 text-white font-bold text-lg rounded-2xl shadow-xl hover:shadow-2xl hover:scale-[1.02] transition-all duration-300 border border-violet-400/50'>
						Отправить код
					</button>
				</form>
			)}

			{!isOtpSubmitted && isEmailSent && (
				<form
					onSubmit={onSubmitOtp}
					className='w-full max-w-sm bg-white/10 backdrop-blur-xl rounded-3xl p-8 shadow-2xl border border-white/20'>
					<h1 className='text-2xl md:text-3xl font-bold text-white text-center mb-6 bg-gradient-to-r from-white to-gray-200 bg-clip-text text-transparent'>
						Код подтверждения
					</h1>
					<p className='text-center mb-10 text-gray-200 text-sm leading-relaxed'>
						Введите 6-значный код из письма
					</p>
					<div
						className='flex justify-between mb-10'
						onPaste={handlePaste}>
						{Array(6)
							.fill(0)
							.map((_, index) => (
								<input
									key={index}
									type='text'
									className='w-14 h-14 bg-white/20 text-white text-2xl font-bold text-center rounded-xl border-2 border-white/30 focus:border-violet-400 focus:outline-none transition-all backdrop-blur-sm hover:bg-white/30'
									maxLength='1'
									ref={el => (inputRefs.current[index] = el)}
									onKeyDown={e => handleKeyDown(e, index)}
									onInput={e => handleInput(e, index)}
								/>
							))}
					</div>
					<button className='w-full py-4 bg-gradient-to-r from-violet-500 to-purple-600 text-white font-bold text-lg rounded-2xl shadow-xl hover:shadow-2xl hover:scale-[1.02] transition-all duration-300 border border-violet-400/50'>
						Продолжить
					</button>
				</form>
			)}

			{isOtpSubmitted && isEmailSent && (
				<form
					onSubmit={onSubmitNewPassword}
					className='w-full max-w-md bg-white/10 backdrop-blur-xl rounded-3xl p-8 shadow-2xl border border-white/20'>
					<h1 className='text-2xl md:text-3xl font-bold text-white text-center mb-6 bg-gradient-to-r from-white to-gray-200 bg-clip-text text-transparent'>
						Новый пароль
					</h1>
					<p className='text-center mb-8 text-gray-200 text-sm leading-relaxed'>
						Задайте новый пароль для входа в аккаунт
					</p>
					<div className='mb-8 flex items-center gap-3 px-5 py-4 rounded-2xl bg-white/10 border border-white/20 hover:bg-white/20 transition-all'>
						<img
							className='w-5 h-5 opacity-80'
							src={assets.lock_icon}
							alt='Lock'
						/>
						<input
							className='bg-transparent w-full outline-none text-white text-lg placeholder-gray-300 font-medium'
							type='password'
							placeholder='Новый пароль (минимум 6 символов)'
							value={newPassword}
							onChange={e => setNewPassword(e.target.value)}
							minLength={6}
							required
						/>
					</div>
					<button className='w-full py-4 bg-gradient-to-r from-emerald-500 to-teal-600 text-white font-bold text-lg rounded-2xl shadow-xl hover:shadow-2xl hover:scale-[1.02] transition-all duration-300 border border-emerald-400/50'>
						Обновить пароль
					</button>
				</form>
			)}
		</div>
	)
}

export default ResetPassword
