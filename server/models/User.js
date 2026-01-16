import mongoose from "mongoose"

const userSchema = new mongoose.Schema({
	fullName: { type: String, required: true }, // ← ТВОЙ чат использует fullName
	email: { type: String, required: true, unique: true },
	password: { type: String, required: true },
	profilePic: { type: String, default: "" }, // ← Для аватарок чата
	isOnline: { type: Boolean, default: false }, // ← Для статуса чата
	role: {
		type: String,
		enum: ["user", "admin"],
		default: "user",
	},
	verifyOtp: { type: String, default: "" },
	verifyOtpExpireAt: { type: Number, default: 0 },
	isAccountVerified: { type: Boolean, default: false },
	resetOtp: { type: String, default: "" },
	resetOtpExpireAt: { type: Number, default: 0 },
	avatar: {
		public_id: String,
		url: String,
	},
	createdAt: {
		type: Date,
		default: Date.now,
	},
})

const User = mongoose.models.User || mongoose.model("User", userSchema)
export default User
