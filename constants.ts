
export const CANVAS_WIDTH = 800;
export const CANVAS_HEIGHT = 400;
export const GROUND_HEIGHT = 30;
export const GRAVITY = 0.6;
export const JUMP_FORCE = -12;
export const INITIAL_SPEED = 5;
export const MAX_SPEED = 15;
export const SPEED_INCREMENT = 0.001;

export interface PhaseConfig {
  name: string;
  threshold: number;
  colors: {
    bg: string;
    ground: string;
    accent: string;
    player: string;
    obstacle: string;
    secondary: string;
  };
  glitchIntensity: number;
}

export const EVOLUTION_PHASES: PhaseConfig[] = [
  {
    name: "NEON_WAVE",
    threshold: 0,
    colors: {
      bg: '#050505',
      ground: '#111111',
      accent: '#00f2ff',
      player: '#00f2ff',
      obstacle: '#ff0055',
      secondary: '#ff0055'
    },
    glitchIntensity: 0.01
  },
  {
    name: "VIRTUAL_VOID",
    threshold: 500,
    colors: {
      bg: '#0a001a',
      ground: '#1a0033',
      accent: '#bc13fe',
      player: '#bc13fe',
      obstacle: '#00ff41',
      secondary: '#00ff41'
    },
    glitchIntensity: 0.05
  },
  {
    name: "DATA_HAZARD",
    threshold: 1500,
    colors: {
      bg: '#1a0500',
      ground: '#330a00',
      accent: '#ffaa00',
      player: '#ffaa00',
      obstacle: '#ff0000',
      secondary: '#ffffff'
    },
    glitchIntensity: 0.12
  },
  {
    name: "CORE_PROTOCOL",
    threshold: 3000,
    colors: {
      bg: '#000800',
      ground: '#001a00',
      accent: '#00ff00',
      player: '#00ff00',
      obstacle: '#ffffff',
      secondary: '#00ff00'
    },
    glitchIntensity: 0.2
  }
];
