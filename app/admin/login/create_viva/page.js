"use client"
import { useState } from "react"
import { useRouter } from "next/navigation"
import { MdOutlineAdd, MdOutlineDelete, MdAccessTime, MdSave, MdPlayArrow, MdUpload } from "react-icons/md"

export default function CombinedPage() {
    const router = useRouter()
    const [courseCode, setCourseCode] = useState("")
    const [courseTitle, setCourseTitle] = useState("")
    const [examTime, setExamTime] = useState("00:10")
    const [hours, setHours] = useState("00")
    const [minutes, setMinutes] = useState("10")
    const [questions, setQuestions] = useState([])
    const [message, setMessage] = useState("")
    const [loading, setLoading] = useState(false)

    const addNewQuestionPair = () => {
        setQuestions((prev) => [{ question: "", answer: "" }, ...prev])
    }

    const updateQuestion = (idx, field, value) => {
        setQuestions((prev) => {
            const copy = [...prev]
            copy[idx] = { ...copy[idx], [field]: value }
            return copy
        })
    }

    const removeQuestion = (idx) => {
        setQuestions((prev) => prev.filter((_, i) => i !== idx))
    }

    const handleSave = async () => {
        setMessage("")
        if (!examTime) {
            setMessage("set_exam_time is required")
            return
        }
        if (!courseCode.trim()) {
            setMessage("Course Code is required")
            return
        }
        if (!courseTitle.trim()) {
            setMessage("Course Title is required")
            return
        }

        const sanitized = questions
            .map((q) => ({ question: (q.question || "").trim(), answer: (q.answer || "").trim() }))
            .filter((q) => q.question && q.answer)

        if (sanitized.length < 10) {
            setMessage("Add at least 10 question-answer pairs before saving.")
            return
        }

        setLoading(true)
        try {
            const res = await fetch("/api/viva/save", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    courseCode: courseCode.trim(),
                    courseTitle: courseTitle.trim(),
                    examTimeHHMM: examTime,
                    questions: sanitized.map((q) => ({ question: q.question, answer: q.answer })),
                }),
            })
            const data = await res.json()
            if (!res.ok) {
                setMessage(data?.error || "Save failed")
            } else {
                setMessage("Saved successfully ✅")
            }
        } catch (err) {
            console.error(err)
            setMessage("Save failed (network)")
        } finally {
            setLoading(false)
        }
    }

    const handleRefresh = async () => {
        if (!courseCode.trim()) {
            setMessage("Enter course code to refresh")
            return
        }
        if (!confirm(`Delete all data for ${courseCode.trim()} ? This cannot be undone.`)) return
        setLoading(true)
        try {
            const res = await fetch(`/api/viva/refresh?courseCode=${encodeURIComponent(courseCode.trim())}`, {
                method: "DELETE",
            })
            const data = await res.json()
            if (res.ok) {
                setMessage("Course data deleted")
                setQuestions([])
                setCourseTitle("")
            } else {
                setMessage(data?.error || "Refresh failed")
            }
        } catch (err) {
            console.error(err)
            setMessage("Refresh failed (network)")
        } finally {
            setLoading(false)
        }
    }

    const handleSetExam = async () => {
        setMessage("")
        if (!courseCode.trim()) {
            setMessage("courseCode required to set exam")
            return
        }

        const sanitized = questions
            .map((q) => ({ question: (q.question || "").trim(), answer: (q.answer || "").trim() }))
            .filter((q) => q.question && q.answer)

        if (sanitized.length < 10) {
            setMessage("Add at least 10 filled question-answer pairs before setting exam.")
            return
        }

        const parts = (examTime || "00:00").split(":")
        const hoursNum = Number.parseInt(parts[0] || "0", 10)
        const minutesNum = Number.parseInt(parts[1] || "0", 10)
        const durationSeconds = (isNaN(hoursNum) ? 0 : hoursNum * 3600) + (isNaN(minutesNum) ? 0 : minutesNum * 60)

        setLoading(true)
        try {
            const res = await fetch("/api/viva/create-session", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    courseCode: courseCode.trim(),
                    courseTitle: courseTitle.trim(),
                    questions: sanitized.map((q) => ({ question: q.question, answer: q.answer })),
                    examDurationSeconds: durationSeconds,
                }),
            })
            const data = await res.json()
            if (!res.ok) {
                setMessage(data?.error || "Failed to create session")
            } else {
                const link = data.link || `/viva?sessionId=${data.sessionId}`
                setMessage(`Exam session created! Link: ${link}`)
                try {
                    await navigator.clipboard.writeText(window.location.origin + link)
                } catch (e) { }
            }
        } catch (err) {
            console.error(err)
            setMessage("Network error while creating session.")
        } finally {
            setLoading(false)
        }
    }

    const handleLoad = async () => {
        if (!courseCode.trim()) {
            setMessage("Enter course code to load")
            return
        }
        setLoading(true)
        try {
            const res = await fetch(`/api/get-cs-questions?courseCode=${encodeURIComponent(courseCode.trim())}`)
            const data = await res.json()
            if (!res.ok) {
                setMessage(data?.error || "Course not found")
            } else {
                setCourseTitle(data.courseTitle || "")
                const secs = data.examDurationSeconds || 0
                const hh = String(Math.floor(secs / 3600)).padStart(2, "0")
                const mm = String(Math.floor((secs % 3600) / 60)).padStart(2, "0")
                setExamTime(`${hh}:${mm}`)
                setHours(hh)
                setMinutes(mm)
                setMessage("Course metadata loaded. To edit full question set, use Save with questions.")
            }
        } catch (err) {
            console.error(err)
            setMessage("Load failed")
        } finally {
            setLoading(false)
        }
    }

    const padHours = (raw) => {
        if (raw === "") return "00"
        const n = Number.parseInt(raw, 10)
        if (isNaN(n)) return "00"
        return String(Math.max(0, Math.min(23, n))).padStart(2, "0")
    }

    const padMinutes = (raw) => {
        if (raw === "") return "00"
        const n = Number.parseInt(raw, 10)
        if (isNaN(n)) return "00"
        return String(Math.max(0, Math.min(59, n))).padStart(2, "0")
    }

    return (
        <div className="min-h-screen bg-white">
            <div className="max-w-[69rem] mx-auto bg-gradient-to-r from-blue-600 to-purple-600 text-white py-3 px-4">
                <div className="max-w-[40rem] w-full mx-auto text-center">
                    <h1 className="text-4xl font-bold mb-2">Viva Exam Manager</h1>
                    <p className="text-blue-100 text-lg">Create and manage interactive exam sessions</p>
                </div>
            </div>


            <div className="max-w-6xl mx-auto p-6">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
                    <div className="bg-gradient-to-br from-blue-50 to-blue-100 border border-blue-200 rounded-lg p-5">
                        <p className="text-blue-600 text-sm font-semibold mb-1">📚 Questions Added</p>
                        <p className="text-3xl font-bold text-blue-900">{questions.length}</p>
                    </div>
                    <div className="bg-gradient-to-br from-purple-50 to-purple-100 border border-purple-200 rounded-lg p-5">
                        <p className="text-purple-600 text-sm font-semibold mb-1">⏱️ Exam Duration</p>
                        <p className="text-3xl font-bold text-purple-900">
                            {hours}:{minutes}
                        </p>
                    </div>
                    <div className="bg-gradient-to-br from-green-50 to-green-100 border border-green-200 rounded-lg p-5">
                        <p className="text-green-600 text-sm font-semibold mb-1">✓ Course Code</p>
                        <p className="text-xl font-bold text-green-900">{courseCode || "Not set"}</p>
                    </div>
                </div>

                <div className="bg-white rounded-xl border border-gray-200 shadow-lg p-8 mb-8">
                    {/* Course Information Section */}
                    <div className="mb-8 pb-8 border-b border-gray-200">
                        <h2 className="text-2xl font-bold text-gray-900 mb-6">Course Information</h2>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            {/* Course Code */}
                            <div>
                                <label className="block text-sm font-semibold text-gray-700 mb-2">
                                    Course Code <span className="text-red-500">*</span>
                                </label>
                                <input
                                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition bg-white text-gray-900"
                                    value={courseCode}
                                    onChange={(e) => setCourseCode(e.target.value)}
                                    placeholder="e.g., CS101"
                                />
                            </div>

                            {/* Course Title */}
                            <div>
                                <label className="block text-sm font-semibold text-gray-700 mb-2">
                                    Course Title <span className="text-red-500">*</span>
                                </label>
                                <input
                                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition bg-white text-gray-900"
                                    value={courseTitle}
                                    onChange={(e) => setCourseTitle(e.target.value)}
                                    placeholder="e.g., Introduction to Programming"
                                />
                            </div>
                        </div>
                    </div>

                    {/* Exam Time Section */}
                    <div className="mb-8 pb-8 border-b border-gray-200">
                        <h2 className="text-2xl font-bold text-gray-900 mb-6 flex items-center gap-2">
                            <MdAccessTime className="text-purple-600" size={28} />
                            Set Exam Duration
                        </h2>

                        <div className="bg-gradient-to-r from-purple-50 to-blue-50 border border-purple-200 rounded-xl p-6">
                            <div className="flex items-center justify-center gap-4">
                                {/* Hours Input */}
                                <div className="flex flex-col items-center">
                                    <label className="text-xs font-semibold text-gray-600 mb-2 uppercase tracking-wide">Hours</label>
                                    <input
                                        type="text"
                                        maxLength={2}
                                        value={hours}
                                        onChange={(e) => {
                                            const v = e.target.value.replace(/\D/g, "")
                                            if (v === "" || (Number.parseInt(v, 10) <= 23 && v.length <= 2)) setHours(v)
                                        }}
                                        onBlur={(e) => setHours(padHours(e.target.value))}
                                        className="w-20 h-20 text-center bg-white border-2 border-purple-300 rounded-lg text-3xl font-bold text-purple-600 focus:border-purple-500 focus:ring-2 focus:ring-purple-200 outline-none transition"
                                    />
                                </div>

                                <div className="text-4xl font-bold text-gray-400 mt-6">:</div>

                                {/* Minutes Input */}
                                <div className="flex flex-col items-center">
                                    <label className="text-xs font-semibold text-gray-600 mb-2 uppercase tracking-wide">Minutes</label>
                                    <input
                                        type="text"
                                        maxLength={2}
                                        value={minutes}
                                        onChange={(e) => {
                                            const v = e.target.value.replace(/\D/g, "")
                                            if (v === "" || (Number.parseInt(v, 10) <= 59 && v.length <= 2)) setMinutes(v)
                                        }}
                                        onBlur={(e) => setMinutes(padMinutes(e.target.value))}
                                        className="w-20 h-20 text-center bg-white border-2 border-purple-300 rounded-lg text-3xl font-bold text-purple-600 focus:border-purple-500 focus:ring-2 focus:ring-purple-200 outline-none transition"
                                    />
                                </div>
                            </div>
                            <p className="text-sm text-gray-600 mt-4 text-center">
                                Format: <span className="font-semibold text-gray-900">HH:MM</span> • Example: 01:30 = 1 hour 30 minutes
                            </p>
                        </div>
                    </div>

                    {/* Questions Section */}
                    <div>
                        <div className="flex items-center justify-between mb-6">
                            <h2 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
                                <MdOutlineAdd className="text-green-600" size={28} />
                                Questions <span className="text-sm text-gray-500 font-normal">({questions.length}/10 minimum)</span>
                            </h2>
                            <button
                                onClick={addNewQuestionPair}
                                disabled={loading}
                                className="bg-green-600 hover:bg-green-700 text-white font-semibold px-6 py-3 rounded-lg transition transform hover:scale-105 flex items-center gap-2 shadow-md"
                            >
                                <MdOutlineAdd size={20} />
                                Add Question
                            </button>
                        </div>

                        {questions.length === 0 ? (
                            <div className="bg-gray-50 border-2 border-dashed border-gray-300 rounded-lg p-12 text-center">
                                <p className="text-gray-500 text-lg">No questions added yet. Click "Add Question" to get started!</p>
                            </div>
                        ) : (
                            <div className="space-y-3">
                                {questions.map((q, i) => (
                                    <div
                                        key={i}
                                        className="bg-gradient-to-r from-gray-50 to-white border border-gray-200 rounded-lg p-4 hover:shadow-md transition"
                                    >
                                        <div className="flex gap-4 items-start">
                                            <div className="flex-1">
                                                <label className="text-xs font-semibold text-gray-600 mb-2 block uppercase tracking-wide">
                                                    Question {i + 1}
                                                </label>
                                                <input
                                                    value={q.question}
                                                    onChange={(e) => updateQuestion(i, "question", e.target.value)}
                                                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition bg-white text-gray-900"
                                                    placeholder="Enter the exam question..."
                                                />
                                            </div>
                                            <div className="flex-1">
                                                <label className="text-xs font-semibold text-gray-600 mb-2 block uppercase tracking-wide">
                                                    Expected Answer
                                                </label>
                                                <input
                                                    value={q.answer}
                                                    onChange={(e) => updateQuestion(i, "answer", e.target.value)}
                                                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition bg-white text-gray-900"
                                                    placeholder="Enter the expected answer..."
                                                />
                                            </div>
                                            <button
                                                onClick={() => removeQuestion(i)}
                                                className="mt-8 bg-red-100 hover:bg-red-200 text-red-600 p-3 rounded-lg transition"
                                                title="Remove question"
                                            >
                                                <MdOutlineDelete size={20} />
                                            </button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>

                <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between bg-gray-50 rounded-lg p-6 mb-8">
                    <div className="flex flex-col sm:flex-row gap-3 w-full sm:w-auto">
                        <button
                            onClick={handleSave}
                            disabled={loading}
                            className="bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white font-semibold px-6 py-3 rounded-lg transition flex items-center justify-center gap-2 shadow-md hover:shadow-lg transform hover:scale-105"
                        >
                            <MdSave size={20} />
                            Save Course
                        </button>

                        <button
                            onClick={handleSetExam}
                            disabled={loading}
                            className="bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-400 text-white font-semibold px-6 py-3 rounded-lg transition flex items-center justify-center gap-2 shadow-md hover:shadow-lg transform hover:scale-105"
                        >
                            <MdPlayArrow size={20} />
                            Set Exam
                        </button>

                        <button
                            onClick={handleLoad}
                            disabled={loading}
                            className="bg-gray-600 hover:bg-gray-700 disabled:bg-gray-400 text-white font-semibold px-6 py-3 rounded-lg transition flex items-center justify-center gap-2 shadow-md hover:shadow-lg transform hover:scale-105"
                        >
                            <MdUpload size={20} />
                            Load Metadata
                        </button>

                        <button
                            onClick={handleRefresh}
                            disabled={loading}
                            className="bg-red-600 hover:bg-red-700 disabled:bg-red-400 text-white font-semibold px-6 py-3 rounded-lg transition flex items-center justify-center gap-2 shadow-md hover:shadow-lg transform hover:scale-105"
                            title="Delete all data for this course"
                        >
                            ⚠️ Delete Course
                        </button>
                    </div>

                    {message && (
                        <div
                            className={`flex-1 p-4 rounded-lg font-semibold text-center ${message.includes("✅") || message.includes("success") || message.includes("loaded")
                                ? "bg-green-100 text-green-800 border border-green-300"
                                : "bg-red-100 text-red-800 border border-red-300"
                                }`}
                        >
                            {message}
                        </div>
                    )}
                </div>

                {/* Loading indicator */}
                {loading && (
                    <div className="fixed inset-0 bg-black/50 flex items-center justify-center rounded-lg backdrop-blur-sm">
                        <div className="bg-white p-8 rounded-lg shadow-2xl flex flex-col items-center gap-4">
                            <div className="w-12 h-12 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin"></div>
                            <p className="text-gray-900 font-semibold">Processing...</p>
                        </div>
                    </div>
                )}
            </div>
        </div>
    )
}
