import React from 'react';
import type { GameId } from '../types/game';
import { GAMES_CATALOG } from '../types/game';
import { sounds } from '../audio/soundEffects';
import { Play, Users, Sparkles, Award, Zap, HelpCircle } from 'lucide-react';

interface LobbyProps {
  onSelectGame: (game: GameId) => void;
  onOpenRules: (game: GameId) => void;
}

export const Lobby: React.FC<LobbyProps> = ({ onSelectGame, onOpenRules }) => {
  return (
    <div className="lobby-container">
      {/* Hero Section */}
      <section className="lobby-hero">
        <div className="hero-pill">
          <Sparkles size={14} />
          <span>Tabletop & Board Game Hub</span>
        </div>
        <h2 className="hero-title">
          Classic Gaming, <span>Re-Engineered</span>
        </h2>
        <p className="hero-subtitle">
          Jump into seamless multiplayer board games, test your intellect against smart AI bots,
          or experience high-roller casino action with realistic physics and animations.
        </p>
      </section>

      {/* Game Catalog Grid */}
      <div className="games-grid">
        {GAMES_CATALOG.map((game) => (
          <div
            key={game.id}
            className="game-card"
            style={
              {
                '--card-accent': game.accentColor,
                '--card-glow': game.glowColor,
              } as React.CSSProperties
            }
            onClick={() => {
              sounds.playClick();
              onSelectGame(game.id);
            }}
          >
            <div
              className="game-card-banner"
              style={{
                background: `radial-gradient(circle at 50% 50%, ${game.glowColor} 0%, rgba(15, 23, 42, 0.8) 100%)`,
              }}
            >
              <div className="game-card-badge">{game.badge}</div>
              <div className="game-card-icon">{game.icon}</div>
            </div>

            <div className="game-card-body">
              <div
                style={{
                  fontSize: '0.78rem',
                  fontWeight: 700,
                  textTransform: 'uppercase',
                  letterSpacing: '1px',
                  color: game.accentColor,
                  marginBottom: '4px',
                }}
              >
                {game.tagline}
              </div>
              <h3 className="game-card-title">{game.title}</h3>
              <p className="game-card-desc">{game.description}</p>

              {/* Feature Chips */}
              <div
                style={{
                  display: 'flex',
                  gap: '6px',
                  flexWrap: 'wrap',
                  marginBottom: '16px',
                }}
              >
                {game.features.map((feat, i) => (
                  <span
                    key={i}
                    style={{
                      fontSize: '0.72rem',
                      padding: '3px 8px',
                      borderRadius: '6px',
                      background: 'rgba(255, 255, 255, 0.05)',
                      border: '1px solid var(--border-subtle)',
                      color: 'var(--text-muted)',
                      fontWeight: 600,
                    }}
                  >
                    {feat}
                  </span>
                ))}
              </div>

              <div className="game-card-footer">
                <div className="player-tag">
                  <Users size={14} />
                  <span>{game.playersText}</span>
                </div>

                <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                  <button
                    className="icon-btn"
                    title="Rules"
                    style={{ width: '32px', height: '32px' }}
                    onClick={(e) => {
                      e.stopPropagation();
                      sounds.playClick();
                      onOpenRules(game.id);
                    }}
                  >
                    <HelpCircle size={15} />
                  </button>

                  <button
                    className="play-btn-pill"
                    onClick={(e) => {
                      e.stopPropagation();
                      sounds.playClick();
                      onSelectGame(game.id);
                    }}
                  >
                    <Play size={14} fill="#fff" />
                    <span>Play</span>
                  </button>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Feature Showcase Banner */}
      <section
        style={{
          marginTop: '48px',
          padding: '24px 32px',
          background: 'rgba(15, 23, 42, 0.5)',
          border: '1px solid var(--border-subtle)',
          borderRadius: '20px',
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
          gap: '24px',
          alignItems: 'center',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
          <div
            style={{
              width: '46px',
              height: '46px',
              borderRadius: '12px',
              background: 'rgba(6, 182, 212, 0.15)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#38bdf8',
            }}
          >
            <Zap size={22} />
          </div>
          <div>
            <h4 style={{ fontWeight: 700, fontSize: '0.95rem' }}>Instant Play</h4>
            <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
              Zero latency & no installs required
            </p>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
          <div
            style={{
              width: '46px',
              height: '46px',
              borderRadius: '12px',
              background: 'rgba(139, 92, 246, 0.15)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#a855f7',
            }}
          >
            <Sparkles size={22} />
          </div>
          <div>
            <h4 style={{ fontWeight: 700, fontSize: '0.95rem' }}>Web Audio FX</h4>
            <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
              Tactile synthesized acoustic feedback
            </p>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
          <div
            style={{
              width: '46px',
              height: '46px',
              borderRadius: '12px',
              background: 'rgba(16, 185, 129, 0.15)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#34d399',
            }}
          >
            <Award size={22} />
          </div>
          <div>
            <h4 style={{ fontWeight: 700, fontSize: '0.95rem' }}>Smart AI Opponents</h4>
            <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
              Trained bot algorithms & minimax
            </p>
          </div>
        </div>
      </section>
    </div>
  );
};
