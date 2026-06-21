const express = require("express")
const authMiddleware = require("../middleware/auth.middleware.js")
const interviewController = require("../controllers/interview.controller")
const upload = require("../middleware/file.middleware.js")

const interviewRouter = express.Router()
interviewRouter.post("/", authMiddleware.authUser, upload.single("resume"), interviewController.generateInterViewReportController)
 


  module.exports = interviewRouter;
