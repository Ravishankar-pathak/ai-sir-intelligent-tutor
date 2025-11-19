import React, { useState, useEffect } from 'react';
import { AppConfig, AIProvider } from '../types';
import { Settings, X, Save, User, CheckCircle, Wifi, Bot, Construction } from 'lucide-react';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  config: AppConfig;
  onSave: (config: AppConfig) => void;
}

const SettingsModal: React.FC<Props> = ({ isOpen, onClose, config, onSave }) => {
  const [localConfig, setLocalConfig] = useState<AppConfig>(config);

  useEffect(() => {
    setLocalConfig(config);
  }, [config]);

  if (!isOpen) return null;

  const handleSave = () => {
    onSave(localConfig);
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden border border-slate-200">
        <div className="bg-indigo-600 p-4 flex justify-between items-center">
          <h2 className="text-white font-bold text-lg flex items-center gap-2">
            <Settings className="w-5 h-5" /> Class Preferences
          </h2>
          <button onClick={onClose} className="text-white/80 hover:text-white">
            <X className="w-6 h-6" />
          </button>
        </div>

        <div className="p-6 space-y-6 max-h-[80vh] overflow-y-auto">
          
          {/* User Name */}
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Student Name</label>
            <div className="relative">
              <User className="absolute left-3 top-2.5 w-5 h-5 text-slate-400" />
              <input 
                type="text"
                value={localConfig.userName}
                onChange={(e) => setLocalConfig({...localConfig, userName: e.target.value})}
                className="w-full pl-10 pr-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none"
                placeholder="Enter your name"
              />
            </div>
          </div>

          {/* Provider Selection */}
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-3">Select Your AI Teacher</label>
            <div className="grid grid-cols-1 gap-3">
              
              {/* Google AI Option */}
              <button
                onClick={() => setLocalConfig({...localConfig, provider: AIProvider.GEMINI})}
                className={`relative py-3 px-4 rounded-xl text-sm font-medium transition-all border-2 flex flex-row items-center justify-between gap-2 ${
                  localConfig.provider === AIProvider.GEMINI 
                    ? 'bg-indigo-50 border-indigo-600 text-indigo-700 shadow-sm' 
                    : 'bg-white border-slate-200 text-slate-600 hover:border-indigo-300'
                }`}
              >
                <div className="flex items-center gap-3">
                   <div className="p-2 bg-indigo-100 rounded-full">
                     <Wifi className={`w-5 h-5 ${localConfig.provider === AIProvider.GEMINI ? 'text-indigo-600' : 'text-slate-400'}`} />
                   </div>
                   <div className="text-left">
                     <span className="block font-bold">Google AI (Recommended)</span>
                     <span className="text-xs opacity-70">Fast, Smart & Supports Images</span>
                   </div>
                </div>
                {localConfig.provider === AIProvider.GEMINI && (
                  <CheckCircle className="w-6 h-6 text-indigo-600" />
                )}
              </button>

              <div className="grid grid-cols-2 gap-3 mt-2">
                {/* OpenAI Option (Under Work) */}
                <button
                  onClick={() => setLocalConfig({...localConfig, provider: AIProvider.OPENAI})}
                  className={`relative py-3 px-4 rounded-xl text-sm font-medium transition-all border-2 flex flex-col items-center gap-2 opacity-80 ${
                    localConfig.provider === AIProvider.OPENAI 
                      ? 'bg-slate-100 border-slate-500 text-slate-700' 
                      : 'bg-white border-slate-200 text-slate-500 hover:border-slate-300'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <Bot className="w-4 h-4 text-slate-400" />
                    <span>ChatGPT</span>
                  </div>
                  <span className="text-xs bg-yellow-100 text-yellow-800 px-2 py-0.5 rounded-full">Coming Soon</span>
                  {localConfig.provider === AIProvider.OPENAI && (
                    <Construction className="absolute top-2 right-2 w-4 h-4 text-slate-500" />
                  )}
                </button>

                {/* Grok Option (Under Work) */}
                <button
                  onClick={() => setLocalConfig({...localConfig, provider: AIProvider.GROK})}
                  className={`relative py-3 px-4 rounded-xl text-sm font-medium transition-all border-2 flex flex-col items-center gap-2 opacity-80 ${
                    localConfig.provider === AIProvider.GROK 
                      ? 'bg-slate-100 border-slate-500 text-slate-700' 
                      : 'bg-white border-slate-200 text-slate-500 hover:border-slate-300'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <span className="font-mono font-bold text-lg leading-4">X</span>
                    <span>Grok</span>
                  </div>
                  <span className="text-xs bg-yellow-100 text-yellow-800 px-2 py-0.5 rounded-full">Coming Soon</span>
                  {localConfig.provider === AIProvider.GROK && (
                    <Construction className="absolute top-2 right-2 w-4 h-4 text-slate-500" />
                  )}
                </button>
              </div>

            </div>
          </div>

          {/* Status Messages */}
          {localConfig.provider === AIProvider.GEMINI && (
            <div className="p-3 bg-indigo-50 text-indigo-800 rounded-lg text-xs border border-indigo-100 flex items-center gap-3">
              <div className="w-2 h-2 bg-indigo-500 rounded-full animate-pulse"></div>
              <div>
                <strong>Premium Access Active</strong><br/>
                Connected to High-Speed Cloud AI Teacher.
              </div>
            </div>
          )}

          {(localConfig.provider === AIProvider.OPENAI || localConfig.provider === AIProvider.GROK) && (
            <div className="p-3 bg-yellow-50 text-yellow-800 rounded-lg text-xs border border-yellow-100 flex items-center gap-3">
              <Construction className="w-5 h-5" />
              <div>
                <strong>Under Development</strong><br/>
                We are currently working on integrating this API. Please use Google AI for now.
              </div>
            </div>
          )}
          
          <button 
            onClick={handleSave}
            className="w-full bg-indigo-600 text-white font-semibold py-3 rounded-xl hover:bg-indigo-700 transition-colors flex items-center justify-center gap-2 shadow-lg shadow-indigo-200 mt-4"
          >
            <Save className="w-5 h-5" /> Save Preferences
          </button>
        </div>
      </div>
    </div>
  );
};

export default SettingsModal;