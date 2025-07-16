// components/AntiCheat.js
import { useEffect, useState, forwardRef, useImperativeHandle } from "react";

const AntiCheat = forwardRef((props, ref) => {
    const [started, setStarted] = useState(false);

    useImperativeHandle(ref, () => ({
        startExam: async () => {
            try {
                await document.documentElement.requestFullscreen();
                setStarted(true);
            } catch (err) {
                alert("Fullscreen failed or blocked by browser.");
            }
        }
    }));

    useEffect(() => {
        if (!started) return;

        const handleVisibilityChange = () => {
            if (document.hidden) alert("⚠ You switched tabs or minimized! Please stay on this page.");
        };
        const handleFullscreenChange = () => {
            if (!document.fullscreenElement) alert("⚠ You exited fullscreen! Please stay in fullscreen mode.");
        };

        document.addEventListener("visibilitychange", handleVisibilityChange);
        document.addEventListener("fullscreenchange", handleFullscreenChange);

        return () => {
            document.removeEventListener("visibilitychange", handleVisibilityChange);
            document.removeEventListener("fullscreenchange", handleFullscreenChange);
        };
    }, [started]);

    return null;
});

export default AntiCheat;
