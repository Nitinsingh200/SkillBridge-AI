const express = require("express")
const cookieParser = require("cookie-parser")
const cors = require("cors")

const app = express()

app.use(express.json())
app.use(cookieParser())

const allowedOrigins = [
    "http://localhost:5173",
    "http://localhost:3000",
    "https://skillbridge-ai-7.onrender.com",
    process.env.FRONTEND_URL
].filter(Boolean)

const isAllowedOrigin = (origin) => {
    if (!origin) return true

    try {
        const hostname = new URL(origin).hostname
        return hostname === "localhost" || hostname.endsWith(".onrender.com")
    } catch (error) {
        return false
    }
}

app.use(cors({
    origin: (origin, callback) => {
        if (!origin || isAllowedOrigin(origin)) {
            callback(null, true)
            return
        }

        callback(new Error("Not allowed by CORS"))
    },
    credentials: true,
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization", "X-Requested-With"]
}))

/* require all the routes here */
const authRouter = require("./routes/auth.routes")
const interviewRouter = require("./routes/interview.routes")

app.get("/", (req, res) => {
    res.status(200).json({
        success: true,
        message: "SkillBridge AI Backend is running 🚀"
    });
});
/* using all the routes here */
app.use("/api/auth", authRouter)
app.use("/api/interview", interviewRouter)



module.exports = app