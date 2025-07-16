import React from 'react';
import Link from 'next/link';

const Problems = ({ problems }) => {
    return (
        <div className="p-4">
            <h1 className="text-xl font-semibold mb-4">Problems List</h1>
            <ul className="space-y-2">
                {problems.map((problem) => (
                    <li key={problem._id}>
                        <Link
                            href={`/problems/${problem.id}`}
                            className="block border rounded p-2 hover:bg-gray-100 transition"
                        >
                            {problem.title}
                        </Link>
                    </li>
                ))}
            </ul>
        </div>
    );
};

export default Problems;
