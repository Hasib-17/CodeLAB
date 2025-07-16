'use client'
import React, { useEffect, useState } from 'react';

export default function CSTestPage() {
    const [questions, setQuestions] = useState([]);
    const [userAnswers, setUserAnswers] = useState({});
    const [percentage, setPercentage] = useState(null);
    const [timeLeft, setTimeLeft] = useState(2 * 60); // e.g. 2 minutes (adjust as needed)

    // On mount: load saved or fetch new random
    useEffect(() => {
        const saved = localStorage.getItem('cs_test');
        if (saved) {
            const parsed = JSON.parse(saved);
            setQuestions(parsed.questions || []);
            const elapsed = Math.floor((Date.now() - parsed.startTime) / 1000);
            setTimeLeft(Math.max(2 * 60 - elapsed, 0));
        } else {
            fetch('/api/get-cs-questions')
                .then(res => res.json())
                .then(data => {
                    if (Array.isArray(data)) {
                        setQuestions(data);
                        const startTime = Date.now();
                        localStorage.setItem('cs_test', JSON.stringify({ questions: data, startTime }));
                    }
                })
                .catch(console.error);
        }
    }, []);

    // Countdown timer
    useEffect(() => {
        if (timeLeft <= 0) return;
        const timer = setInterval(() => {
            setTimeLeft(prev => prev - 1);
        }, 1000);
        return () => clearInterval(timer);
    }, [timeLeft]);

    const handleChange = (id, value) => {
        setUserAnswers(prev => ({ ...prev, [id]: value }));
    };

    const handleSubmit = async () => {
        try {
            const res = await fetch('/api/submit-cs-test', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ answers: userAnswers }),
            });
            const data = await res.json();
            setPercentage(data.percentage);
        } catch (err) {
            console.error(err);
        }
    };

    const formatTime = (seconds) => {
        const m = String(Math.floor(seconds / 60)).padStart(2, '0');
        const s = String(seconds % 60).padStart(2, '0');
        return `${m}:${s}`;
    };

    return (
        <div className="relative max-w-4xl mx-auto p-6 md:p-10 text-gray-100">
            <h1 className="text-3xl md:text-4xl font-bold mb-8 text-center text-blue-400">CSIT-121 : Java Programming </h1>

            <div className="absolute top-10 right-9 text-red-700 px-4 py-2 rounded-xl shadow font-bold">
                Time Left: {formatTime(timeLeft)}
            </div>

            <div className="space-y-6 mt-6">
                {questions.map((q, idx) => (
                    <div key={q._id} className="bg-gray-800/80 backdrop-blur-md p-5 rounded-xl shadow hover:shadow-lg transition">
                        <p className="mb-3 font-medium text-lg">{idx + 1}. {q.question}</p>
                        <input
                            type="text"
                            value={userAnswers[q._id] || ''}
                            onChange={(e) => handleChange(q._id, e.target.value)}
                            disabled={timeLeft <= 0}
                            className="w-full bg-gray-700 text-gray-100 border border-gray-600 rounded px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-600 disabled:cursor-not-allowed"
                            placeholder="Your answer..."
                        />
                    </div>
                ))}
            </div>

            <div className="flex items-center gap-4 mt-8 justify-center">
                <button
                    onClick={handleSubmit}
                    className="bg-blue-600 hover:bg-blue-700 text-white font-semibold px-6 py-2 rounded-2xl shadow transition disabled:bg-gray-500 disabled:cursor-not-allowed"
                    disabled={timeLeft <= 0}
                >
                    Submit
                </button>
                {percentage !== null && (
                    <span className="font-semibold text-lg text-green-400">Score: {percentage}%</span>
                )}
            </div>
        </div>
    );
}
