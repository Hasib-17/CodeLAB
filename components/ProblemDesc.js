import React from 'react';
import Link from 'next/link';

const ProblemDesc = ({ problem }) => {
    return (
        <div className='w-full flex flex-col overflow-x-hidden overflow-y-auto px-1'>
            <div className='flex h-11 w-full items-center pt-2 bg-light-3 rounded-t-lg px-2'>
                <div className='bg-light-2 rounded-t-md px-5 py-[10px] text-sm cursor-pointer'>
                    Description
                </div>
                {/* Back button */}
                <Link href="/Exam" className='ml-auto text-blue-500 underline text-sm'>
                    ← Back to Problems
                </Link>
            </div>

            <div className='bg-light-2 rounded-b-lg flex-grow'>
                <h2 className='font-semibold text-xl p-5'>
                    {problem?.order}. {problem?.title}
                </h2>

                {/* Removed the solved checkmark section */}

                {/* Problem Statement */}
                <div className='px-5 py-2'>
                    <div dangerouslySetInnerHTML={{ __html: problem?.problemStatement || '' }} />
                </div>

                {/* Input Format */}
                <div className='mt-4 px-5'>
                    <h2 className='font-bold'>Input Format</h2>
                    <div dangerouslySetInnerHTML={{ __html: problem?.inputFormat || '' }} />
                </div>

                {/* Output Format */}
                <div className='mt-4 px-5'>
                    <h2 className='font-bold'>Output Format</h2>
                    <div dangerouslySetInnerHTML={{ __html: problem?.outputFormat || '' }} />
                </div>

                {/* Sample Input */}
                <div className='mt-4 px-5'>
                    <h2 className='font-bold'>Sample Input</h2>
                    <div className='bg-light-3 font-mono mt-1 py-2 px-3 rounded-lg'>
                        <div dangerouslySetInnerHTML={{ __html: problem?.sampleInput || '' }} />
                    </div>
                </div>

                {/* Sample Output */}
                <div className='mt-4 px-5'>
                    <h2 className='font-bold'>Sample Output</h2>
                    <div className='bg-light-3 font-mono mt-1 py-2 px-3 rounded-lg'>
                        <div dangerouslySetInnerHTML={{ __html: problem?.sampleOutput || '' }} />
                    </div>
                </div>

                {/* Constraints */}
                <div className='mt-2 px-5 py-2'>
                    {problem?.constraints && (
                        <>
                            <p className='font-bold'>Constraints:</p>
                            <div className='font-medium' dangerouslySetInnerHTML={{ __html: problem?.constraints || '' }} />
                        </>
                    )}
                </div>
            </div>
        </div>
    );
}

export default ProblemDesc;
