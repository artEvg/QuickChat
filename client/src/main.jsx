import { createRoot } from "react-dom/client"
import "./index.css"
import App from "./App.jsx"
import { AuthContextProvider } from "./context/AuthContext.jsx"
import { ChatProvider } from "./context/ChatContext.jsx"

createRoot(document.getElementById("root")).render(
	<AuthContextProvider>
		<ChatProvider>
			<App />
		</ChatProvider>
	</AuthContextProvider>
)
