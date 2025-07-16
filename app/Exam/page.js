'use client'
import React, { useEffect, useState } from 'react';
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

    // Problems state and fetch once on mount
    const [problems, setProblems] = useState([]);
    useEffect(() => {
        const fetchProblems = async () => {
            const response = await fetch('/api/getAllProblems');
            const data = await response.json();
            setProblems(Array.isArray(data) ? data : []);  // ensure array
        }
        fetchProblems();
    }, []);

    // USB logs state and fetch every 5 seconds to get live updates
    const [logs, setLogs] = useState([]);
    useEffect(() => {
        const fetchLogs = () => {
            fetch('/api/get-usb-logs')
                .then(res => res.json())
                .then(data => {
                    if (Array.isArray(data)) {
                        setLogs(data);
                    } else if (data && Array.isArray(data.logs)) {
                        setLogs(data.logs);
                    } else {
                        setLogs([]);
                    }
                })
                .catch(console.error);
        };

        fetchLogs(); // fetch immediately on mount

        const interval = setInterval(fetchLogs, 5000); // fetch every 5 sec
        return () => clearInterval(interval); // cleanup on unmount
    }, []);

    return (
        <>
            {/* Problems Table Section */}
            <div>
                <div className="p-10 max-md:p-3">
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
                                {problems.map((problem, index) => (
                                    <tr key={index} className="bg-gray-100 hover:bg-gray-300">
                                        <td className="p-4 text-center">{index + 1}</td>
                                        <th
                                            scope="row"
                                            className="px-6 py-4 hover:text-blue-500 hover:font-semibold cursor-pointer font-medium whitespace-nowrap transition-all ease-in"
                                            onClick={() => router.push(`/problems/${problem.id}`)}
                                        >
                                            <div className="w-[300px] text-ellipsis overflow-hidden">
                                                {problem.title}
                                            </div>
                                        </th>
                                        <td className="px-6 py-4 text-center">
                                            <ImCheckboxChecked size={20} color={'green'} className='mx-auto' />
                                        </td>
                                        <td className="px-6 py-4 text-center">{problem.points ?? 100}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>

            {/* USB Logs - Fixed at bottom right */}
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
