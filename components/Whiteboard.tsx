import React, { useEffect, useRef } from 'react';
import ReactMarkdown from 'react-markdown';
import { Loader2, PenTool } from 'lucide-react';

interface Props {
  content: string;
  isThinking: boolean;
}

const Whiteboard: React.FC<Props> = ({ content, isThinking }) => {
  const bottomRef = useRef<HTMLDivElement>(null);

  // Always scroll to bottom when content is added
  useEffect(() => {
    if (bottomRef.current) {
      bottomRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [content, isThinking]);

  // Helper to render content mixed with SVG and Markdown
  const renderContent = (fullText: string) => {
    // Fix: Sometimes LLMs wrap SVG in markdown code blocks like ```xml ... ```. We need to strip that.
    const cleanText = fullText.replace(/```xml/g, '').replace(/```svg/g, '').replace(/```/g, '');

    // Split text by SVG tags. 
    const parts = cleanText.split(/(<svg[\s\S]*?<\/svg>)/g);

    return parts.map((part, index) => {
      if (part.trim().startsWith('<svg')) {
        // Render SVG safely with responsive styling
        return (
          <div key={index} className="my-8 flex flex-col items-center justify-center animate-in zoom-in-95 duration-500">
            <div className="bg-white p-6 rounded-xl border-2 border-slate-200 shadow-lg w-full max-w-lg relative group hover:border-indigo-300 transition-colors">
              {/* Badge */}
              <div className="absolute top-0 left-0 bg-slate-100 px-3 py-1 rounded-br-lg border-b border-r border-slate-200 text-[10px] font-bold text-slate-500 flex items-center gap-1 uppercase tracking-wider">
                <PenTool className="w-3 h-3" /> Diagram
              </div>
              
              {/* 
                SVG Container with Arbitrary Variants for responsiveness.
                Also added [&_text]:font-sans [&_text]:font-bold to make labels crisp.
              */}
              <div 
                className="mt-4 w-full flex justify-center [&>svg]:w-full [&>svg]:h-auto [&>svg]:max-h-[400px] [&>svg]:drop-shadow-sm [&_text]:font-sans [&_text]:font-medium"
                dangerouslySetInnerHTML={{ __html: part }} 
              />
            </div>
          </div>
        );
      } else if (part.trim()) {
        // Render Markdown
        return (
          <div key={index} className="prose prose-slate max-w-none font-hand text-lg leading-relaxed">
            <ReactMarkdown
               components={{
                 strong: ({node, ...props}) => <span className="text-indigo-700 font-bold bg-indigo-50 px-1 rounded" {...props} />,
                 ul: ({node, ...props}) => <ul className="list-disc pl-6 my-2 space-y-1" {...props} />,
                 ol: ({node, ...props}) => <ol className="list-decimal pl-6 my-2 space-y-1" {...props} />,
                 h1: ({node, ...props}) => <h1 className="text-2xl font-bold text-indigo-800 border-b-2 border-indigo-100 pb-2 mb-4 mt-8" {...props} />,
                 h2: ({node, ...props}) => <h2 className="text-xl font-bold text-slate-800 mt-6 mb-2 border-l-4 border-indigo-400 pl-3" {...props} />,
                 h3: ({node, ...props}) => <h3 className="text-lg font-bold text-slate-700 mt-4 mb-2" {...props} />,
                 blockquote: ({node, ...props}) => <blockquote className="border-l-4 border-green-400 pl-4 italic text-slate-600 my-4 bg-green-50 p-3 rounded-r" {...props} />,
                 code: ({node, ...props}) => <code className="bg-slate-100 text-red-500 px-1 py-0.5 rounded font-mono text-sm" {...props} />,
               }}
            >
              {part}
            </ReactMarkdown>
          </div>
        );
      }
      return null;
    });
  };

  return (
    <div className="h-full flex flex-col bg-white border-x border-slate-200 shadow-inner relative overflow-hidden">
      {/* Board Header */}
      <div className="bg-slate-800 text-white p-3 flex justify-between items-center shadow-md z-10">
        <h2 className="font-hand text-xl font-bold tracking-wide">AI Sir's Whiteboard 🎓</h2>
        <div className="flex gap-2">
            <div className="w-3 h-3 rounded-full bg-red-400"></div>
            <div className="w-3 h-3 rounded-full bg-yellow-400"></div>
            <div className="w-3 h-3 rounded-full bg-green-400"></div>
        </div>
      </div>

      {/* Content Area */}
      <div className="flex-1 overflow-y-auto p-6 whiteboard-scroll bg-[url('https://www.transparenttextures.com/patterns/graphy.png')]">
        {content ? (
           <div className="animate-in fade-in duration-500 pb-20">
             {renderContent(content)}
           </div>
        ) : (
          <div className="h-full flex flex-col items-center justify-center text-slate-400 opacity-50">
            <div className="text-6xl mb-4">🏫</div>
            <p className="text-xl font-hand">Upload a chapter or ask a doubt to start...</p>
          </div>
        )}

        {isThinking && (
          <div className="flex items-center gap-2 text-indigo-600 font-medium mt-4 animate-pulse bg-indigo-50 p-2 rounded-lg inline-flex">
            <Loader2 className="w-5 h-5 animate-spin" />
            <span>AI Sir is preparing the lesson...</span>
          </div>
        )}
        <div ref={bottomRef} className="h-4" />
      </div>
      
      {/* Marker Tray Visual */}
      <div className="h-4 bg-slate-300 border-t border-slate-400 shadow-lg relative z-10">
        <div className="absolute bottom-1 left-10 w-20 h-2 bg-blue-600 rounded-full shadow opacity-80"></div>
        <div className="absolute bottom-1 left-32 w-20 h-2 bg-black rounded-full shadow opacity-80"></div>
        <div className="absolute bottom-1 left-56 w-16 h-3 bg-slate-100 border border-slate-300 rounded shadow transform -rotate-1"></div>
      </div>
    </div>
  );
};

export default Whiteboard;