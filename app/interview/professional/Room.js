"use client";
import { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import { generateColor } from "./utils";
import Meeting from "@/components/interview/Meeting";
import "./Room.css";
import { languagesData } from "@/constants";
import Loader from "@/components/shared/Loader";
import CustomInput from "@/components/shared/CustomInput";
import OutputWindow from "@/components/shared/OutputWindow";
import LanguagesDropdown from "@/components/shared/LanguagesDropdown";
import ThemeDropdown from "@/components/shared/ThemeDropdown";
import FontSizeDropdown from "@/components/shared/FontSizeDropdown";
import Timer from "@/components/shared/Timer";
import { AiOutlineFullscreen, AiOutlineFullscreenExit } from "react-icons/ai";
import CodeEditorWindow from "@/components/shared/CodeEditorWindow";
import axios from "axios";

export default function Room({ socket }) {
  const navigate = useRouter();
  const { roomId } = useParams();
  const [fetchedUsers, setFetchedUsers] = useState([]);
  const [fetchedCode, setFetchedCode] = useState("");
  const [language, setLanguage] = useState({ value: "python3", label: "Python" });
  const [theme, setTheme] = useState({ value: "dark", label: "Dark" });
  const [fontSize, setFontSize] = useState({ value: "14", label: "14px" });
  const [isFullScreen, setIsFullScreen] = useState(false);
  const [customInput, setCustomInput] = useState("");
  const [outputDetails, setOutputDetails] = useState(null);
  const [isCodeRunning, setIsCodeRunning] = useState(false);

  function onChange(newValue) {
    setFetchedCode(newValue);
    socket.emit("update code", { roomId, code: newValue });
    socket.emit("syncing the code", { roomId });
  }

  function handleLanguageChange(e) {
    setLanguage(e);
    socket.emit("update language", { roomId, languageUsed: e });
    socket.emit("syncing the language", { roomId });
  }

  function handleLeave() {
    socket.disconnect();
    if (!socket.connected) navigate.push("/", { replace: true });
  }

  function copyToClipboard(text) {
    try {
      navigator.clipboard.writeText(text);
    } catch (exp) {
      console.error(exp);
    }
  }

  useEffect(() => {
    socket.on("updating client list", ({ userslist }) => {
      setFetchedUsers(userslist);
    });

    socket.on("on language change", ({ languageUsed }) => {
      setLanguage(languageUsed);
    });

    socket.on("on code change", ({ code }) => {
      setFetchedCode(code);
    });

    socket.on("new member joined", ({ username }) => { });

    socket.on("member left", ({ username }) => { });

    const backButtonEventListener = (e) => {
      const eventStateObj = e.state;
      if (!eventStateObj || !("usr" in eventStateObj) || !("username" in eventStateObj.usr)) {
        socket.disconnect();
      }
    };

    window.addEventListener("popstate", backButtonEventListener);

    return () => {
      window.removeEventListener("popstate", backButtonEventListener);
    };
  }, [socket]);

  const compileCode = async (input) => {
    try {
      const response = await axios.post(
        "https://emkc.org/api/v2/piston/execute",
        {
          language: language.value,
          version: "*",
          files: [{ content: fetchedCode }],
          stdin: input || "",
        },
        {
          headers: { "Content-Type": "application/json" },
        }
      );

      return (
        response.data.run.stdout?.trim() ||
        response.data.run.stderr?.trim() ||
        ""
      );
    } catch (error) {
      console.error(error);
      return "Error running code.";
    }
  };

  const handleCompile = async (input) => {
    console.log("Input sent to compiler:", input); // Debug input
    setIsCodeRunning(true);
    const output = await compileCode(input);
    setOutputDetails({
      type: "run",
      input,
      output,
    });
    setIsCodeRunning(false);
  };

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
      setIsFullScreen(!!document.fullscreenElement);
    }

    document.addEventListener("fullscreenchange", exitHandler);
    document.addEventListener("webkitfullscreenchange", exitHandler);
    document.addEventListener("mozfullscreenchange", exitHandler);
    document.addEventListener("MSFullscreenChange", exitHandler);

    return () => {
      document.removeEventListener("fullscreenchange", exitHandler);
      document.removeEventListener("webkitfullscreenchange", exitHandler);
      document.removeEventListener("mozfullscreenchange", exitHandler);
      document.removeEventListener("MSFullscreenChange", exitHandler);
    };
  }, []);

  return (
    <div className="room">
      <div className="w-full flex flex-col">
        <div className="roomSidebarUsersWrapper mb-3">
          <p>Connected Users:</p>
          <div className="roomSidebarUsers">
            {fetchedUsers.map((each, index) => (
              <div key={index} className="roomSidebarUsersEach">
                <div
                  className="roomSidebarUsersEachAvatar"
                  style={{ backgroundColor: generateColor(each) }}
                >
                  {each.slice(0, 2).toUpperCase()}
                </div>
                <div className="roomSidebarUsersEachName">{each}</div>
              </div>
            ))}
          </div>
        </div>

        <Meeting roomId={roomId} />
        <div className="flex my-2 justify-center items-center gap-4">
          <button
            className="bg-blue-500 text-light-1 hover:bg-blue-600 transition-all px-4 py-2 rounded-lg"
            onClick={() => {
              copyToClipboard(roomId);
            }}
          >
            Copy Invite code
          </button>
          <button
            className="bg-red-500 text-light-1 hover:bg-red-600 transition-all px-4 py-2 rounded-lg"
            onClick={handleLeave}
          >
            Leave
          </button>
        </div>
      </div>

      <div className="w-full flex flex-col">
        <div className="flex gap-2 justify-between flex-wrap">
          <div className="flex flex-wrap gap-2">
            <LanguagesDropdown
              value={language}
              onSelectChange={handleLanguageChange}
            />
            <ThemeDropdown handleThemeChange={setTheme} />
            <FontSizeDropdown onSelectChange={setFontSize} />
          </div>
          <div className="flex gap-2 items-center">
            <Timer />
            <button
              onClick={handleFullScreen}
              className="hover:bg-light-3 hover:border-light-4 rounded-lg p-1"
              aria-label="Toggle Fullscreen"
            >
              <div className="h-6 w-6 font-bold text-2xl text-dark-4">
                {!isFullScreen ? <AiOutlineFullscreen /> : <AiOutlineFullscreenExit />}
              </div>
            </button>
          </div>
        </div>

        <div className="!w-full flex-grow flex flex-col items-start pt-4">
          <CodeEditorWindow
            code={fetchedCode}
            onChange={onChange}
            language={language?.value || "Python"}
            theme={theme.value}
            fontSize={fontSize.value}
            forProblemsPage={false}
            isInterview={true}
          />

          <div className="!w-full min-h-[30%] flex flex-col">
            <div className="flex justify-end items-center gap-3">
              <button
                onClick={() => handleCompile(customInput)}
                className="px-8 py-2 bg-green-500 text-light-1 mt-2 rounded-lg text-sm"
                disabled={isCodeRunning}
              >
                {isCodeRunning ? <Loader /> : "Run"}
              </button>
            </div>

            <div className="flex gap-5 flex-grow max-sm:flex-col">
              <div className="!w-full flex flex-col h-[250px]">
                <h1 className="font-bold text-lg">Custom Input</h1>
                <CustomInput
                  customInput={customInput}
                  setCustomInput={setCustomInput}
                />
              </div>
              <OutputWindow
                outputDetails={outputDetails}
                additionalStyles="h-[250px]"
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
