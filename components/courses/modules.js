"use client";

import React, { useState } from "react";

const Modules = ({ lessons, setCurrentContent }) => {
    const [open, setOpen] = useState(false);

    return (
        <div>
            {/* Mobile menu toggle */}
            <div className={`md:hidden my-4 ${open && "hidden"}`}>
                <img
                    src="/menu.png"
                    alt="menu"
                    className="w-8 h-8 object-contain cursor-pointer"
                    onClick={() => setOpen(true)}
                />
            </div>

            <div
                className={`w-full max-w-[350px] flex flex-col overflow-y-auto max-md:absolute max-md:bg-white z-10 ${!open && "max-md:hidden"
                    }`}
            >
                {/* Header with close button on mobile */}
                <div
                    className="px-4 py-4 flex justify-between items-center cursor-pointer"
                    onClick={() => setOpen(false)}
                >
                    <h1 className="text-xl font-bold">Modules</h1>
                    <img
                        src="/menu.png"
                        alt="close menu"
                        className="w-8 h-8 object-contain md:hidden"
                    />
                </div>

                {/* List all lessons */}
                {lessons.map((lesson, idx) => (
                    <div
                        key={idx}
                        className="p-4 border-b border-gray-200 cursor-pointer hover:bg-gray-100"
                        onClick={() => {
                            setCurrentContent(lesson.content);
                            setOpen(false); // close menu on mobile after click
                        }}
                    >
                        <span className="font-semibold">{lesson.title}</span>
                    </div>
                ))}
            </div>
        </div>
    );
};

export default Modules;
