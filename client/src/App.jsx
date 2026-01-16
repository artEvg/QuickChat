import { Navigate, Route, Routes } from "react-router-dom"
import Home from "./pages/Home.jsx"
import Login from "./pages/Login.jsx"
import Profile from "./pages/Profile.jsx"
import ResetPassword from "./pages/ResetPassword.jsx"
import { Toaster } from "react-hot-toast"
import { useAuth } from "../context/AuthContext.jsx"

const AppContent = () => {
	const { user: authUser, loading } = useAuth()

	if (loading) {
		return (
			<div className='min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-900 to-black'>
				<div className='text-white text-xl animate-pulse'>Загрузка...</div>
			</div>
		)
	}

	return (
		<div className="bg-[url('/bgImage.svg')] bg-cover min-h-screen">
			<Toaster />
			<Routes>
				<Route
					path='/'
					element={authUser ? <Home /> : <Navigate to='/login' />}
				/>
				<Route
					path='/login'
					element={!authUser ? <Login /> : <Navigate to='/' />}
				/>
				<Route
					path='/profile'
					element={authUser ? <Profile /> : <Navigate to='/login' />}
				/>
				<Route
					path='/reset-password'
					element={<ResetPassword />}
				/>
			</Routes>
		</div>
	)
}

const App = () => <AppContent />

export default App
