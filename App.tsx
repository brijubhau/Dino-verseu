
import React, { useState, useEffect, useCallback } from 'react';
import { GameStatus, GameState, PowerUpType } from './types';
import { getGameNarration } from './services/geminiService';
import { audioService } from './services/audioService';
import DinoCanvas from './components/DinoCanvas';
import { Play, RotateCcw, Shield, Clock, Zap, Cpu, Volume2, VolumeX, Home, Terminal } from 'lucide-react';

const App: React.FC = () => {
  const [gameState, setGameState] = useState<GameState>({
    status: GameStatus.START,
    score: 0,
    highScore: parseInt(localStorage.getItem('dino-high-score') || '0'),
    speed: 5,
    lastScoreMilestone: 0,
    narration: "INITIALIZING DINO-VERSE PROTOCOL...",
    isThinking: false
  });

  const [isMuted, setIsMuted] = useState(false);
  const [activePowerUpName, setActivePowerUpName] = useState<string | null>(null);
  const [currentPhaseName, setCurrentPhaseName] = useState<string>("NEON_WAVE");
  const [showPhaseAlert, setShowPhaseAlert] = useState(false);

  const toggleMute = () => {
    const newMute = !isMuted;
    setIsMuted(newMute);
    audioService.setMute(newMute);
  };

  const handleGameOver = useCallback((finalScore: number) => {
    setGameState(prev => {
      const isNewHigh = finalScore > prev.highScore;
      if (isNewHigh) {
        localStorage.setItem('dino-high-score', finalScore.toString());
      }
      return {
        ...prev,
        status: GameStatus.GAMEOVER,
        score: finalScore,
        highScore: isNewHigh ? finalScore : prev.highScore,
        narration: "SYSTEM CRITICAL. SIMULATION TERMINATED."
      };
    });
  }, []);

  const handleScoreUpdate = useCallback((score: number) => {
    setGameState(prev => {
      if (score > prev.lastScoreMilestone + 100 && !prev.isThinking) {
        fetchNarration(score);
        return { ...prev, score, lastScoreMilestone: score, isThinking: true };
      }
      return { ...prev, score };
    });
  }, []);

  const handlePhaseChange = (phase: string) => {
    setCurrentPhaseName(phase);
    setShowPhaseAlert(true);
    setTimeout(() => setShowPhaseAlert(false), 3000);
  };

  const fetchNarration = async (score: number) => {
    const text = await getGameNarration(score);
    setGameState(prev => ({ ...prev, narration: text, isThinking: false }));
  };

  const handlePowerUp = (type: PowerUpType) => {
      setActivePowerUpName(type.replace('_', ' '));
      setTimeout(() => setActivePowerUpName(null), 2000);
  };

  const goToMenu = () => {
    setGameState(prev => ({
        ...prev,
        status: GameStatus.START,
        score: 0,
        narration: "INITIALIZING DINO-VERSE PROTOCOL..."
    }));
  };

  const startGame = () => {
    audioService.startAmbient();
    setGameState(prev => ({ 
      ...prev, 
      status: GameStatus.START,
      score: 0, 
      lastScoreMilestone: 0,
      narration: "NEURAL LINK ESTABLISHED. ESCAPE STARTING."
    }));

    setTimeout(() => {
        setGameState(prev => ({ ...prev, status: GameStatus.PLAYING }));
    }, 10);
  };

  return (
    <div className="min-h-screen bg-[#050505] text-white flex flex-col items-center justify-center p-4">
      {/* Header UI */}
      <div className="w-full max-w-4xl flex justify-between items-end mb-4 px-2">
        <div className="flex items-center gap-4">
          <div>
            <h1 className="text-4xl font-bold font-orbitron tracking-tighter text-cyan-400 drop-shadow-[0_0_10px_rgba(34,211,238,0.5)]">
              DINO-VERSE
            </h1>
            <p className="text-xs text-cyan-700 font-mono flex items-center gap-2">
              <Cpu size={14} /> EVOLVED_v3.2.0
            </p>
          </div>
          <button 
            onClick={toggleMute}
            className="p-2 bg-zinc-900 border border-zinc-700 rounded-full hover:bg-zinc-800 transition-colors text-cyan-400"
            title={isMuted ? "Unmute" : "Mute"}
          >
            {isMuted ? <VolumeX size={18} /> : <Volume2 size={18} />}
          </button>
        </div>
        <div className="text-right font-mono">
          <p className="text-pink-500 text-[10px] tracking-widest uppercase">Phase: {currentPhaseName}</p>
          <p className="text-pink-500 text-sm">HI: {gameState.highScore.toString().padStart(6, '0')}</p>
          <p className="text-3xl font-bold text-white leading-none">
            {gameState.score.toString().padStart(6, '0')}
          </p>
        </div>
      </div>

      {/* Main Game Area */}
      <div className="relative w-full max-w-4xl aspect-[2/1] bg-black rounded-xl overflow-hidden shadow-2xl border border-white/10">
        <DinoCanvas 
          status={gameState.status} 
          onGameOver={handleGameOver}
          onScoreUpdate={handleScoreUpdate}
          onPowerUpCollected={handlePowerUp}
          onPhaseChange={handlePhaseChange}
        />

        {showPhaseAlert && (
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-30 pointer-events-none animate-in zoom-in duration-500">
                <div className="bg-black/80 border-2 border-cyan-500 p-8 backdrop-blur-md rounded-lg text-center shadow-[0_0_50px_rgba(6,182,212,0.5)]">
                    <p className="text-cyan-400 font-mono text-xs mb-2 tracking-[0.5em] uppercase">Phase Shift Detected</p>
                    <h3 className="text-5xl font-orbitron font-bold text-white">{currentPhaseName}</h3>
                </div>
            </div>
        )}

        {gameState.status === GameStatus.START && (
          <div className="absolute inset-0 bg-black/80 flex flex-col items-center justify-center backdrop-blur-sm transition-all z-20">
            <div className="text-center space-y-6">
              <h2 className="text-5xl font-orbitron font-bold text-white animate-pulse">RUN. EVOLVE. SURVIVE.</h2>
              <p className="text-cyan-400 font-mono text-sm max-w-md mx-auto px-4">
                Dino has been digitized. Survive the evolving wasteland by adapting to phase shifts and collecting neural enhancers.
              </p>
              <button 
                onClick={startGame}
                className="group relative px-8 py-4 bg-cyan-500 hover:bg-cyan-400 text-black font-bold font-orbitron rounded-sm transition-all overflow-hidden flex items-center gap-3 mx-auto shadow-[0_0_20px_rgba(6,182,212,0.5)]"
              >
                <Play fill="black" size={24} /> INITIALIZE CORE
              </button>
            </div>
          </div>
        )}

        {gameState.status === GameStatus.GAMEOVER && (
          <div className="absolute inset-0 bg-red-950/80 flex flex-col items-center justify-center backdrop-blur-md animate-in fade-in duration-500 z-20">
             <div className="text-center space-y-6">
              <h2 className="text-6xl font-orbitron font-bold text-red-500 drop-shadow-lg">SYSTEM FAILURE</h2>
              <div className="space-y-1">
                <p className="text-white/60 font-mono text-sm uppercase tracking-widest">Simulation Depth Reached</p>
                <p className="text-5xl font-bold font-orbitron text-white">{gameState.score} @ {currentPhaseName}</p>
              </div>
              
              <div className="flex flex-col sm:flex-row gap-4 items-center justify-center pt-4">
                <button 
                  onClick={startGame}
                  className="px-8 py-3 bg-red-600 hover:bg-red-500 text-white font-bold font-orbitron rounded-sm transition-all flex items-center gap-3 w-48 justify-center shadow-[0_0_15px_rgba(220,38,38,0.4)]"
                >
                  <RotateCcw size={20} /> QUICK REBOOT
                </button>
                <button 
                  onClick={goToMenu}
                  className="px-8 py-3 bg-zinc-800 hover:bg-zinc-700 text-white font-bold font-orbitron rounded-sm transition-all flex items-center gap-3 w-48 justify-center border border-white/10"
                >
                  <Home size={20} /> SYSTEM MENU
                </button>
              </div>
            </div>
          </div>
        )}

        {gameState.status === GameStatus.PLAYING && (
          <>
            <div className="absolute top-4 left-4 p-3 bg-black/50 border border-white/10 rounded-md backdrop-blur-sm max-w-[300px]">
              <div className="flex items-center gap-2 mb-1">
                <Terminal size={12} className="text-cyan-500" />
                <span className="text-[10px] text-cyan-400 font-mono uppercase tracking-widest font-bold">AI Overseer</span>
              </div>
              <p className="text-xs text-white/90 font-mono leading-relaxed italic">
                "{gameState.narration}"
              </p>
            </div>

            {activePowerUpName && (
                <div className="absolute bottom-12 left-1/2 -translate-x-1/2 px-4 py-2 bg-purple-600/90 text-white font-orbitron text-lg rounded-full border border-purple-400 animate-bounce shadow-[0_0_15px_rgba(168,85,247,0.5)]">
                    {activePowerUpName} ACTIVATED
                </div>
            )}
          </>
        )}
      </div>

      <div className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-6 w-full max-w-4xl">
        <div className="p-4 rounded-lg bg-zinc-900/50 border border-zinc-800 group hover:border-cyan-500/50 transition-colors">
            <h3 className="text-cyan-400 font-orbitron text-sm mb-2 flex items-center gap-2"><Shield size={16} /> NEURAL SHIELD</h3>
            <p className="text-xs text-zinc-500 leading-relaxed">The simulation absorbs one collision error. Visualized as a cyan pulse barrier.</p>
        </div>
        <div className="p-4 rounded-lg bg-zinc-900/50 border border-zinc-800 group hover:border-purple-500/50 transition-colors">
            <h3 className="text-purple-400 font-orbitron text-sm mb-2 flex items-center gap-2"><Clock size={16} /> TIME DILATION</h3>
            <p className="text-xs text-zinc-500 leading-relaxed">Reduces system clock frequency by 50%. Essential for high-density obstacle fields.</p>
        </div>
        <div className="p-4 rounded-lg bg-zinc-900/50 border border-zinc-800 group hover:border-yellow-500/50 transition-colors">
            <h3 className="text-yellow-400 font-orbitron text-sm mb-2 flex items-center gap-2"><Zap size={16} /> MULTI-JUMP</h3>
            <p className="text-xs text-zinc-500 leading-relaxed">Digital thrusters allow secondary lift in mid-simulation. Chain jumps for maximum evasion.</p>
        </div>
      </div>

      <div className="mt-auto py-6 text-[10px] font-mono text-zinc-600 uppercase tracking-[0.2em]">
        Space/Up to Jump • Dynamic Evolution Engine v3.2 • Powered by Gemini AI
      </div>
    </div>
  );
};

export default App;
