// app/admin/login/mcq/page.js
'use client'
import React, { useState } from 'react';
import { Upload, Settings, CheckCircle, AlertCircle, Loader } from 'lucide-react';

export default function AdminMCQPage() {
    const [file, setFile] = useState(null);
    const [batchId, setBatchId] = useState('');
    const [courseCode, setCourseCode] = useState('');
    const [courseTitle, setCourseTitle] = useState('');
    const [timeHHMM, setTimeHHMM] = useState('00:02');
    const [msg, setMsg] = useState('');
    const [loading, setLoading] = useState(false);

    const handleUpload = async (e) => {
        e.preventDefault();
        if (!file) return alert('Please select CSV file');
        setLoading(true);
        const fd = new FormData();
        fd.append('file', file);
        try {
            const res = await fetch('/api/admin/upload', { method: 'POST', body: fd });
            const j = await res.json();
            if (!res.ok) {
                setMsg(`Upload failed: ${j.error || JSON.stringify(j)}`);
            } else if (j.batchId) {
                setBatchId(j.batchId);
                setMsg(`CSV uploaded. batchId: ${j.batchId}`);
            } else {
                setMsg(JSON.stringify(j));
            }
        } catch (err) {
            setMsg('Network error: ' + err.message);
        } finally {
            setLoading(false);
        }
    };

    const handleSetExam = async () => {
        if (!batchId) return alert('Upload CSV first (Save) to get batchId');
        if (!courseCode || !courseTitle || !timeHHMM) return alert('Fill all fields');
        setLoading(true);
        try {
            const res = await fetch('/api/admin/set-exam', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ courseCode, courseTitle, timeHHMM, batchId })
            });
            const j = await res.json();
            if (j.ok) setMsg(`Exam set with id: ${j.examSetupId}`);
            else setMsg(JSON.stringify(j));
        } catch (err) {
            setMsg(err.message);
        } finally {
            setLoading(false);
        }
    };

    const isSuccess = msg.includes('uploaded') || msg.includes('Exam set');
    const isError = msg.includes('failed') || msg.includes('error') || msg.includes('Network');

    return (
        <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 p-6">
            <div className="max-w-4xl mx-auto">
                {/* Header */}
                <div className="mb-8">
                    <h1 className="text-4xl font-bold text-gray-800 mb-2">MCQ Exam Management</h1>
                    <p className="text-gray-600">Upload questions and configure exam settings</p>
                </div>

                {/* Upload Section */}
                <div className="bg-white rounded-lg shadow-lg border border-gray-200 p-8 mb-6">
                    <div className="flex items-center gap-3 mb-6">
                        <div className="p-3 bg-blue-100 rounded-lg">
                            <Upload className="w-6 h-6 text-blue-600" />
                        </div>
                        <h2 className="text-2xl font-semibold text-gray-800">Step 1: Upload CSV</h2>
                    </div>

                    <form onSubmit={handleUpload} className="space-y-5">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                CSV File Format
                            </label>
                            <p className="text-xs text-gray-500 mb-3">
                                Required columns: id, question, options, correctOption, points
                            </p>
                            <div className="relative">
                                <input
                                    type="file"
                                    accept=".csv"
                                    onChange={(e) => setFile(e.target.files[0])}
                                    className="hidden"
                                    id="csv-input"
                                />
                                <label
                                    htmlFor="csv-input"
                                    className="flex items-center justify-center w-full px-4 py-4 border-2 border-dashed border-blue-300 rounded-lg cursor-pointer hover:border-blue-500 hover:bg-blue-50 transition-colors"
                                >
                                    <div className="text-center">
                                        <Upload className="w-8 h-8 text-blue-600 mx-auto mb-2" />
                                        <p className="text-sm font-medium text-gray-700">
                                            {file ? file.name : 'Click to select CSV file'}
                                        </p>
                                        <p className="text-xs text-gray-500 mt-1">or drag and drop</p>
                                    </div>
                                </label>
                            </div>
                        </div>

                        <div className="flex gap-3 pt-2">
                            <button
                                type="submit"
                                className="flex-1 px-6 py-3 bg-gradient-to-r from-blue-600 to-blue-700 text-white font-medium rounded-lg hover:from-blue-700 hover:to-blue-800 disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center justify-center gap-2"
                                disabled={loading}
                            >
                                {loading ? (
                                    <>
                                        <Loader className="w-4 h-4 animate-spin" />
                                        Uploading...
                                    </>
                                ) : (
                                    <>
                                        <Upload className="w-4 h-4" />
                                        Upload CSV
                                    </>
                                )}
                            </button>
                            <button
                                type="button"
                                onClick={() => { setFile(null); setBatchId(''); setMsg(''); }}
                                className="px-6 py-3 bg-gray-100 text-gray-700 font-medium rounded-lg hover:bg-gray-200 transition-colors"
                            >
                                Reset
                            </button>
                        </div>

                        {batchId && (
                            <div className="flex items-center gap-2 p-4 bg-green-50 border border-green-200 rounded-lg">
                                <CheckCircle className="w-5 h-5 text-green-600" />
                                <div>
                                    <p className="text-sm font-medium text-green-900">Batch Created</p>
                                    <p className="text-xs text-green-700">ID: <span className="font-mono font-semibold">{batchId}</span></p>
                                </div>
                            </div>
                        )}
                    </form>
                </div>

                {/* Exam Configuration Section */}
                <div className="bg-white rounded-lg shadow-lg border border-gray-200 p-8 mb-6">
                    <div className="flex items-center gap-3 mb-6">
                        <div className="p-3 bg-green-100 rounded-lg">
                            <Settings className="w-6 h-6 text-green-600" />
                        </div>
                        <h2 className="text-2xl font-semibold text-gray-800">Step 2: Configure Exam</h2>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-5 mb-6">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Course Code
                            </label>
                            <input
                                value={courseCode}
                                onChange={e => setCourseCode(e.target.value)}
                                placeholder="e.g., CS101"
                                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Course Title
                            </label>
                            <input
                                value={courseTitle}
                                onChange={e => setCourseTitle(e.target.value)}
                                placeholder="e.g., Data Structures"
                                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Duration (HH:MM)
                            </label>
                            <input
                                value={timeHHMM}
                                onChange={e => setTimeHHMM(e.target.value)}
                                placeholder="00:02"
                                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all"
                            />
                        </div>
                    </div>

                    <button
                        onClick={handleSetExam}
                        disabled={loading || !batchId}
                        className="w-full px-6 py-3 bg-gradient-to-r from-green-600 to-green-700 text-white font-medium rounded-lg hover:from-green-700 hover:to-green-800 disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center justify-center gap-2"
                    >
                        {loading ? (
                            <>
                                <Loader className="w-4 h-4 animate-spin" />
                                Setting Exam...
                            </>
                        ) : (
                            <>
                                <Settings className="w-4 h-4" />
                                Set Exam
                            </>
                        )}
                    </button>
                </div>

                {/* Message Display */}
                {msg && (
                    <div className={`rounded-lg border p-4 flex gap-3 ${isSuccess
                            ? 'bg-green-50 border-green-200'
                            : isError
                                ? 'bg-red-50 border-red-200'
                                : 'bg-blue-50 border-blue-200'
                        }`}>
                        {isSuccess ? (
                            <CheckCircle className={`w-5 h-5 flex-shrink-0 ${isSuccess ? 'text-green-600' : isError ? 'text-red-600' : 'text-blue-600'}`} />
                        ) : isError ? (
                            <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0" />
                        ) : (
                            <AlertCircle className="w-5 h-5 text-blue-600 flex-shrink-0" />
                        )}
                        <pre className={`text-sm font-mono whitespace-pre-wrap break-words flex-1 ${isSuccess
                                ? 'text-green-800'
                                : isError
                                    ? 'text-red-800'
                                    : 'text-blue-800'
                            }`}>
                            {msg}
                        </pre>
                    </div>
                )}
            </div>
        </div>
    );
}