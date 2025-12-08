import React, { useState } from 'react';
import { InterviewConfig } from './types';
import ConfigForm from './components/ConfigForm';
import SessionView from './components/SessionView';
import { Sparkles } from 'lucide-react';

const App: React.FC = () => {
  const [config, setConfig] = useState<InterviewConfig | null>(null);

  const handleStart = (newConfig: InterviewConfig) => {
    setConfig(newConfig);
  };

  const handleEnd = () => {
    setConfig(null);
  };

  return (
    <div className="min-h-screen bg-dark text-white font-sans selection:bg-primary selection:text-white overflow-hidden relative">
      
      {/* Background Decor */}
      <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none z-0">
        <div className="absolute -top-[10%] -left-[10%] w-[40%] h-[40%] bg-primary/20 rounded-full blur-[120px]"></div>
        <div className="absolute top-[20%] -right-[10%] w-[30%] h-[30%] bg-secondary/20 rounded-full blur-[100px]"></div>
      </div>

      <div className="relative z-10 flex flex-col min-h-screen">
        {/* Navbar */}
        <header className="p-6 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="bg-gradient-to-tr from-primary to-secondary p-2 rounded-lg">
              <Sparkles className="w-6 h-6 text-white" />
            </div>
            <h1 className="text-2xl font-bold tracking-tight">InterviewAI</h1>
          </div>
          <div className="text-sm text-slate-400">
            Powered by Gemini Live
          </div>
        </header>

        {/* Main Content */}
        <main className="flex-1 flex flex-col items-center justify-center p-4">
          {!config ? (
            <ConfigForm onStart={handleStart} />
          ) : (
            <SessionView config={config} onEnd={handleEnd} />
          )}
        </main>

        {/* Footer */}
        <footer className="p-6 text-center text-slate-600 text-sm">
          &copy; {new Date().getFullYear()} InterviewAI. Practice makes perfect.
        </footer>
      </div>
    </div>
  );
};

export default App;
