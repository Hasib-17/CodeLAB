'use client'

import axios from "axios";
import dynamic from "next/dynamic";
import { useRouter } from "next/navigation";
import React, { useEffect, useState } from "react";
import Webcam from "react-webcam";

const Timer = ({ hasStarted, minutes, seconds, setMinutes, setSeconds, onTimeUp }) => {

  useEffect(() => {
    let interval;
    if (hasStarted && (minutes > 0 || seconds > 0)) {
      interval = setInterval(() => {
        if (seconds > 0) {
          setSeconds(prev => prev - 1);
        } else if (minutes > 0) {
          setMinutes(prev => prev - 1);
          setSeconds(59);
        } else {
          clearInterval(interval);
          onTimeUp();
        }
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [hasStarted, minutes, seconds]);

  const handleDecimal = (num) => num < 10 ? `0${num}` : num;

  return (
    <div className="text-right mb-2">
      <p>Time remaining - <span className="font-medium">{handleDecimal(minutes)}:{handleDecimal(seconds)}</span></p>
    </div>
  );
};


const ReactMediaRecorder = dynamic(
  () => import('react-media-recorder-2').then((mod) => mod.ReactMediaRecorder),
  { ssr: false }
);


const VideoInterview = ({ questions }) => {
  const [attempted, setAttempted] = useState(0);
  const [hasStarted, setHasStarted] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [minutes, setMinutes] = useState(1);
  const [seconds, setSeconds] = useState(30);
  const router = useRouter();

  const blobUrlToFile = async (blobUrl) => {
    if (!questions.length) {
      console.error('Questions not loaded yet');
      return;
    }
    setSubmitted(true);
    const file = await fetch(blobUrl).then(r => r.blob()).then(blobFile =>
      new File([blobFile], 'interview.mp4', { type: blobFile.type })
    );
    const formData = new FormData();
    formData.append('video', file);
    formData.append('id', questions[0].id);
    await axios.post('/api/submitVideo', formData);
    setSubmitted(false);
    router.push('/interview');
  };

  return (
    <div className="flex flex-col items-center gap-6 w-[650px] mx-auto">
      <div className="flex flex-col gap-2">
        {questions.map((q, idx) => (
          <h2 key={idx} className="font-medium">{q.question}</h2>
        ))}
      </div>

      <ReactMediaRecorder
        video
        onStart={() => {
          setHasStarted(true);
          setAttempted(prev => prev + 1);
        }}
        onStop={() => {
          setHasStarted(false);
          setMinutes(1);
          setSeconds(30);
        }}
        render={({ status, startRecording, stopRecording, mediaBlobUrl }) => {
          const isRecording = status === "recording";
          const isStopped = status === "stopped";
          const isIdle = status === "idle";

          // stop if time up
          useEffect(() => {
            if (minutes === 0 && seconds === 0 && isRecording) {
              stopRecording();
            }
          }, [minutes, seconds, isRecording]);

          return (
            <>
              <Timer
                hasStarted={hasStarted}
                minutes={minutes}
                seconds={seconds}
                setMinutes={setMinutes}
                setSeconds={setSeconds}
                onTimeUp={() => stopRecording()}
              />

              <div className="w-[650px] h-[450px] bg-black flex justify-center items-center">
                {isRecording ? (
                  <Webcam className="w-full h-auto" />
                ) : isStopped ? (
                  <video
                    src={mediaBlobUrl}
                    controls
                    loop
                    className="w-full h-auto"
                  />
                ) : (
                  <p className="text-white">Ready to start recording</p>
                )}
              </div>

              <div className="w-full flex gap-4">
                {(isIdle || isStopped) && attempted < 2 && (
                  <button
                    onClick={startRecording}
                    className="w-full bg-blue-500 text-white px-3 py-2 rounded-xl"
                  >
                    {attempted === 0 ? "Start" : "Retake"}
                  </button>
                )}
                {isRecording && (
                  <button
                    onClick={stopRecording}
                    className="w-full bg-blue-500 text-white px-3 py-2 rounded-xl"
                  >
                    Stop
                  </button>
                )}
                {isStopped && (
                  <button
                    onClick={() => blobUrlToFile(mediaBlobUrl)}
                    className="w-full bg-green-500 text-white px-3 py-2 rounded-xl"
                  >
                    Finish
                  </button>
                )}
              </div>
            </>
          );
        }}
      />

      {submitted && (
        <div className='fixed top-5 right-5 bg-green-300 shadow-lg rounded-lg py-3 px-5'>
          Successfully submitted
        </div>
      )}
    </div>
  );
};

export default VideoInterview;
