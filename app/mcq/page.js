'use client';
import React, { useEffect, useState, useRef } from 'react';
import { useSession, signIn } from 'next-auth/react';

export default function StudentExamPage() {
    const { data: session, status } = useSession();
    const [examInfo, setExamInfo] = useState(null);
    const [questions, setQuestions] = useState([]);
    const [examInstanceId, setExamInstanceId] = useState(null);
    const [answers, setAnswers] = useState({});
    const [timeLeft, setTimeLeft] = useState(null);
    const [submitted, setSubmitted] = useState(false);
    const [scoreResult, setScoreResult] = useState(null);
    const autosaveTimeout = useRef(null);
    const timerRef = useRef(null);

    useEffect(() => {
        fetch('/api/mcqexam/current')
            .then(r => r.json())
            .then(j => {
                if (j.ok) setExamInfo(j.exam);
                else setExamInfo(null);
            }).catch(() => setExamInfo(null));
    }, []);

    const startTimer = (duration) => {
        setTimeLeft(duration);
        if (timerRef.current) clearInterval(timerRef.current);
        timerRef.current = setInterval(() => {
            setTimeLeft(prev => {
                if (prev <= 1) {
                    clearInterval(timerRef.current);
                    handleAutoSubmit();
                    return 0;
                }
                return prev - 1;
            });
        }, 1000);
    };

    const startExam = async () => {
        if (status !== 'authenticated') {
            signIn();
            return;
        }

        const res = await fetch('/api/mcqexam/start', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ size: 10 })
        });
        const j = await res.json();
        if (!j.ok) {
            alert(j.error || 'Could not start exam');
            return;
        }

        setExamInstanceId(j.examInstanceId);
        setQuestions(j.questions || []);
        setAnswers({});
        startTimer(examInfo?.durationSeconds || 120);
        setSubmitted(false);
        setScoreResult(null);
    };

    const scheduleAutosave = (newAnswers) => {
        if (!examInstanceId) return;
        if (autosaveTimeout.current) clearTimeout(autosaveTimeout.current);
        autosaveTimeout.current = setTimeout(async () => {
            try {
                await fetch('/api/mcqexam/save', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        examInstanceId,
                        answers: Object.entries(newAnswers).map(([qid, sel]) => ({ questionId: qid, selectedIndex: sel }))
                    })
                });
            } catch (e) {
                console.warn('autosave failed', e);
            }
        }, 700);
    };

    const handleSelect = (qid, idx) => {
        if (timeLeft === 0 || submitted) return;
        const next = { ...answers, [qid]: idx };
        setAnswers(next);
        scheduleAutosave(next);
    };

    const handleSubmit = async () => {
        if (!examInstanceId) return;
        const payload = Object.entries(answers).map(([qid, sel]) => ({ questionId: qid, selectedIndex: sel }));
        const res = await fetch('/api/mcqexam/submit', {
            method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ examInstanceId, answers: payload })
        });
        const j = await res.json();
        if (j.ok) {
            setScoreResult({ score: j.score, total: j.total });
            setSubmitted(true);
            setTimeLeft(0);
            if (timerRef.current) clearInterval(timerRef.current);
            alert(`Submitted — Score: ${j.score}/${j.total}`);
        } else {
            alert('Submit error: ' + (j.error || 'Unknown'));
        }
    };

    const handleAutoSubmit = async () => {
        if (submitted || !examInstanceId) return;
        await handleSubmit();
    };

    const formatTime = (secs) => {
        if (secs == null) return 'Not started';
        const mm = Math.floor(secs / 60);
        const ss = secs % 60;
        return `${mm}:${String(ss).padStart(2, '0')}`;
    };

    const timePercentage = examInfo?.durationSeconds ? ((examInfo.durationSeconds - (timeLeft ?? 0)) / examInfo.durationSeconds) * 100 : 0;
    const answeredCount = Object.keys(answers).length;
    const timeWarning = timeLeft !== null && timeLeft < 300;
    const timeCritical = timeLeft !== null && timeLeft < 60;

    if (!examInfo) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 flex items-center justify-center p-4">
                <div className="bg-white rounded-xl shadow-xl p-8 text-center max-w-md">
                    <div className="text-5xl mb-4">📋</div>
                    <h2 className="text-2xl font-bold text-gray-800 mb-2">No Active Exam</h2>
                    <p className="text-gray-600">There is currently no active MCQ exam available.</p>
                    <p className="text-sm text-gray-500 mt-4">Please check back later or contact your instructor.</p>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50">
            {/* Header */}
            <div className="sticky top-0 z-50 bg-white shadow-sm border-b border-gray-200">
                <div className="max-w-6xl mx-auto px-4 py-4 sm:px-6">
                    <div className="flex items-center justify-between gap-4">
                        <div className="flex-1 min-w-0">
                            <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 truncate">{examInfo.courseTitle}</h1>
                            <p className="text-sm text-gray-500 mt-1">{examInfo.courseCode}</p>
                        </div>
                        
                        {/* Timer */}
                        <div className={`text-right p-3 rounded-lg ${
                            timeCritical ? 'bg-red-50 border border-red-200' :
                            timeWarning ? 'bg-amber-50 border border-amber-200' :
                            'bg-blue-50 border border-blue-200'
                        }`}>
                            <p className="text-xs font-medium text-gray-600">Time Remaining</p>
                            <p className={`text-2xl font-bold font-mono mt-1 ${
                                timeCritical ? 'text-red-600' :
                                timeWarning ? 'text-amber-600' :
                                'text-blue-600'
                            }`}>
                                {formatTime(timeLeft)}
                            </p>
                        </div>
                    </div>
                </div>
            </div>

            {/* Main Content */}
            <div className="max-w-6xl mx-auto px-4 sm:px-6 py-8">
                {!questions.length ? (
                    // Start Exam Screen
                    <div className="flex items-center justify-center min-h-[60vh]">
                        <div className="bg-white rounded-2xl shadow-2xl p-8 sm:p-12 max-w-md w-full">
                            <div className="text-center">
                                <div className="text-6xl mb-6">🎯</div>
                                <h2 className="text-3xl font-bold text-gray-900 mb-4">Ready to Begin?</h2>
                                <p className="text-gray-600 mb-2">
                                    {examInfo.durationSeconds ? `${Math.floor(examInfo.durationSeconds / 60)} minutes` : 'Limited time'} exam
                                </p>
                                <p className="text-sm text-gray-500 mb-8">
                                    You will answer multiple choice questions. Good luck!
                                </p>
                                
                                <button
                                    onClick={startExam}
                                    className="w-full px-6 py-3 bg-gradient-to-r from-indigo-600 to-blue-600 text-white font-semibold rounded-lg hover:from-indigo-700 hover:to-blue-700 transition-all shadow-lg hover:shadow-xl transform hover:scale-105"
                                >
                                    {status === 'authenticated' ? '▶️ Start Exam' : '🔐 Sign in to Start'}
                                </button>
                            </div>
                        </div>
                    </div>
                ) : (
                    <>
                        {/* Progress Section */}
                        <div className="mb-8">
                            <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-200">
                                <div className="flex items-center justify-between mb-3">
                                    <h3 className="text-sm font-semibold text-gray-700">Exam Progress</h3>
                                    <span className="text-sm font-medium text-indigo-600">
                                        {answeredCount} of {questions.length} answered
                                    </span>
                                </div>
                                
                                {/* Progress Bar */}
                                <div className="w-full h-3 bg-gray-200 rounded-full overflow-hidden">
                                    <div
                                        className={`h-3 rounded-full transition-all duration-300 ${
                                            submitted ? 'bg-green-500' :
                                            timeCritical ? 'bg-red-500' :
                                            timeWarning ? 'bg-amber-500' :
                                            'bg-indigo-500'
                                        }`}
                                        style={{ width: `${timePercentage}%` }}
                                    />
                                </div>

                                {/* Status Bar */}
                                <div className="flex items-center gap-4 mt-4 text-xs sm:text-sm">
                                    <div className="flex items-center gap-2">
                                        <span className="inline-block w-2 h-2 rounded-full bg-indigo-500"></span>
                                        <span className="text-gray-600">Progress: {Math.round(timePercentage)}%</span>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <span className="inline-block w-2 h-2 rounded-full bg-green-500"></span>
                                        <span className="text-gray-600">Answered: {answeredCount}/{questions.length}</span>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Questions Container */}
                        <div className="grid gap-6 mb-8">
                            {questions.map((q, i) => (
                                <div
                                    key={q.id}
                                    className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden hover:shadow-md transition-shadow"
                                >
                                    {/* Question Header */}
                                    <div className="bg-gradient-to-r from-indigo-50 to-blue-50 px-6 py-4 border-b border-gray-200">
                                        <div className="flex items-start gap-4">
                                            <div className="flex-shrink-0 w-8 h-8 rounded-full bg-indigo-600 text-white flex items-center justify-center font-semibold text-sm">
                                                {i + 1}
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <p className="text-gray-900 font-medium leading-relaxed">{q.text}</p>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Options */}
                                    <div className="p-6">
                                        <div className="space-y-3">
                                            {q.options.map((opt, idx) => {
                                                const checked = answers[q.id] === idx;
                                                const isDisabled = timeLeft === 0 || submitted;
                                                
                                                return (
                                                    <label
                                                        key={idx}
                                                        className={`flex items-start gap-4 p-4 rounded-lg cursor-pointer border-2 transition-all ${
                                                            checked
                                                                ? 'border-indigo-500 bg-indigo-50'
                                                                : 'border-gray-200 bg-gray-50 hover:bg-gray-100 hover:border-gray-300'
                                                        } ${isDisabled ? 'opacity-60 cursor-not-allowed' : ''}`}
                                                    >
                                                        <input
                                                            type="radio"
                                                            name={q.id}
                                                            checked={checked}
                                                            onChange={() => handleSelect(q.id, idx)}
                                                            disabled={isDisabled}
                                                            className="flex-shrink-0 w-5 h-5 mt-0.5 cursor-pointer"
                                                        />
                                                        <span className={`flex-1 text-sm sm:text-base leading-relaxed ${
                                                            checked ? 'text-indigo-900 font-medium' : 'text-gray-700'
                                                        }`}>
                                                            {opt}
                                                        </span>
                                                        {checked && (
                                                            <span className="flex-shrink-0 text-indigo-600 font-bold">✓</span>
                                                        )}
                                                    </label>
                                                );
                                            })}
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>

                        {/* Footer Actions */}
                        <div className="sticky bottom-0 bg-white border-t border-gray-200 shadow-lg">
                            <div className="max-w-6xl mx-auto px-4 sm:px-6 py-4">
                                <div className="flex flex-col sm:flex-row items-center gap-4 justify-between">
                                    <div className="text-sm text-gray-600">
                                        {submitted ? (
                                            <div className="flex items-center gap-2">
                                                <span className="text-2xl">✅</span>
                                                <span className="font-semibold">
                                                    Exam Submitted — 
                                                    <span className="text-indigo-600 ml-1">
                                                        {scoreResult ? `${scoreResult.score}/${scoreResult.total}` : 'Scoring...'}
                                                    </span>
                                                </span>
                                            </div>
                                        ) : (
                                            <div className="flex items-center gap-2">
                                                <span className="text-lg">💾</span>
                                                <span>Auto-saving your answers...</span>
                                            </div>
                                        )}
                                    </div>
                                    
                                    <button
                                        onClick={handleSubmit}
                                        disabled={timeLeft === 0 || submitted}
                                        className={`px-8 py-3 font-semibold rounded-lg transition-all transform ${
                                            submitted
                                                ? 'bg-gray-100 text-gray-500 cursor-not-allowed'
                                                : timeCritical
                                                ? 'bg-gradient-to-r from-red-500 to-red-600 text-white hover:shadow-lg hover:scale-105'
                                                : 'bg-gradient-to-r from-green-500 to-green-600 text-white hover:shadow-lg hover:scale-105'
                                        }`}
                                    >
                                        {submitted ? '✓ Submitted' : '📤 Submit Now'}
                                    </button>
                                </div>
                            </div>
                        </div>
                    </>
                )}
            </div>
        </div>
    );
}