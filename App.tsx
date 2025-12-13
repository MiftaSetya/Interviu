import React, { useEffect, useState } from 'react';
import { InterviewConfig } from './types';
import LandingPage from './components/LandingPage';
import ConfigForm from './components/ConfigForm';
import SessionView from './components/SessionView';
import ResultView from './components/ResultView';
import AOS from 'aos';
import 'aos/dist/aos.css';

const App: React.FC = () => {
  useEffect(() => {
AOS.init({
offset: 200,
duration: 600,
easing: 'ease-in-sine',
delay: 100,
once: true,
});
}, []);

  const [showLanding, setShowLanding] = useState(true);
  const [result, setResult] = useState("");
  const [showResult, setShowResult] = useState(false);
  const [config, setConfig] = useState<InterviewConfig | null>(null);

  const handleGetStarted = () => {
    setShowLanding(false);
  };

  const handleStart = (newConfig: InterviewConfig) => {
    setConfig(newConfig);
  };

  const handleEnd = () => {
    // setConfig(null); // Keep config for ResultView
  };

  // Landing Page View
  if (showLanding) {
    return (
      <div className="min-h-screen bg-dark text-white font-sans selection:bg-primary selection:text-white overflow-hidden relative">
        <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none z-0">
          <div className="absolute -top-[10%] -left-[10%] w-[40%] h-[40%] bg-primary/20 rounded-full blur-[120px]"></div>
          <div className="absolute top-[20%] -right-[10%] w-[30%] h-[30%] bg-secondary/20 rounded-full blur-[100px]"></div>
        </div>

        <LandingPage onGetStarted={handleGetStarted} />
      </div>
    );
  }

  if (showResult) {
    return (
      <ResultView
        feedback={result}
        config={config}
        onRestart={() => {
          setResult("");
          setShowResult(false);
          setConfig(null); // Clear config explicitly on restart
        }}
      />
    );
  }

  // Config/Session View
  return (
    <div className="min-h-screen bg-dark text-white font-sans selection:bg-primary selection:text-white overflow-hidden relative">

      <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none z-0">
        <div className="absolute -top-[10%] -left-[10%] w-[40%] h-[40%] bg-primary/20 rounded-full blur-[120px]"></div>
        <div className="absolute top-[20%] -right-[10%] w-[30%] h-[30%] bg-secondary/20 rounded-full blur-[100px]"></div>
      </div>

      <div className="relative z-10 flex flex-col min-h-screen">
        {/* <header className="p-6 flex items-center justify-between">
          <div className="flex items-center gap-2 cursor-pointer" onClick={() => !config && setShowLanding(true)}>
            <h1 className="text-3xl font-bold tracking-tight">Interviu</h1>
          </div>
        </header> */}

        <main className="flex-1 flex flex-col items-center justify-center p-4">
          {!config ? (
            <ConfigForm onStart={handleStart} />
          ) : (
            <SessionView
              config={config}
              onEnd={handleEnd}
              onResult={(text) => {
                setResult(text);
                setShowResult(true);
              }}
            />
          )}
        </main>
      </div>
    </div>
  );
};

export default App;
