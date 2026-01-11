
export enum GameStatus {
  START = 'START',
  PLAYING = 'PLAYING',
  GAMEOVER = 'GAMEOVER'
}

export enum PowerUpType {
  SHIELD = 'SHIELD',
  SLOW_MO = 'SLOW_MO',
  DOUBLE_JUMP = 'DOUBLE_JUMP'
}

export interface GameObject {
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface Dino extends GameObject {
  vy: number;
  isJumping: boolean;
  canDoubleJump: boolean;
  activePowerUp: PowerUpType | null;
  powerUpTimer: number;
}

export interface Obstacle extends GameObject {
  type: 'cactus' | 'bird' | 'cyber-drone';
  speedMultiplier: number;
}

export interface PowerUpItem extends GameObject {
  type: PowerUpType;
}

export interface GameState {
  status: GameStatus;
  score: number;
  highScore: number;
  speed: number;
  lastScoreMilestone: number;
  narration: string;
  isThinking: boolean;
}
