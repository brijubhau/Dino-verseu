
import React, { useEffect, useRef, useCallback, useState } from 'react';
import { 
  CANVAS_WIDTH, 
  CANVAS_HEIGHT, 
  GROUND_HEIGHT, 
  GRAVITY, 
  JUMP_FORCE, 
  INITIAL_SPEED, 
  SPEED_INCREMENT,
  MAX_SPEED,
  EVOLUTION_PHASES,
  PhaseConfig
} from '../constants';
import { GameStatus, Dino, Obstacle, PowerUpItem, PowerUpType } from '../types';
import { audioService } from '../services/audioService';

interface DinoCanvasProps {
  status: GameStatus;
  onGameOver: (score: number) => void;
  onScoreUpdate: (score: number) => void;
  onPowerUpCollected: (type: PowerUpType) => void;
  onPhaseChange?: (phaseName: string) => void;
}

const DinoCanvas: React.FC<DinoCanvasProps> = ({ 
  status, 
  onGameOver, 
  onScoreUpdate,
  onPowerUpCollected,
  onPhaseChange
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const requestRef = useRef<number>();
  const [currentPhase, setCurrentPhase] = useState<PhaseConfig>(EVOLUTION_PHASES[0]);
  
  const dinoRef = useRef<Dino>({
    x: 50,
    y: CANVAS_HEIGHT - GROUND_HEIGHT - 44,
    width: 44,
    height: 44,
    vy: 0,
    isJumping: false,
    canDoubleJump: false,
    activePowerUp: null,
    powerUpTimer: 0
  });

  const obstaclesRef = useRef<Obstacle[]>([]);
  const powerUpsRef = useRef<PowerUpItem[]>([]);
  const scoreRef = useRef(0);
  const speedRef = useRef(INITIAL_SPEED);
  const frameCountRef = useRef(0);
  const bgOffsetRef = useRef(0);

  const resetGame = useCallback(() => {
    dinoRef.current = {
      x: 50,
      y: CANVAS_HEIGHT - GROUND_HEIGHT - 44,
      width: 44,
      height: 44,
      vy: 0,
      isJumping: false,
      canDoubleJump: false,
      activePowerUp: null,
      powerUpTimer: 0
    };
    obstaclesRef.current = [];
    powerUpsRef.current = [];
    scoreRef.current = 0;
    speedRef.current = INITIAL_SPEED;
    frameCountRef.current = 0;
    setCurrentPhase(EVOLUTION_PHASES[0]);
  }, []);

  const jump = useCallback(() => {
    const dino = dinoRef.current;
    if (!dino.isJumping) {
      dino.vy = JUMP_FORCE;
      dino.isJumping = true;
      dino.canDoubleJump = dino.activePowerUp === PowerUpType.DOUBLE_JUMP;
      audioService.playJump();
    } else if (dino.canDoubleJump) {
      dino.vy = JUMP_FORCE * 0.85;
      dino.canDoubleJump = false;
      audioService.playJump();
    }
  }, []);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.code === 'Space' || e.code === 'ArrowUp') {
        if (status === GameStatus.PLAYING) jump();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [status, jump]);

  const update = () => {
    if (status !== GameStatus.PLAYING) return;

    const dino = dinoRef.current;
    frameCountRef.current++;

    // Phase detection
    const nextPhase = [...EVOLUTION_PHASES].reverse().find(p => scoreRef.current >= p.threshold);
    if (nextPhase && nextPhase.name !== currentPhase.name) {
      setCurrentPhase(nextPhase);
      onPhaseChange?.(nextPhase.name);
    }

    dino.vy += GRAVITY;
    dino.y += dino.vy;

    const groundY = CANVAS_HEIGHT - GROUND_HEIGHT - dino.height;
    if (dino.y > groundY) {
      dino.y = groundY;
      dino.vy = 0;
      dino.isJumping = false;
    }

    if (dino.powerUpTimer > 0) {
      dino.powerUpTimer--;
      if (dino.powerUpTimer === 0) {
        dino.activePowerUp = null;
      }
    }

    speedRef.current = Math.min(MAX_SPEED, speedRef.current + SPEED_INCREMENT);
    const effectiveSpeed = dino.activePowerUp === PowerUpType.SLOW_MO 
      ? speedRef.current * 0.5 
      : speedRef.current;

    bgOffsetRef.current = (bgOffsetRef.current + effectiveSpeed * 0.5) % CANVAS_WIDTH;

    if (frameCountRef.current % Math.floor(100 / (effectiveSpeed / 5)) === 0) {
      const type = Math.random() > 0.8 ? 'bird' : 'cactus';
      obstaclesRef.current.push({
        x: CANVAS_WIDTH,
        y: type === 'bird' ? CANVAS_HEIGHT - GROUND_HEIGHT - 90 : CANVAS_HEIGHT - GROUND_HEIGHT - 45,
        width: type === 'bird' ? 46 : 32,
        height: type === 'bird' ? 45 : 45,
        type: type,
        speedMultiplier: 1
      });
    }

    if (frameCountRef.current % 800 === 0) {
      const types = [PowerUpType.SHIELD, PowerUpType.SLOW_MO, PowerUpType.DOUBLE_JUMP];
      powerUpsRef.current.push({
        x: CANVAS_WIDTH,
        y: CANVAS_HEIGHT - GROUND_HEIGHT - 70,
        width: 25,
        height: 25,
        type: types[Math.floor(Math.random() * types.length)]
      });
    }

    obstaclesRef.current.forEach(obs => { obs.x -= effectiveSpeed; });
    powerUpsRef.current.forEach(p => { p.x -= effectiveSpeed; });

    obstaclesRef.current = obstaclesRef.current.filter(obs => obs.x + obs.width > 0);
    powerUpsRef.current = powerUpsRef.current.filter(p => p.x + p.width > 0);

    const checkCollision = (a: any, b: any) => {
      const padding = 8;
      return a.x + padding < b.x + b.width - padding &&
             a.x + a.width - padding > b.x + padding &&
             a.y + padding < b.y + b.height - padding &&
             a.y + a.height - padding > b.y + padding;
    };

    obstaclesRef.current.forEach(obs => {
      if (checkCollision(dino, obs)) {
        if (dino.activePowerUp === PowerUpType.SHIELD) {
          dino.activePowerUp = null;
          dino.powerUpTimer = 0;
          obstaclesRef.current = obstaclesRef.current.filter(o => o !== obs);
          audioService.playPowerUp();
        } else {
          audioService.playCollision();
          onGameOver(Math.floor(scoreRef.current));
        }
      }
    });

    powerUpsRef.current.forEach(p => {
      if (checkCollision(dino, p)) {
        dino.activePowerUp = p.type;
        dino.powerUpTimer = 300; 
        audioService.playPowerUp();
        onPowerUpCollected(p.type);
        powerUpsRef.current = powerUpsRef.current.filter(item => item !== p);
      }
    });

    scoreRef.current += 0.1;
    onScoreUpdate(Math.floor(scoreRef.current));
  };

  const drawBackground = (ctx: CanvasRenderingContext2D, frame: number) => {
    ctx.fillStyle = currentPhase.colors.bg;
    ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

    // Parallax Grid
    ctx.strokeStyle = `${currentPhase.colors.accent}22`;
    ctx.lineWidth = 1;
    const gridSpacing = 40;
    const scrollX = bgOffsetRef.current * 0.3;

    // Vertical lines
    for (let x = -gridSpacing; x < CANVAS_WIDTH + gridSpacing; x += gridSpacing) {
      ctx.beginPath();
      ctx.moveTo(x - scrollX % gridSpacing, 0);
      ctx.lineTo(x - scrollX % gridSpacing, CANVAS_HEIGHT);
      ctx.stroke();
    }

    // Horizontal lines with perspective
    for (let y = 0; y < CANVAS_HEIGHT; y += gridSpacing) {
      const alpha = (y / CANVAS_HEIGHT) * 0.1;
      ctx.strokeStyle = `${currentPhase.colors.accent}${Math.floor(alpha * 255).toString(16).padStart(2, '0')}`;
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(CANVAS_WIDTH, y);
      ctx.stroke();
    }

    // Floating digital "dust"
    ctx.fillStyle = currentPhase.colors.accent;
    for(let i=0; i<10; i++) {
        const x = (Math.sin(frame * 0.001 + i) * CANVAS_WIDTH + CANVAS_WIDTH) % CANVAS_WIDTH;
        const y = (Math.cos(frame * 0.002 + i) * CANVAS_HEIGHT + CANVAS_HEIGHT) % CANVAS_HEIGHT;
        ctx.globalAlpha = 0.2;
        ctx.fillRect(x, y, 2, 2);
    }
    ctx.globalAlpha = 1.0;
  };

  const drawDino = (ctx: CanvasRenderingContext2D, dino: Dino, frame: number) => {
    ctx.save();
    const { x, y, width, height } = dino;
    
    if (dino.activePowerUp === PowerUpType.SHIELD) {
      ctx.shadowBlur = 15;
      ctx.shadowColor = currentPhase.colors.accent;
      ctx.strokeStyle = currentPhase.colors.accent;
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(x + width/2, y + height/2, width/2 + 10, 0, Math.PI * 2);
      ctx.stroke();
    }

    ctx.fillStyle = currentPhase.colors.player;
    ctx.shadowBlur = 10;
    ctx.shadowColor = currentPhase.colors.player;

    // Body
    ctx.fillRect(x + 10, y + 10, 24, 24);
    
    // Tail
    const tailWave = Math.sin(frame * 0.1) * 3;
    ctx.beginPath();
    ctx.moveTo(x + 10, y + 15);
    ctx.lineTo(x, y + 25 + tailWave);
    ctx.lineTo(x + 10, y + 30);
    ctx.fill();

    // Head
    ctx.fillRect(x + 28, y, 16, 12);
    ctx.fillRect(x + 38, y + 10, 6, 4); 

    // Eye
    ctx.fillStyle = '#000';
    ctx.fillRect(x + 32, y + 3, 3, 3);

    // Legs
    ctx.fillStyle = currentPhase.colors.player;
    const legOffset = Math.sin(frame * 0.2) * 8;
    if (dino.isJumping) {
      ctx.fillRect(x + 12, y + 34, 4, 10);
      ctx.fillRect(x + 24, y + 34, 4, 10);
    } else {
      ctx.fillRect(x + 12, y + 34, 4, 10 + legOffset);
      ctx.fillRect(x + 24, y + 34, 4, 10 - legOffset);
    }

    ctx.restore();
  };

  const drawCactus = (ctx: CanvasRenderingContext2D, obs: Obstacle) => {
    ctx.save();
    ctx.fillStyle = currentPhase.colors.obstacle;
    ctx.shadowBlur = 12;
    ctx.shadowColor = currentPhase.colors.obstacle;

    const { x, y, width, height } = obs;
    ctx.fillRect(x + width * 0.35, y, width * 0.3, height);
    ctx.fillRect(x, y + height * 0.3, width * 0.4, height * 0.15);
    ctx.fillRect(x, y + height * 0.1, width * 0.15, height * 0.3);
    ctx.fillRect(x + width * 0.6, y + height * 0.5, width * 0.4, height * 0.15);
    ctx.fillRect(x + width * 0.85, y + height * 0.3, width * 0.15, height * 0.3);

    // Add tech detailing to obstacles
    ctx.fillStyle = '#ffffff';
    ctx.globalAlpha = 0.3;
    ctx.fillRect(x + width * 0.4, y + 10, 2, 20);
    ctx.restore();
  };

  const drawBird = (ctx: CanvasRenderingContext2D, obs: Obstacle, frame: number) => {
    ctx.save();
    ctx.fillStyle = currentPhase.colors.obstacle;
    ctx.shadowBlur = 12;
    ctx.shadowColor = currentPhase.colors.obstacle;

    const { x, y, width, height } = obs;
    const hover = Math.sin(frame * 0.15) * 5;
    const flap = Math.sin(frame * 0.3) * 12;

    ctx.fillRect(x + 10, y + hover + 10, 20, 10);
    ctx.beginPath();
    ctx.moveTo(x + 10, y + hover + 10);
    ctx.lineTo(x, y + hover + 15);
    ctx.lineTo(x + 10, y + hover + 20);
    ctx.fill();

    ctx.beginPath();
    ctx.moveTo(x + 20, y + hover + 10);
    ctx.lineTo(x + 25, y + hover - 5 + flap);
    ctx.lineTo(x + 30, y + hover + 10);
    ctx.fill();
    ctx.restore();
  };

  const drawGlitchEffect = (ctx: CanvasRenderingContext2D, frame: number) => {
      if (Math.random() < currentPhase.glitchIntensity) {
          ctx.save();
          const glitchY = Math.random() * CANVAS_HEIGHT;
          const glitchH = Math.random() * 20;
          ctx.fillStyle = `${currentPhase.colors.secondary}44`;
          ctx.fillRect(0, glitchY, CANVAS_WIDTH, glitchH);
          ctx.restore();
      }
  };

  const draw = useCallback((ctx: CanvasRenderingContext2D) => {
    const frame = frameCountRef.current;
    
    // 1. BG
    drawBackground(ctx, frame);
    
    // 2. Glitch underneath
    drawGlitchEffect(ctx, frame);

    // 3. Ground
    ctx.fillStyle = currentPhase.colors.ground;
    ctx.fillRect(0, CANVAS_HEIGHT - GROUND_HEIGHT, CANVAS_WIDTH, GROUND_HEIGHT);
    
    ctx.strokeStyle = currentPhase.colors.accent;
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(0, CANVAS_HEIGHT - GROUND_HEIGHT);
    ctx.lineTo(CANVAS_WIDTH, CANVAS_HEIGHT - GROUND_HEIGHT);
    ctx.stroke();

    const pulseSpeed = speedRef.current * 2;
    const spacing = 150;
    ctx.fillStyle = `${currentPhase.colors.accent}44`;
    for (let i = 0; i < CANVAS_WIDTH + spacing; i += spacing) {
      const px = (i - (frame * pulseSpeed) % spacing);
      ctx.fillRect(px, CANVAS_HEIGHT - GROUND_HEIGHT + 4, 40, 2);
    }

    // 4. Game Objects
    drawDino(ctx, dinoRef.current, frame);
    obstaclesRef.current.forEach(obs => {
      if (obs.type === 'bird') drawBird(ctx, obs, frame);
      else drawCactus(ctx, obs);
    });

    powerUpsRef.current.forEach(p => {
      ctx.save();
      ctx.fillStyle = '#bc13fe';
      ctx.shadowBlur = 15;
      ctx.shadowColor = '#bc13fe';
      const pulse = Math.sin(frame * 0.1) * 3;
      ctx.beginPath();
      ctx.arc(p.x + p.width/2, p.y + p.height/2, p.width/2 + pulse, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#fff';
      ctx.font = 'bold 12px Orbitron';
      ctx.textAlign = 'center';
      const label = p.type === PowerUpType.SHIELD ? 'S' : p.type === PowerUpType.SLOW_MO ? 'T' : 'J';
      ctx.fillText(label, p.x + p.width/2, p.y + p.height/2 + 4);
      ctx.restore();
    });
  }, [currentPhase]);

  const animate = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    update();
    draw(ctx);
    requestRef.current = requestAnimationFrame(animate);
  }, [status, draw]);

  useEffect(() => {
    if (status === GameStatus.START) {
      resetGame();
    }
  }, [status, resetGame]);

  useEffect(() => {
    requestRef.current = requestAnimationFrame(animate);
    return () => {
      if (requestRef.current) cancelAnimationFrame(requestRef.current);
    };
  }, [animate]);

  return (
    <div className="relative w-full h-full flex items-center justify-center bg-black overflow-hidden border-4 border-cyan-900 rounded-xl shadow-2xl shadow-cyan-500/20">
      <canvas
        ref={canvasRef}
        width={CANVAS_WIDTH}
        height={CANVAS_HEIGHT}
        className="w-full h-auto max-w-[800px]"
        onMouseDown={() => status === GameStatus.PLAYING && jump()}
        onTouchStart={() => status === GameStatus.PLAYING && jump()}
      />
      
      {/* Dynamic Overlay for Phase Transitions */}
      <div className={`absolute inset-0 pointer-events-none transition-opacity duration-1000 bg-[${currentPhase.colors.accent}]/5`} />
    </div>
  );
};

export default DinoCanvas;
