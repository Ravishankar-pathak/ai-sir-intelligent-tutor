import React, { useState, useRef, useEffect } from 'react';
import { Send, Mic, Image as ImageIcon, Settings, Volume2, StopCircle, Loader2, Play, Pause, Hand, Heart } from 'lucide-react';
import Whiteboard from './components/Whiteboard';
import SettingsModal from './components/SettingsModal';
import { AppConfig, AIProvider, Message, TutorState, LectureChunk } from './types';
import { DEFAULT_CONFIG } from './constants';
import { generateGeminiResponse } from './services/gemini';
import { generateOpenAIResponse } from './services/openai';

const App: React.FC = () => {
  // State
  const [config, setConfig] = useState<AppConfig>(() => {
    const saved = localStorage.getItem('ai_tutor_config');
    // Fallback if saved config has old invalid provider
    const parsed = saved ? JSON.parse(saved) : DEFAULT_CONFIG;
    if (parsed.provider === 'OLLAMA') parsed.provider = AIProvider.GEMINI;
    return parsed;
  });
  
  const [messages, setMessages] = useState<Message[]>([]);
  const [currentInput, setCurrentInput] = useState('');
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [tutorState, setTutorState] = useState<TutorState>('idle');
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  
  // Lecture Mode State
  const [lectureQueue, setLectureQueue] = useState<LectureChunk[]>([]);
  const [currentChunkIndex, setCurrentChunkIndex] = useState<number>(-1);
  const [displayedContent, setDisplayedContent] = useState<string>('');
  
  // Refs
  const fileInputRef = useRef<HTMLInputElement>(null);
  const speechSynthRef = useRef<SpeechSynthesisUtterance | null>(null);
  const lectureTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Effects
  useEffect(() => {
    localStorage.setItem('ai_tutor_config', JSON.stringify(config));
  }, [config]);

  // Ensure voices are loaded (for browsers that load async)
  useEffect(() => {
    const loadVoices = () => {
      window.speechSynthesis.getVoices();
    };
    loadVoices();
    window.speechSynthesis.onvoiceschanged = loadVoices;
    return () => {
      window.speechSynthesis.onvoiceschanged = null;
    };
  }, []);

  // --- LECTURE ENGINE CORE ---

  // Watch for state changes to trigger next chunk
  useEffect(() => {
    if (tutorState === 'teaching' && currentChunkIndex < lectureQueue.length && currentChunkIndex >= 0) {
      playChunk(lectureQueue[currentChunkIndex]);
    } else if (tutorState === 'teaching' && currentChunkIndex >= lectureQueue.length && lectureQueue.length > 0) {
      // Lecture finished
      setTutorState('idle');
    }
  }, [tutorState, currentChunkIndex, lectureQueue]);

  const startLecture = (fullResponseText: string) => {
    // Split by the separator "|||" defined in system prompt
    const parts = fullResponseText.split('|||').map(p => p.trim()).filter(p => p.length > 0);
    
    const chunks: LectureChunk[] = parts.map((text, i) => ({
      id: `${Date.now()}-${i}`,
      text: text,
      isPlayed: false
    }));

    setLectureQueue(chunks);
    setCurrentChunkIndex(0);
    setDisplayedContent(''); // Clear board for new topic or append? Let's clear for new topic.
    setTutorState('teaching');
  };

  const playChunk = (chunk: LectureChunk) => {
    // 1. Update Whiteboard (Simulate "Writing")
    // We append the new text to what's already on the board
    setDisplayedContent(prev => {
      const separator = prev ? '\n\n' : '';
      // Don't add if it's already there (react strict mode safety)
      if (prev.includes(chunk.text)) return prev;
      return prev + separator + chunk.text;
    });

    // 2. Speak Audio
    speakText(chunk.text, () => {
      // On End of Audio
      if (tutorState === 'teaching') {
         // Wait a tiny bit for effect then move to next
         lectureTimeoutRef.current = setTimeout(() => {
           setCurrentChunkIndex(prev => prev + 1);
         }, 800); 
      }
    });
  };

  const interruptLecture = () => {
    // Stop everything
    if (speechSynthRef.current) {
      window.speechSynthesis.cancel();
    }
    if (lectureTimeoutRef.current) {
      clearTimeout(lectureTimeoutRef.current);
    }
    setTutorState('paused');
  };

  const resumeLecture = () => {
    setTutorState('teaching');
    // It will pick up from currentChunkIndex due to the useEffect
  };

  // --- INTERACTION LOGIC ---

  const handleSendMessage = async () => {
    if ((!currentInput.trim() && !selectedImage) || tutorState === 'preparing') return;

    // Check for unavailable providers
    if (config.provider === AIProvider.OPENAI || config.provider === AIProvider.GROK) {
      const systemMsg: Message = {
        id: Date.now().toString(),
        role: 'system',
        content: `🚧 **Coming Soon:** support for ${config.provider === AIProvider.GROK ? 'Grok' : 'ChatGPT'} is under active development. Please switch to **Google AI** in settings to continue learning.`,
        timestamp: Date.now()
      };
      setMessages(prev => [...prev, systemMsg]);
      setCurrentInput('');
      return;
    }

    // Determine if this is a new topic or a doubt
    const isDoubt = tutorState === 'paused' || tutorState === 'teaching';
    
    if (isDoubt) {
      interruptLecture();
      setTutorState('answering_doubt');
    } else {
      setTutorState('preparing');
    }

    const userMsg: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: currentInput,
      timestamp: Date.now()
    };

    setMessages(prev => [...prev, userMsg]);
    setCurrentInput('');
    
    const imgToSend = selectedImage;
    setSelectedImage(null); // consume image

    try {
      // Construct History
      const history = messages.slice(-10); 

      // Context Modification: If answering doubt, inject context
      let promptToSend = userMsg.content || "Explain this image";
      if (isDoubt) {
        promptToSend = `(Context: User interrupted lecture at step ${currentChunkIndex + 1}/${lectureQueue.length}). STUDENT DOUBT: ${promptToSend}. Answer the doubt, then ask if we should continue.`;
      }

      let responseText = '';
      
      if (config.provider === AIProvider.GEMINI) {
        responseText = await generateGeminiResponse(config.geminiKey, promptToSend, imgToSend, history);
      } 

      const aiMsg: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: responseText, // Store full text in history
        timestamp: Date.now()
      };
      setMessages(prev => [...prev, aiMsg]);

      if (isDoubt) {
        // If it's a doubt answer, we just speak it directly, we don't queue it as a lecture
        // But we allow the user to say "Yes continue" afterwards
        setDisplayedContent(prev => prev + `\n\n> **Doubt Solved:** ${responseText}`);
        speakText(responseText, () => {
          setTutorState('paused'); // Go back to paused state so user can say "Continue"
        });
      } else {
        // New Topic -> Start Lecture Mode
        startLecture(responseText);
      }

    } catch (error: any) {
      const errorMsg: Message = {
        id: Date.now().toString(),
        role: 'system',
        content: `**Error:** ${error.message}. Check Settings.`,
        timestamp: Date.now()
      };
      setMessages(prev => [...prev, errorMsg]);
      setTutorState('idle');
    }
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setSelectedImage(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  // Speech Synthesis (TTS)
  const speakText = (text: string, onEndCallback?: () => void) => {
    if (!window.speechSynthesis) {
      if (onEndCallback) onEndCallback();
      return;
    }
    
    window.speechSynthesis.cancel();

    // 1. Clean markdown
    let cleanText = text.replace(/[*#_`|]/g, '');
    
    // 2. Remove SVG/HTML tags specifically for speech so it doesn't read "<svg ...>"
    cleanText = cleanText.replace(/<[^>]*>/g, '');
    
    // 3. Normalize newlines
    cleanText = cleanText.replace(/\s+/g, ' ').trim();

    if (!cleanText) {
      if (onEndCallback) onEndCallback();
      return;
    }
    
    const utterance = new SpeechSynthesisUtterance(cleanText);
    
    // Enhanced Voice Selection
    const voices = window.speechSynthesis.getVoices();
    // Try to find a specific Hindi voice or Google Hindi to sound more natural
    const voice = voices.find(v => v.lang === 'hi-IN' || v.lang === 'hi') || 
                  voices.find(v => v.name.includes('Hindi')) || 
                  voices.find(v => v.name.includes('Google') && v.lang.includes('IN'));

    if (voice) {
        utterance.voice = voice;
        utterance.lang = voice.lang;
    } else {
        utterance.lang = 'hi-IN';
    }

    utterance.rate = 1.0;
    utterance.pitch = 1.05; // Slightly higher for enthusiastic teacher tone
    
    utterance.onend = () => {
      if (onEndCallback) onEndCallback();
    };
    
    utterance.onerror = (e) => {
      // Ignore interruption errors
      if (e.error === 'interrupted' || e.error === 'canceled') return;
      
      console.error(`TTS Error: ${e.error}`);
      if (onEndCallback) onEndCallback();
    };

    speechSynthRef.current = utterance;
    window.speechSynthesis.speak(utterance);
  };

  // Speech Recognition (STT)
  const toggleListening = () => {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) {
      alert("Voice input not supported in this browser.");
      return;
    }

    if (tutorState === 'listening') {
      setTutorState(lectureQueue.length > 0 ? 'paused' : 'idle');
      return; 
    }

    if (tutorState === 'teaching') {
      interruptLecture();
    }

    const recognition = new SpeechRecognition();
    recognition.lang = 'en-IN'; // Indian English for input
    recognition.interimResults = false;
    recognition.maxAlternatives = 1;

    recognition.onstart = () => setTutorState('listening');
    
    recognition.onresult = (event: any) => {
      const transcript = event.results[0][0].transcript;
      setCurrentInput(prev => prev + (prev ? ' ' : '') + transcript);
    };

    recognition.onerror = (event: any) => {
      console.error("Speech error", event.error);
      setTutorState(lectureQueue.length > 0 ? 'paused' : 'idle');
    };

    recognition.onend = () => {
      setTutorState(lectureQueue.length > 0 ? 'paused' : 'idle');
    };

    recognition.start();
  };

  return (
    <div className="flex h-screen bg-slate-100 font-sans">
      <SettingsModal 
        isOpen={isSettingsOpen} 
        onClose={() => setIsSettingsOpen(false)} 
        config={config}
        onSave={setConfig}
      />

      <div className="flex-1 flex flex-col md:flex-row overflow-hidden max-w-7xl mx-auto w-full bg-white shadow-2xl my-0 md:my-4 md:rounded-2xl border border-slate-200">
        
        {/* Left Panel: Whiteboard (65%) */}
        <div className="flex-1 md:flex-[3] flex flex-col min-h-[50vh] border-r border-slate-200 relative">
          <Whiteboard content={displayedContent} isThinking={tutorState === 'preparing'} />
          
          {/* Lecture Overlay Controls */}
          {(tutorState === 'teaching' || tutorState === 'paused') && (
            <div className="absolute bottom-6 left-1/2 transform -translate-x-1/2 flex items-center gap-4 bg-white/90 backdrop-blur border border-slate-200 shadow-xl rounded-full px-6 py-3 z-20 transition-all animate-in slide-in-from-bottom-4">
               {tutorState === 'teaching' ? (
                 <>
                    <div className="flex flex-col items-start mr-2">
                      <span className="text-xs font-bold text-indigo-600 uppercase tracking-wider">Live Class</span>
                      <div className="flex gap-1">
                        <span className="w-1 h-4 bg-indigo-600 animate-[pulse_0.6s_ease-in-out_infinite]"></span>
                        <span className="w-1 h-4 bg-indigo-600 animate-[pulse_0.6s_ease-in-out_0.2s_infinite]"></span>
                        <span className="w-1 h-4 bg-indigo-600 animate-[pulse_0.6s_ease-in-out_0.4s_infinite]"></span>
                      </div>
                    </div>
                    <button 
                      onClick={interruptLecture}
                      className="flex items-center gap-2 bg-red-50 text-red-600 px-4 py-2 rounded-full hover:bg-red-100 font-semibold border border-red-200 transition-colors"
                    >
                      <Hand className="w-4 h-4" /> Raise Hand (Doubt)
                    </button>
                 </>
               ) : (
                 <>
                   <span className="text-sm font-medium text-slate-600">Class Paused</span>
                   <button 
                      onClick={resumeLecture}
                      className="flex items-center gap-2 bg-green-600 text-white px-6 py-2 rounded-full hover:bg-green-700 font-semibold shadow-md transition-transform hover:scale-105"
                    >
                      <Play className="w-4 h-4" /> Resume Class
                    </button>
                 </>
               )}
            </div>
          )}
        </div>

        {/* Right Panel: Chat & Controls (35%) */}
        <div className="flex-1 md:flex-[2] flex flex-col bg-slate-50">
          
          {/* Header */}
          <div className="bg-white p-4 border-b border-slate-200 flex justify-between items-center">
            <div>
              <h1 className="font-bold text-lg text-slate-800">AI Tutor Class</h1>
              <div className="flex items-center gap-2 text-xs text-slate-500">
                <span className="w-2 h-2 rounded-full bg-blue-500"></span>
                Google AI
              </div>
            </div>
            <button onClick={() => setIsSettingsOpen(true)} className="p-2 hover:bg-slate-100 rounded-full text-slate-600">
              <Settings className="w-5 h-5" />
            </button>
          </div>

          {/* Chat History */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4">
            {messages.length === 0 && (
               <div className="text-center text-slate-400 mt-10">
                  <div className="text-4xl mb-2">👨‍🏫</div>
                  <p className="font-medium text-slate-600">Hello {config.userName}!</p>
                  <p className="text-sm mt-1">Upload a chapter photo or ask a question to start your personal tuition.</p>
               </div>
            )}
            {messages.map((msg) => (
              <div key={msg.id} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                <div className={`max-w-[90%] rounded-2xl px-4 py-3 text-sm shadow-sm ${
                  msg.role === 'user' 
                    ? 'bg-indigo-600 text-white rounded-br-none' 
                    : msg.role === 'system'
                    ? 'bg-yellow-50 text-yellow-800 border border-yellow-100'
                    : 'bg-white text-slate-700 border border-slate-200 rounded-bl-none'
                }`}>
                  {msg.role === 'assistant' && (
                    <span className="text-[10px] font-bold text-indigo-500 uppercase tracking-wide block mb-1">
                      {msg.content.includes('|||') ? 'Explanation Plan' : 'Response'}
                    </span>
                  )}
                  {/* Don't show full lecture text in chat, just summary or first part */}
                  {msg.role === 'assistant' && msg.content.includes('|||') 
                    ? <span className="italic text-slate-500">explaining on whiteboard...</span>
                    : msg.content}
                </div>
              </div>
            ))}
            {tutorState === 'preparing' && (
              <div className="flex justify-start">
                 <div className="bg-white border border-slate-200 rounded-2xl rounded-bl-none px-4 py-3 shadow-sm flex items-center gap-2">
                    <Loader2 className="w-4 h-4 animate-spin text-indigo-500" />
                    <span className="text-xs text-slate-500">Preparing lesson plan...</span>
                 </div>
              </div>
            )}
          </div>

          {/* Image Preview */}
          {selectedImage && (
            <div className="px-4 pt-2">
              <div className="relative inline-block group">
                <img src={selectedImage} alt="Upload preview" className="h-20 w-auto rounded-lg border border-slate-300 shadow-sm" />
                <button 
                  onClick={() => setSelectedImage(null)}
                  className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 shadow-md hover:bg-red-600 transition-transform hover:scale-110"
                >
                  <StopCircle className="w-3 h-3" />
                </button>
              </div>
            </div>
          )}

          {/* Input Area */}
          <div className="p-4 bg-white border-t border-slate-200">
            <div className="flex items-end gap-2">
              <button 
                onClick={() => fileInputRef.current?.click()}
                className="p-3 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-full transition-all"
                title="Upload Chapter"
              >
                <ImageIcon className="w-6 h-6" />
              </button>
              <input 
                type="file" 
                ref={fileInputRef}
                onChange={handleImageUpload}
                accept="image/*"
                className="hidden" 
              />

              <div className="flex-1 bg-slate-100 rounded-2xl flex items-center px-4 py-2 border border-transparent focus-within:border-indigo-300 focus-within:ring-2 focus-within:ring-indigo-100 transition-all">
                <textarea
                  value={currentInput}
                  onChange={(e) => setCurrentInput(e.target.value)}
                  onKeyDown={(e) => {
                    if(e.key === 'Enter' && !e.shiftKey) {
                      e.preventDefault();
                      handleSendMessage();
                    }
                  }}
                  placeholder={tutorState === 'teaching' ? "Interrupt and ask doubt..." : "Ask a question..."}
                  className="flex-1 bg-transparent border-none outline-none text-slate-700 resize-none max-h-24 py-2 placeholder:text-slate-400"
                  rows={1}
                />
                
                <button 
                  onClick={toggleListening}
                  className={`ml-2 p-2 rounded-full transition-all ${tutorState === 'listening' ? 'bg-red-100 text-red-600 animate-pulse' : 'text-slate-400 hover:text-indigo-600'}`}
                >
                  <Mic className="w-5 h-5" />
                </button>
              </div>

              <button 
                onClick={handleSendMessage}
                disabled={(!currentInput.trim() && !selectedImage) || tutorState === 'preparing'}
                className={`p-3 rounded-full shadow-lg transition-all transform hover:scale-105 active:scale-95 ${
                   tutorState === 'teaching' 
                   ? 'bg-orange-500 hover:bg-orange-600 text-white' // Interrupt color
                   : 'bg-indigo-600 hover:bg-indigo-700 text-white'
                } disabled:opacity-50 disabled:cursor-not-allowed`}
              >
                {tutorState === 'teaching' ? <Hand className="w-6 h-6" /> : <Send className="w-6 h-6" />}
              </button>
            </div>
            
            {/* Footer / Copyright - Added as requested */}
            <div className="mt-2 text-center">
              <p className="text-[10px] text-slate-400 flex items-center justify-center gap-1">
                Made with <Heart className="w-3 h-3 text-red-400 fill-red-400" /> by <span className="font-bold text-slate-500">Ravi</span>
              </p>
            </div>

          </div>

        </div>
      </div>
    </div>
  );
};

export default App;