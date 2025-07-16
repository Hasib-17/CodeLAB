"use client";
import React, { useEffect, useState } from "react";
import LanguagesDropdown from "../shared/LanguagesDropdown";
import ThemeDropdown from "../shared/ThemeDropdown";
import CodeEditorWindow from "../shared/CodeEditorWindow";
import OutputWindow from "../shared/OutputWindow";
import CustomInput from "../shared/CustomInput";
import Split from "react-split";
import { languagesData, mockComments } from "@/constants";
import { AiOutlineFullscreen, AiOutlineFullscreenExit } from "react-icons/ai";
import Timer from "../shared/Timer";
import axios from "axios";
import Loader from "../shared/Loader";
import { useParams } from "next/navigation";
import FontSizeDropdown from "../shared/FontSizeDropdown";

const Playground = ({ problems, isForSubmission = true, setSubmitted }) => {
  const params = useParams();
  const [customInput, setCustomInput] = useState("");
  const [outputDetails, setOutputDetails] = useState(null);
  const [isCodeRunning, setIsCodeRunning] = useState(false);
  const [isCodeSubmitting, setIsCodeSubmitting] = useState(false);
  const [theme, setTheme] = useState({ value: "dark", label: "Dark" });
  const [language, setLanguage] = useState(languagesData[3]);
  const [code, setCode] = useState(mockComments[language.value]);
  const [fontSize, setFontSize] = useState({ value: "14", label: "14px" });
  const [isFullScreen, setIsFullScreen] = useState(false);
  const [clickedProblemId, setClickedProblemId] = useState(null);
  const [plot, setPlot] = useState(null);
  const [isPlotModalOpen, setIsPlotModalOpen] = useState(false);

  useEffect(() => {
    if (problems) {
      problems.forEach((problem) => {
        if (problem.id === params.id) {
          setClickedProblemId(problem.id);
          setCustomInput(problem.testCases[0].input[0]);
        }
      });
    }
  }, [problems]);

  const handleFullScreen = () => {
    if (isFullScreen) {
      document.exitFullscreen();
    } else {
      document.documentElement.requestFullscreen();
    }
    setIsFullScreen(!isFullScreen);
  };

  useEffect(() => {
    const exitHandler = () => {
      if (!document.fullscreenElement) setIsFullScreen(false);
      else setIsFullScreen(true);
    };
    document.addEventListener("fullscreenchange", exitHandler);
    return () => document.removeEventListener("fullscreenchange", exitHandler);
  }, []);

  const onChange = (action, data) => {
    if (action === "code") setCode(data);
  };

  const handleCompile = async (input, forSubmission = false) => {
    if (!forSubmission) setIsCodeRunning(true);
    try {
      const res = await axios.post("https://emkc.org/api/v2/piston/execute", {
        language: language.value,
        version: "*",
        files: [{ content: code }],
        stdin: input || "",
      });
      const output = res.data.run?.stdout?.trim() || "";
      if (!forSubmission) {
        setOutputDetails({ type: "run", input, output });
        setIsCodeRunning(false);
      }
      return output;
    } catch (e) {
      console.error(e);
      if (!forSubmission) setIsCodeRunning(false);
      return "Error running code.";
    }
  };

  const handleRunHeavy = async () => {
    setIsCodeRunning(true);
    try {
      const res = await axios.post("/api/run-heavy", { code });
      const data = res.data;
      setOutputDetails({
        type: "run",
        input: "",
        output: data?.output ?? data?.error ?? "No output",
      });
      if (data?.plot) setPlot(data.plot);
    } catch (e) {
      console.error(e);
      setOutputDetails({ type: "run", input: "", output: "Error running heavy code." });
    }
    setIsCodeRunning(false);
  };

  const handleSubmit = async () => {
    setIsCodeSubmitting(true);
    const res = await fetch("/api/submitCode", {
      method: "POST",
      body: JSON.stringify({ code, problem: clickedProblemId, language: language.value }),
      headers: { "Content-Type": "application/json" },
    });
    const data = await res.json();
    if (data.isAccepted == "accepted") {
      setSubmitted(true);
      setTimeout(() => setSubmitted(false), 5000);
      setOutputDetails({ output: "Accepted", submitted: true, accepted: true });
    } else {
      setOutputDetails({ output: data.output, submitted: true, accepted: false });
    }
    setIsCodeSubmitting(false);
  };

  return (
    <div className="w-full flex flex-col">
      <div className="flex px-4 gap-2 justify-between max-md:mt-12 flex-wrap">
        <div className="flex gap-2 flex-wrap">
          <LanguagesDropdown onSelectChange={(lang) => { setLanguage(lang); setCode(mockComments[lang.value]); }} />
          <ThemeDropdown handleThemeChange={(th) => setTheme(th)} />
          <FontSizeDropdown onSelectChange={(f) => setFontSize(f)} />
        </div>
        <div className="flex gap-2 items-center">
          <Timer />
          <button onClick={handleFullScreen} className="hover:bg-light-3 hover:border-light-4 rounded-lg p-1">
            <div className="h-6 w-6 font-bold text-2xl text-dark-4">
              {!isFullScreen ? <AiOutlineFullscreen /> : <AiOutlineFullscreenExit />}
            </div>
          </button>
        </div>
      </div>

      <Split className="!w-full flex-grow flex flex-col items-start px-4 pt-4 max-md:hidden" direction="vertical" minSize={100}>
        <CodeEditorWindow code={code} onChange={onChange} language={language.value} theme={theme.value} fontSize={fontSize.value} />
        <div className="!w-full min-h-[30%] flex flex-col">
          <div className="flex justify-end items-center gap-3">
            {plot && (
              <button
                onClick={() => setIsPlotModalOpen(true)}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-light-1 mt-2 rounded-lg text-sm"
              >
                Show Plot
              </button>
            )}
            <button
              onClick={handleRunHeavy}
              disabled={!code}
              className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-light-1 mt-2 rounded-lg text-sm"
            >
              Run Heavy
            </button>
            <button
              onClick={() => handleCompile(customInput)}
              disabled={!code}
              className="px-4 py-2 bg-dark-4 text-light-1 mt-2 rounded-lg text-sm"
            >
              {isCodeRunning ? <Loader /> : "Run"}
            </button>
            {isForSubmission && (
              <button
                onClick={handleSubmit}
                disabled={!code}
                className="px-4 py-2 bg-green-600 text-light-1 mt-2 rounded-lg text-sm"
              >
                {isCodeSubmitting ? <Loader /> : "Submit"}
              </button>
            )}
          </div>
          <div className="flex gap-5 flex-grow max-sm:flex-col">
            <div className="!w-full flex flex-col h-[250px]">
              <h1 className="font-bold text-lg">Custom Input</h1>
              <CustomInput customInput={customInput} setCustomInput={setCustomInput} />
            </div>
            <OutputWindow outputDetails={outputDetails} additionalStyles="h-[250px]" />
          </div>
        </div>
      </Split>

      <div className="!w-full flex-grow flex flex-col items-start px-4 pt-4 md:hidden max-md:w-[500px]">
        <CodeEditorWindow code={code} onChange={onChange} language={language.value} theme={theme.value} fontSize={fontSize.value} />
        <div className="!w-full min-h-[30%] flex flex-col">
          <div className="flex justify-end items-center gap-3">
            {plot && (
              <button
                onClick={() => setIsPlotModalOpen(true)}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-light-1 mt-2 rounded-lg text-sm"
              >
                Show Plot
              </button>
            )}
            <button
              onClick={handleRunHeavy}
              disabled={!code}
              className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-light-1 mt-2 rounded-lg text-sm"
            >
              Run Heavy
            </button>
            <button
              onClick={() => handleCompile(customInput)}
              disabled={!code}
              className="px-4 py-2 bg-dark-4 text-light-1 mt-2 rounded-lg text-sm"
            >
              {isCodeRunning ? <Loader /> : "Run"}
            </button>
            {isForSubmission && (
              <button
                onClick={handleSubmit}
                disabled={!code}
                className="px-4 py-2 bg-green-600 text-light-1 mt-2 rounded-lg text-sm"
              >
                {isCodeSubmitting ? <Loader /> : "Submit"}
              </button>
            )}
          </div>
          <div className="flex gap-5 flex-grow max-xs:flex-col">
            <div className="!w-full flex flex-col max-xs:h-[250px]">
              <h1 className="font-bold text-lg">Custom Input</h1>
              <CustomInput customInput={customInput} setCustomInput={setCustomInput} />
            </div>
            <OutputWindow outputDetails={outputDetails} additionalStyles={"max-md:h-[250px]"} />
          </div>
        </div>
      </div>

      {isPlotModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-30 flex justify-center items-center z-50">
          <div className="bg-white p-2 rounded-lg max-w-[80%] max-h-[80%] overflow-auto relative shadow-lg">
            <button
              onClick={() => setIsPlotModalOpen(false)}
              className="absolute top-2 right-2 px-3 py-1 bg-red-600 text-white rounded"
            >
              Close
            </button>
            <img src={plot} alt="Plot" className="max-w-full max-h-full object-contain mx-auto" />
          </div>
        </div>
      )}
    </div>
  );
};

export default Playground;
