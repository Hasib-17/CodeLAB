// app/Exam/page.js
'use client'
import React, { useEffect, useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { ImCheckboxChecked } from "react-icons/im";

export default function CombinedPage() {
    const router = useRouter();

    useEffect(() => {
        // Hide footer by matching text
        const allElements = document.querySelectorAll('body *');
        allElements.forEach(el => {
            if (
                el.textContent?.includes('© CodeLab | All Rights Reserved') ||
                el.textContent?.includes('Developed by Hasib-17')
            ) {
                el.style.display = 'none';
            }
        });

        // Restore on unmount
        return () => {
            allElements.forEach(el => {
                if (
                    el.textContent?.includes('© CodeLab | All Rights Reserved') ||
                    el.textContent?.includes('Developed by Hasib-17')
                ) {
                    el.style.display = '';
                }
            });
        };
    }, []);

    // Course info loaded from localStorage (set on lab/page.js)
    const [courseCode, setCourseCode] = useState('');
    const [courseTitle, setCourseTitle] = useState('');
    const [courseLoaded, setCourseLoaded] = useState(false);

    // Problems state and fetch once on mount (only for the course)
    const [problems, setProblems] = useState([]);
    const [loadingProblems, setLoadingProblems] = useState(false);

    const pollRef = useRef(null);

    useEffect(() => {
        const storedCode = typeof window !== 'undefined' ? localStorage.getItem('admin_courseCode') : null;
        const storedTitle = typeof window !== 'undefined' ? localStorage.getItem('admin_courseTitle') : null;

        if (storedCode) {
            setCourseCode(storedCode);
            if (storedTitle) setCourseTitle(storedTitle);
            setCourseLoaded(true);
            fetchProblemsForCourse(storedCode);
        } else {
            setCourseLoaded(false);
            setProblems([]);
        }

        // Listen for cross-tab updates: lab page sets exam_updated_ts when it adds to exam
        const handleStorage = (e) => {
            if (!e) return;
            if (e.key === 'exam_updated_ts') {
                // re-fetch when exam list changed
                const code = localStorage.getItem('admin_courseCode') || storedCode;
                if (code) fetchProblemsForCourse(code);
            }
            // allow courseCode changes via storage too
            if (e.key === 'admin_courseCode') {
                const newCode = e.newValue;
                if (newCode) {
                    setCourseCode(newCode);
                    setCourseLoaded(true);
                    fetchProblemsForCourse(newCode);
                } else {
                    setCourseCode('');
                    setCourseLoaded(false);
                    setProblems([]);
                }
            }
        };
        window.addEventListener('storage', handleStorage);

        // Poll fallback: every 10 minutes refresh exam list (helps if storage event isn't fired)
        pollRef.current = setInterval(() => {
            const code = localStorage.getItem('admin_courseCode');
            if (code) fetchProblemsForCourse(code);
        }, 10 * 60 * 1000);

        return () => {
            window.removeEventListener('storage', handleStorage);
            if (pollRef.current) clearInterval(pollRef.current);
        };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    async function fetchProblemsForCourse(code) {
        if (!code) {
            setProblems([]);
            return;
        }
        setLoadingProblems(true);
        try {
            const params = new URLSearchParams();
            params.append('courseCode', code); // server matches category OR courseCode
            params.append('inExam', 'true');   // only problems that have been added to exam
            params.append('limit', '0');       // use 0 to indicate no limit (server honors this)

            const res = await fetch(`/api/problems?${params.toString()}`);
            if (!res.ok) {
                console.error('Failed to fetch course problems', res.status);
                setProblems([]);
                return;
            }
            const data = await res.json();
            setProblems(Array.isArray(data) ? data : []);
        } catch (err) {
            console.error('fetchProblemsForCourse error', err);
            setProblems([]);
        } finally {
            setLoadingProblems(false);
        }
    }

    // USB logs state and fetch every 5 seconds to get live updates (unchanged)
    const [logs, setLogs] = useState([]);
    useEffect(() => {
        const fetchLogs = () => {
            fetch('/api/get-usb-logs', { credentials: 'include' })
                .then(async (res) => {
                    if (!res.ok) {
                        // try to read JSON body for error
                        let errBody = {};
                        try { errBody = await res.json(); } catch (e) { /* ignore */ }
                        console.error('get-usb-logs response not ok', res.status, errBody);
                        // set logs empty so UI shows "No USB events detected."
                        setLogs([]);
                        return;
                    }
                    return res.json();
                })
                .then(data => {
                    if (!data) return;
                    if (Array.isArray(data)) {
                        setLogs(data);
                    } else if (data && Array.isArray(data.logs)) {
                        setLogs(data.logs);
                    } else {
                        setLogs([]);
                    }
                })
                .catch(err => {
                    console.error('fetchLogs error', err);
                    setLogs([]);
                });
        };

        fetchLogs();
        const interval = setInterval(fetchLogs, 5000);
        return () => clearInterval(interval);
    }, []);

    return (
        <>
            {/* Course header */}
            <div className="p-6 max-w-6xl mx-auto">
                <div className="bg-white rounded-md p-4 mb-6 shadow-sm border">
                    <h2 className="text-lg font-semibold mb-2">Course</h2>

                    {courseLoaded ? (
                        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
                            <div>
                                <div className="text-sm text-gray-500">Course Code</div>
                                <div className="font-medium">{courseCode}</div>
                            </div>

                            <div>
                                <div className="text-sm text-gray-500">Course Title</div>
                                <div className="font-medium">{courseTitle}</div>
                            </div>
                        </div>
                    ) : (
                        <div className="text-sm text-yellow-700">
                            Course Code & Course Title are not set. Please open the Lab page and save Course Code & Course Title there. This page will then show only problems that were added to the Exam list for that course.
                        </div>
                    )}
                </div>

                {/* Problems Table Section */}
                <div>
                    <div className="p-2">
                        <div className="relative overflow-auto rounded-xl shadow-xl max-w-6xl mx-auto">
                            <table className="w-full text-sm text-left rtl:text-right">
                                <thead className="text-gray-700 uppercase bg-gray-200">
                                    <tr>
                                        <th scope="col" className="p-6 text-center">Sr No.</th>
                                        <th scope="col" className="p-6">Problem Title</th>
                                        <th scope="col" className="p-6 text-center">Status</th>
                                        <th scope="col" className="p-6 text-center">Points</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {loadingProblems ? (
                                        <tr>
                                            <td colSpan={4} className="p-6 text-center text-gray-500">Loading recent problems...</td>
                                        </tr>
                                    ) : !courseLoaded ? (
                                        <tr>
                                            <td colSpan={4} className="p-6 text-center text-gray-500">No course selected.</td>
                                        </tr>
                                    ) : problems.length === 0 ? (
                                        <tr>
                                            <td colSpan={4} className="p-6 text-center text-gray-500">No problems added to Exam for this course.</td>
                                        </tr>
                                    ) : (
                                        problems.map((problem, index) => (
                                            <tr key={problem.id ?? index} className="bg-gray-100 hover:bg-gray-300">
                                                <td className="p-4 text-center">{index + 1}</td>
                                                <th
                                                    scope="row"
                                                    className="px-6 py-4 hover:text-blue-500 hover:font-semibold cursor-pointer font-medium whitespace-nowrap transition-all ease-in"
                                                    onClick={() => router.push(`/problems/${problem.id}`)}
                                                >
                                                    <div className="max-w-[420px] text-ellipsis overflow-hidden">
                                                        {problem.title}
                                                    </div>
                                                </th>
                                                <td className="px-6 py-4 text-center">
                                                    <ImCheckboxChecked size={20} color={'green'} className='mx-auto' />
                                                </td>
                                                <td className="px-6 py-4 text-center">{problem.points ?? 100}</td>
                                            </tr>
                                        ))
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>
            </div>

            {/* USB Logs - Fixed at bottom right (unchanged) */}
            <div style={{
                position: 'fixed',
                bottom: '1rem',
                right: '1rem',
                width: '320px',
                maxHeight: '250px',
                overflowY: 'auto',
                backgroundColor: 'rgba(255, 255, 255, 0.95)',
                border: '1px solid #ccc',
                borderRadius: '8px',
                boxShadow: '0 0 8px rgba(0,0,0,0.15)',
                padding: '12px',
                fontSize: '14px',
                zIndex: 1000,
            }}>
                <h2 className="font-semibold mb-2 text-center text-lg">USB Activity Logs</h2>
                {!Array.isArray(logs) || logs.length === 0 ? (
                    <p>No USB events detected.</p>
                ) : (
                    <ul className="list-disc pl-5">
                        {logs.map(log => (
                            <li key={log._id || log.id || Math.random()}>
                                [{new Date(log.time).toLocaleTimeString()}] {log.event}
                            </li>
                        ))}
                    </ul>
                )}
            </div>
        </>
    );
}
