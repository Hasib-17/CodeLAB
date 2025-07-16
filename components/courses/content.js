"use client";

import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import rehypeRaw from "rehype-raw";

const Content = ({ content, title }) => {
    return (
        <div className="h-[92vh] py-4 w-full flex flex-col relative px-6 max-md:px-2">
            {/* Background image */}
            <div className="h-[92vh] absolute opacity-20 w-full flex justify-center items-center -z-10">
                <img
                    src={`/${title}.png`}
                    alt={title}
                    className="w-96 h-96 object-contain rounded-xl mx-auto"
                />
            </div>

            {/* Markdown content */}
            <div className="h-[92vh] overflow-y-scroll prose max-w-none">
                <ReactMarkdown
                    remarkPlugins={[remarkGfm]}
                    rehypePlugins={[rehypeRaw]}
                >
                    {content}
                </ReactMarkdown>
            </div>
        </div>
    );
};

export default Content;
