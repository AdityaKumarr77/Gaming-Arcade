export type GameId = 'hub' | 'ttt' | 'ludo' | 'carrom' | 'blackjack';

export interface GameInfo {
  id: GameId;
  title: string;
  tagline: string;
  description: string;
  badge: string;
  icon: string;
  accentColor: string;
  glowColor: string;
  playersText: string;
  features: string[];
}

export const GAMES_CATALOG: GameInfo[] = [
  {
    id: 'ttt',
    title: 'Tic Tac Toe Supreme',
    tagline: 'Neon Cyber Duel',
    description: 'Fast-paced tactical grid battle. Play locally with friends or challenge the unbeatable Minimax AI.',
    badge: 'Classic Remastered',
    icon: '⚡',
    accentColor: '#06b6d4',
    glowColor: 'rgba(6, 182, 212, 0.4)',
    playersText: '1 - 2 Players / AI',
    features: ['3 AI Difficulties', 'Win Streaks', 'Cyber Glow Effects']
  },
  {
    id: 'ludo',
    title: 'Ludo Royale',
    tagline: 'King of the Board',
    description: 'Authentic 15x15 board with 3D rolling dice, animated pawn hops, safe stars, home runs, and smart bots.',
    badge: 'Popular Choice',
    icon: '🎲',
    accentColor: '#ef4444',
    glowColor: 'rgba(239, 68, 68, 0.4)',
    playersText: '2 - 4 Players / Bots',
    features: ['3D Animated Dice', 'Pawn Hop Animation', 'Smart AI Bots', 'Live Combat Feed']
  },
  {
    id: 'carrom',
    title: 'Carrom Championship',
    tagline: 'Precision Striker Physics',
    description: 'Smooth wooden board with drag-to-shoot aiming, trajectory ray preview, realistic puck bounces, and Queen cover rules.',
    badge: 'Physics Powered',
    icon: '🎯',
    accentColor: '#f59e0b',
    glowColor: 'rgba(245, 158, 11, 0.4)',
    playersText: '1 - 2 Players / AI Bot',
    features: ['Real Elastic Collisions', 'Aim Reflection Guide', 'Queen & Foul Rules', 'Tactile Clack Audio']
  },
  {
    id: 'blackjack',
    title: 'VIP Blackjack 21',
    tagline: 'High Roller Casino Table',
    description: 'Green velvet casino lounge. Realistic card flip animations, chip betting, Double Down, Split, and 3:2 payouts.',
    badge: 'Casino VIP',
    icon: '♠️',
    accentColor: '#10b981',
    glowColor: 'rgba(16, 185, 129, 0.4)',
    playersText: '1 Player vs Dealer',
    features: ['Authentic Chips ($5-$500)', 'Double Down & Insurance', 'Card Dealing Physics', 'Bankroll Wallet']
  }
];
