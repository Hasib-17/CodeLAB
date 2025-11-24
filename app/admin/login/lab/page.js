"use client";
import React, { useEffect, useState } from "react";

/**
 * LabPage (UI-upgraded)
 * - Functionality unchanged; only styles & structure improved.
 * - All original functions, handlers and API calls are preserved.
 */
export default function LabPage() {
    // Course fields (title only for display; code used for query)
    const [courseCode, setCourseCode] = useState("");
    const [courseTitle, setCourseTitle] = useState("");
    const [courseSaved, setCourseSaved] = useState(false);

    // Problem creation form
    const [showProblemForm, setShowProblemForm] = useState(false);
    const [title, setTitle] = useState("");
    const [problemStatement, setProblemStatement] = useState("");
    const [inputFormat, setInputFormat] = useState("");
    const [outputFormat, setOutputFormat] = useState("");
    const [sampleInput, setSampleInput] = useState("");
    const [sampleOutput, setSampleOutput] = useState("");
    const [constraints, setConstraints] = useState("");

    // Problems list + loading state
    const [problems, setProblems] = useState([]);
    const [loadingList, setLoadingList] = useState(false);
    const [submitting, setSubmitting] = useState(false);
    const [message, setMessage] = useState(null);

    // Edit modal state
    const [editingProblem, setEditingProblem] = useState(null);
    const [editSubmitting, setEditSubmitting] = useState(false);

    useEffect(() => {
        // hide footer by content as before
        const allElements = document.querySelectorAll("body *");
        allElements.forEach((el) => {
            if (
                el.textContent?.includes("© CodeLab | All Rights Reserved") ||
                el.textContent?.includes("Developed by Hasib-17")
            ) {
                el.style.display = "none";
            }
        });

        const storedCode = localStorage.getItem("admin_courseCode");
        const storedTitle = localStorage.getItem("admin_courseTitle");
        if (storedCode) {
            setCourseCode(storedCode);
            setCourseSaved(true);
            if (storedTitle) setCourseTitle(storedTitle);
            loadProblems(storedCode);
        }

        return () => {
            allElements.forEach((el) => {
                if (
                    el.textContent?.includes("© CodeLab | All Rights Reserved") ||
                    el.textContent?.includes("Developed by Hasib-17")
                ) {
                    el.style.display = "";
                }
            });
        };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    async function loadProblems(code = courseCode) {
        setLoadingList(true);
        setMessage(null);
        try {
            const params = new URLSearchParams();
            if (code) params.append("courseCode", code);
            params.append("limit", "0"); // no limit

            const res = await fetch(`/api/problems?${params.toString()}`, { method: "GET" });
            if (!res.ok) {
                const body = await res.text().catch(() => "");
                throw new Error(`Failed to fetch problems: ${res.status} ${body}`);
            }

            const data = await res.json();
            const list = Array.isArray(data) ? data : data.problems ?? [];
            setProblems(list);
            return true;
        } catch (err) {
            console.error("loadProblems error:", err);
            setMessage({ type: "error", text: "Failed to load problems for this course." });
            setProblems([]);
            return false;
        } finally {
            setLoadingList(false);
        }
    }

    const handleSaveCourse = async () => {
        if (!courseCode.trim()) {
            setMessage({ type: "error", text: "Please provide Course Code (required)." });
            return;
        }

        setMessage(null);
        setLoadingList(true);

        const ok = await loadProblems(courseCode.trim());
        setLoadingList(false);

        if (!ok) {
            setMessage({ type: "error", text: "Could not load problems. Course was not saved." });
            return;
        }

        localStorage.setItem("admin_courseCode", courseCode.trim());
        if (courseTitle.trim()) localStorage.setItem("admin_courseTitle", courseTitle.trim());
        setCourseSaved(true);
        setMessage({ type: "success", text: "Course saved and problems loaded." });
    };

    const handleClearCourse = () => {
        localStorage.removeItem("admin_courseCode");
        localStorage.removeItem("admin_courseTitle");
        setCourseSaved(false);
        setCourseCode("");
        setCourseTitle("");
        setMessage(null);
        setProblems([]);
    };

    const handleCreateClick = () => {
        if (!courseSaved) {
            setMessage({ type: "error", text: "Please save Course Code first." });
            return;
        }
        setMessage(null);
        setShowProblemForm(true);
        // scroll to form
        setTimeout(() => {
            const el = document.getElementById("new-problem-form");
            if (el) el.scrollIntoView({ behavior: "smooth", block: "center" });
        }, 80);
    };

    const handleAddProblem = async () => {
        if (!title.trim() || !problemStatement.trim()) {
            setMessage({ type: "error", text: "Please fill Problem Title and Problem Statement." });
            return;
        }
        setSubmitting(true);
        setMessage(null);

        const payload = {
            courseCode: courseCode.trim(),
            courseTitle: courseTitle.trim() || "",
            title: title.trim(),
            problemStatement,
            inputFormat,
            outputFormat,
            sampleInput,
            sampleOutput,
            constraints,
        };

        try {
            const res = await fetch("/api/problems", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(payload),
            });

            if (!res.ok) {
                const err = await res.json().catch(() => ({}));
                throw new Error(err?.error || `Server returned ${res.status}`);
            }

            const data = await res.json();
            const created = data?.created ?? data;
            if (!created || !created.id) {
                await loadProblems();
                setMessage({ type: "success", text: "Problem created (list refreshed)." });
            } else {
                if (!created.createdAt) created.createdAt = new Date().toISOString();
                setProblems((prev) => [created, ...prev]);
                setMessage({ type: "success", text: "Problem added successfully." });
            }

            setTitle("");
            setProblemStatement("");
            setInputFormat("");
            setOutputFormat("");
            setSampleInput("");
            setSampleOutput("");
            setConstraints("");
            setShowProblemForm(false);
            window.scrollTo({ top: 0, behavior: "smooth" });
        } catch (error) {
            console.error("Add problem error", error);
            setMessage({ type: "error", text: "Failed to add problem. " + (error.message || "") });
        } finally {
            setSubmitting(false);
        }
    };

    // NEW: Add problem to Exam (set inExam=true) — updated to send courseCode/courseTitle too
    const handleAddToExam = async (problemId) => {
        if (!courseCode) {
            setMessage({ type: "error", text: "Please save a Course Code first so exam can link to a course." });
            return;
        }

        // optimistic update locally
        setProblems((prev) => prev.map((p) => (p.id === problemId ? { ...p, inExam: true } : p)));
        try {
            const payload = {
                inExam: true,
                // ensure problem has courseCode/category set so Exam page will return it
                courseCode: courseCode.trim(),
                // keep legacy field in sync if server expects category
                category: courseCode.trim(),
                // update display title/companies as well (optional)
                courseTitle: courseTitle.trim() || "",
            };

            const res = await fetch(`/api/problems/${encodeURIComponent(problemId)}`, {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(payload),
            });
            if (!res.ok) {
                const err = await res.json().catch(() => ({}));
                throw new Error(err?.error || `Server ${res.status}`);
            }

            // mark global storage flag so other pages update (Exam page listens to this)
            try {
                localStorage.setItem("exam_updated_ts", Date.now().toString());
            } catch (e) {
                // ignore storage errors
            }
            setMessage({ type: "success", text: "Problem added to Exam list." });
        } catch (err) {
            console.error("AddToExam error", err);
            setMessage({ type: "error", text: "Failed to add problem to Exam." });
            // rollback: reload full list from server (will reset optimistic flag)
            await loadProblems(courseCode);
        }
    };

    const handleDelete = async (problemId) => {
        const ok = confirm("Are you sure you want to delete this problem? (soft delete)");
        if (!ok) return;
        try {
            const res = await fetch(`/api/problems/${encodeURIComponent(problemId)}`, {
                method: "DELETE",
            });
            if (!res.ok) {
                const err = await res.json().catch(() => ({}));
                throw new Error(err?.error || `Server returned ${res.status}`);
            }
            setMessage({ type: "success", text: "Problem deleted (soft)." });
            setProblems((prev) => prev.filter((p) => p.id !== problemId));
        } catch (err) {
            console.error("Delete error", err);
            setMessage({ type: "error", text: "Failed to delete problem." });
        }
    };

    // Edit helpers
    const openEdit = (problem) => {
        setEditingProblem({
            ...problem,
            courseCode: problem.courseCode ?? problem.category ?? "",
            courseTitle: problem.courseTitle ?? (Array.isArray(problem.companies) ? problem.companies[0] ?? "" : ""),
            title: problem.title ?? "",
            problemStatement: problem.problemStatement ?? "",
            inputFormat: problem.inputFormat ?? "",
            outputFormat: problem.outputFormat ?? "",
            sampleInput: problem.sampleInput ?? "",
            sampleOutput: problem.sampleOutput ?? "",
            constraints: problem.constraints ?? "",
        });
    };

    const closeEdit = () => {
        setEditingProblem(null);
        setEditSubmitting(false);
    };

    const handleEditChange = (field, value) => {
        setEditingProblem((prev) => ({ ...prev, [field]: value }));
    };

    const handleSaveEdit = async () => {
        if (!editingProblem) return;
        if (!editingProblem.title.trim() || !editingProblem.problemStatement.trim()) {
            setMessage({ type: "error", text: "Title and Problem Statement are required." });
            return;
        }
        setEditSubmitting(true);
        setMessage(null);

        try {
            const payload = {
                title: editingProblem.title,
                problemStatement: editingProblem.problemStatement,
                inputFormat: editingProblem.inputFormat,
                outputFormat: editingProblem.outputFormat,
                sampleInput: editingProblem.sampleInput,
                sampleOutput: editingProblem.sampleOutput,
                constraints: editingProblem.constraints,
                courseCode: courseCode.trim(),
                courseTitle: editingProblem.courseTitle ?? "",
            };

            const res = await fetch(`/api/problems/${encodeURIComponent(editingProblem.id)}`, {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(payload),
            });

            if (!res.ok) {
                const err = await res.json().catch(() => ({}));
                throw new Error(err?.error || `Server returned ${res.status}`);
            }

            const updatedResp = await res.json();
            const updatedDoc = updatedResp?.updated ?? updatedResp;
            if (updatedDoc && updatedDoc.id) {
                setProblems((prev) => prev.map((p) => (p.id === updatedDoc.id ? { ...p, ...updatedDoc } : p)));
                setMessage({ type: "success", text: "Problem updated." });
            } else {
                await loadProblems(courseCode);
                setMessage({ type: "success", text: "Problem updated (refreshed list)." });
            }

            closeEdit();
        } catch (err) {
            console.error("Edit save error", err);
            setMessage({ type: "error", text: "Failed to update problem." });
        } finally {
            setEditSubmitting(false);
        }
    };

    // tiny util for pretty timestamp
    const prettyDate = (iso) => {
        try {
            return new Date(iso).toLocaleString();
        } catch {
            return String(iso);
        }
    };

    return (
        <div className="min-h-screen bg-white text-gray-800">
            <div className="max-w-5xl mx-auto px-6 py-8">
                {/* Top header */}
                <div className="flex items-center justify-between gap-6 mb-6">
                    <div className="flex items-center gap-4">
                        <div className="p-3 rounded-lg bg-gradient-to-tr from-blue-600 to-purple-600 shadow-lg text-white">
                            {/* icon */}
                            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M12 8c-3.866 0-7 1.79-7 4v4h14v-4c0-2.21-3.134-4-7-4zM12 4c1.657 0 3 .895 3 2s-1.343 2-3 2-3-.895-3-2 1.343-2 3-2z" />
                            </svg>
                        </div>
                        <div>
                            <h1 className="text-2xl font-semibold">Course LAB Problems </h1>
                            <p className="text-sm text-gray-500">Manage and publish problems to exam lists</p>
                        </div>
                    </div>

                    <div className="flex items-center gap-3">
                        <button
                            onClick={() => { setCourseCode(""); setCourseTitle(""); setMessage(null); }}
                            className="px-3 py-2 rounded-md border hover:bg-gray-50 text-sm"
                            title="Clear inputs"
                        >
                            Reset inputs
                        </button>

                        <button
                            onClick={handleSaveCourse}
                            className="px-4 py-2 bg-gradient-to-r from-green-600 to-emerald-500 text-white rounded-md shadow hover:opacity-95 text-sm"
                            title="Save Course (loads problems)"
                        >
                            Save Course
                        </button>
                    </div>
                </div>

                {/* message bar */}
                {message && (
                    <div className={`mb-5 rounded-md p-3 ${message.type === "success" ? "bg-green-50 border border-green-100 text-green-700" : "bg-red-50 border border-red-100 text-red-700"}`}>
                        <div className="flex items-center gap-3">
                            <div className="text-sm">{message.text}</div>
                            <div className="ml-auto text-xs text-gray-400">{new Date().toLocaleTimeString()}</div>
                        </div>
                    </div>
                )}

                {/* Course card */}
                <div className="mb-6 bg-white border rounded-xl shadow-sm p-5 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                    {!courseSaved ? (
                        <div className="w-full grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-600 mb-1">Course Code (used for query)</label>
                                <input value={courseCode} onChange={(e) => setCourseCode(e.target.value)} className="w-full rounded-md border px-3 py-2 focus:ring-2 focus:ring-blue-100" placeholder="e.g. CSIT-121" />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-600 mb-1">Course Title (display only)</label>
                                <input value={courseTitle} onChange={(e) => setCourseTitle(e.target.value)} className="w-full rounded-md border px-3 py-2 focus:ring-2 focus:ring-blue-100" placeholder="e.g. C Programming LAB" />
                            </div>
                        </div>
                    ) : (
                        <div className="flex-1">
                            <div className="flex items-start justify-between gap-4">
                                <div>
                                    <div className="text-sm text-gray-500">Course Code</div>
                                    <div className="font-medium text-lg">{courseCode}</div>
                                    <div className="text-sm text-gray-500 mt-2">Course Title</div>
                                    <div className="font-medium">{courseTitle}</div>
                                </div>

                                <div className="flex gap-2 items-center">
                                    <button onClick={() => setCourseSaved(false)} className="px-3 py-2 rounded-md border hover:bg-gray-50 text-sm">Edit</button>
                                    <button onClick={handleClearCourse} className="px-3 py-2 rounded-md border bg-red-50 text-red-700 hover:bg-red-100 text-sm">Reset</button>
                                </div>
                            </div>
                        </div>
                    )}
                </div>

                {/* Actions row */}
                <div className="flex items-center justify-between gap-4 mb-6">
                    <div className="flex items-center gap-3">
                        <button onClick={handleCreateClick} className="inline-flex items-center gap-2 bg-gradient-to-r from-blue-600 to-purple-600 text-white px-4 py-2 rounded-md shadow hover:opacity-95">
                            <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor"><path strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" d="M12 5v14M5 12h14" /></svg>
                            Create a Problem
                        </button>

                        <button onClick={() => loadProblems(courseCode)} className="px-3 py-2 rounded-md border hover:bg-gray-50 text-sm" title="Reload problems">
                            {loadingList ? "Loading..." : "Reload"}
                        </button>
                    </div>

                    <div className="text-sm text-gray-500">Total problems: <span className="font-medium text-gray-700">{problems.length}</span></div>
                </div>

                {/* Problems list */}
                <div className="mb-8">
                    <h2 className="text-lg font-semibold mb-3">All Problems for this Course</h2>

                    {loadingList ? (
                        <div className="p-6 rounded-md bg-gray-50 border text-sm text-gray-600">Loading problems...</div>
                    ) : problems.length === 0 ? (
                        <div className="p-6 rounded-md bg-gray-50 border text-sm text-gray-600">No problems for this course yet. Click <span className="font-semibold">Create a Problem</span> to add one.</div>
                    ) : (
                        <ul className="grid grid-cols-1 gap-4">
                            {problems.map((p) => (
                                <li key={p.id} className="flex items-center justify-between bg-white border rounded-lg p-4 shadow-sm hover:shadow-md transition">
                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-center gap-3">
                                            <div className="w-10 h-10 rounded-md bg-gradient-to-br from-indigo-100 to-indigo-200 flex items-center justify-center text-indigo-700 font-semibold">
                                                {(p.title || "P").charAt(0).toUpperCase()}
                                            </div>
                                            <div className="min-w-0">
                                                <div className="flex items-baseline gap-3">
                                                    <h3 className="font-semibold text-sm truncate">{p.title}</h3>
                                                    <span className="text-xs text-gray-400">#{p.id}</span>
                                                </div>
                                                <div className="text-xs text-gray-500 mt-1">Created: <span className="font-medium text-gray-700">{prettyDate(p.createdAt ?? p.updatedAt ?? Date.now())}</span></div>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="flex items-center gap-2 ml-4">
                                        <button onClick={() => openEdit(p)} className="text-sm px-3 py-1 rounded-md border hover:bg-gray-50 transition">Edit</button>
                                        <button onClick={() => handleDelete(p.id)} className="text-sm px-3 py-1 rounded-md border bg-red-50 text-red-700 hover:bg-red-100 transition">Delete</button>

                                        {!p.inExam ? (
                                            <button onClick={() => handleAddToExam(p.id)} className="text-sm px-3 py-1 rounded-md border bg-blue-50 text-blue-700 hover:bg-blue-100 transition">Add</button>
                                        ) : (
                                            <button disabled className="text-sm px-3 py-1 rounded-md border bg-green-50 text-green-700 cursor-not-allowed">Added</button>
                                        )}
                                    </div>
                                </li>
                            ))}
                        </ul>
                    )}
                </div>

                {/* Create form (keeps same functionality) */}
                {showProblemForm && (
                    <div id="new-problem-form" className="mb-8 bg-gray-50 p-6 rounded-xl border shadow-sm">
                        <div className="flex items-center justify-between mb-4">
                            <h3 className="text-lg font-semibold">New Problem Details</h3>
                            <div className="flex items-center gap-2">
                                <button onClick={() => { setShowProblemForm(false); setMessage(null); }} className="text-sm px-3 py-1 rounded-md border hover:bg-white">Cancel</button>
                                <button onClick={handleAddProblem} disabled={submitting} className="text-sm px-4 py-2 bg-blue-600 text-white rounded-md shadow hover:opacity-95">
                                    {submitting ? "Adding..." : "Add Problem"}
                                </button>
                            </div>
                        </div>

                        <div className="grid grid-cols-1 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-600 mb-1">Problem Title</label>
                                <input value={title} onChange={(e) => setTitle(e.target.value)} className="w-full rounded-md border px-3 py-2 focus:ring-2 focus:ring-blue-100" placeholder="Problem title..." />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-600 mb-1">Problem Statement</label>
                                <textarea value={problemStatement} onChange={(e) => setProblemStatement(e.target.value)} rows={6} className="w-full rounded-md border px-3 py-2 focus:ring-2 focus:ring-blue-100" placeholder="Write the problem statement..." />
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-600 mb-1">Input Format</label>
                                    <textarea value={inputFormat} onChange={(e) => setInputFormat(e.target.value)} rows={3} className="w-full rounded-md border px-3 py-2" placeholder="Describe input format..." />
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-600 mb-1">Output Format</label>
                                    <textarea value={outputFormat} onChange={(e) => setOutputFormat(e.target.value)} rows={3} className="w-full rounded-md border px-3 py-2" placeholder="Describe output format..." />
                                </div>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-600 mb-1">Sample Input</label>
                                    <textarea value={sampleInput} onChange={(e) => setSampleInput(e.target.value)} rows={3} className="w-full rounded-md border px-3 py-2" placeholder="Sample input..." />
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-600 mb-1">Sample Output</label>
                                    <textarea value={sampleOutput} onChange={(e) => setSampleOutput(e.target.value)} rows={3} className="w-full rounded-md border px-3 py-2" placeholder="Sample output..." />
                                </div>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-600 mb-1">Constraints</label>
                                <textarea value={constraints} onChange={(e) => setConstraints(e.target.value)} rows={3} className="w-full rounded-md border px-3 py-2" placeholder="Constraints, e.g. 1 ≤ n ≤ 10^5" />
                            </div>
                        </div>
                    </div>
                )}

                {/* Edit Modal (keeps same behavior but prettier) */}
                {editingProblem && (
                    <div className="fixed inset-0 z-50 flex items-start justify-center py-10 px-4" role="dialog" aria-modal="true" onKeyDown={(e) => { if (e.key === "Escape") closeEdit(); }}>
                        <div className="absolute inset-0 bg-black/40" onClick={closeEdit} aria-hidden="true" />
                        <div className="relative bg-white rounded-xl shadow-xl w-full max-w-5xl h-[calc(100vh-120px)] overflow-auto p-6 z-10">
                            <div className="flex items-start justify-between gap-4 mb-4">
                                <div>
                                    <h3 className="text-lg font-semibold">Edit Problem</h3>
                                    <p className="text-sm text-gray-500 mt-1">Update fields and click Save to apply changes.</p>
                                </div>
                                <div className="flex items-center gap-2">
                                    <button onClick={closeEdit} aria-label="Close edit dialog" className="inline-flex items-center justify-center rounded-md p-2 hover:bg-gray-100">
                                        <svg className="w-5 h-5 text-gray-600" viewBox="0 0 24 24" fill="none" stroke="currentColor"><path strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>
                                    </button>
                                </div>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div>
                                    <label className="block text-sm font-medium mb-1">Category (Course Code)</label>
                                    <input value={courseCode} disabled className="w-full rounded-md border px-3 py-2 bg-gray-100" />
                                </div>

                                <div>
                                    <label className="block text-sm font-medium mb-1">Course Title (display)</label>
                                    <input value={editingProblem.courseTitle ?? courseTitle} onChange={(e) => handleEditChange("courseTitle", e.target.value)} className="w-full rounded-md border px-3 py-2" />
                                </div>

                                <div className="md:col-span-2">
                                    <label className="block text-sm font-medium mb-1">Problem Title</label>
                                    <input value={editingProblem.title} onChange={(e) => handleEditChange("title", e.target.value)} className="w-full rounded-md border px-3 py-2" />
                                </div>

                                <div className="md:col-span-2">
                                    <label className="block text-sm font-medium mb-1">Problem Statement</label>
                                    <textarea value={editingProblem.problemStatement} onChange={(e) => handleEditChange("problemStatement", e.target.value)} rows={8} className="w-full min-h-[160px] rounded-md border px-3 py-2 resize-y" />
                                </div>

                                <div>
                                    <label className="block text-sm font-medium mb-1">Input Format</label>
                                    <textarea value={editingProblem.inputFormat} onChange={(e) => handleEditChange("inputFormat", e.target.value)} rows={4} className="w-full rounded-md border px-3 py-2 resize-y" />
                                </div>

                                <div>
                                    <label className="block text-sm font-medium mb-1">Output Format</label>
                                    <textarea value={editingProblem.outputFormat} onChange={(e) => handleEditChange("outputFormat", e.target.value)} rows={4} className="w-full rounded-md border px-3 py-2 resize-y" />
                                </div>

                                <div>
                                    <label className="block text-sm font-medium mb-1">Sample Input</label>
                                    <textarea value={editingProblem.sampleInput} onChange={(e) => handleEditChange("sampleInput", e.target.value)} rows={4} className="w-full rounded-md border px-3 py-2 resize-y" />
                                </div>

                                <div>
                                    <label className="block text-sm font-medium mb-1">Sample Output</label>
                                    <textarea value={editingProblem.sampleOutput} onChange={(e) => handleEditChange("sampleOutput", e.target.value)} rows={4} className="w-full rounded-md border px-3 py-2 resize-y" />
                                </div>

                                <div className="md:col-span-2">
                                    <label className="block text-sm font-medium mb-1">Constraints</label>
                                    <textarea value={editingProblem.constraints} onChange={(e) => handleEditChange("constraints", e.target.value)} rows={3} className="w-full rounded-md border px-3 py-2 resize-y" />
                                </div>
                            </div>

                            <div className="mt-6 flex items-center justify-end gap-3">
                                <button onClick={closeEdit} className="bg-gray-200 px-4 py-2 rounded-md hover:bg-gray-300 transition">Cancel</button>
                                <button onClick={handleSaveEdit} disabled={editSubmitting} className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 disabled:opacity-60 transition">
                                    {editSubmitting ? "Saving..." : "Save"}
                                </button>
                            </div>
                        </div>
                    </div>
                )}
            </div>

            {/* floating create button (mobile-friendly) */}
            <div className="fixed bottom-6 right-6 z-40">
                <button onClick={handleCreateClick} className="flex items-center gap-3 px-4 py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-full shadow-lg hover:scale-105 transition">
                    <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor"><path strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" d="M12 5v14M5 12h14" /></svg>
                    <span className="hidden sm:inline text-sm font-semibold">Create Problem</span>
                </button>
            </div>
        </div>
    );
}
