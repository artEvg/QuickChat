import mongoose from "mongoose"

const messageSchema = new mongoose.Schema(
	{
		senderId: {
			type: mongoose.Schema.Types.ObjectId,
			ref: "User",
			require: true,
		},
		receiverId: {
			type: mongoose.Schema.Types.ObjectId,
			ref: "User",
			require: true,
		},
		text: { type: String },
		image: { type: String },
		audio: { type: String },
		audioDuration: { type: Number },
		seen: { type: Boolean, default: false },
	},
	{ timestamps: true }
)

const Message = mongoose.model("Messages", messageSchema)

export default Message
