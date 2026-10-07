import React, { useState } from 'react';
import type { GameId } from '../types/game';
import { GAMES_CATALOG } from '../types/game';
import { sounds } from '../audio/soundEffects';
import { X, BookOpen, ShieldCheck, Trophy, Sparkles } from 'lucide-react';

interface RulesModalProps {
  initialTab?: GameId;
  isOpen: boolean;
  onClose: () => void;
}

export const RulesModal: React.FC<RulesModalProps> = ({
  initialTab = 'ttt',
  isOpen,
  onClose,
}) => {
  const [selectedTab, setSelectedTab] = useState<GameId>(
    initialTab === 'hub' ? 'ttt' : initialTab
  );

  if (!isOpen) return null;

  const rulesData: Record<
    string,
    { title: string; subtitle: string; sections: { heading: string; text: string }[] }
  > = {
    ttt: {
      title: 'Tic Tac Toe Supreme',
      subtitle: 'The timeless duel of tactical prediction',
      sections: [
        {
          heading: 'Objective & Board',
          text: 'Align 3 of your marks (X or O) vertically, horizontally, or diagonally on the 3x3 cyber grid before your opponent does.',
        },
        {
          heading: 'AI Difficulty Levels',
          text: 'Choose Novice for relaxed play, Tactician for strategic sparring, or God Mode (Minimax) for a mathematically invincible opponent!',
        },
        {
          heading: 'Winning & Draw',
          text: 'First player to form a continuous trio triggers the neon victory line. If all 9 squares are filled without a trio, the match ends in a stalemate draw.',
        },
      ],
    },
    ludo: {
      title: 'Ludo Royale',
      subtitle: 'The grand cross-and-circle strategic race',
      sections: [
        {
          heading: 'Exiting the Yard',
          text: 'Roll a 6 on the dice to mobilize a token from your starting yard onto your colored starting star on the perimeter track.',
        },
        {
          heading: 'Captures & Bonus Rolls',
          text: 'Landing directly on an opponent’s token captures it, banishing it back to their yard. Capturing a token or rolling a 6 grants you an instant bonus roll!',
        },
        {
          heading: 'Safe Stars & Home Run',
          text: 'Cells marked with a Golden Star are protected safe zones where tokens cannot be captured. Navigate around the circuit and into your home column to reach the center glory triangle.',
        },
      ],
    },
    carrom: {
      title: 'Carrom Championship',
      subtitle: 'Precision tabletop strike and pocket physics',
      sections: [
        {
          heading: 'Board & Striker Placement',
          text: 'Slide your striker anywhere along your baseline ensuring it touches both baseline lines. Aim by dragging the pointer back to determine launch angle and strike power.',
        },
        {
          heading: 'Piece Scoring',
          text: 'Pocket your assigned color (White = 1 pt, Black = 1 pt). The Red Queen is worth 3 points, but requires immediate "coverage" by pocketing another carrom man on your next turn.',
        },
        {
          heading: 'Fouls & Penalties',
          text: 'Sinking the striker into any pocket constitutes a foul: your striker is reset and 1 previously pocketed piece is returned to the center circle as a penalty.',
        },
      ],
    },
    blackjack: {
      title: 'VIP Blackjack 21',
      subtitle: 'Beat the dealer without busting over 21',
      sections: [
        {
          heading: 'Card Values',
          text: 'Numbered cards count as their face value. Face cards (J, Q, K) count as 10. Aces count flexibly as either 1 or 11 depending on which favors your hand.',
        },
        {
          heading: 'Dealer Rules',
          text: 'The dealer must hit on any total under 17 and must stand on 17 or higher. If the dealer busts (exceeds 21), all remaining active players win.',
        },
        {
          heading: 'Actions & Payouts',
          text: 'Hit (take card), Stand (keep hand), Double Down (double your wager for exactly 1 more card). Blackjack (an Ace + 10-value card on first deal) pays out at 3 to 2!',
        },
      ],
    },
  };

  const currentRules = rulesData[selectedTab] || rulesData['ttt'];

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div
        className="modal-content"
        onClick={(e) => e.stopPropagation()}
        style={{ width: 'min(100%, 620px)' }}
      >
        <div className="modal-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <BookOpen style={{ color: 'var(--accent-cyan)' }} size={24} />
            <h2 className="modal-title">How To Play & Rules</h2>
          </div>
          <button
            className="icon-btn"
            onClick={() => {
              sounds.playClick();
              onClose();
            }}
          >
            <X size={20} />
          </button>
        </div>

        {/* Game Tab Selector */}
        <div
          style={{
            display: 'flex',
            gap: '8px',
            marginBottom: '20px',
            overflowX: 'auto',
            paddingBottom: '4px',
          }}
        >
          {GAMES_CATALOG.map((g) => (
            <button
              key={g.id}
              onClick={() => {
                sounds.playClick();
                setSelectedTab(g.id);
              }}
              style={{
                padding: '8px 14px',
                borderRadius: '10px',
                fontSize: '0.85rem',
                fontWeight: 700,
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                background:
                  selectedTab === g.id
                    ? 'linear-gradient(135deg, #06b6d4, #3b82f6)'
                    : 'rgba(255, 255, 255, 0.05)',
                color: selectedTab === g.id ? '#fff' : 'var(--text-muted)',
                border: '1px solid var(--border-subtle)',
                whiteSpace: 'nowrap',
              }}
            >
              <span>{g.icon}</span>
              <span>{g.title.split(' ')[0]}</span>
            </button>
          ))}
        </div>

        {/* Content */}
        <div style={{ marginBottom: '24px' }}>
          <h3
            style={{
              fontFamily: 'var(--font-display)',
              fontSize: '1.25rem',
              color: '#fff',
              marginBottom: '4px',
            }}
          >
            {currentRules.title}
          </h3>
          <p
            style={{
              fontSize: '0.88rem',
              color: 'var(--accent-cyan)',
              marginBottom: '16px',
            }}
          >
            {currentRules.subtitle}
          </p>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
            {currentRules.sections.map((sec, idx) => (
              <div
                key={idx}
                style={{
                  background: 'rgba(255, 255, 255, 0.03)',
                  border: '1px solid var(--border-subtle)',
                  borderRadius: '12px',
                  padding: '14px 16px',
                }}
              >
                <h4
                  style={{
                    fontSize: '0.95rem',
                    fontWeight: 700,
                    color: '#f1f5f9',
                    marginBottom: '4px',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                  }}
                >
                  {idx === 0 ? (
                    <Trophy size={16} color="#f59e0b" />
                  ) : idx === 1 ? (
                    <Sparkles size={16} color="#06b6d4" />
                  ) : (
                    <ShieldCheck size={16} color="#10b981" />
                  )}
                  {sec.heading}
                </h4>
                <p
                  style={{
                    fontSize: '0.85rem',
                    color: 'var(--text-muted)',
                    lineHeight: '1.45',
                  }}
                >
                  {sec.text}
                </p>
              </div>
            ))}
          </div>
        </div>

        <button
          className="primary-btn"
          style={{ width: '100%', justifyContent: 'center' }}
          onClick={() => {
            sounds.playClick();
            onClose();
          }}
        >
          Got It, Let's Play!
        </button>
      </div>
    </div>
  );
};
