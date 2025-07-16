"use client";
import React, { createContext, useEffect, useState } from "react";

export const ExamContext = createContext();

export default function ExamProvider({ children }) {
    const [examStarted, setExamStarted] = useState(false);
    const [startTime, setStartTime] = useState(null);
    const [endTime, setEndTime] = useState(null);
    const [durationStr, setDurationStr] = useState('');
    const [startTimeStr, setStartTimeStr] = useState('');
    const [endTimeStr, setEndTimeStr] = useState('');

    useEffect(() => {
        // Load from localStorage
        const storedStarted = localStorage.getItem('examStarted');
        const storedStart = localStorage.getItem('startTime');
        const storedEnd = localStorage.getItem('endTime');
        const storedDuration = localStorage.getItem('durationStr');

        if (storedStarted === 'true') setExamStarted(true);
        if (storedStart) {
            const date = new Date(storedStart);
            setStartTime(date);
            setStartTimeStr(format12Hour(date));
        }
        if (storedEnd) {
            const date = new Date(storedEnd);
            setEndTime(date);
            setEndTimeStr(format12Hour(date));
        }
        if (storedDuration) setDurationStr(storedDuration);
    }, []);

    useEffect(() => {
        if (examStarted) {
            localStorage.setItem('examStarted', 'true');

            const handleVisibility = () => {
                if (document.hidden) {
                    alert('⚠ You switched tabs or minimized! Please stay on this page.');
                }
            };

            const handleFullscreen = () => {
                if (!document.fullscreenElement) {
                    const end = new Date();
                    setEndTime(end);
                    setEndTimeStr(format12Hour(end));
                    localStorage.setItem('endTime', end.toISOString());

                    if (startTime) {
                        const duration = calculateDuration(startTime, end);
                        setDurationStr(duration);
                        localStorage.setItem('durationStr', duration);
                    }

                    alert('⚠ You exited fullscreen! Please stay in fullscreen mode.');
                }
            };

            document.addEventListener('visibilitychange', handleVisibility);
            document.addEventListener('fullscreenchange', handleFullscreen);

            return () => {
                document.removeEventListener('visibilitychange', handleVisibility);
                document.removeEventListener('fullscreenchange', handleFullscreen);
            };
        }
    }, [examStarted, startTime]);

    const calculateDuration = (start, end) => {
        const diffMs = end - start;
        const hours = String(Math.floor(diffMs / (1000 * 60 * 60))).padStart(2, '0');
        const minutes = String(Math.floor((diffMs / (1000 * 60)) % 60)).padStart(2, '0');
        const seconds = String(Math.floor((diffMs / 1000) % 60)).padStart(2, '0');
        return `${hours}:${minutes}:${seconds}`;
    };

    const format12Hour = (date) => {
        let hours = date.getHours();
        const minutes = String(date.getMinutes()).padStart(2, '0');
        const seconds = String(date.getSeconds()).padStart(2, '0');
        const ampm = hours >= 12 ? 'PM' : 'AM';
        hours = hours % 12;
        if (hours === 0) hours = 12;
        return `${String(hours).padStart(2, '0')}:${minutes}:${seconds} ${ampm}`;
    };

    const startExam = async () => {
        try {
            await document.documentElement.requestFullscreen();
            const now = new Date();
            setStartTime(now);
            setStartTimeStr(format12Hour(now));
            setEndTime(null);
            setEndTimeStr('');
            setDurationStr('');
            setExamStarted(true);

            localStorage.setItem('startTime', now.toISOString());
            localStorage.removeItem('endTime');
            localStorage.removeItem('durationStr');
        } catch (e) {
            alert("Failed to enter fullscreen. Please allow fullscreen permission.");
        }
    };

    return (
        <ExamContext.Provider value={{
            examStarted, startTime, endTime, durationStr, startExam,
            startTimeStr, endTimeStr
        }}>
            {children}
        </ExamContext.Provider>
    );
}
