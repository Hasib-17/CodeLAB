// app/lab/page.js
"use client";
import React, { useEffect, useState } from "react";

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

    // NEW: Add problem to Exam (set inExam=true)
    const handleAddToExam = async (problemId) => {
        // optimistic update locally
        setProblems((prev) => prev.map((p) => (p.id === problemId ? { ...p, inExam: true } : p)));
        try {
            const res = await fetch(`/api/problems/${encodeURIComponent(problemId)}`, {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ inExam: true }),
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
            // rollback: reload full list from server
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

    return (
        <div className="p-6 max-w-3xl mx-auto">
            <h1 className="text-2xl font-semibold mb-4">Course Problems (Admin)</h1>

            {/* Messages */}
            {message && <div className={`mb-4 p-3 rounded ${message.type === "success" ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"}`}>{message.text}</div>}

            {/* Course display (code required for queries; title is optional) */}
            <div className="mb-6 bg-white p-4 rounded-md border">
                {!courseSaved ? (
                    <>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-3">
                            <div>
                                <label className="block text-sm font-medium mb-1">Course Code (used for query)</label>
                                <input value={courseCode} onChange={(e) => setCourseCode(e.target.value)} className="w-full rounded-md border px-3 py-2" placeholder="e.g. CSIT-121" />
                            </div>

                            <div>
                                <label className="block text-sm font-medium mb-1">Course Title (display only)</label>
                                <input value={courseTitle} onChange={(e) => setCourseTitle(e.target.value)} className="w-full rounded-md border px-3 py-2" placeholder="e.g. C Programming LAB" />
                            </div>
                        </div>

                        <div className="flex gap-3">
                            <button onClick={handleSaveCourse} className="bg-green-600 text-white px-4 py-2 rounded-md hover:bg-green-700 transition">Save Course</button>
                            <button onClick={() => { setCourseCode(""); setCourseTitle(""); setMessage(null); }} className="bg-gray-200 px-4 py-2 rounded-md hover:bg-gray-300 transition">Clear</button>
                        </div>
                    </>
                ) : (
                    <div className="flex items-center justify-between gap-4">
                        <div>
                            <div className="text-sm text-gray-600">Course Code</div>
                            <div className="font-medium">{courseCode}</div>
                            <div className="text-sm text-gray-600 mt-2">Course Title</div>
                            <div className="font-medium">{courseTitle}</div>
                        </div>

                        <div className="flex gap-3">
                            <button onClick={() => setCourseSaved(false)} className="px-3 py-2 rounded-md border hover:bg-gray-50">Edit</button>
                            <button onClick={handleClearCourse} className="px-3 py-2 rounded-md border bg-red-50 text-red-700 hover:bg-red-100">Reset</button>
                        </div>
                    </div>
                )}
            </div>

            {/* All problems for the selected course */}
            <div className="mb-6">
                <h2 className="text-lg font-medium mb-3">All Problems for this Course</h2>

                {loadingList ? (
                    <div className="text-sm text-gray-600">Loading...</div>
                ) : problems.length === 0 ? (
                    <div className="text-sm text-gray-500">No problems for this course yet.</div>
                ) : (
                    <ul className="space-y-3">
                        {problems.map((p) => (
                            <li key={p.id} className="flex items-center justify-between bg-white border rounded-md p-3 shadow-sm">
                                <div>
                                    <div className="flex items-baseline gap-3">
                                        <h3 className="font-semibold text-sm">{p.title}</h3>
                                        <span className="text-xs text-gray-500">#{p.id}</span>
                                    </div>
                                    <div className="text-xs text-gray-600">
                                        Created: <span className="font-medium">{new Date(p.createdAt ?? p.updatedAt ?? Date.now()).toLocaleString()}</span>
                                    </div>
                                </div>

                                <div className="flex items-center gap-2">
                                    <button onClick={() => openEdit(p)} className="text-sm px-3 py-1 rounded-md border hover:bg-gray-100 transition">Edit</button>
                                    <button onClick={() => handleDelete(p.id)} className="text-sm px-3 py-1 rounded-md border bg-red-50 text-red-700 hover:bg-red-100 transition">Delete</button>

                                    {/* Add to Exam button */}
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

            {/* Create button & form */}
            <div className="mb-6">
                <button onClick={handleCreateClick} className="bg-green-600 text-white px-4 py-2 rounded-md hover:bg-green-700 transition">Create a new Problem</button>
            </div>

            {showProblemForm && (
                <div className="bg-gray-50 p-4 rounded-md border mb-8">
                    <h2 className="text-lg font-medium mb-3">New Problem Details</h2>

                    <div className="mb-3">
                        <label className="block text-sm font-medium mb-1">Problem Title</label>
                        <input value={title} onChange={(e) => setTitle(e.target.value)} className="w-full rounded-md border px-3 py-2" placeholder="Problem title..." />
                    </div>

                    <div className="mb-3">
                        <label className="block text-sm font-medium mb-1">Problem Statement</label>
                        <textarea value={problemStatement} onChange={(e) => setProblemStatement(e.target.value)} rows={6} className="w-full rounded-md border px-3 py-2" placeholder="Write the problem statement..." />
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-3">
                        <div>
                            <label className="block text-sm font-medium mb-1">Input Format</label>
                            <textarea value={inputFormat} onChange={(e) => setInputFormat(e.target.value)} rows={3} className="w-full rounded-md border px-3 py-2" placeholder="Describe input format..." />
                        </div>

                        <div>
                            <label className="block text-sm font-medium mb-1">Output Format</label>
                            <textarea value={outputFormat} onChange={(e) => setOutputFormat(e.target.value)} rows={3} className="w-full rounded-md border px-3 py-2" placeholder="Describe output format..." />
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-3">
                        <div>
                            <label className="block text-sm font-medium mb-1">Sample Input</label>
                            <textarea value={sampleInput} onChange={(e) => setSampleInput(e.target.value)} rows={3} className="w-full rounded-md border px-3 py-2" placeholder="Sample input..." />
                        </div>

                        <div>
                            <label className="block text-sm font-medium mb-1">Sample Output</label>
                            <textarea value={sampleOutput} onChange={(e) => setSampleOutput(e.target.value)} rows={3} className="w-full rounded-md border px-3 py-2" placeholder="Sample output..." />
                        </div>
                    </div>

                    <div className="mb-3">
                        <label className="block text-sm font-medium mb-1">Constraints</label>
                        <textarea value={constraints} onChange={(e) => setConstraints(e.target.value)} rows={3} className="w-full rounded-md border px-3 py-2" placeholder="Constraints, e.g. 1 ≤ n ≤ 10^5" />
                    </div>

                    <div className="flex gap-3">
                        <button onClick={handleAddProblem} disabled={submitting} className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 disabled:opacity-60 transition">{submitting ? "Adding..." : "Add"}</button>
                        <button onClick={() => { setShowProblemForm(false); setMessage(null); }} className="bg-gray-200 px-4 py-2 rounded-md hover:bg-gray-300 transition">Cancel</button>
                    </div>
                </div>
            )}

            {/* Edit Modal */}
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
                                <button onClick={closeEdit} aria-label="Close edit dialog" className="inline-flex items-center justify-center rounded-md p-2 hover:bg-gray-100">✕</button>
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
                            <button onClick={handleSaveEdit} disabled={editSubmitting} className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 disabled:opacity-60 transition">{editSubmitting ? "Saving..." : "Save"}</button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
