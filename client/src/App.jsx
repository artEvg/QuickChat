import { Navigate, Route, Routes } from "react-router-dom"
import Home from "./pages/Home.jsx"
import Login from "./pages/Login.jsx"
import Profile from "./pages/Profile.jsx"
import assets from "./assets/assets.js"
import { Toaster } from "react-hot-toast"
import { useContext } from "react"
import { AuthContext } from "../context/AuthContext"

const App = () => {
	const { authUser } = useContext(AuthContext)
	return (
		<div className="bg-[url('./src/assets/bgImage.svg')] bg-cover">
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
			</Routes>
		</div>
	)
}

export default App
