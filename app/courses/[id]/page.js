"use client";

import Modules from "@/components/courses/modules";
import Content from "@/components/courses/content";
import ContentData from "@/constants/courses";
import { useEffect, useState } from "react";
import { useParams } from "next/navigation";

const Page = () => {
    const params = useParams();
    const courseId = params.id;

    const [lessons, setLessons] = useState([]);
    const [currentContent, setCurrentContent] = useState("");

    useEffect(() => {
        const courseLessons = ContentData[courseId];

        if (courseLessons) {
            setLessons(courseLessons);
            setCurrentContent(courseLessons[0]?.content || "## No lessons found.");
        } else {
            setLessons([]);
            setCurrentContent("## Course not found.");
        }
    }, [courseId]);

    return (
        <div className="w-full px-4 h-[92vh] flex gap-3 max-md:flex-col mb-12">
            <Modules lessons={lessons} setCurrentContent={setCurrentContent} />
            <Content content={currentContent} title={courseId} />
        </div>
    );
};

export default Page;
