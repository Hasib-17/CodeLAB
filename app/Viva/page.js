'use client';
import React, { useEffect, useState } from 'react';

export default function CSTestPage() {
    const [questions, setQuestions] = useState([]);
    const [userAnswers, setUserAnswers] = useState({});
    const [correctAnswers, setCorrectAnswers] = useState({});
    const [percentage, setPercentage] = useState(null);
    const [timeLeft, setTimeLeft] = useState(null);
    const [meta, setMeta] = useState({ courseCode: '', courseTitle: '', durationSeconds: 0 });
    const [loading, setLoading] = useState(true);
    const [errorMsg, setErrorMsg] = useState('');
    const [submitting, setSubmitting] = useState(false);

    const getSessionIdFromUrl = () => {
        if (typeof window === 'undefined') return null;
        const params = new URLSearchParams(window.location.search);
        return params.get('sessionId') || null;
    };

    const updateUrlWithSessionId = (sessionId) => {
        if (typeof window === 'undefined') return;
        const url = new URL(window.location.href);
        url.searchParams.set('sessionId', sessionId);
        window.history.replaceState({}, '', url.toString());
    };

    useEffect(() => {
        (async () => {
            setLoading(true);
            setErrorMsg('');

            let sessionId = getSessionIdFromUrl();

            if (!sessionId) {
                try {
                    const r = await fetch('/api/viva/session/latest');
                    if (!r.ok) {
                        const body = await r.json().catch(() => ({}));
                        setErrorMsg(body?.error || `No active session (${r.status})`);
                        setLoading(false);
                        return;
                    }
                    const latest = await r.json();
                    sessionId = latest?.sessionId;
                    if (!sessionId) {
                        setErrorMsg('No active session found on server.');
                        setLoading(false);
                        return;
                    }
                    updateUrlWithSessionId(sessionId);
                } catch (err) {
                    console.error('Failed to fetch latest session', err);
                    setErrorMsg('Network error while fetching latest session.');
                    setLoading(false);
                    return;
                }
            }

            const savedKey = `cs_test_session_${sessionId}`;
            const saved = typeof window !== 'undefined' ? localStorage.getItem(savedKey) : null;
            if (saved) {
                try {
                    const parsed = JSON.parse(saved);
                    setQuestions(parsed.questions || []);
                    setMeta({
                        courseCode: parsed.courseCode || '',
                        courseTitle: parsed.courseTitle || '',
                        durationSeconds: parsed.durationSeconds || 0
                    });
                    const elapsed = Math.floor((Date.now() - (parsed.startTime || Date.now())) / 1000);
                    setTimeLeft(Math.max((parsed.durationSeconds || 0) - elapsed, 0));
                    setLoading(false);
                    return;
                } catch (e) {
                    console.warn('Failed parsing saved session:', e);
                }
            }

            try {
                const res = await fetch(`/api/viva/session/${encodeURIComponent(sessionId)}`);
                if (!res.ok) {
                    const body = await res.json().catch(() => ({}));
                    setErrorMsg(body?.error || `Failed to load session (${res.status})`);
                    setLoading(false);
                    return;
                }
                const data = await res.json();
                const q = data.questions || [];
                if (!Array.isArray(q) || q.length === 0) {
                    setErrorMsg('This session has no questions. Make sure the session was created correctly.');
                    setQuestions([]);
                    setLoading(false);
                    return;
                }

                const normalized = q.map((it, idx) => ({
                    _id: String(it._id ?? it.id ?? idx),
                    question: it.question ?? ''
                }));

                setQuestions(normalized);
                const metaData = {
                    courseCode: data.courseCode || '',
                    courseTitle: data.courseTitle || '',
                    durationSeconds: data.examDurationSeconds || data.durationSeconds || 0
                };
                setMeta(metaData);

                const startTime = Date.now();
                const savedObj = { ...metaData, startTime, questions: normalized };
                try { localStorage.setItem(savedKey, JSON.stringify(savedObj)); } catch (e) { console.warn('localStorage set failed', e); }
                setTimeLeft(savedObj.durationSeconds);
                setLoading(false);
            } catch (err) {
                console.error('Fetch session error:', err);
                setErrorMsg('Network error while loading session.');
                setLoading(false);
            }
        })();
    }, []);

    useEffect(() => {
        if (timeLeft === null) return;
        if (timeLeft <= 0) {
            // ensure timeLeft is exactly zero and fetch answers
            setTimeLeft(0);
            fetchAnswersWhenExpired();
            return;
        }
        const timer = setInterval(() => setTimeLeft(prev => {
            const next = (prev ?? 0) - 1;
            if (next <= 0) {
                clearInterval(timer);
                // when timer reaches zero, fetch answers
                setTimeLeft(0);
                fetchAnswersWhenExpired();
                return 0;
            }
            return next;
        }), 1000);
        return () => clearInterval(timer);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [timeLeft, questions]);

    useEffect(() => {
        const handlePopState = () => { window.history.pushState(null, "", window.location.href); };
        const handleBeforeUnload = (e) => { e.preventDefault(); e.returnValue = ''; };

        if (typeof window !== 'undefined') window.history.pushState(null, "", window.location.href);
        window.addEventListener('popstate', handlePopState);
        window.addEventListener('beforeunload', handleBeforeUnload);

        return () => {
            window.removeEventListener('popstate', handlePopState);
            window.removeEventListener('beforeunload', handleBeforeUnload);
        };
    }, []);

    const fetchAnswersWhenExpired = async () => {
        try {
            const sessionId = getSessionIdFromUrl();
            if (!sessionId) return;
            const res = await fetch(`/api/viva/session/${encodeURIComponent(sessionId)}/answers`);
            if (!res.ok) {
                const body = await res.json().catch(() => ({}));
                if (res.status !== 403) console.warn('Fetch answers error', body);
                return;
            }
            const data = await res.json();
            const map = {};
            (data.questions || []).forEach(q => {
                const id = String(q._id ?? q.id ?? '');
                // Accept both 'answer' or 'correct_answer'
                map[id] = q.answer ?? q.correct_answer ?? null;
            });
            setCorrectAnswers(map);
        } catch (err) {
            console.error('Failed fetching answers:', err);
        }
    };

    const handleChange = (id, value) => {
        const sid = String(id);
        setUserAnswers(prev => {
            const next = { ...prev, [sid]: value };
            const sessionId = getSessionIdFromUrl();
            if (sessionId) {
                try {
                    const savedKey = `cs_test_session_${sessionId}`;
                    const savedRaw = localStorage.getItem(savedKey);
                    if (savedRaw) {
                        const parsed = JSON.parse(savedRaw);
                        parsed.userAnswers = { ...(parsed.userAnswers || {}), [sid]: value };
                        localStorage.setItem(savedKey, JSON.stringify(parsed));
                    }
                } catch (e) { }
            }
            return next;
        });
    };

    const handleSubmit = async () => {
        setSubmitting(true);
        try {
            const sessionId = getSessionIdFromUrl();
            const payload = { answers: userAnswers };
            if (sessionId) payload.sessionId = sessionId;
            else payload.courseCode = meta.courseCode;

            const res = await fetch('/api/submit-cs-test', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload),
            });
            if (!res.ok) {
                const err = await res.json().catch(() => ({}));
                setErrorMsg(err?.error || 'Submission failed');
                setSubmitting(false);
                return;
            }
            const data = await res.json();
            setPercentage(data.percentage);
            window.onbeforeunload = null;
            const sid = getSessionIdFromUrl();
            if (sid) localStorage.removeItem(`cs_test_session_${sid}`);
            fetchAnswersWhenExpired();
        } catch (err) {
            console.error(err);
            setErrorMsg('Network error while submitting.');
        } finally {
            setSubmitting(false);
        }
    };

    const formatTime = (seconds) => {
        if (seconds == null) return '00:00';
        const m = String(Math.floor(seconds / 60)).padStart(2, '0');
        const s = String(seconds % 60).padStart(2, '0');
        return `${m}:${s}`;
    };

    const getTimerColor = () => {
        if (timeLeft === null) return 'text-gray-500';
        if (timeLeft <= 60) return 'text-red-600 animate-pulse';
        if (timeLeft <= 300) return 'text-orange-600';
        return 'text-green-700';
    };

    const getProgressPercentage = () => {
        const answered = Object.values(userAnswers).filter(a => a && a.trim()).length;
        return questions.length > 0 ? (answered / questions.length) * 100 : 0;
    };

    const disabled = timeLeft === null || timeLeft <= 0;

    if (loading) {
        return (
            <div className="min-h-screen bg-white flex items-center justify-center">
                <div className="text-center">
                    <div className="inline-block animate-spin rounded-full h-16 w-16 border-4 border-gray-200 border-t-blue-500 mb-4"></div>
                    <p className="text-gray-700 text-lg font-medium">Loading your exam...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-white relative overflow-hidden text-gray-800">
            {/* subtle background shapes (light) */}
            <div className="absolute inset-0 overflow-hidden pointer-events-none">
                <div className="absolute -top-1/2 -right-1/2 w-[120%] h-[120%] bg-blue-50 rounded-full blur-3xl opacity-60"></div>
                <div className="absolute -bottom-1/2 -left-1/2 w-[120%] h-[120%] bg-purple-50 rounded-full blur-3xl opacity-60" style={{ animationDelay: '1s' }}></div>
            </div>

            <div className="relative z-10 max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
                {/* Header Section */}
                <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-6 mb-8">
                    <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
                        <div className="flex-1">
                            <div className="flex items-center gap-3 mb-2">
                                <div className="h-10 w-1 bg-gradient-to-b from-blue-500 to-purple-500 rounded-full"></div>
                                <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-gray-900">
                                    {meta.courseCode ? `${meta.courseCode}` : 'Viva Test'}
                                </h1>
                            </div>
                            {meta.courseTitle && (
                                <p className="text-gray-600 text-sm sm:text-base ml-4 pl-3 border-l-2 border-gray-100">
                                    {meta.courseTitle}
                                </p>
                            )}
                        </div>

                        {/* Timer Card */}
                        <div className="bg-white rounded-xl px-6 py-4 border border-gray-100 shadow-sm">
                            <div className="flex items-center gap-3">
                                <svg className="w-6 h-6 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                                </svg>
                                <div>
                                    <p className="text-xs text-gray-500 uppercase tracking-wider font-semibold">Time Remaining</p>
                                    <p className={`text-2xl font-bold font-mono ${getTimerColor()}`}>
                                        {formatTime(timeLeft ?? 0)}
                                    </p>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Progress Bar */}
                    <div className="mt-6">
                        <div className="flex justify-between items-center mb-2">
                            <span className="text-sm font-medium text-gray-600">Progress</span>
                            <span className="text-sm font-semibold text-gray-800">
                                {Object.values(userAnswers).filter(a => a && a.trim()).length} / {questions.length} answered
                            </span>
                        </div>
                        <div className="h-2 bg-gray-100 rounded-full overflow-hidden shadow-inner">
                            <div
                                className="h-full bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500 transition-all duration-500 ease-out rounded-full"
                                style={{ width: `${getProgressPercentage()}%` }}
                            ></div>
                        </div>
                    </div>
                </div>

                {/* Error Message */}
                {errorMsg && (
                    <div className="bg-red-50 border border-red-100 rounded-xl p-4 mb-6">
                        <div className="flex items-start gap-3">
                            <svg className="w-6 h-6 text-red-600 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                            <p className="text-red-600 font-medium">{errorMsg}</p>
                        </div>
                    </div>
                )}

                {/* Questions Section */}
                <div className="space-y-6 mb-8">
                    {questions.map((q, idx) => {
                        const id = String(q._id || q.id || idx);
                        const isAnswered = userAnswers[id] && userAnswers[id].trim();
                        const hasCorrectAnswer = correctAnswers[id] != null;

                        return (
                            <div
                                key={id}
                                className="group bg-white rounded-2xl shadow-sm border border-gray-100 hover:shadow-md transition-all duration-300 overflow-hidden"
                            >
                                <div className="p-6 sm:p-8">
                                    {/* Question Header */}
                                    <div className="flex items-start gap-4 mb-4">
                                        <div className="flex-shrink-0 w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-xl flex items-center justify-center shadow text-white font-bold">
                                            {idx + 1}
                                        </div>
                                        <div className="flex-1">
                                            <p className="text-gray-900 text-base sm:text-lg font-medium leading-relaxed">
                                                {q.question}
                                            </p>
                                        </div>
                                        {isAnswered && !hasCorrectAnswer && (
                                            <div className="flex-shrink-0">
                                                <svg className="w-6 h-6 text-green-600" fill="currentColor" viewBox="0 0 20 20">
                                                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                                                </svg>
                                            </div>
                                        )}
                                    </div>

                                    {/* Answer Input */}
                                    <div className="relative">
                                        <input
                                            type="text"
                                            value={userAnswers[id] || ''}
                                            onChange={(e) => handleChange(id, e.target.value)}
                                            disabled={disabled}
                                            className="w-full bg-white text-gray-900 border-2 border-gray-200 rounded-xl px-4 py-3 sm:py-4 focus:outline-none focus:ring-2 focus:ring-blue-200 focus:border-transparent disabled:bg-gray-50 disabled:cursor-not-allowed disabled:text-gray-400 transition-all duration-300 placeholder:text-gray-400 text-base sm:text-lg"
                                            placeholder="Type your answer here..."
                                        />
                                    </div>

                                    {/* Correct Answer Display (only shows when fetched) */}
                                    {hasCorrectAnswer && (
                                        <div className="mt-4 p-4 bg-green-50 border border-green-100 rounded-xl">
                                            <div className="flex items-start gap-3">
                                                <svg className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                                                    <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                                                </svg>
                                                <div>
                                                    <p className="text-xs text-green-600 font-semibold uppercase tracking-wide mb-1">Correct Answer</p>
                                                    <p className="text-green-700 font-medium break-words">{correctAnswers[id]}</p>
                                                </div>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </div>
                        );
                    })}
                </div>

                {/* Submit Section */}
                <div className="sticky bottom-0 bg-white rounded-2xl shadow-inner border border-gray-100 p-6">
                    <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
                        <button
                            onClick={handleSubmit}
                            disabled={disabled || loading || submitting}
                            className="group relative px-8 py-4 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-500 hover:to-purple-500 text-white font-bold rounded-xl shadow-lg hover:shadow-2xl disabled:from-gray-300 disabled:to-gray-300 disabled:cursor-not-allowed disabled:shadow-none transition-all duration-300 transform hover:scale-105 disabled:transform-none text-lg w-full sm:w-auto"
                        >
                            {submitting ? (
                                <span className="flex items-center justify-center gap-2">
                                    <svg className="animate-spin h-5 w-5" fill="none" viewBox="0 0 24 24">
                                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                    </svg>
                                    Submitting...
                                </span>
                            ) : (
                                <span className="flex items-center justify-center gap-2">
                                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                                    </svg>
                                    Submit Exam
                                </span>
                            )}
                        </button>

                        {percentage !== null && (
                            <div className="flex items-center gap-3 bg-green-50 border border-green-100 rounded-xl px-6 py-4 shadow-sm">
                                <svg className="w-8 h-8 text-green-600" fill="currentColor" viewBox="0 0 20 20">
                                    <path fillRule="evenodd" d="M6.267 3.455a3.066 3.066 0 001.745-.723 3.066 3.066 0 013.976 0 3.066 3.066 0 001.745.723 3.066 3.066 0 012.812 2.812c.051.643.304 1.254.723 1.745a3.066 3.066 0 010 3.976 3.066 3.066 0 00-.723 1.745 3.066 3.066 0 01-2.812 2.812 3.066 3.066 0 00-1.745.723 3.066 3.066 0 01-3.976 0 3.066 3.066 0 00-1.745-.723 3.066 3.066 0 01-2.812-2.812 3.066 3.066 0 00-.723-1.745 3.066 3.066 0 010-3.976 3.066 3.066 0 00.723-1.745 3.066 3.066 0 012.812-2.812zm7.44 5.252a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                                </svg>
                                <div>
                                    <p className="text-xs text-green-600 font-semibold uppercase tracking-wide">Your Score</p>
                                    <p className="text-3xl font-bold text-green-700">{percentage}%</p>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
