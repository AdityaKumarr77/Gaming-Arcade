import React, { useState } from 'react';
import confetti from 'canvas-confetti';
import { sounds } from '../../../audio/soundEffects';
import { ChevronLeft, HelpCircle } from 'lucide-react';

interface BlackjackProps {
  onBackToHub: () => void;
  onOpenRules: () => void;
  coins: number;
  onUpdateCoins: (newAmount: number) => void;
}

type Suit = '♠' | '♥' | '♦' | '♣';
type Rank = 'A' | '2' | '3' | '4' | '5' | '6' | '7' | '8' | '9' | '10' | 'J' | 'Q' | 'K';

interface Card {
  suit: Suit;
  rank: Rank;
  isRed: boolean;
  value: number;
}

const CHIP_VALUES = [5, 25, 50, 100, 500];

export const BlackjackGame: React.FC<BlackjackProps> = ({
  onBackToHub,
  onOpenRules,
  coins,
  onUpdateCoins,
}) => {
  const [deck, setDeck] = useState<Card[]>([]);
  const [playerHand, setPlayerHand] = useState<Card[]>([]);
  const [dealerHand, setDealerHand] = useState<Card[]>([]);
  const [currentBet, setCurrentBet] = useState<number>(25);
  const [lastBet, setLastBet] = useState<number>(25);
  const [gameState, setGameState] = useState<'betting' | 'player_turn' | 'dealer_turn' | 'round_over'>('betting');
  const [message, setMessage] = useState<string>('Place your chips and tap Deal to start.');
  const [isDealerHoleRevealed, setIsDealerHoleRevealed] = useState<boolean>(false);
  const [stats, setStats] = useState<{ wins: number; losses: number; pushes: number }>({
    wins: 0,
    losses: 0,
    pushes: 0,
  });

  // Build and shuffle 6-deck shoe
  const generateDeck = (): Card[] => {
    const suits: Suit[] = ['♠', '♥', '♦', '♣'];
    const ranks: Rank[] = ['A', '2', '3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K'];
    const cards: Card[] = [];

    // 2 decks
    for (let d = 0; d < 2; d++) {
      for (const suit of suits) {
        for (const rank of ranks) {
          let val = 10;
          if (rank === 'A') val = 11;
          else if (!['J', 'Q', 'K', '10'].includes(rank)) val = Number(rank);

          cards.push({
            suit,
            rank,
            isRed: suit === '♥' || suit === '♦',
            value: val,
          });
        }
      }
    }

    // Shuffle
    for (let i = cards.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [cards[i], cards[j]] = [cards[j], cards[i]];
    }
    return cards;
  };

  // Calculate score with dynamic Aces
  const calculateHand = (hand: Card[]): { score: number; isSoft: boolean; isBlackjack: boolean } => {
    let total = 0;
    let aces = 0;

    for (const card of hand) {
      if (card.rank === 'A') {
        aces++;
        total += 11;
      } else {
        total += card.value;
      }
    }

    while (total > 21 && aces > 0) {
      total -= 10;
      aces--;
    }

    const isBlackjack = hand.length === 2 && total === 21;
    return { score: total, isSoft: aces > 0, isBlackjack };
  };

  const addChip = (amount: number) => {
    if (gameState !== 'betting') return;
    if (coins < currentBet + amount) return;

    sounds.playChipBet();
    setCurrentBet((prev) => prev + amount);
  };

  const clearBet = () => {
    if (gameState !== 'betting') return;
    sounds.playClick();
    setCurrentBet(0);
  };

  const startDeal = () => {
    if (currentBet <= 0) {
      setMessage('Please place a wager first.');
      return;
    }
    if (coins < currentBet) {
      setMessage('Insufficient balance to cover wager.');
      return;
    }

    sounds.playCardDeal();
    const newCoins = coins - currentBet;
    onUpdateCoins(newCoins);
    setLastBet(currentBet);

    const newDeck = deck.length > 15 ? [...deck] : generateDeck();
    const p1 = newDeck.pop()!;
    const d1 = newDeck.pop()!;
    const p2 = newDeck.pop()!;
    const d2 = newDeck.pop()!;

    setDeck(newDeck);
    const pHand = [p1, p2];
    const dHand = [d1, d2];
    setPlayerHand(pHand);
    setDealerHand(dHand);
    setIsDealerHoleRevealed(false);

    const pCalc = calculateHand(pHand);
    const dCalc = calculateHand(dHand);

    if (pCalc.isBlackjack) {
      // Natural Blackjack!
      setIsDealerHoleRevealed(true);
      if (dCalc.isBlackjack) {
        // Push
        endRound('Both have Blackjack! Push (Tie).', currentBet, 0);
      } else {
        // Natural 3:2 payout!
        const winAmount = Math.floor(currentBet * 2.5);
        sounds.playWinFanfare();
        confetti({ particleCount: 80, spread: 70, origin: { y: 0.6 } });
        endRound(`Natural Blackjack! Payout $${winAmount}!`, winAmount, 1);
      }
    } else {
      setGameState('player_turn');
      setMessage('Hit or Stand? Double Down available.');
    }
  };

  const handleHit = () => {
    if (gameState !== 'player_turn') return;
    sounds.playCardDeal();

    const newDeck = [...deck];
    const card = newDeck.pop()!;
    setDeck(newDeck);

    const newHand = [...playerHand, card];
    setPlayerHand(newHand);

    const calc = calculateHand(newHand);
    if (calc.score > 21) {
      // Bust
      sounds.playBust();
      setIsDealerHoleRevealed(true);
      endRound(`Bust! Hand value ${calc.score}. Dealer wins.`, 0, -1);
    } else if (calc.score === 21) {
      // Auto stand on 21
      handleStand(newHand);
    }
  };

  const handleDoubleDown = () => {
    if (gameState !== 'player_turn' || playerHand.length !== 2) return;
    if (coins < currentBet) {
      setMessage('Not enough balance to double down.');
      return;
    }

    sounds.playChipBet();
    const newCoins = coins - currentBet;
    onUpdateCoins(newCoins);
    const doubledBet = currentBet * 2;
    setCurrentBet(doubledBet);

    sounds.playCardDeal();
    const newDeck = [...deck];
    const card = newDeck.pop()!;
    setDeck(newDeck);

    const newHand = [...playerHand, card];
    setPlayerHand(newHand);

    const calc = calculateHand(newHand);
    if (calc.score > 21) {
      sounds.playBust();
      setIsDealerHoleRevealed(true);
      endRound(`Bust! Hand value ${calc.score}. Dealer wins.`, 0, -1);
    } else {
      handleStand(newHand, doubledBet);
    }
  };

  const handleStand = (pHand = playerHand, betAmount = currentBet) => {
    if (gameState !== 'player_turn' && gameState !== 'betting') return;
    setGameState('dealer_turn');
    setIsDealerHoleRevealed(true);

    const pCalc = calculateHand(pHand);
    let curDeck = [...deck];
    let curDHand = [...dealerHand];

    const dealerPlay = () => {
      let dCalc = calculateHand(curDHand);

      // Dealer must hit until score >= 17
      if (dCalc.score < 17) {
        setTimeout(() => {
          sounds.playCardDeal();
          const card = curDeck.pop()!;
          curDHand = [...curDHand, card];
          setDealerHand(curDHand);
          setDeck(curDeck);
          dealerPlay();
        }, 550);
      } else {
        // Dealer finished
        if (dCalc.score > 21) {
          sounds.playWinFanfare();
          confetti({ particleCount: 70, spread: 60, origin: { y: 0.6 } });
          endRound(`Dealer busts with ${dCalc.score}! You win $${betAmount * 2}!`, betAmount * 2, 1);
        } else if (pCalc.score > dCalc.score) {
          sounds.playWinFanfare();
          confetti({ particleCount: 70, spread: 60, origin: { y: 0.6 } });
          endRound(`You win! (${pCalc.score} vs ${dCalc.score}) Payout $${betAmount * 2}!`, betAmount * 2, 1);
        } else if (pCalc.score < dCalc.score) {
          sounds.playBust();
          endRound(`Dealer wins with ${dCalc.score} vs your ${pCalc.score}.`, 0, -1);
        } else {
          sounds.playClick();
          endRound(`Push! Both tied at ${pCalc.score}. Bet returned.`, betAmount, 0);
        }
      }
    };

    dealerPlay();
  };

  const endRound = (msg: string, returnAmount: number, result: number) => {
    setGameState('round_over');
    setMessage(msg);

    if (returnAmount > 0) {
      onUpdateCoins(coins + returnAmount);
    }

    if (result > 0) {
      setStats((s) => ({ ...s, wins: s.wins + 1 }));
    } else if (result < 0) {
      setStats((s) => ({ ...s, losses: s.losses + 1 }));
    } else {
      setStats((s) => ({ ...s, pushes: s.pushes + 1 }));
    }
  };

  const resetForNextHand = () => {
    sounds.playClick();
    setPlayerHand([]);
    setDealerHand([]);
    setIsDealerHoleRevealed(false);
    setCurrentBet(lastBet > 0 ? lastBet : 25);
    setGameState('betting');
    setMessage('Place your wager and tap Deal.');
  };

  const pScore = calculateHand(playerHand);
  const dScore = calculateHand(dealerHand);

  return (
    <div style={{ maxWidth: '820px', margin: '0 auto' }}>
      {/* Top Bar */}
      <div className="game-screen-header">
        <button
          className="back-to-hub-btn"
          onClick={() => {
            sounds.playClick();
            onBackToHub();
          }}
        >
          <ChevronLeft size={18} />
          <span>Lobby</span>
        </button>

        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div
            style={{
              padding: '6px 14px',
              borderRadius: '999px',
              background: 'rgba(245, 158, 11, 0.12)',
              border: '1px solid rgba(245, 158, 11, 0.3)',
              color: '#fbbf24',
              fontWeight: 800,
              fontSize: '0.9rem',
            }}
          >
            Bankroll: ${coins.toLocaleString()}
          </div>
          <button className="secondary-btn" onClick={onOpenRules} style={{ padding: '6px 12px', display: 'flex', alignItems: 'center', gap: '5px' }}>
            <HelpCircle size={15} />
            <span>Rules</span>
          </button>
        </div>
      </div>

      {/* Luxury Casino Felt Table */}
      <div
        style={{
          background: 'radial-gradient(ellipse at 50% 30%, #0c4a34 0%, #062e20 65%, #031710 100%)',
          borderRadius: '28px',
          border: '10px solid #2e1e0f',
          boxShadow: '0 20px 60px rgba(0, 0, 0, 0.9), inset 0 0 80px rgba(0, 0, 0, 0.6)',
          padding: '32px 24px',
          color: '#f8fafc',
          position: 'relative',
        }}
      >
        {/* Table Felt Inscription */}
        <div
          style={{
            textAlign: 'center',
            fontSize: '0.75rem',
            fontWeight: 800,
            textTransform: 'uppercase',
            letterSpacing: '2px',
            color: 'rgba(245, 158, 11, 0.45)',
            marginBottom: '20px',
            borderBottom: '1px dashed rgba(245, 158, 11, 0.2)',
            paddingBottom: '8px',
          }}
        >
          ♦ BLACKJACK PAYS 3 TO 2 · DEALER MUST STAND ON 17 ♦
        </div>

        {/* Dealer Area */}
        <div style={{ textAlign: 'center', marginBottom: '28px' }}>
          <div
            style={{
              fontSize: '0.8rem',
              fontWeight: 700,
              color: 'rgba(255, 255, 255, 0.6)',
              marginBottom: '8px',
            }}
          >
            DEALER {dealerHand.length > 0 && isDealerHoleRevealed ? `(${dScore.score})` : ''}
          </div>

          <div
            style={{
              display: 'flex',
              justifyContent: 'center',
              gap: '12px',
              minHeight: '100px',
              alignItems: 'center',
            }}
          >
            {dealerHand.map((card, idx) => {
              const isHoleCard = idx === 1 && !isDealerHoleRevealed;
              return (
                <div
                  key={idx}
                  style={{
                    width: '68px',
                    height: '96px',
                    borderRadius: '8px',
                    background: isHoleCard
                      ? 'repeating-linear-gradient(45deg, #1e293b, #1e293b 8px, #0f172a 8px, #0f172a 16px)'
                      : '#ffffff',
                    border: isHoleCard ? '2px solid #334155' : '1px solid #cbd5e1',
                    boxShadow: '0 6px 14px rgba(0, 0, 0, 0.5)',
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'space-between',
                    padding: '6px',
                    color: isHoleCard ? 'transparent' : card.isRed ? '#dc2626' : '#0f172a',
                    fontWeight: 800,
                    fontSize: '1rem',
                    transform: 'translateY(0)',
                    transition: 'all 0.25s ease',
                  }}
                >
                  {!isHoleCard ? (
                    <>
                      <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                        <span>{card.rank}</span>
                        <span>{card.suit}</span>
                      </div>
                      <div style={{ textAlign: 'center', fontSize: '1.4rem' }}>{card.suit}</div>
                      <div
                        style={{
                          display: 'flex',
                          justifyContent: 'space-between',
                          transform: 'rotate(180deg)',
                        }}
                      >
                        <span>{card.rank}</span>
                        <span>{card.suit}</span>
                      </div>
                    </>
                  ) : (
                    <div
                      style={{
                        height: '100%',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        color: 'rgba(255,255,255,0.2)',
                        fontSize: '1.5rem',
                      }}
                    >
                      ♠
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Center Felt Announcement Pill */}
        <div
          style={{
            maxWidth: '440px',
            margin: '0 auto 28px',
            padding: '10px 18px',
            borderRadius: '999px',
            background: 'rgba(0, 0, 0, 0.45)',
            border: '1px solid rgba(245, 158, 11, 0.3)',
            textAlign: 'center',
            fontSize: '0.9rem',
            fontWeight: 700,
            color: '#fbbf24',
          }}
        >
          {message}
        </div>

        {/* Player Area */}
        <div style={{ textAlign: 'center', marginBottom: '28px' }}>
          <div
            style={{
              display: 'flex',
              justifyContent: 'center',
              gap: '12px',
              minHeight: '100px',
              alignItems: 'center',
              marginBottom: '8px',
            }}
          >
            {playerHand.map((card, idx) => (
              <div
                key={idx}
                style={{
                  width: '68px',
                  height: '96px',
                  borderRadius: '8px',
                  background: '#ffffff',
                  border: '1px solid #cbd5e1',
                  boxShadow: '0 6px 14px rgba(0, 0, 0, 0.5)',
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'space-between',
                  padding: '6px',
                  color: card.isRed ? '#dc2626' : '#0f172a',
                  fontWeight: 800,
                  fontSize: '1rem',
                  animation: 'slideUp 0.2s ease-out',
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span>{card.rank}</span>
                  <span>{card.suit}</span>
                </div>
                <div style={{ textAlign: 'center', fontSize: '1.4rem' }}>{card.suit}</div>
                <div
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    transform: 'rotate(180deg)',
                  }}
                >
                  <span>{card.rank}</span>
                  <span>{card.suit}</span>
                </div>
              </div>
            ))}
          </div>

          <div
            style={{
              fontSize: '0.85rem',
              fontWeight: 800,
              color: 'rgba(255, 255, 255, 0.85)',
            }}
          >
            YOUR HAND {playerHand.length > 0 ? `(${pScore.score})` : ''}
          </div>
        </div>

        {/* Betting & Chip Controls Area */}
        {gameState === 'betting' && (
          <div style={{ textAlign: 'center' }}>
            <div style={{ marginBottom: '16px' }}>
              <span
                style={{
                  fontSize: '0.85rem',
                  color: 'rgba(255, 255, 255, 0.7)',
                  marginRight: '8px',
                }}
              >
                Current Bet:
              </span>
              <span style={{ fontSize: '1.4rem', fontWeight: 900, color: '#fbbf24' }}>
                ${currentBet}
              </span>
            </div>

            {/* Chips Tray */}
            <div
              style={{
                display: 'flex',
                justifyContent: 'center',
                gap: '12px',
                flexWrap: 'wrap',
                marginBottom: '20px',
              }}
            >
              {CHIP_VALUES.map((val) => {
                const colors: Record<number, string> = {
                  5: '#dc2626',
                  25: '#16a34a',
                  50: '#2563eb',
                  100: '#1f2937',
                  500: '#7c3aed',
                };
                return (
                  <button
                    key={val}
                    onClick={() => addChip(val)}
                    style={{
                      width: '54px',
                      height: '54px',
                      borderRadius: '50%',
                      background: `radial-gradient(circle at 35% 35%, ${colors[val]}, #0f172a)`,
                      border: '3px dashed #ffffff',
                      boxShadow: '0 4px 12px rgba(0,0,0,0.6)',
                      color: '#ffffff',
                      fontWeight: 800,
                      fontSize: '0.85rem',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      cursor: 'pointer',
                      transform: 'translateY(0)',
                      transition: 'transform 0.12s',
                    }}
                  >
                    ${val}
                  </button>
                );
              })}
            </div>

            <div style={{ display: 'flex', gap: '12px', justifyContent: 'center' }}>
              <button
                className="secondary-btn"
                onClick={clearBet}
                disabled={currentBet === 0}
                style={{ borderRadius: '999px', padding: '8px 18px' }}
              >
                Clear Bet
              </button>
              <button
                className="primary-btn"
                onClick={startDeal}
                disabled={currentBet === 0}
                style={{
                  borderRadius: '999px',
                  padding: '10px 32px',
                  background: 'linear-gradient(135deg, #f59e0b, #d97706)',
                  boxShadow: '0 4px 16px rgba(245, 158, 11, 0.4)',
                }}
              >
                Deal Hand
              </button>
            </div>
          </div>
        )}

        {/* Player Action Buttons (Hit, Stand, Double) */}
        {gameState === 'player_turn' && (
          <div style={{ display: 'flex', gap: '14px', justifyContent: 'center', flexWrap: 'wrap' }}>
            <button
              className="primary-btn"
              onClick={handleHit}
              style={{
                borderRadius: '999px',
                padding: '10px 28px',
                background: 'linear-gradient(135deg, #10b981, #059669)',
              }}
            >
              Hit
            </button>
            <button
              className="primary-btn"
              onClick={() => handleStand()}
              style={{
                borderRadius: '999px',
                padding: '10px 28px',
                background: 'linear-gradient(135deg, #ef4444, #dc2626)',
              }}
            >
              Stand
            </button>
            {playerHand.length === 2 && coins >= currentBet && (
              <button
                className="primary-btn"
                onClick={handleDoubleDown}
                style={{
                  borderRadius: '999px',
                  padding: '10px 24px',
                  background: 'linear-gradient(135deg, #f59e0b, #b45309)',
                }}
              >
                Double Down (2x)
              </button>
            )}
          </div>
        )}

        {/* Round Over Actions */}
        {gameState === 'round_over' && (
          <div style={{ display: 'flex', justifyContent: 'center', gap: '12px' }}>
            <button
              className="primary-btn"
              onClick={resetForNextHand}
              style={{
                borderRadius: '999px',
                padding: '10px 32px',
                background: 'linear-gradient(135deg, #f59e0b, #d97706)',
              }}
            >
              Next Deal
            </button>
          </div>
        )}
      </div>

      {/* Career Stats Footer */}
      <div
        style={{
          marginTop: '20px',
          display: 'grid',
          gridTemplateColumns: 'repeat(3, 1fr)',
          gap: '12px',
        }}
      >
        <div
          style={{
            padding: '12px',
            borderRadius: '12px',
            background: 'rgba(16, 185, 129, 0.08)',
            border: '1px solid rgba(16, 185, 129, 0.2)',
            textAlign: 'center',
          }}
        >
          <div style={{ fontSize: '0.72rem', color: '#34d399', fontWeight: 700 }}>HANDS WON</div>
          <div style={{ fontSize: '1.3rem', fontWeight: 800 }}>{stats.wins}</div>
        </div>

        <div
          style={{
            padding: '12px',
            borderRadius: '12px',
            background: 'rgba(255, 255, 255, 0.04)',
            border: '1px solid var(--border-subtle)',
            textAlign: 'center',
          }}
        >
          <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', fontWeight: 700 }}>PUSHES</div>
          <div style={{ fontSize: '1.3rem', fontWeight: 800 }}>{stats.pushes}</div>
        </div>

        <div
          style={{
            padding: '12px',
            borderRadius: '12px',
            background: 'rgba(239, 68, 68, 0.08)',
            border: '1px solid rgba(239, 68, 68, 0.2)',
            textAlign: 'center',
          }}
        >
          <div style={{ fontSize: '0.72rem', color: '#f87171', fontWeight: 700 }}>DEALER WINS</div>
          <div style={{ fontSize: '1.3rem', fontWeight: 800 }}>{stats.losses}</div>
        </div>
      </div>
    </div>
  );
};
