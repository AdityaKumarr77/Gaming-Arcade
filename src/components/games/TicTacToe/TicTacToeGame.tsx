import React, { useState, useEffect, useCallback } from 'react';
import confetti from 'canvas-confetti';
import { sounds } from '../../../audio/soundEffects';
import { RotateCcw, Bot, Users, Flame, ChevronLeft, HelpCircle } from 'lucide-react';

interface TicTacToeProps {
  onBackToHub: () => void;
  onOpenRules: () => void;
}

type Player = 'X' | 'O';
type AIDifficulty = 'easy' | 'medium' | 'unbeatable';

export const TicTacToeGame: React.FC<TicTacToeProps> = ({ onBackToHub, onOpenRules }) => {
  const [board, setBoard] = useState<(Player | null)[]>(Array(9).fill(null));
  const [turn, setTurn] = useState<Player>('X');
  const [winner, setWinner] = useState<Player | 'draw' | null>(null);
  const [winningLine, setWinningLine] = useState<number[] | null>(null);
  const [mode, setMode] = useState<'pvp' | 'ai'>('ai');
  const [difficulty, setDifficulty] = useState<AIDifficulty>('unbeatable');
  const [scores, setScores] = useState<{ X: number; O: number; draws: number }>({
    X: 0,
    O: 0,
    draws: 0,
  });
  const [streak, setStreak] = useState<number>(0);
  const [isAiThinking, setIsAiThinking] = useState<boolean>(false);

  const WIN_COMBOS = [
    [0, 1, 2], [3, 4, 5], [6, 7, 8], // Rows
    [0, 3, 6], [1, 4, 7], [2, 5, 8], // Columns
    [0, 4, 8], [2, 4, 6],             // Diagonals
  ];

  const checkWinner = useCallback((b: (Player | null)[]): { winner: Player | 'draw' | null; line: number[] | null } => {
    for (const combo of WIN_COMBOS) {
      const [x, y, z] = combo;
      if (b[x] && b[x] === b[y] && b[x] === b[z]) {
        return { winner: b[x] as Player, line: combo };
      }
    }
    if (b.every((cell) => cell !== null)) {
      return { winner: 'draw', line: null };
    }
    return { winner: null, line: null };
  }, []);

  // Minimax algorithm for unbeatable AI
  const minimax = useCallback((b: (Player | null)[], depth: number, isMaximizing: boolean): number => {
    const res = checkWinner(b);
    if (res.winner === 'O') return 10 - depth;
    if (res.winner === 'X') return depth - 10;
    if (res.winner === 'draw') return 0;

    if (isMaximizing) {
      let maxEval = -Infinity;
      for (let i = 0; i < 9; i++) {
        if (!b[i]) {
          b[i] = 'O';
          const evalScore = minimax(b, depth + 1, false);
          b[i] = null;
          maxEval = Math.max(maxEval, evalScore);
        }
      }
      return maxEval;
    } else {
      let minEval = Infinity;
      for (let i = 0; i < 9; i++) {
        if (!b[i]) {
          b[i] = 'X';
          const evalScore = minimax(b, depth + 1, true);
          b[i] = null;
          minEval = Math.min(minEval, evalScore);
        }
      }
      return minEval;
    }
  }, [checkWinner]);

  const getBestMove = useCallback((b: (Player | null)[], diff: AIDifficulty): number => {
    const available = b.map((val, idx) => (val === null ? idx : null)).filter((val) => val !== null) as number[];
    if (available.length === 0) return -1;

    // Easy: Random move 80% of the time
    if (diff === 'easy' && Math.random() < 0.8) {
      return available[Math.floor(Math.random() * available.length)];
    }

    // Medium: Block obvious wins or win if possible, otherwise random
    if (diff === 'medium') {
      // 1. Can AI win right now?
      for (const idx of available) {
        b[idx] = 'O';
        if (checkWinner(b).winner === 'O') {
          b[idx] = null;
          return idx;
        }
        b[idx] = null;
      }
      // 2. Can Player win right now? Block!
      for (const idx of available) {
        b[idx] = 'X';
        if (checkWinner(b).winner === 'X') {
          b[idx] = null;
          return idx;
        }
        b[idx] = null;
      }
      // 50% minimax / 50% random
      if (Math.random() < 0.5) {
        return available[Math.floor(Math.random() * available.length)];
      }
    }

    // Unbeatable: Pure Minimax
    let bestScore = -Infinity;
    let move = available[0];
    for (const idx of available) {
      b[idx] = 'O';
      const score = minimax(b, 0, false);
      b[idx] = null;
      if (score > bestScore) {
        bestScore = score;
        move = idx;
      }
    }
    return move;
  }, [checkWinner, minimax]);

  const handleCellClick = (index: number) => {
    if (board[index] || winner || isAiThinking) return;

    sounds.playTTTMove(turn);
    const newBoard = [...board];
    newBoard[index] = turn;
    setBoard(newBoard);

    const result = checkWinner(newBoard);
    if (result.winner) {
      handleGameEnd(result.winner, result.line);
    } else {
      const nextTurn = turn === 'X' ? 'O' : 'X';
      setTurn(nextTurn);
    }
  };

  const handleGameEnd = (w: Player | 'draw', line: number[] | null) => {
    setWinner(w);
    setWinningLine(line);

    if (w === 'X') {
      sounds.playWinFanfare();
      confetti({ particleCount: 70, spread: 60, origin: { y: 0.6 } });
      setScores((s) => ({ ...s, X: s.X + 1 }));
      setStreak((st) => st + 1);
    } else if (w === 'O') {
      if (mode === 'ai') {
        sounds.playBust();
      } else {
        sounds.playWinFanfare();
        confetti({ particleCount: 70, spread: 60, origin: { y: 0.6 } });
      }
      setScores((s) => ({ ...s, O: s.O + 1 }));
      setStreak(0);
    } else {
      sounds.playClick();
      setScores((s) => ({ ...s, draws: s.draws + 1 }));
      setStreak(0);
    }
  };

  // AI Turn effect
  useEffect(() => {
    if (mode === 'ai' && turn === 'O' && !winner) {
      setIsAiThinking(true);
      const timer = setTimeout(() => {
        const bestMove = getBestMove(board, difficulty);
        if (bestMove !== -1) {
          sounds.playTTTMove('O');
          const newBoard = [...board];
          newBoard[bestMove] = 'O';
          setBoard(newBoard);

          const result = checkWinner(newBoard);
          if (result.winner) {
            handleGameEnd(result.winner, result.line);
          } else {
            setTurn('X');
          }
        }
        setIsAiThinking(false);
      }, 400);

      return () => clearTimeout(timer);
    }
  }, [mode, turn, winner, board, difficulty, checkWinner, getBestMove]);

  const resetGame = () => {
    sounds.playClick();
    setBoard(Array(9).fill(null));
    setTurn('X');
    setWinner(null);
    setWinningLine(null);
    setIsAiThinking(false);
  };

  return (
    <div style={{ maxWidth: '640px', margin: '0 auto' }}>
      {/* Top Header */}
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

        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <div
            style={{
              display: 'flex',
              background: 'rgba(255, 255, 255, 0.06)',
              borderRadius: '10px',
              padding: '3px',
              border: '1px solid var(--border-subtle)',
            }}
          >
            <button
              onClick={() => {
                sounds.playClick();
                setMode('ai');
                resetGame();
              }}
              style={{
                padding: '6px 12px',
                borderRadius: '8px',
                fontSize: '0.8rem',
                fontWeight: 600,
                display: 'flex',
                alignItems: 'center',
                gap: '5px',
                background: mode === 'ai' ? 'var(--accent-cyan)' : 'transparent',
                color: mode === 'ai' ? '#000' : 'var(--text-muted)',
              }}
            >
              <Bot size={14} /> vs AI
            </button>
            <button
              onClick={() => {
                sounds.playClick();
                setMode('pvp');
                resetGame();
              }}
              style={{
                padding: '6px 12px',
                borderRadius: '8px',
                fontSize: '0.8rem',
                fontWeight: 600,
                display: 'flex',
                alignItems: 'center',
                gap: '5px',
                background: mode === 'pvp' ? 'var(--accent-cyan)' : 'transparent',
                color: mode === 'pvp' ? '#000' : 'var(--text-muted)',
              }}
            >
              <Users size={14} /> 2 Players
            </button>
          </div>

          {mode === 'ai' && (
            <select
              className="select-input"
              value={difficulty}
              onChange={(e) => {
                sounds.playClick();
                setDifficulty(e.target.value as AIDifficulty);
                resetGame();
              }}
              style={{ fontSize: '0.8rem', padding: '6px 10px' }}
            >
              <option value="easy">Novice Bot</option>
              <option value="medium">Tactician</option>
              <option value="unbeatable">God Mode (Minimax)</option>
            </select>
          )}

          <button
            className="icon-btn"
            style={{ width: '32px', height: '32px' }}
            title="Rules"
            onClick={() => {
              sounds.playClick();
              onOpenRules();
            }}
          >
            <HelpCircle size={16} />
          </button>
        </div>
      </div>

      {/* Main Game Card */}
      <div className="glass-panel" style={{ padding: '28px', textAlign: 'center' }}>
        {/* Status / Turn Bar */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            marginBottom: '20px',
            flexWrap: 'wrap',
            gap: '12px',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <div
              style={{
                width: '12px',
                height: '12px',
                borderRadius: '50%',
                background: turn === 'X' ? '#06b6d4' : '#ec4899',
                boxShadow: `0 0 10px ${turn === 'X' ? '#06b6d4' : '#ec4899'}`,
              }}
            />
            <span style={{ fontWeight: 700, fontSize: '1rem' }}>
              {winner
                ? winner === 'draw'
                  ? 'Stalemate! Game Drawn'
                  : `${winner === 'X' ? 'Player X' : mode === 'ai' ? 'AI Bot' : 'Player O'} Takes Victory!`
                : isAiThinking
                ? 'AI is calculating move...'
                : `${turn === 'X' ? 'Player X' : mode === 'ai' ? 'AI' : 'Player O'}'s Turn`}
            </span>
          </div>

          {streak > 0 && (
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '4px',
                color: '#f59e0b',
                fontWeight: 700,
                fontSize: '0.85rem',
              }}
            >
              <Flame size={16} />
              <span>{streak} Win Streak!</span>
            </div>
          )}
        </div>

        {/* 3x3 Cyber Board */}
        <div
          style={{
            position: 'relative',
            width: 'min(100%, 340px)',
            aspectRatio: '1',
            margin: '0 auto 24px',
            display: 'grid',
            gridTemplateColumns: 'repeat(3, 1fr)',
            gap: '10px',
            padding: '10px',
            background: 'rgba(15, 23, 42, 0.8)',
            borderRadius: '20px',
            border: '1px solid rgba(255, 255, 255, 0.1)',
            boxShadow: '0 12px 30px rgba(0, 0, 0, 0.5)',
          }}
        >
          {board.map((cell, idx) => {
            const isWinningCell = winningLine?.includes(idx);
            return (
              <button
                key={idx}
                onClick={() => handleCellClick(idx)}
                disabled={!!cell || !!winner || isAiThinking}
                style={{
                  background: isWinningCell
                    ? 'rgba(16, 185, 129, 0.25)'
                    : 'rgba(30, 41, 59, 0.7)',
                  border: isWinningCell
                    ? '2px solid #10b981'
                    : '1px solid rgba(255, 255, 255, 0.08)',
                  borderRadius: '14px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '2.8rem',
                  fontWeight: 900,
                  fontFamily: 'var(--font-display)',
                  color: cell === 'X' ? '#06b6d4' : '#ec4899',
                  textShadow:
                    cell === 'X'
                      ? '0 0 16px rgba(6, 182, 212, 0.6)'
                      : cell === 'O'
                      ? '0 0 16px rgba(236, 72, 153, 0.6)'
                      : 'none',
                  cursor: !cell && !winner && !isAiThinking ? 'pointer' : 'default',
                  transition: 'all 0.15s ease',
                  transform: isWinningCell ? 'scale(1.04)' : 'scale(1)',
                }}
              >
                {cell}
              </button>
            );
          })}
        </div>

        {/* Scoreboard Bar */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(3, 1fr)',
            gap: '10px',
            marginBottom: '24px',
          }}
        >
          <div
            style={{
              padding: '10px',
              borderRadius: '12px',
              background: 'rgba(6, 182, 212, 0.1)',
              border: '1px solid rgba(6, 182, 212, 0.25)',
            }}
          >
            <div style={{ fontSize: '0.75rem', color: '#38bdf8', fontWeight: 700 }}>PLAYER X</div>
            <div style={{ fontSize: '1.4rem', fontWeight: 800 }}>{scores.X}</div>
          </div>

          <div
            style={{
              padding: '10px',
              borderRadius: '12px',
              background: 'rgba(255, 255, 255, 0.05)',
              border: '1px solid var(--border-subtle)',
            }}
          >
            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 700 }}>DRAWS</div>
            <div style={{ fontSize: '1.4rem', fontWeight: 800 }}>{scores.draws}</div>
          </div>

          <div
            style={{
              padding: '10px',
              borderRadius: '12px',
              background: 'rgba(236, 72, 153, 0.1)',
              border: '1px solid rgba(236, 72, 153, 0.25)',
            }}
          >
            <div style={{ fontSize: '0.75rem', color: '#f472b6', fontWeight: 700 }}>
              {mode === 'ai' ? 'AI BOT' : 'PLAYER O'}
            </div>
            <div style={{ fontSize: '1.4rem', fontWeight: 800 }}>{scores.O}</div>
          </div>
        </div>

        {/* Action Controls */}
        <div style={{ display: 'flex', gap: '12px', justifyContent: 'center' }}>
          <button className="primary-btn" onClick={resetGame}>
            <RotateCcw size={16} />
            <span>Play Again</span>
          </button>
        </div>
      </div>
    </div>
  );
};
