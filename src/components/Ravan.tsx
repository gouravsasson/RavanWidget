import React, { useState, useEffect, useRef } from "react";
import { Mic, Send, X, Minimize2, Pause, Volume2, VolumeX } from "lucide-react";
import { MicOff } from "lucide-react";
import axios from "axios";
import { UltravoxSession } from "ultravox-client";
import { useWidgetContext } from "../constexts/WidgetContext";
import useSessionStore from "../store/session";
import { useUltravoxStore } from "../store/ultrasession";
import logo from "../assets/logo.png";

const RavanVoiceAI = () => {
  const [expanded, setExpanded] = useState(false);
  const [inputValue, setInputValue] = useState("");
  const [isRecording, setIsRecording] = useState(false);
  const containerRef = useRef(null);
  const [isGlowing, setIsGlowing] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [speech, setSpeech] = useState("");
  const [isVisible, setIsVisible] = useState(true);
  const [auto_end_call, setAutoEndCall] = useState(false);
  const [pulseEffects, setPulseEffects] = useState({
    small: false,
    medium: false,
    large: false,
  });
  const [message, setMessage] = useState("");
  const [isMinimized, setIsMinimized] = useState(false);

  const { agent_id, schema } = useWidgetContext();
  const { callId, callSessionId, setCallId, setCallSessionId } =
    useSessionStore();
  const {
    setSession,
    transcripts,
    setTranscripts,
    isListening,
    setIsListening,
    status,
    setStatus,
  } = useUltravoxStore();
  const baseurl = "https://app.snowie.ai";
  // const agent_id = "43279ed4-9039-49c8-b11b-e90f3f7c588c";
  // const schema = "6af30ad4-a50c-4acc-8996-d5f562b6987f";
  const debugMessages = new Set(["debug"]);
  const orange = "#F97316";
  const creamYellow = "#FFF7ED";
  // Change agent name to Ravan
  useEffect(() => {
    if (status === "disconnected") {
      setSpeech("Talk To Ravan");
    } else if (status === "connecting") {
      setSpeech("Connecting To Ravan");
    } else if (status === "speaking") {
      setSpeech("Ravan is Speaking");
    } else if (status === "connected") {
      setSpeech("Connected To Ravan");
    } else if (status === "disconnecting") {
      setSpeech("Ending Conversation With Ravan");
    } else if (status === "listening") {
      setSpeech("Ravan is Listening");
    }
  }, [status]);

  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.visibilityState === "hidden") {
        console.log("gg", document.visibilityState);
        session.muteSpeaker();
      } else if (document.visibilityState === "visible") {
        session.unmuteSpeaker();
      }
    };

    document.addEventListener("visibilitychange", handleVisibilityChange);

    return () => {
      document.removeEventListener("visibilitychange", handleVisibilityChange);
    };
  }, []);

  const sessionRef = useRef(null);
  if (!sessionRef.current) {
    sessionRef.current = new UltravoxSession({
      experimentalMessages: debugMessages,
    });

    setSession(sessionRef.current);
  }

  const session = sessionRef.current;

  const end_call = (parameters) => {
    console.log("end_call", parameters.auto_disconnect_call);
    if (parameters.auto_disconnect_call) {
      setAutoEndCall(true);
    }
  };

  useEffect(() => {
    if (auto_end_call) {
      const handleClose = async () => {
        localStorage.clear();

        await session.leaveCall();
        console.log("call left successfully first time");

        const response = await axios.post(
          `${baseurl}/api/end-call-session-ultravox/`,
          {
            call_session_id: callSessionId,
            call_id: callId,
            schema_name: schema,
          }
        );
        setTranscripts(null);
        toggleVoice(false);
      };
      handleClose();
    }
  }, [auto_end_call]);

  session.registerToolImplementation("auto_end_call", end_call);

  // Handle message submission
  const handleSubmit = () => {
    if (status !== "disconnected" && message.trim()) {
      session.sendText(`${message}`);
      setMessage("");
    }
  };

  useEffect(() => {
    console.log("status", status);
    const callId = localStorage.getItem("callId");
    if (callId && status === "disconnected") {
      console.log("reconnecting");
      setIsMuted(true);
      handleMicClickForReconnect(callId);
    } else if (status === "listening" && callId && isMuted) {
      session.muteSpeaker();
    }
  }, [status]);

  const handleMicClickForReconnect = async (id) => {
    try {
      const response = await axios.post(`${baseurl}/api/start-thunder/`, {
        agent_code: agent_id,
        schema_name: schema,
        prior_call_id: id,
      });

      const wssUrl = response.data.joinUrl;
      const callId = response.data.callId;
      localStorage.setItem("callId", callId);
      setCallId(callId);
      setCallSessionId(response.data.call_session_id);

      if (wssUrl) {
        await session.joinCall(`${wssUrl}`);
      }
    } catch (error) {
      console.error("Error in handleMicClick:", error);
    }
  };

  // Handle mic button click
  const handleMicClick = async (id) => {
    try {
      if (!isListening) {
        setIsGlowing(true);
        const response = await axios.post(`${baseurl}/api/start-thunder/`, {
          agent_code: agent_id,
          schema_name: schema,
          prior_call_id: id,
        });

        const wssUrl = response.data.joinUrl;
        const callId = response.data.callId;
        localStorage.setItem("callId", callId);
        localStorage.setItem("wssUrl", wssUrl);
        setCallId(callId);
        setCallSessionId(response.data.call_session_id);

        if (wssUrl) {
          session.joinCall(`${wssUrl}`);
        }
        toggleVoice(true);
      } else {
        setIsGlowing(false);
        await session.leaveCall();
        console.log("call left successfully second time");
        const response = await axios.post(
          `${baseurl}/api/end-call-session-ultravox/`,
          {
            call_session_id: callSessionId,
            call_id: callId,
            schema_name: schema,
          }
        );

        setTranscripts(null);
        toggleVoice(false);
        localStorage.clear();
      }
    } catch (error) {
      console.error("Error in handleMicClick:", error);
    }
  };

  session.addEventListener("transcripts", (event) => {
    const alltrans = session.transcripts;
    let Trans = "";

    for (let index = 0; index < alltrans.length; index++) {
      const currentTranscript = alltrans[index];
      Trans = currentTranscript.text;

      if (currentTranscript) {
        setTranscripts(Trans);
      }
    }
  });

  // Listen for status changing events
  session.addEventListener("status", (event) => {
    setStatus(session.status);
    if (session.status === "speaking" || session.status === "listening") {
      setIsRecording(true);
    } else {
      setIsRecording(false);
    }
  });

  session.addEventListener("experimental_message", (msg) => {
    console.log("Got a debug message: ", JSON.stringify(msg));
  });

  // Animated pulse effects for recording state
  useEffect(() => {
    if (isRecording) {
      const smallPulse = setInterval(() => {
        setPulseEffects((prev) => ({ ...prev, small: !prev.small }));
      }, 1000);

      const mediumPulse = setInterval(() => {
        setPulseEffects((prev) => ({ ...prev, medium: !prev.medium }));
      }, 1500);

      const largePulse = setInterval(() => {
        setPulseEffects((prev) => ({ ...prev, large: !prev.large }));
      }, 2000);

      return () => {
        clearInterval(smallPulse);
        clearInterval(mediumPulse);
        clearInterval(largePulse);
      };
    }
  }, [isRecording]);

  const toggleExpand = () => {
    if (status === "disconnected") {
      setSpeech("Connecting To Ravan");
      handleMicClick();
    }
    if (session.isSpeakerMuted) {
      setIsMuted(false);
      session.unmuteSpeaker();
    }

    setExpanded(!expanded);
    setIsMinimized(false);
  };

  const toggleMute = () => {
    setIsMuted(!isMuted);
    if (session.isSpeakerMuted) {
      session.unmuteSpeaker();
    } else {
      session.muteSpeaker();
    }
  };

  const toggleMinimize = () => {
    setIsMinimized(!isMinimized);
  };

  const handleClose = async () => {
    setExpanded(false);
    localStorage.clear();
    await session.leaveCall();
    const response = await axios.post(
      `${baseurl}/api/end-call-session-ultravox/`,
      {
        call_session_id: callSessionId,
        call_id: callId,
        schema_name: schema,
      }
    );
    setTranscripts(null);
    toggleVoice(false);
  };

  const toggleVoice = (data) => {
    setIsListening(data);
  };

  useEffect(() => {
    const container = containerRef.current;
    if (container) {
      // Set scrollTop to scrollHeight to always scroll to the bottom
      container.scrollTop = container.scrollHeight;
    }
  }, [transcripts]);

  // Animation for the button when speaking/active
  useEffect(() => {
    if (status === "speaking" || status === "listening") {
      setIsGlowing(true);
    } else {
      setIsGlowing(false);
    }
  }, [status]);

  return (
    <div
      className="fixed bottom-6 right-6 z-50 flex flex-col items-end"
      style={{
        zIndex: 999,
      }}
    >
      {expanded ? (
        <div
          className={`bg-yellow-100 backdrop-blur-md w-[320px] ${
            isMinimized ? "h-16" : "h-[520px]"
          } rounded-2xl shadow-2xl overflow-hidden border transition-all duration-300 ${
            isGlowing
              ? "border-orange-400 shadow-orange-500/50"
              : "border-orange-300"
          }`}
        >
          {/* Header with glow effect */}
          <div className="relative p-4 flex justify-between bg-black/80 items-center border-b border-orange-500/30">
            <div className="absolute inset-0 bg-gradient-to-r from-orange-600/20 via-transparent to-orange-500/10"></div>
            <div className="relative flex items-center">
              <div className=" rounded-full w-8 h-8 flex items-center justify-center mr-2 border border-orange-300 shadow-lg shadow-orange-500/30">
                <span className="text-white font-bold text-xl rounded-full">
                  <img src={logo} alt="Ravan AI logo" className="w-6 h-6" />
                </span>
              </div>
              <span className="text-white font-bold text-lg">Ravan AI</span>
            </div>
            <div className="relative flex space-x-3">
              <button
                onClick={toggleMute}
                className="text-gray-300 hover:text-orange-400 transition-colors"
                title={isMuted ? "Unmute" : "Mute"}
              >
                {isMuted ? <VolumeX size={18} /> : <Volume2 size={18} />}
              </button>
              <button
                onClick={toggleMinimize}
                className="text-gray-300 hover:text-orange-400 transition-colors"
                title={isMinimized ? "Expand" : "Minimize"}
              >
                <Minimize2 size={18} />
              </button>
              <button
                onClick={handleClose}
                className="text-gray-300 hover:text-orange-400 transition-colors"
                title="Close"
              >
                <X size={18} />
              </button>
            </div>
          </div>

          {!isMinimized && (
            <>
              {/* Microphone Button with enhanced visual effects */}
              <div className="pt-8 flex flex-col items-center justify-center relative overflow-hidden w-full">
                {/* Background glow effects */}
                <div className="absolute inset-0 bg-gradient-to-b from-orange-500/10 to-transparent"></div>
                <div className="absolute w-full h-64 left-1/2 transform -translate-x-1/2 -translate-y-1/2 bg-orange-500/10 rounded-full blur-3xl"></div>

                {/* Microphone button with pulse animations */}
                <div className="relative">
                  {isRecording && (
                    <>
                      <div className="absolute inset-0 -m-3 bg-orange-400 opacity-30 rounded-full animate-ping"></div>
                      <div className="absolute inset-0 -m-6 bg-orange-500 opacity-20 rounded-full animate-pulse"></div>
                      <div className="absolute inset-0 -m-12 bg-orange-600 opacity-10 rounded-full animate-pulse"></div>
                    </>
                  )}
                  {isGlowing && (
                    <>
                      <div className="absolute inset-0 -m-5 bg-orange-400 opacity-50 rounded-full animate-ping"></div>
                      <div className="absolute inset-0 -m-10 bg-orange-400 opacity-30 rounded-full animate-pulse"></div>
                    </>
                  )}
                  <button
                    onClick={handleMicClick}
                    className={`relative z-10 bg-orange-500 rounded-full w-32 h-32 flex items-center justify-center border-2 ${
                      isGlowing
                        ? "border-orange-300 shadow-xl shadow-orange-500/60"
                        : "border-orange-400 shadow-lg"
                    } shadow-orange-500/30 transition-all duration-500 ${
                      isRecording ? "scale-110" : "hover:scale-105"
                    } backdrop-blur-sm`}
                  >
                    <div className="absolute inset-0 bg-gradient-to-br from-transparent via-transparent to-black/20 rounded-full"></div>
                    <div className="absolute inset-0 bg-gradient-to-tr from-orange-400/30 via-transparent to-transparent rounded-full"></div>
                    <div className="flex items-center justify-center">
                      <span
                        className={`text-white font-bold text-6xl drop-shadow-xl tracking-tighter ${
                          isRecording ? "animate-pulse" : ""
                        }`}
                      >
                        <img src={logo} alt="Ravan AI logo" className="w-16 h-16" />
                      </span>
                    </div>
                  </button>
                </div>

                <div className={`text-orange-300 text-sm mt-4 font-medium drop-shadow-md 
                  bg-black/50 px-4 py-2 rounded-full backdrop-blur-sm border border-orange-500/20 
                  ${isRecording ? "animate-pulse" : ""}`}>
                  {speech}
                </div>

                {/* Transcription Box with enhanced styling */}
                <div className="relative p-4 w-full mt-2">
                  <div className="relative">
                    <div className="flex justify-between items-center mb-2">
                      {isRecording && (
                        <div className="flex items-center">
                          <div className="w-2 h-2 bg-red-500 rounded-full mr-1 animate-pulse"></div>
                          <span className="text-orange-300 text-xs">LIVE</span>
                        </div>
                      )}
                    </div>
                    <div
                      ref={containerRef}
                      className="bg-gradient-to-br from-gray-800 to-gray-900 backdrop-blur-sm rounded-xl p-4 h-20 text-white shadow-inner border border-orange-500/30 overflow-y-auto scrollbar-hide"
                      style={{
                        scrollbarWidth: "none",
                        msOverflowStyle: "none",
                      }}
                    >
                      <div className="relative">
                        <span className="text-orange-50">{transcripts}</span>
                        {!transcripts && (
                          <span className="text-gray-400 italic">Your conversation will appear here...</span>
                        )}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Input Area with glass effect */}
                <div className="relative p-4 w-full">
                  <div className="relative flex items-center space-x-2">
                    <input
                      type="text"
                      disabled={
                        status === "disconnected" || status === "connecting"
                      }
                      value={message}
                      onChange={(e) => setMessage(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter") {
                          handleSubmit();
                        }
                      }}
                      placeholder="Type your message..."
                      className="flex-1 bg-gray-800 text-white p-3 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500/80 placeholder-gray-400 border border-orange-500/30"
                    />
                    <button
                      type="button"
                      onClick={handleSubmit}
                      disabled={!message.trim() || status === "disconnected" || status === "connecting"}
                      className={`p-3 ${
                        message.trim() && status !== "disconnected" && status !== "connecting"
                          ? "bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-400 hover:to-orange-500"
                          : "bg-gray-700 cursor-not-allowed"
                      } rounded-xl transition-colors shadow-md`}
                    >
                      <Send size={20} className="text-white" />
                    </button>
                  </div>
                </div>
              </div>
            </>
          )}
        </div>
      ) : (
        <button
          onClick={toggleExpand}
          className="rounded-full w-16 h-16 flex items-center justify-center shadow-2xl border-2 border-orange-300  transition-all hover:scale-110 hover:shadow-orange-500/50"
        >
          <div className="relative">
            <div className="absolute inset-0 -m-1 bg-orange-400/40 rounded-full animate-ping"></div>
            <div className="absolute inset-0 -m-3 bg-orange-400/20 rounded-full animate-pulse"></div>
            <span className="text-white font-bold text-3xl relative z-10 drop-shadow-xl tracking-tighter">
              <img src={logo} alt="Ravan AI logo" className="w-10 h-10" />
            </span>
          </div>
        </button>
      )}
    </div>
  );
};

export default RavanVoiceAI;