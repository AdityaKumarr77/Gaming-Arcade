import React, { useState } from 'react';
import type { GameId } from '../types/game';
import { sounds } from '../audio/soundEffects';
import { Volume2, VolumeX, HelpCircle, Coins, Gamepad2 } from 'lucide-react';

interface HeaderProps {
  activeGame: GameId;
  onSelectGame: (game: GameId) => void;
  coins: number;
  onOpenRules: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  activeGame,
  onSelectGame,
  coins,
  onOpenRules,
}) => {
  const [soundOn, setSoundOn] = useState(sounds.enabled);

  const handleToggleSound = () => {
    const newState = sounds.toggleSound();
    setSoundOn(newState);
  };

  const navItems: { id: GameId; label: string; icon: string }[] = [
    { id: 'hub', label: 'All Games', icon: '🕹️' },
    { id: 'ttt', label: 'Tic Tac Toe', icon: '⚡' },
    { id: 'ludo', label: 'Ludo', icon: '🎲' },
    { id: 'carrom', label: 'Carrom', icon: '🎯' },
    { id: 'blackjack', label: 'Blackjack', icon: '♠️' },
  ];

  return (
    <header className="app-header">
      <div
        className="logo-section"
        onClick={() => {
          sounds.playClick();
          onSelectGame('hub');
        }}
      >
        <div className="logo-badge">
          <Gamepad2 size={24} />
        </div>
        <div className="logo-text">
          <h1>Arcade Arena</h1>
          <span>Online Tabletop Lounge</span>
        </div>
      </div>

      <nav className="nav-tabs" aria-label="Game Selection">
        {navItems.map((item) => (
          <button
            key={item.id}
            className={`nav-tab-btn ${activeGame === item.id ? 'active' : ''}`}
            onClick={() => {
              sounds.playClick();
              onSelectGame(item.id);
            }}
          >
            <span>{item.icon}</span>
            <span>{item.label}</span>
          </button>
        ))}
      </nav>

      <div className="header-actions">
        <div className="chips-pill" title="Arcade Tokens / Bankroll">
          <Coins size={16} />
          <span>${coins.toLocaleString()}</span>
        </div>

        <button
          className="icon-btn"
          onClick={handleToggleSound}
          title={soundOn ? 'Mute Sounds' : 'Unmute Sounds'}
          aria-label="Toggle Sound"
        >
          {soundOn ? <Volume2 size={18} /> : <VolumeX size={18} />}
        </button>

        <button
          className="icon-btn"
          onClick={() => {
            sounds.playClick();
            onOpenRules();
          }}
          title="Game Rules & How to Play"
          aria-label="View Rules"
        >
          <HelpCircle size={18} />
        </button>
      </div>
    </header>
  );
};
