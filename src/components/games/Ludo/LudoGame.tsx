import React, { useState } from 'react';
import confetti from 'canvas-confetti';
import { sounds } from '../../../audio/soundEffects';
import { ChevronLeft, RotateCcw, Bot, User, HelpCircle } from 'lucide-react';
import './Ludo.css';

interface LudoProps {
  onBackToHub: () => void;
  onOpenRules: () => void;
}

type PlayerColor = 'red' | 'green' | 'yellow' | 'blue';

interface PlayerConfig {
  id: number;
  color: PlayerColor;
  name: string;
  isBot: boolean;
  avatar: string;
  hex: string;
  glow: string;
}

const PLAYER_DEFAULTS: PlayerConfig[] = [
  { id: 0, color: 'red', name: 'Player 1', isBot: false, avatar: '🦁', hex: '#d63031', glow: 'rgba(214, 48, 49, 0.6)' },
  { id: 1, color: 'green', name: 'Bot Rex', isBot: true, avatar: '🐊', hex: '#00b894', glow: 'rgba(0, 184, 148, 0.6)' },
  { id: 2, color: 'yellow', name: 'Bot Sol', isBot: true, avatar: '🦊', hex: '#fdcb6e', glow: 'rgba(253, 203, 110, 0.6)' },
  { id: 3, color: 'blue', name: 'Bot Neo', isBot: true, avatar: '🐬', hex: '#0984e3', glow: 'rgba(9, 132, 227, 0.6)' },
];

// Exact 52-cell track coordinates clockwise from Red start
const TRACK_COORDS: [number, number][] = [
  [6, 1],  // 0: Red Start (Safe Star)
  [6, 2],
  [6, 3],
  [6, 4],
  [6, 5],
  [5, 6],
  [4, 6],
  [3, 6],
  [2, 6],  // 8: Safe Star
  [1, 6],
  [0, 6],
  [0, 7],
  [0, 8],
  [1, 8],  // 13: Green Start (Safe Star)
  [2, 8],
  [3, 8],
  [4, 8],
  [5, 8],
  [6, 9],
  [6, 10],
  [6, 11],
  [6, 12], // 21: Safe Star
  [6, 13],
  [6, 14],
  [7, 14],
  [8, 14],
  [8, 13], // 26: Yellow Start (Safe Star)
  [8, 12],
  [8, 11],
  [8, 10],
  [8, 9],
  [9, 8],
  [10, 8],
  [11, 8],
  [12, 8], // 34: Safe Star
  [13, 8],
  [14, 8],
  [14, 7],
  [14, 6],
  [13, 6], // 39: Blue Start (Safe Star)
  [12, 6],
  [11, 6],
  [10, 6],
  [9, 6],
  [8, 5],
  [8, 4],
  [8, 3],
  [8, 2],  // 47: Safe Star
  [8, 1],
  [8, 0],
  [7, 0],
  [6, 0],
];

// Start cell on track for each player:
const START_OFFSETS = [0, 13, 26, 39];

// 8 Official Safe Stars
const SAFE_STAR_INDICES = [0, 8, 13, 21, 26, 34, 39, 47];

// Home run coordinates (5 steps)
const HOME_RUNS: [number, number][][] = [
  // Red Home Run: row 7, cols 1 to 5
  [[7, 1], [7, 2], [7, 3], [7, 4], [7, 5]],
  // Green Home Run: col 7, rows 1 to 5
  [[1, 7], [2, 7], [3, 7], [4, 7], [5, 7]],
  // Yellow Home Run: row 7, cols 13 down to 9
  [[7, 13], [7, 12], [7, 11], [7, 10], [7, 9]],
  // Blue Home Run: col 7, rows 13 down to 9
  [[13, 7], [12, 7], [11, 7], [10, 7], [9, 7]],
];

// 4 Yard Pockets inside each 6x6 Yard
const YARD_POCKET_COORDS: [number, number][][] = [
  // Red (Top-Left)
  [[1, 1], [1, 4], [4, 1], [4, 4]],
  // Green (Top-Right)
  [[1, 10], [1, 13], [4, 10], [4, 13]],
  // Yellow (Bottom-Right)
  [[10, 10], [10, 13], [13, 10], [13, 13]],
  // Blue (Bottom-Left)
  [[10, 1], [10, 4], [13, 1], [13, 4]],
];

export const LudoGame: React.FC<LudoProps> = ({ onBackToHub, onOpenRules }) => {
  const [playerCount, setPlayerCount] = useState<number>(4);
  const [players, setPlayers] = useState<PlayerConfig[]>(PLAYER_DEFAULTS);
  // tokens: 4 players, 4 tokens each. Value: -1 = in yard, 0..50 = on common track, 51..55 = home stretch, 56 = in Home Goal
  const [tokens, setTokens] = useState<number[][]>([
    [-1, -1, -1, -1],
    [-1, -1, -1, -1],
    [-1, -1, -1, -1],
    [-1, -1, -1, -1],
  ]);

  const [currentTurnIdx, setCurrentTurnIdx] = useState<number>(0);
  const [diceValue, setDiceValue] = useState<number | null>(null);
  const [isRolling, setIsRolling] = useState<boolean>(false);
  const [isMovingPawn, setIsMovingPawn] = useState<boolean>(false);
  const [winner, setWinner] = useState<PlayerConfig | null>(null);
  const [announcement, setAnnouncement] = useState<string>('Red to play! Tap the dice to roll.');
  const [consecutiveSixes, setConsecutiveSixes] = useState<number>(0);

  const activePlayers = players.slice(0, playerCount);
  const currentPlayer = activePlayers[currentTurnIdx];

  // Helper: check if a token can move
  const canTokenMove = (pos: number, dice: number): boolean => {
    if (pos === -1) {
      return dice === 6;
    }
    if (pos === 56) return false;
    return pos + dice <= 56;
  };

  const getMovableTokens = (playerIdx: number, dice: number): number[] => {
    return tokens[playerIdx]
      .map((pos, idx) => (canTokenMove(pos, dice) ? idx : -1))
      .filter((idx) => idx !== -1);
  };

  // Roll Dice logic
  const handleRollDice = () => {
    if (isRolling || isMovingPawn || diceValue !== null || winner) return;

    sounds.playDiceRoll();
    setIsRolling(true);
    setAnnouncement(`${currentPlayer.name} is rolling...`);

    let ticks = 0;
    const interval = setInterval(() => {
      setDiceValue(Math.floor(Math.random() * 6) + 1);
      ticks++;
      if (ticks >= 8) {
        clearInterval(interval);
        const finalRoll = Math.floor(Math.random() * 6) + 1;
        setDiceValue(finalRoll);
        setIsRolling(false);
        onDiceRollFinished(currentPlayer.id, finalRoll);
      }
    }, 60);
  };

  const onDiceRollFinished = (playerIdx: number, rolled: number) => {
    // Check 3 consecutive sixes rule
    if (rolled === 6) {
      const nextSixes = consecutiveSixes + 1;
      setConsecutiveSixes(nextSixes);
      if (nextSixes >= 3) {
        sounds.playBust();
        setAnnouncement(`${players[playerIdx].name} rolled three 6s in a row! Turn forfeited.`);
        setConsecutiveSixes(0);
        setTimeout(passTurn, 1000);
        return;
      }
    } else {
      setConsecutiveSixes(0);
    }

    const movable = getMovableTokens(playerIdx, rolled);

    if (movable.length === 0) {
      setAnnouncement(`${players[playerIdx].name} rolled ${rolled} — No legal move!`);
      setTimeout(passTurn, 950);
      return;
    }

    setAnnouncement(
      rolled === 6
        ? `🔥 ${players[playerIdx].name} rolled a 6! Select a pawn.`
        : `${players[playerIdx].name} rolled ${rolled}! Select a pawn to move.`
    );

    // If only 1 move is possible and it's a bot, automatically move it
    if (players[playerIdx].isBot) {
      setTimeout(() => {
        botChooseMove(playerIdx, movable, rolled);
      }, 650);
    }
  };

  // Smart AI decision logic
  const botChooseMove = (playerIdx: number, movable: number[], dice: number) => {
    let bestToken = movable[0];
    let highestScore = -9999;

    for (const tIdx of movable) {
      const pos = tokens[playerIdx][tIdx];
      let score = 0;

      // 1. Exiting yard
      if (pos === -1 && dice === 6) {
        score += 60;
      }

      const destPos = pos === -1 ? 0 : pos + dice;

      // 2. Entering Home Goal
      if (destPos === 56) {
        score += 150;
      }

      // 3. Capturing opponent
      if (destPos <= 50) {
        const destTrack = (START_OFFSETS[playerIdx] + destPos) % 52;
        if (!SAFE_STAR_INDICES.includes(destTrack)) {
          activePlayers.forEach((other) => {
            if (other.id !== playerIdx) {
              tokens[other.id].forEach((oPos) => {
                if (oPos >= 0 && oPos <= 50) {
                  const oTrack = (START_OFFSETS[other.id] + oPos) % 52;
                  if (oTrack === destTrack) {
                    score += 120; // Massive capture bonus!
                  }
                }
              });
            }
          });
        }
      }

      // 4. Moving to safe star
      if (destPos <= 50) {
        const destTrack = (START_OFFSETS[playerIdx] + destPos) % 52;
        if (SAFE_STAR_INDICES.includes(destTrack)) {
          score += 30;
        }
      }

      // 5. General advancement
      score += destPos;

      if (score > highestScore) {
        highestScore = score;
        bestToken = tIdx;
      }
    }

    animateStepHop(playerIdx, bestToken, dice);
  };

  // Step-by-Step Hopping Animation (like real Ludo!)
  const animateStepHop = (playerIdx: number, tokenIdx: number, dice: number) => {
    setIsMovingPawn(true);
    const startPos = tokens[playerIdx][tokenIdx];

    if (startPos === -1) {
      // Exiting Yard: 1 step to starting square 0
      sounds.playTokenMove();
      const nextTokens = tokens.map((arr) => [...arr]);
      nextTokens[playerIdx][tokenIdx] = 0;
      setTokens(nextTokens);

      setTimeout(() => {
        finishPawnMove(playerIdx, tokenIdx, 0, dice);
      }, 250);
      return;
    }

    // Incremental step-by-step hop
    let curStep = startPos;
    const targetPos = startPos + dice;

    const hopInterval = setInterval(() => {
      curStep++;
      sounds.playTokenMove();

      setTokens((prev) => {
        const copy = prev.map((arr) => [...arr]);
        copy[playerIdx][tokenIdx] = curStep;
        return copy;
      });

      if (curStep >= targetPos) {
        clearInterval(hopInterval);
        setTimeout(() => {
          finishPawnMove(playerIdx, tokenIdx, targetPos, dice);
        }, 180);
      }
    }, 130);
  };

  // Finalize move, process captures & extra turns
  const finishPawnMove = (playerIdx: number, tokenIdx: number, endPos: number, dice: number) => {
    setIsMovingPawn(false);
    let capturedEnemy = false;

    // Check capture on common track (0..50)
    if (endPos <= 50) {
      const destTrack = (START_OFFSETS[playerIdx] + endPos) % 52;
      const isSafe = SAFE_STAR_INDICES.includes(destTrack);

      if (!isSafe) {
        setTokens((prev) => {
          const updated = prev.map((arr) => [...arr]);
          activePlayers.forEach((other) => {
            if (other.id !== playerIdx) {
              updated[other.id].forEach((oPos, oIdx) => {
                if (oPos >= 0 && oPos <= 50) {
                  const oTrack = (START_OFFSETS[other.id] + oPos) % 52;
                  if (oTrack === destTrack) {
                    // Knockout capture!
                    sounds.playCapture();
                    updated[other.id][oIdx] = -1; // Send back to yard
                    capturedEnemy = true;
                    setAnnouncement(
                      `💥 ${players[playerIdx].name} knocked out ${other.name}'s pawn!`
                    );
                  }
                }
              });
            }
          });
          return updated;
        });
      }
    }

    // Check win condition (all 4 tokens in Home Goal: 56)
    const playerTokens = tokens[playerIdx];
    const isWinner = playerTokens.every((p, idx) => (idx === tokenIdx ? endPos === 56 : p === 56));

    if (isWinner) {
      sounds.playWinFanfare();
      confetti({ particleCount: 120, spread: 80, origin: { y: 0.6 } });
      setWinner(players[playerIdx]);
      setAnnouncement(`🏆 ${players[playerIdx].name} WINS THE MATCH!`);
      return;
    }

    // Bonus roll rule: if rolled 6, captured enemy, or reached home
    if (dice === 6 || capturedEnemy || endPos === 56) {
      setAnnouncement(`✨ ${players[playerIdx].name} earned a bonus roll!`);
      setDiceValue(null);

      if (players[playerIdx].isBot) {
        setTimeout(handleRollDice, 850);
      }
    } else {
      passTurn();
    }
  };

  const passTurn = () => {
    setDiceValue(null);
    setConsecutiveSixes(0);
    const nextIdx = (currentTurnIdx + 1) % activePlayers.length;
    setCurrentTurnIdx(nextIdx);
    setAnnouncement(`${activePlayers[nextIdx].name}'s turn. Tap dice to roll.`);

    // If next player is bot, trigger roll
    if (activePlayers[nextIdx].isBot && !winner) {
      setTimeout(handleRollDice, 750);
    }
  };

  const handlePawnClick = (playerIdx: number, tokenIdx: number) => {
    if (isMovingPawn || diceValue === null || playerIdx !== currentPlayer.id || currentPlayer.isBot) {
      return;
    }

    const pos = tokens[playerIdx][tokenIdx];
    if (canTokenMove(pos, diceValue)) {
      animateStepHop(playerIdx, tokenIdx, diceValue);
    }
  };

  const resetGame = () => {
    sounds.playClick();
    setTokens([
      [-1, -1, -1, -1],
      [-1, -1, -1, -1],
      [-1, -1, -1, -1],
      [-1, -1, -1, -1],
    ]);
    setCurrentTurnIdx(0);
    setDiceValue(null);
    setIsRolling(false);
    setIsMovingPawn(false);
    setWinner(null);
    setConsecutiveSixes(0);
    setAnnouncement('New game started! Red to play.');
  };

  const togglePlayerBot = (idx: number) => {
    sounds.playClick();
    setPlayers((prev) =>
      prev.map((p, i) => (i === idx ? { ...p, isBot: !p.isBot } : p))
    );
  };

  // Convert token position to [row, col] on 15x15 board
  const getTokenCell = (playerIdx: number, pos: number, tokenIdx: number): [number, number] => {
    if (pos === -1) {
      return YARD_POCKET_COORDS[playerIdx][tokenIdx];
    }
    if (pos <= 50) {
      const globalTrack = (START_OFFSETS[playerIdx] + pos) % 52;
      return TRACK_COORDS[globalTrack];
    }
    if (pos < 56) {
      return HOME_RUNS[playerIdx][pos - 51];
    }
    return [7, 7]; // Center Goal
  };

  // Render 3D Dice Face with exact dots
  const renderDiceFace = (val: number | null) => {
    if (!val) {
      return <span style={{ fontSize: '1.6rem' }}>🎲</span>;
    }

    // Coordinates of pips in 3x3 grid [row, col] (1 to 3)
    const pipCoords: Record<number, [number, number][]> = {
      1: [[2, 2]],
      2: [[1, 1], [3, 3]],
      3: [[1, 1], [2, 2], [3, 3]],
      4: [[1, 1], [1, 3], [3, 1], [3, 3]],
      5: [[1, 1], [1, 3], [2, 2], [3, 1], [3, 3]],
      6: [[1, 1], [1, 3], [2, 1], [2, 3], [3, 1], [3, 3]],
    };

    const activePips = pipCoords[val] || [];

    return (
      <div className="dice-face">
        {[1, 2, 3].map((r) =>
          [1, 2, 3].map((c) => {
            const hasPip = activePips.some(([pr, pc]) => pr === r && pc === c);
            return (
              <div
                key={`${r}-${c}`}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                {hasPip && (
                  <div
                    className="dice-pip"
                    style={{ background: val === 1 ? '#d63031' : '#1e293b' }}
                  />
                )}
              </div>
            );
          })
        )}
      </div>
    );
  };

  // Render the 15x15 Ludo Board Grid
  const renderGridCells = () => {
    const cells = [];
    const movableTokens = diceValue !== null ? getMovableTokens(currentPlayer.id, diceValue) : [];

    for (let r = 0; r < 15; r++) {
      for (let c = 0; c < 15; c++) {
        // Skip corner 6x6 yards and center 3x3 goal (they are overlaid via absolute containers)
        const isRedYard = r < 6 && c < 6;
        const isGreenYard = r < 6 && c > 8;
        const isYellowYard = r > 8 && c > 8;
        const isBlueYard = r > 8 && c < 6;
        const isCenterGoal = r >= 6 && r <= 8 && c >= 6 && c <= 8;

        if (isRedYard || isGreenYard || isYellowYard || isBlueYard || isCenterGoal) {
          cells.push(
            <div
              key={`${r}-${c}`}
              style={{ visibility: 'hidden' }}
              className="ludo-cell"
            />
          );
          continue;
        }

        // Check if track coordinate matches
        const trackIdx = TRACK_COORDS.findIndex(([tr, tc]) => tr === r && tc === c);
        const isSafeStar = trackIdx !== -1 && SAFE_STAR_INDICES.includes(trackIdx);

        // Check home run cells
        const isRedPath = r === 7 && c >= 1 && c <= 5;
        const isGreenPath = c === 7 && r >= 1 && r <= 5;
        const isYellowPath = r === 7 && c >= 9 && c <= 13;
        const isBluePath = c === 7 && r >= 9 && r <= 13;

        // Check start cell arrows
        const isRedStart = r === 6 && c === 1;
        const isGreenStart = r === 1 && c === 8;
        const isYellowStart = r === 8 && c === 13;
        const isBlueStart = r === 13 && c === 6;

        let cellCls = 'ludo-cell';
        if (isRedPath || isRedStart) cellCls += ' red-path';
        else if (isGreenPath || isGreenStart) cellCls += ' green-path';
        else if (isYellowPath || isYellowStart) cellCls += ' yellow-path';
        else if (isBluePath || isBlueStart) cellCls += ' blue-path';

        // Check tokens on this cell
        const tokensOnCell: { playerIdx: number; tokenIdx: number }[] = [];
        activePlayers.forEach((p) => {
          tokens[p.id].forEach((pos, tIdx) => {
            const [tr, tc] = getTokenCell(p.id, pos, tIdx);
            if (tr === r && tc === c) {
              tokensOnCell.push({ playerIdx: p.id, tokenIdx: tIdx });
            }
          });
        });

        cells.push(
          <div key={`${r}-${c}`} className={cellCls}>
            {isSafeStar && <span className="safe-star-badge">★</span>}

            {isRedStart && !tokensOnCell.length && <span className="start-arrow">▶</span>}
            {isGreenStart && !tokensOnCell.length && <span className="start-arrow">▼</span>}
            {isYellowStart && !tokensOnCell.length && <span className="start-arrow">◀</span>}
            {isBlueStart && !tokensOnCell.length && <span className="start-arrow">▲</span>}

            {/* Render Pawns */}
            {tokensOnCell.map(({ playerIdx, tokenIdx }) => {
              const p = players[playerIdx];
              const isMovable =
                playerIdx === currentPlayer.id &&
                !currentPlayer.isBot &&
                movableTokens.includes(tokenIdx);

              return (
                <div
                  key={`${playerIdx}-${tokenIdx}`}
                  className={`ludo-pawn ${p.color} ${isMovable ? 'movable' : ''}`}
                  onClick={() => handlePawnClick(playerIdx, tokenIdx)}
                  title={`${p.name} Token ${tokenIdx + 1}`}
                >
                  {tokensOnCell.length > 1 && (
                    <span className="stack-badge">{tokensOnCell.length}</span>
                  )}
                </div>
              );
            })}
          </div>
        );
      }
    }
    return cells;
  };

  // Render Yard Tokens for a specific corner yard
  const renderYardPockets = (playerIdx: number) => {
    const p = players[playerIdx];
    const movableTokens = diceValue !== null ? getMovableTokens(currentPlayer.id, diceValue) : [];

    return [0, 1, 2, 3].map((tokenIdx) => {
      const pos = tokens[playerIdx][tokenIdx];
      const isStillInYard = pos === -1;
      const isMovable =
        playerIdx === currentPlayer.id &&
        !currentPlayer.isBot &&
        isStillInYard &&
        movableTokens.includes(tokenIdx);

      return (
        <div key={tokenIdx} className={`ludo-yard-pocket ${p.color}`}>
          {isStillInYard && (
            <div
              className={`ludo-pawn ${p.color} ${isMovable ? 'movable' : ''}`}
              onClick={() => handlePawnClick(playerIdx, tokenIdx)}
              title={`${p.name} Token in Yard`}
            />
          )}
        </div>
      );
    });
  };

  return (
    <div className="ludo-arena-wrapper">
      {/* Top Header Bar */}
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

        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <select
            className="select-input"
            value={playerCount}
            onChange={(e) => {
              sounds.playClick();
              setPlayerCount(Number(e.target.value));
              resetGame();
            }}
          >
            <option value={2}>2 Players (Red vs Yellow)</option>
            <option value={3}>3 Players</option>
            <option value={4}>4 Players (Full Arena)</option>
          </select>

          <button className="secondary-btn" onClick={resetGame}>
            <RotateCcw size={16} />
            <span>Reset</span>
          </button>

          <button
            className="icon-btn"
            style={{ width: '36px', height: '36px' }}
            title="Rules"
            onClick={() => {
              sounds.playClick();
              onOpenRules();
            }}
          >
            <HelpCircle size={18} />
          </button>
        </div>
      </div>

      {/* Main Table Felt Container */}
      <div className="ludo-table-felt">
        {/* Match Announcement Banner */}
        <div
          style={{
            maxWidth: '540px',
            margin: '0 auto 16px',
            padding: '10px 20px',
            borderRadius: '999px',
            background: 'rgba(15, 23, 42, 0.85)',
            border: `1px solid ${currentPlayer.hex}`,
            boxShadow: `0 0 16px ${currentPlayer.glow}`,
            textAlign: 'center',
            fontSize: '0.92rem',
            fontWeight: 700,
            color: '#ffffff',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '8px',
          }}
        >
          <span>{announcement}</span>
        </div>

        {/* Central Stage: Board + 4 Corner Player Pods */}
        <div className="ludo-main-layout">
          {/* Top 2 Player Pods (Red & Green) */}
          <div className="ludo-players-grid">
            {/* Red Player Pod (Top-Left) */}
            <div
              className={`ludo-player-pod ${currentPlayer.id === 0 ? 'active-turn' : ''}`}
              style={{
                '--pod-color': players[0].hex,
                '--pod-glow': players[0].glow,
              } as React.CSSProperties}
            >
              <div className="pod-info">
                <div className="pod-avatar">{players[0].avatar}</div>
                <div className="pod-meta">
                  <h4>
                    <span>{players[0].name}</span>
                    <button
                      onClick={() => togglePlayerBot(0)}
                      style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}
                    >
                      {players[0].isBot ? <Bot size={13} /> : <User size={13} />}
                    </button>
                  </h4>
                  <div className="pod-home-progress">
                    {tokens[0].filter((t) => t === 56).length}/4 Home
                  </div>
                </div>
              </div>

              {/* Red Dice Box */}
              <div className="pod-dice-box">
                <button
                  className={`ludo-3d-dice ${isRolling && currentPlayer.id === 0 ? 'rolling' : ''}`}
                  disabled={
                    currentPlayer.id !== 0 ||
                    isRolling ||
                    isMovingPawn ||
                    diceValue !== null ||
                    players[0].isBot ||
                    !!winner
                  }
                  onClick={handleRollDice}
                >
                  {renderDiceFace(currentPlayer.id === 0 ? diceValue : null)}
                </button>
                {currentPlayer.id === 0 && diceValue === null && !players[0].isBot && !winner && (
                  <span className="roll-prompt-badge">ROLL</span>
                )}
              </div>
            </div>

            {/* Green Player Pod (Top-Right) */}
            {playerCount >= 2 && (
              <div
                className={`ludo-player-pod ${currentPlayer.id === 1 ? 'active-turn' : ''}`}
                style={{
                  '--pod-color': players[1].hex,
                  '--pod-glow': players[1].glow,
                } as React.CSSProperties}
              >
                <div className="pod-info">
                  <div className="pod-avatar">{players[1].avatar}</div>
                  <div className="pod-meta">
                    <h4>
                      <span>{players[1].name}</span>
                      <button
                        onClick={() => togglePlayerBot(1)}
                        style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}
                      >
                        {players[1].isBot ? <Bot size={13} /> : <User size={13} />}
                      </button>
                    </h4>
                    <div className="pod-home-progress">
                      {tokens[1].filter((t) => t === 56).length}/4 Home
                    </div>
                  </div>
                </div>

                {/* Green Dice Box */}
                <div className="pod-dice-box">
                  <button
                    className={`ludo-3d-dice ${isRolling && currentPlayer.id === 1 ? 'rolling' : ''}`}
                    disabled={
                      currentPlayer.id !== 1 ||
                      isRolling ||
                      isMovingPawn ||
                      diceValue !== null ||
                      players[1].isBot ||
                      !!winner
                    }
                    onClick={handleRollDice}
                  >
                    {renderDiceFace(currentPlayer.id === 1 ? diceValue : null)}
                  </button>
                  {currentPlayer.id === 1 && diceValue === null && !players[1].isBot && !winner && (
                    <span className="roll-prompt-badge">ROLL</span>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Authentic 15x15 Ludo Board */}
          <div className="ludo-board-container">
            {/* 1. Red Yard (Top-Left 6x6) */}
            <div className="ludo-yard red">
              <div className="ludo-yard-box">{renderYardPockets(0)}</div>
            </div>

            {/* 2. Green Yard (Top-Right 6x6) */}
            <div className="ludo-yard green">
              <div className="ludo-yard-box">{renderYardPockets(1)}</div>
            </div>

            {/* 3. Yellow Yard (Bottom-Right 6x6) */}
            <div className="ludo-yard yellow">
              <div className="ludo-yard-box">{renderYardPockets(2)}</div>
            </div>

            {/* 4. Blue Yard (Bottom-Left 6x6) */}
            <div className="ludo-yard blue">
              <div className="ludo-yard-box">{renderYardPockets(3)}</div>
            </div>

            {/* 5. Center Home Goal Triangle (3x3) */}
            <div className="ludo-center-goal">
              <div className="center-triangle red" />
              <div className="center-triangle green" />
              <div className="center-triangle yellow" />
              <div className="center-triangle blue" />
              <div className="center-home-trophy">🏆</div>
            </div>

            {/* 6. 15x15 Track Cells */}
            {renderGridCells()}
          </div>

          {/* Bottom 2 Player Pods (Blue & Yellow) */}
          <div className="ludo-players-grid">
            {/* Blue Player Pod (Bottom-Left) */}
            {playerCount >= 4 && (
              <div
                className={`ludo-player-pod ${currentPlayer.id === 3 ? 'active-turn' : ''}`}
                style={{
                  '--pod-color': players[3].hex,
                  '--pod-glow': players[3].glow,
                } as React.CSSProperties}
              >
                <div className="pod-info">
                  <div className="pod-avatar">{players[3].avatar}</div>
                  <div className="pod-meta">
                    <h4>
                      <span>{players[3].name}</span>
                      <button
                        onClick={() => togglePlayerBot(3)}
                        style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}
                      >
                        {players[3].isBot ? <Bot size={13} /> : <User size={13} />}
                      </button>
                    </h4>
                    <div className="pod-home-progress">
                      {tokens[3].filter((t) => t === 56).length}/4 Home
                    </div>
                  </div>
                </div>

                {/* Blue Dice Box */}
                <div className="pod-dice-box">
                  <button
                    className={`ludo-3d-dice ${isRolling && currentPlayer.id === 3 ? 'rolling' : ''}`}
                    disabled={
                      currentPlayer.id !== 3 ||
                      isRolling ||
                      isMovingPawn ||
                      diceValue !== null ||
                      players[3].isBot ||
                      !!winner
                    }
                    onClick={handleRollDice}
                  >
                    {renderDiceFace(currentPlayer.id === 3 ? diceValue : null)}
                  </button>
                  {currentPlayer.id === 3 && diceValue === null && !players[3].isBot && !winner && (
                    <span className="roll-prompt-badge">ROLL</span>
                  )}
                </div>
              </div>
            )}

            {/* Yellow Player Pod (Bottom-Right) */}
            {playerCount >= 3 && (
              <div
                className={`ludo-player-pod ${currentPlayer.id === 2 ? 'active-turn' : ''}`}
                style={{
                  '--pod-color': players[2].hex,
                  '--pod-glow': players[2].glow,
                } as React.CSSProperties}
              >
                <div className="pod-info">
                  <div className="pod-avatar">{players[2].avatar}</div>
                  <div className="pod-meta">
                    <h4>
                      <span>{players[2].name}</span>
                      <button
                        onClick={() => togglePlayerBot(2)}
                        style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}
                      >
                        {players[2].isBot ? <Bot size={13} /> : <User size={13} />}
                      </button>
                    </h4>
                    <div className="pod-home-progress">
                      {tokens[2].filter((t) => t === 56).length}/4 Home
                    </div>
                  </div>
                </div>

                {/* Yellow Dice Box */}
                <div className="pod-dice-box">
                  <button
                    className={`ludo-3d-dice ${isRolling && currentPlayer.id === 2 ? 'rolling' : ''}`}
                    disabled={
                      currentPlayer.id !== 2 ||
                      isRolling ||
                      isMovingPawn ||
                      diceValue !== null ||
                      players[2].isBot ||
                      !!winner
                    }
                    onClick={handleRollDice}
                  >
                    {renderDiceFace(currentPlayer.id === 2 ? diceValue : null)}
                  </button>
                  {currentPlayer.id === 2 && diceValue === null && !players[2].isBot && !winner && (
                    <span className="roll-prompt-badge">ROLL</span>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
