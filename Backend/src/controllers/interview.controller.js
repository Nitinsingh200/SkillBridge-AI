const pdfParse = require("pdf-parse")
const generrateInterviewReport = require("../services/ai.service")
const interviewReportModel = require("../models/interviewReport.model")

async function generateInterViewReportController(req, res) {
    // const  resumeFile = req.file
     const resumeContent = await (new pdfParse.PDFParse(Uint8Array.from(req.file.buffer))).getText()
    const {selfDescription,jobDescription}= req.body;

     const  interViewReportByAi = await generrateInterviewReport({
        resume:resumeContent.text,
        selfDescription,
        jobDescription
     })
     const interviewReport = await interviewReportModel.create({
        user: req.user.id,
        resume: resumeContent.text,
        selfDescription,
        jobDescription,
        ...interViewReportByAi
    })
        res.status(201).json({
        message: "Interview report generated successfully.",
        interviewReport
    })

}

module.exports ={generateInterViewReportController}