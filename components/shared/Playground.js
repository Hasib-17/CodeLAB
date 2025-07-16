"use client";
import React, { useEffect, useState } from "react";
import LanguagesDropdown from "./LanguagesDropdown";
import ThemeDropdown from "./ThemeDropdown";
import CodeEditorWindow from "./CodeEditorWindow";
import OutputWindow from "./OutputWindow";
import CustomInput from "./CustomInput";
import { languagesData, mockComments } from "@/constants";
import { AiOutlineFullscreen, AiOutlineFullscreenExit } from "react-icons/ai";
import Timer from "./Timer";
import axios from "axios";
import Loader from "../shared/Loader";
import FontSizeDropdown from "./FontSizeDropdown";

const Playground = ({ problem = null, isForSubmission = true, setSubmitted }) => {
  const [customInput, setCustomInput] = useState(problem ? problem.testCase.input[0] : '');
  const [outputDetails, setOutputDetails] = useState(null);
  const [plot, setPlot] = useState(null);  // new
  const [isCodeRunning, setIsCodeRunning] = useState(false);
  const [isCodeSubmitting, setIsCodeSubmitting] = useState(false);
  const [theme, setTheme] = useState({ value: "dark", label: "Dark" });
  const [language, setLanguage] = useState(languagesData[3]);
  const [code, setCode] = useState(mockComments[language.value]);
  const [fontSize, setFontSize] = useState({ value: '14', label: '14px' });
  const [isFullScreen, setIsFullScreen] = useState(false);

  const handleFullScreen = () => {
    if (isFullScreen) {
      document.exitFullscreen();
    } else {
      document.documentElement.requestFullscreen();
    }
    setIsFullScreen(!isFullScreen);
  };

  useEffect(() => {
    function exitHandler() {
      if (!document.fullscreenElement) {
        setIsFullScreen(false);
        return;
      }
      setIsFullScreen(true);
    }
    document.addEventListener("fullscreenchange", exitHandler);
    return () => document.removeEventListener("fullscreenchange", exitHandler);
  }, []);

  const onChange = (action, data) => {
    if (action === "code") {
      setCode(data);
    }
  };

  const compileCode = async (input) => {
    try {
      const response = await axios.post("https://emkc.org/api/v2/piston/execute", {
        language: language.value,
        version: "*",
        files: [{ content: code }],
        stdin: input || "",
      }, {
        headers: { "Content-Type": "application/json" }
      });
      return response.data.run.stdout?.trim() || response.data.run.stderr?.trim() || "";
    } catch (error) {
      console.error(error);
      return "Error running code.";
    }
  };

  const handleCompile = async (input) => {
    setIsCodeRunning(true);
    const output = await compileCode(input);
    setOutputDetails({
      type: "run",
      input,
      output
    });
    setPlot(null);  // clear plot when using normal run
    setIsCodeRunning(false);
  };

  const handleSubmit = async () => {
    if (!problem?.testCase) return;
    setIsCodeSubmitting(true);

    try {
      const allInput = problem.testCase.input.join("\n");
      const allExpected = problem.testCase.output.join("\n").trim();

      const actualRaw = await compileCode(allInput);
      const actual = actualRaw?.trim?.() ?? "";

      if (actual === allExpected) {
        setOutputDetails({
          type: "submit",
          submitted: true,
          accepted: true,
        });
        setSubmitted(true);
        setTimeout(() => setSubmitted(false), 5000);
      } else {
        setOutputDetails({
          type: "submit",
          submitted: true,
          accepted: false,
          actual,
          expected: allExpected
        });
      }
    } catch (error) {
      console.error("Submit error:", error);
      setOutputDetails({
        type: "submit",
        submitted: true,
        accepted: false,
        actual: "Error during submission"
      });
    }

    setPlot(null);  // clear plot when submitting
    setIsCodeSubmitting(false);
  };

  // New: handleRunHeavy - call /api/run-heavy
  const handleRunHeavy = async () => {
    setIsCodeRunning(true);
    setPlot(null);  // reset before new run
    try {
      const res = await axios.post('/api/run-heavy', { code });
      const data = res.data;

      setOutputDetails({
        type: "run",
        input: "",
        output: data?.output ?? data?.error ?? 'No output'
      });
      setPlot(data?.plot ?? null);
      // set plot if returned
    } catch (error) {
      console.error(error);
      setOutputDetails({
        type: "run",
        input: "",
        output: "Error running heavy code."
      });
    }
    setIsCodeRunning(false);
  };

  return (
    <div className="w-full flex flex-col">
      <div className="flex gap-2 justify-between flex-wrap">
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

      <div className="!w-full flex-grow flex flex-col items-start pt-4">
        <CodeEditorWindow
          code={code}
          onChange={onChange}
          language={language.value}
          theme={theme.value}
          fontSize={fontSize.value}
          forProblemsPage={false}
        />

        <div className="!w-full min-h-[30%] flex flex-col">
          <div className="flex justify-end items-center gap-3">
            {/* New Run Heavy button on the left */}
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

          {/* Show plot if exists */}
          {plot && (
            <div className="mt-4">
              <h2 className="font-semibold">Plot:</h2>
              <img src={`data:image/png;base64,${plot}`} alt="Generated plot" className="max-w-full rounded border" />
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Playground;
