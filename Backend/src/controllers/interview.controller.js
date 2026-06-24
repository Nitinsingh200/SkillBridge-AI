const pdfParse = require("pdf-parse")
const { generateInterviewReport, generateResumePdf } = require("../services/ai.service")
const interviewReportModel = require("../models/interviewReport.model")

// Fallback generators when AI returns empty arrays
function generateDefaultTechnicalQuestions(title, count = 5) {
    const base = title ? title.replace(/\s+/g, ' ') : 'the role'
    const templates = [
        `Explain the most important data structures and algorithms you would use for ${base}.`,
        `Describe a performance bottleneck you might face in ${base} systems and how you'd solve it.`,
        `How would you design a scalable service for handling high traffic in ${base}?`,
        `Walk through debugging a production issue in a ${base} application.`,
        `Explain trade-offs between different persistence/storage options for ${base} workloads.`
    ]
    return templates.slice(0, count).map(t => ({ question: t, intention: 'Assess technical depth', answer: 'Provide a clear, structured answer with examples and trade-offs.' }))
}

function generateDefaultBehavioralQuestions(title, count = 5) {
    const base = title ? title.replace(/\s+/g, ' ') : 'the role'
    const templates = [
        `Tell me about a challenging project you worked on related to ${base}.`,
        `Describe a time you had to learn a new technology quickly for ${base}.`,
        `How do you prioritize tasks when under tight deadlines in ${base} work?`,
        `Give an example of when you disagreed with a teammate and how you resolved it.`,
        `Describe how you mentor or share knowledge with others on ${base} topics.`
    ]
    return templates.slice(0, count).map(t => ({ question: t, intention: 'Assess cultural fit and soft skills', answer: 'Use STAR format: Situation, Task, Action, Result.' }))
}

function generateDefaultPreparationPlan(title, days = 5) {
    const base = title ? title.replace(/\s+/g, ' ') : 'the role'
    const plan = []
    for (let i = 1; i <= days; i++) {
        plan.push({ day: i, focus: `Day ${i} focus for ${base}`, tasks: [ `Study core concepts related to ${base}`, 'Practice related interview problems', 'Review past projects and examples' ] })
    }
    return plan
}




/**
 * @description Controller to generate interview report based on user self description, resume and job description.
 */
async function generateInterViewReportController(req, res) {

    const resumeContent = await (new pdfParse.PDFParse(Uint8Array.from(req.file.buffer))).getText()
    const { selfDescription, jobDescription } = req.body

    const interViewReportByAi = await generateInterviewReport({
        resume: resumeContent.text,
        selfDescription,
        jobDescription
    })

    // Ensure required `title` is present. If the AI didn't return a title,
    // fall back to the first line of the job description or a safe default.
    let title = interViewReportByAi && interViewReportByAi.title
    if (!title) {
        if (jobDescription && typeof jobDescription === 'string') {
            title = jobDescription.split('\n').find(l => l.trim()) || jobDescription.slice(0, 120)
        } else {
            title = 'Untitled Position'
        }
    }

    // Normalize arrays and sanitize entries so Mongoose validation doesn't fail
    const sanitizeQuestions = (arr) => {
        if (!Array.isArray(arr)) return []
        return arr.map(q => ({
            question: q && q.question ? String(q.question) : 'Not provided',
            intention: q && q.intention ? String(q.intention) : 'Not provided',
            answer: q && q.answer ? String(q.answer) : 'Not provided'
        }))
    }

    const sanitizeSkillGaps = (arr) => {
        if (!Array.isArray(arr)) return []
        const allowed = [ 'low', 'medium', 'high' ]
        return arr.map(s => ({
            skill: s && s.skill ? String(s.skill) : 'Not provided',
            severity: s && allowed.includes(s.severity) ? s.severity : 'low'
        }))
    }

    const sanitizePreparationPlan = (arr) => {
        if (!Array.isArray(arr)) return []
        return arr.map(p => ({
            day: p && typeof p.day === 'number' ? p.day : 1,
            focus: p && p.focus ? String(p.focus) : 'General preparation',
            tasks: Array.isArray(p && p.tasks) ? p.tasks.map(t => String(t)) : [ 'Practice relevant topics' ]
        }))
    }

    // Sanitize and provide fallbacks when AI returns empty arrays
    let tech = sanitizeQuestions(interViewReportByAi.technicalQuestions)
    if (!tech || tech.length === 0) tech = generateDefaultTechnicalQuestions(title, 5)

    let behavioral = sanitizeQuestions(interViewReportByAi.behavioralQuestions)
    if (!behavioral || behavioral.length === 0) behavioral = generateDefaultBehavioralQuestions(title, 5)

    let skillGaps = sanitizeSkillGaps(interViewReportByAi.skillGaps)
    // keep empty skillGaps if none

    let prep = sanitizePreparationPlan(interViewReportByAi.preparationPlan)
    if (!prep || prep.length === 0) prep = generateDefaultPreparationPlan(title, 5)
    if (!interViewReportByAi) interViewReportByAi = {}

    // Robust extraction: look for numeric score fields (e.g., matchScore, score, percentage)
    function extractMatchScore(obj) {
        if (obj == null) return null
        const keyRegex = /score|match|compat|percent|percentage/i
        const candidates = []

        function visit(value, key) {
            if (value == null) return
            if (typeof value === 'number') {
                candidates.push(value)
                return
            }
            if (typeof value === 'string') {
                // look for numbers like '85', '85%', '85/100', 'Score: 85'
                const m = value.match(/-?\d+(?:\.\d+)?/)
                if (m) candidates.push(Number(m[0]))
                return
            }
            if (Array.isArray(value)) {
                value.forEach(v => visit(v))
                return
            }
            if (typeof value === 'object') {
                for (const k of Object.keys(value)) {
                    const v = value[k]
                    if (keyRegex.test(k) && (typeof v === 'number' || typeof v === 'string')) {
                        if (typeof v === 'number') candidates.push(v)
                        else {
                            const m = String(v).match(/-?\d+(?:\.\d+)?/)
                            if (m) candidates.push(Number(m[0]))
                        }
                    }
                    visit(v, k)
                }
            }
        }

        visit(obj)

        const filtered = candidates.filter(c => typeof c === 'number' && !Number.isNaN(c) && c >= 0 && c <= 100)
        return filtered.length ? filtered[0] : null
    }

    let matchScore = extractMatchScore(interViewReportByAi)
    if (typeof matchScore === 'number') {
        matchScore = Math.round(Math.max(0, Math.min(100, matchScore)) * 100) / 100
    } else {
        matchScore = null
    }

    const normalized = {
        matchScore,
        technicalQuestions: tech,
        behavioralQuestions: behavioral,
        skillGaps,
        preparationPlan: prep,
    }

    const interviewReport = await interviewReportModel.create({
        user: req.user.id,
        resume: resumeContent.text,
        selfDescription,
        jobDescription,
        title,
        ...normalized
    })

    res.status(201).json({
        message: "Interview report generated successfully.",
        interviewReport
    })

}

/**
 * @description Controller to get interview report by interviewId.
 */
async function getInterviewReportByIdController(req, res) {

    const { interviewId } = req.params

    const interviewReport = await interviewReportModel.findOne({ _id: interviewId, user: req.user.id })

    if (!interviewReport) {
        return res.status(404).json({
            message: "Interview report not found."
        })
    }

    res.status(200).json({
        message: "Interview report fetched successfully.",
        interviewReport
    })
}


/** 
 * @description Controller to get all interview reports of logged in user.
 */
async function getAllInterviewReportsController(req, res) {
    const interviewReports = await interviewReportModel.find({ user: req.user.id }).sort({ createdAt: -1 }).select("-resume -selfDescription -jobDescription -__v -technicalQuestions -behavioralQuestions -skillGaps -preparationPlan")

    res.status(200).json({
        message: "Interview reports fetched successfully.",
        interviewReports
    })
}


/**
 * @description Controller to generate resume PDF based on user self description, resume and job description.
 */
async function generateResumePdfController(req, res) {
    const { interviewReportId } = req.params

    const interviewReport = await interviewReportModel.findById(interviewReportId)

    if (!interviewReport) {
        return res.status(404).json({
            message: "Interview report not found."
        })
    }

    const { resume, jobDescription, selfDescription } = interviewReport

    const pdfBuffer = await generateResumePdf({ resume, jobDescription, selfDescription })

    res.set({
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename=resume_${interviewReportId}.pdf`
    })

    res.send(pdfBuffer)
}

module.exports = { generateInterViewReportController, getInterviewReportByIdController, getAllInterviewReportsController, generateResumePdfController }