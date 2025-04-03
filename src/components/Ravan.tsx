import React, { useState, useRef, useEffect } from 'react';
import { Minimize2, Send, Mic, MicOff, MessageSquare, X, ChevronDown, Settings, Volume2 } from 'lucide-react';

function App() {
  const [isMinimized, setIsMinimized] = useState(false);
  const [currentMessage, setCurrentMessage] = useState('');
  const [inputText, setInputText] = useState('');
  const [isRecording, setIsRecording] = useState(false);
  const [isTyping, setIsTyping] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [isTalking, setIsTalking] = useState(false);
  const recognition = useRef<SpeechRecognition | null>(null);

  useEffect(() => {
    if ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window) {
      const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
      recognition.current = new SpeechRecognition();
      recognition.current.continuous = false;
      recognition.current.interimResults = false;
      recognition.current.lang = 'en-US';

      recognition.current.onresult = (event) => {
        const transcript = event.results[0][0].transcript;
        handleMessage(transcript);
      };

      recognition.current.onend = () => {
        setIsRecording(false);
      };
    }
  }, []);

  const handleMessage = async (text: string) => {
    setIsTyping(true);
    setIsTalking(true);
    await new Promise(resolve => setTimeout(resolve, 1000));
    setCurrentMessage(`This is a response for: ${text}`);
    setIsTyping(false);
    speakResponse(`This is a response for: ${text}`);
  };

  const handleSend = () => {
    if (inputText.trim()) {
      handleMessage(inputText);
      setInputText('');
    }
  };

  const toggleRecording = () => {
    if (!recognition.current) return;

    if (isRecording) {
      recognition.current.stop();
    } else {
      recognition.current.start();
    }
    setIsRecording(!isRecording);
  };

  const speakResponse = (text: string) => {
    if ('speechSynthesis' in window) {
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.onend = () => setIsTalking(false);
      window.speechSynthesis.speak(utterance);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  if (isMinimized) {
    return (
      <div 
        className="fixed bottom-5 right-5 cursor-pointer group"
        onClick={() => setIsMinimized(false)}
      >
        <div className="relative">
          <div className="absolute -top-2 -right-2 w-4 h-4 bg-[#FF4400] rounded-full animate-pulse-ring" />
          <div className="assistant-container w-24 h-24 rounded-full neo-brutalism overflow-hidden relative bg-[#FFF5EB] hover:scale-105 transition-transform duration-300">
            <div className="energy-field" />
            <div className="absolute inset-0 bg-gradient-to-br from-[#FF4400]/10 to-[#FF4400]/5">
              <div className="matrix-rain" />
              <div className="neural-network" />
              <div className="data-stream" />
              <div className="absolute inset-0 assistant-pattern opacity-20" />
              <div className="absolute inset-0 circuit-pattern opacity-30" />
            </div>
            <div className="absolute inset-2 rounded-full bg-[#FF4400] glow-effect">
              <div className="w-full h-full flex items-center justify-center">
                <div className={`assistant-face ${isTalking ? 'talking' : ''}`}>
                  <div className="eyes">
                    <div className="eye" />
                    <div className="eye" />
                  </div>
                  <div className={`smile ${isTalking ? 'talking' : ''}`} />
                </div>
              </div>
            </div>
          </div>
        </div>
        <div className="absolute bottom-full right-0 mb-2 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
          <div className="bg-[#FFF5EB] text-black text-sm py-2 px-4 rounded-xl shadow-lg transform transition-transform duration-300 hover:scale-105">
            Talk to Assistant
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed bottom-5 right-5 w-[400px]">
      <div className="chat-container rounded-2xl overflow-hidden border border-[#FF4400]/20 bg-[#FFF5EB]">
        {/* Header */}
        <div className="bg-[#FF4400] p-4 relative">
          <div className="flex items-center justify-between relative z-10">
            <div className="flex items-center gap-4">
              <div className="assistant-container w-12 h-12 rounded-full neo-brutalism overflow-hidden relative bg-[#FFF5EB] hover:scale-105 transition-transform duration-300">
                <div className="energy-field" />
                <div className="absolute inset-0 bg-gradient-to-br from-[#FF4400]/10 to-[#FF4400]/5">
                  <div className="matrix-rain" />
                  <div className="neural-network" />
                  <div className="data-stream" />
                  <div className="absolute inset-0 assistant-pattern opacity-20" />
                  <div className="absolute inset-0 circuit-pattern opacity-30" />
                </div>
                <div className="absolute inset-1 rounded-full bg-[#FF4400] glow-effect">
                  <div className="w-full h-full flex items-center justify-center">
                    <div className={`assistant-face ${isTalking ? 'talking' : ''}`}>
                      <div className="eyes">
                        <div className="eye" />
                        <div className="eye" />
                      </div>
                      <div className={`smile ${isTalking ? 'talking' : ''}`} />
                    </div>
                  </div>
                </div>
              </div>
              <div>
                <h3 className="font-bold text-white text-xl">Ravan.ai</h3>
                <div className="flex items-center gap-2">
                  <span className="w-2 h-2 bg-[#FFF5EB] rounded-full" />
                  <p className="text-sm text-white/80">AI Assistant</p>
                </div>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <button 
                onClick={() => setShowSettings(!showSettings)}
                className="p-2 hover:bg-white/10 rounded-lg transition-all duration-300 button-hover"
              >
                <Settings size={20} className="text-white" />
              </button>
              <button 
                onClick={() => setIsMinimized(true)}
                className="p-2 hover:bg-white/10 rounded-lg transition-all duration-300 button-hover"
              >
                <Minimize2 size={20} className="text-white" />
              </button>
            </div>
          </div>
          
          {/* Settings Panel */}
          {showSettings && (
            <div className="absolute top-full left-0 right-0 bg-[#FFF5EB] border-t border-[#FF4400]/20 p-4 z-20 shadow-lg settings-panel">
              <div className="flex items-center justify-between mb-4">
                <h4 className="text-[#FF4400] font-medium">Settings</h4>
                <button 
                  onClick={() => setShowSettings(false)}
                  className="text-black/60 hover:text-black transition-colors duration-300"
                >
                  <X size={18} />
                </button>
              </div>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Volume2 size={18} className="text-[#FF4400]" />
                    <span className="text-black">Voice Response</span>
                  </div>
                  <div className="w-12 h-6 bg-[#FF4400]/20 rounded-full relative cursor-pointer transition-all duration-300 hover:bg-[#FF4400]/30">
                    <div className="absolute w-5 h-5 bg-[#FF4400] rounded-full top-0.5 right-0.5 shadow-md transition-transform duration-300 hover:scale-110" />
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Chat Body */}
        <div className="h-[300px] p-6 bg-[#FFF5EB] flex items-center justify-center relative">
          <div className="absolute inset-0 bg-gradient-to-b from-[#FF4400]/5 to-transparent" />
          {isTyping ? (
            <div className="message-bubble bg-white p-4 relative z-10">
              <div className="typing-indicator">
                <span></span>
                <span></span>
                <span></span>
              </div>
            </div>
          ) : currentMessage ? (
            <div className="message-bubble bg-white p-4 max-w-[90%] relative z-10">
              <p className="text-black">{currentMessage}</p>
            </div>
          ) : (
            <div className="text-black/50 text-center relative z-10 welcome-message">
              <p className="text-xl font-semibold mb-2">Welcome to Ravan.ai</p>
              <p>Ask me anything!</p>
              <p className="text-sm mt-2">I'll respond with text and voice</p>
            </div>
          )}
        </div>

        {/* Input Area */}
        <div className="p-4 bg-[#FFF5EB] border-t border-[#FF4400]/20">
          <div className="flex items-center gap-2">
            <div className="flex-1 input-container">
              <input
                type="text"
                value={inputText}
                onChange={(e) => setInputText(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder="Type your message..."
                className="w-full px-4 py-2 rounded-xl bg-white border border-[#FF4400]/20 text-black placeholder-black/40 focus:outline-none focus:border-[#FF4400] focus:ring-2 focus:ring-[#FF4400]/20 transition-all duration-300"
              />
            </div>
            <div className="flex gap-2">
              {recognition.current && (
                <button
                  onClick={toggleRecording}
                  className={`p-3 rounded-xl transition-all duration-300 button-hover ${
                    isRecording
                      ? 'bg-red-600 hover:bg-red-700'
                      : 'bg-[#FF4400] hover:bg-[#FF4400]/90'
                  }`}
                >
                  {isRecording ? 
                    <MicOff size={20} className="text-white animate-pulse" /> : 
                    <Mic size={20} className="text-white" />
                  }
                </button>
              )}
              <button
                onClick={handleSend}
                className="p-3 bg-[#FF4400] rounded-xl hover:bg-[#FF4400]/90 transition-all duration-300 button-hover"
              >
                <Send size={20} className="text-white" />
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default App;