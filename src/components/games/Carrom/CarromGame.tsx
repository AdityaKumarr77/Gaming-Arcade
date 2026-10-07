import React, { useRef, useEffect, useState, useCallback } from 'react';
import confetti from 'canvas-confetti';
import { sounds } from '../../../audio/soundEffects';
import { ChevronLeft, RotateCcw, Bot, Users, Crosshair, HelpCircle } from 'lucide-react';

interface CarromProps {
  onBackToHub: () => void;
  onOpenRules: () => void;
}

type PieceType = 'w' | 'b' | 'q' | 's';

interface Piece {
  id: number;
  x: number;
  y: number;
  vx: number;
  vy: number;
  radius: number;
  type: PieceType;
  color: string;
  isDead?: boolean;
}

const BOARD_SIZE = 500;
const POCKET_RADIUS = 26;
const POCKETS: [number, number][] = [
  [30, 30],
  [470, 30],
  [30, 470],
  [470, 470],
];

export const CarromGame: React.FC<CarromProps> = ({ onBackToHub, onOpenRules }) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  const [mode, setMode] = useState<'pvp' | 'ai'>('ai');
  const [turn, setTurn] = useState<'white' | 'black'>('white');
  const [scores, setScores] = useState<{ white: number; black: number }>({ white: 0, black: 0 });
  const [strikerX, setStrikerX] = useState<number>(250);
  const [isAiming, setIsAiming] = useState<boolean>(false);
  const [dragStart, setDragStart] = useState<{ x: number; y: number } | null>(null);
  const [dragCurrent, setDragCurrent] = useState<{ x: number; y: number } | null>(null);
  const [isMoving, setIsMoving] = useState<boolean>(false);
  const [winner, setWinner] = useState<string | null>(null);
  const [message, setMessage] = useState<string>(
    "White's Turn · Position striker, drag to aim & shoot!"
  );

  // Game state stored in refs for the 60fps canvas loop
  const piecesRef = useRef<Piece[]>([]);
  const strikerRef = useRef<Piece>({
    id: 0,
    x: 250,
    y: 415,
    vx: 0,
    vy: 0,
    radius: 17,
    type: 's',
    color: '#06b6d4',
  });
  const turnRef = useRef<'white' | 'black'>('white');
  const scoresRef = useRef<{ white: number; black: number }>({ white: 0, black: 0 });
  const pocketedThisTurnRef = useRef<PieceType[]>([]);
  const modeRef = useRef<'pvp' | 'ai'>('ai');
  const isMovingRef = useRef<boolean>(false);

  turnRef.current = turn;
  scoresRef.current = scores;
  modeRef.current = mode;

  // Initialize board pieces
  const initBoard = useCallback(() => {
    const list: Piece[] = [];
    let idCounter = 1;

    // Center Queen
    list.push({
      id: idCounter++,
      x: 250,
      y: 250,
      vx: 0,
      vy: 0,
      radius: 13,
      type: 'q',
      color: '#ef4444',
    });

    // Inner circle (6 pieces: alternating 3 white, 3 black)
    const r1 = 30;
    for (let i = 0; i < 6; i++) {
      const angle = (i / 6) * Math.PI * 2;
      const type: PieceType = i % 2 === 0 ? 'w' : 'b';
      list.push({
        id: idCounter++,
        x: 250 + r1 * Math.cos(angle),
        y: 250 + r1 * Math.sin(angle),
        vx: 0,
        vy: 0,
        radius: 13,
        type,
        color: type === 'w' ? '#f8fafc' : '#1e293b',
      });
    }

    // Outer circle (12 pieces: alternating)
    const r2 = 60;
    for (let i = 0; i < 12; i++) {
      const angle = (i / 12) * Math.PI * 2;
      const type: PieceType = i % 2 === 0 ? 'b' : 'w';
      list.push({
        id: idCounter++,
        x: 250 + r2 * Math.cos(angle),
        y: 250 + r2 * Math.sin(angle),
        vx: 0,
        vy: 0,
        radius: 13,
        type,
        color: type === 'w' ? '#f8fafc' : '#1e293b',
      });
    }

    piecesRef.current = list;
    resetStriker('white', 250);
    setScores({ white: 0, black: 0 });
    setTurn('white');
    setWinner(null);
    setMessage("White's Turn · Position striker, drag to aim & shoot!");
  }, []);

  const resetStriker = (currentTurn: 'white' | 'black', xPos: number) => {
    const yPos = currentTurn === 'white' ? 415 : 85;
    strikerRef.current = {
      id: 0,
      x: xPos,
      y: yPos,
      vx: 0,
      vy: 0,
      radius: 17,
      type: 's',
      color: currentTurn === 'white' ? '#06b6d4' : '#f59e0b',
      isDead: false,
    };
    isMovingRef.current = false;
    setIsMoving(false);
    pocketedThisTurnRef.current = [];
  };

  // Check end of turn
  const handleTurnEnd = useCallback(() => {
    const pocketed = pocketedThisTurnRef.current;
    const currentTurn = turnRef.current;
    let keepTurn = false;

    // Check fouls (striker sunk)
    if (strikerRef.current.isDead) {
      sounds.playBust();
      setScores((s) => ({
        ...s,
        [currentTurn]: Math.max(0, s[currentTurn] - 1),
      }));
      setMessage(`Foul! Striker sunk! -1 pt penalty.`);
      keepTurn = false;
    } else {
      // Score pocketed pieces
      pocketed.forEach((type) => {
        if (type === 'q') {
          sounds.playWinFanfare();
          setScores((s) => ({ ...s, [currentTurn]: s[currentTurn] + 3 }));
          keepTurn = true;
          setMessage(`${currentTurn === 'white' ? 'White' : 'Black'} pocketed Queen! (+3 pts)`);
        } else if (
          (type === 'w' && currentTurn === 'white') ||
          (type === 'b' && currentTurn === 'black')
        ) {
          setScores((s) => ({ ...s, [currentTurn]: s[currentTurn] + 1 }));
          keepTurn = true;
          setMessage(
            `${currentTurn === 'white' ? 'White' : 'Black'} pocketed a piece! (+1 pt) Bonus turn!`
          );
        } else {
          // Pocketed opponent piece
          const opponent = currentTurn === 'white' ? 'black' : 'white';
          setScores((s) => ({ ...s, [opponent]: s[opponent] + 1 }));
          setMessage(`Pocketed opponent piece for ${opponent}!`);
        }
      });
    }

    // Check game over
    const remainingWhite = piecesRef.current.filter((p) => p.type === 'w').length;
    const remainingBlack = piecesRef.current.filter((p) => p.type === 'b').length;

    if (remainingWhite === 0 || remainingBlack === 0) {
      const finalScores = scoresRef.current;
      const winSide =
        finalScores.white > finalScores.black
          ? 'White'
          : finalScores.black > finalScores.white
          ? 'Black'
          : 'Draw';
      setWinner(winSide);
      sounds.playWinFanfare();
      confetti({ particleCount: 90, spread: 70, origin: { y: 0.6 } });
      setMessage(`Game Complete! ${winSide} wins!`);
      return;
    }

    const nextTurn = keepTurn ? currentTurn : currentTurn === 'white' ? 'black' : 'white';
    setTurn(nextTurn);
    resetStriker(nextTurn, 250);

    // If bot's turn in AI mode
    if (nextTurn === 'black' && modeRef.current === 'ai') {
      triggerAiShot();
    }
  }, []);

  const triggerAiShot = () => {
    setMessage('AI is lining up shot...');
    setTimeout(() => {
      // Bot finds closest black piece to pocket
      const targetPieces = piecesRef.current.filter((p) => p.type === 'b' || p.type === 'q');
      if (targetPieces.length === 0) return;

      const target = targetPieces[Math.floor(Math.random() * targetPieces.length)];
      // Position striker to face target
      const botX = Math.max(100, Math.min(400, target.x + (Math.random() * 40 - 20)));
      strikerRef.current.x = botX;
      setStrikerX(botX);

      const dx = target.x - strikerRef.current.x;
      const dy = target.y - strikerRef.current.y;
      const dist = Math.hypot(dx, dy);

      const speed = Math.min(18, Math.max(8, dist * 0.04 + 6));
      strikerRef.current.vx = (dx / dist) * speed;
      strikerRef.current.vy = (dy / dist) * speed;

      sounds.playCarromHit(speed);
      isMovingRef.current = true;
      setIsMoving(true);
      setMessage("AI fired striker!");
    }, 900);
  };

  // Physics simulation step
  const updatePhysics = useCallback(() => {
    const allPieces = strikerRef.current.isDead
      ? piecesRef.current
      : [strikerRef.current, ...piecesRef.current];

    let stillMoving = false;

    // 1. Move & friction
    allPieces.forEach((p) => {
      p.x += p.vx;
      p.y += p.vy;
      p.vx *= 0.982; // table friction
      p.vy *= 0.982;

      if (Math.abs(p.vx) > 0.05 || Math.abs(p.vy) > 0.05) {
        stillMoving = true;
      } else {
        p.vx = 0;
        p.vy = 0;
      }

      // Cushion wall collisions
      const minX = 20 + p.radius;
      const maxX = BOARD_SIZE - 20 - p.radius;
      const minY = 20 + p.radius;
      const maxY = BOARD_SIZE - 20 - p.radius;

      if (p.x < minX) {
        p.x = minX;
        p.vx *= -0.78;
        sounds.playCarromHit(Math.abs(p.vx));
      } else if (p.x > maxX) {
        p.x = maxX;
        p.vx *= -0.78;
        sounds.playCarromHit(Math.abs(p.vx));
      }

      if (p.y < minY) {
        p.y = minY;
        p.vy *= -0.78;
        sounds.playCarromHit(Math.abs(p.vy));
      } else if (p.y > maxY) {
        p.y = maxY;
        p.vy *= -0.78;
        sounds.playCarromHit(Math.abs(p.vy));
      }
    });

    // 2. Rigid body circle-to-circle elastic collision
    for (let i = 0; i < allPieces.length; i++) {
      for (let j = i + 1; j < allPieces.length; j++) {
        const p1 = allPieces[i];
        const p2 = allPieces[j];

        const dx = p2.x - p1.x;
        const dy = p2.y - p1.y;
        const dist = Math.hypot(dx, dy);
        const minDist = p1.radius + p2.radius;

        if (dist < minDist && dist > 0) {
          // Normal vector
          const nx = dx / dist;
          const ny = dy / dist;
          const overlap = (minDist - dist) / 2;

          p1.x -= nx * overlap;
          p1.y -= ny * overlap;
          p2.x += nx * overlap;
          p2.y += ny * overlap;

          // Relative velocity along normal
          const kx = p1.vx - p2.vx;
          const ky = p1.vy - p2.vy;
          const p = 2 * (nx * kx + ny * ky) / 2; // Equal mass approximation

          p1.vx -= p * nx * 0.95;
          p1.vy -= p * ny * 0.95;
          p2.vx += p * nx * 0.95;
          p2.vy += p * ny * 0.95;

          const relSpeed = Math.hypot(kx, ky);
          if (relSpeed > 0.4) {
            sounds.playCarromHit(relSpeed);
          }
        }
      }
    }

    // 3. Pocket detection
    const remainingPieces: Piece[] = [];
    piecesRef.current.forEach((p) => {
      const inPocket = POCKETS.some(([px, py]) => Math.hypot(p.x - px, p.y - py) < POCKET_RADIUS);
      if (inPocket) {
        sounds.playCarromPocket();
        pocketedThisTurnRef.current.push(p.type);
      } else {
        remainingPieces.push(p);
      }
    });
    piecesRef.current = remainingPieces;

    // Striker in pocket
    if (!strikerRef.current.isDead) {
      const strikerPocket = POCKETS.some(
        ([px, py]) => Math.hypot(strikerRef.current.x - px, strikerRef.current.y - py) < POCKET_RADIUS
      );
      if (strikerPocket) {
        strikerRef.current.isDead = true;
        strikerRef.current.vx = 0;
        strikerRef.current.vy = 0;
        sounds.playCarromPocket();
      }
    }

    // Check if motion ceased
    if (isMovingRef.current && !stillMoving) {
      isMovingRef.current = false;
      setIsMoving(false);
      handleTurnEnd();
    }
  }, [handleTurnEnd]);

  // Main canvas render loop
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animId: number;

    const render = () => {
      if (isMovingRef.current) {
        updatePhysics();
      }

      // Draw Wooden Board Canvas
      ctx.clearRect(0, 0, BOARD_SIZE, BOARD_SIZE);

      // Board Surface (Polished Teak Wood Gradient)
      const grad = ctx.createRadialGradient(250, 250, 50, 250, 250, 320);
      grad.addColorStop(0, '#f2d49b');
      grad.addColorStop(0.8, '#d8aa67');
      grad.addColorStop(1, '#be8a44');
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, BOARD_SIZE, BOARD_SIZE);

      // Wooden Frame Border
      ctx.strokeStyle = '#5a2d0c';
      ctx.lineWidth = 14;
      ctx.strokeRect(7, 7, BOARD_SIZE - 14, BOARD_SIZE - 14);

      // Inner Border Line
      ctx.strokeStyle = '#3e1c04';
      ctx.lineWidth = 2;
      ctx.strokeRect(20, 20, BOARD_SIZE - 40, BOARD_SIZE - 40);

      // Pockets
      POCKETS.forEach(([px, py]) => {
        // Pocket rim
        ctx.fillStyle = '#1e1005';
        ctx.beginPath();
        ctx.arc(px, py, POCKET_RADIUS, 0, Math.PI * 2);
        ctx.fill();

        // Deep hole
        ctx.fillStyle = '#080502';
        ctx.beginPath();
        ctx.arc(px, py, POCKET_RADIUS - 4, 0, Math.PI * 2);
        ctx.fill();
      });

      // Center Mandala Circles
      ctx.strokeStyle = '#8c531b';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(250, 250, 48, 0, Math.PI * 2);
      ctx.stroke();

      ctx.fillStyle = '#ef4444';
      ctx.beginPath();
      ctx.arc(250, 250, 6, 0, Math.PI * 2);
      ctx.fill();

      // Baselines for both sides (White bottom: y=415, Black top: y=85)
      const drawBaseline = (y: number, color: string) => {
        ctx.strokeStyle = color;
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(90, y);
        ctx.lineTo(410, y);
        ctx.stroke();

        // Foul circles at baseline endpoints
        [90, 410].forEach((bx) => {
          ctx.fillStyle = '#ef4444';
          ctx.beginPath();
          ctx.arc(bx, y, 12, 0, Math.PI * 2);
          ctx.fill();
          ctx.strokeStyle = '#fff';
          ctx.lineWidth = 1.5;
          ctx.stroke();
        });
      };
      drawBaseline(415, '#8c531b');
      drawBaseline(85, '#8c531b');

      // Draw Carrom Pieces
      piecesRef.current.forEach((p) => {
        ctx.save();
        ctx.shadowColor = 'rgba(0,0,0,0.4)';
        ctx.shadowBlur = 6;
        ctx.shadowOffsetY = 3;

        ctx.fillStyle = p.color;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
        ctx.fill();

        // Outer piece bevel ring
        ctx.strokeStyle = p.type === 'w' ? '#cbd5e1' : '#475569';
        ctx.lineWidth = 2;
        ctx.stroke();

        // Center dot on piece
        ctx.fillStyle = p.type === 'q' ? '#fff' : p.type === 'w' ? '#94a3b8' : '#0f172a';
        ctx.beginPath();
        ctx.arc(p.x, p.y, 4, 0, Math.PI * 2);
        ctx.fill();

        ctx.restore();
      });

      // Draw Striker (if not dead)
      const s = strikerRef.current;
      if (!s.isDead) {
        ctx.save();
        ctx.shadowColor = 'rgba(6, 182, 212, 0.6)';
        ctx.shadowBlur = 10;

        ctx.fillStyle = s.color;
        ctx.beginPath();
        ctx.arc(s.x, s.y, s.radius, 0, Math.PI * 2);
        ctx.fill();

        ctx.strokeStyle = '#fff';
        ctx.lineWidth = 2.5;
        ctx.stroke();

        ctx.fillStyle = '#fff';
        ctx.beginPath();
        ctx.arc(s.x, s.y, 5, 0, Math.PI * 2);
        ctx.fill();

        ctx.restore();
      }

      // Draw Aim Trajectory Line when aiming
      if (isAiming && dragStart && dragCurrent && !s.isDead) {
        const dx = s.x - dragCurrent.x;
        const dy = s.y - dragCurrent.y;
        const dist = Math.hypot(dx, dy);

        if (dist > 8) {
          const power = Math.min(dist, 140) / 140;

          // Trajectory aim vector pointing opposite of pull
          const aimLength = Math.min(dist * 2.8, 300);
          const aimAngle = Math.atan2(dy, dx);
          const targetX = s.x + Math.cos(aimAngle) * aimLength;
          const targetY = s.y + Math.sin(aimAngle) * aimLength;

          // Aim ray
          ctx.strokeStyle = power > 0.75 ? '#ef4444' : power > 0.4 ? '#f59e0b' : '#10b981';
          ctx.lineWidth = 3;
          ctx.setLineDash([6, 6]);
          ctx.beginPath();
          ctx.moveTo(s.x, s.y);
          ctx.lineTo(targetX, targetY);
          ctx.stroke();
          ctx.setLineDash([]);

          // Aim circle at target tip
          ctx.fillStyle = '#fff';
          ctx.beginPath();
          ctx.arc(targetX, targetY, 5, 0, Math.PI * 2);
          ctx.fill();
        }
      }

      animId = requestAnimationFrame(render);
    };

    animId = requestAnimationFrame(render);
    return () => cancelAnimationFrame(animId);
  }, [isAiming, dragStart, dragCurrent, updatePhysics]);

  useEffect(() => {
    initBoard();
  }, [initBoard]);

  // Handle pointer drag for aiming & shooting
  const handlePointerDown = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (isMovingRef.current || winner || (turn === 'black' && mode === 'ai')) return;
    const canvas = canvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * BOARD_SIZE;
    const y = ((e.clientY - rect.top) / rect.height) * BOARD_SIZE;

    const s = strikerRef.current;
    // Allow starting drag near striker
    if (Math.hypot(x - s.x, y - s.y) < 50) {
      setIsAiming(true);
      setDragStart({ x: s.x, y: s.y });
      setDragCurrent({ x, y });
      canvas.setPointerCapture(e.pointerId);
    }
  };

  const handlePointerMove = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (!isAiming) return;
    const canvas = canvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * BOARD_SIZE;
    const y = ((e.clientY - rect.top) / rect.height) * BOARD_SIZE;
    setDragCurrent({ x, y });
  };

  const handlePointerUp = () => {
    if (!isAiming || !dragCurrent) {
      setIsAiming(false);
      return;
    }

    const s = strikerRef.current;
    const dx = s.x - dragCurrent.x;
    const dy = s.y - dragCurrent.y;
    const dist = Math.hypot(dx, dy);

    setIsAiming(false);
    setDragStart(null);
    setDragCurrent(null);

    if (dist > 12) {
      const speed = Math.min(dist, 140) * 0.14;
      s.vx = (dx / dist) * speed;
      s.vy = (dy / dist) * speed;

      sounds.playCarromHit(speed);
      isMovingRef.current = true;
      setIsMoving(true);
      setMessage("Striker released!");
    }
  };

  const handleSliderChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (isMovingRef.current || (turn === 'black' && mode === 'ai')) return;
    const val = Number(e.target.value);
    setStrikerX(val);
    strikerRef.current.x = val;
  };

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

        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <button
            onClick={() => {
              sounds.playClick();
              setMode('ai');
              initBoard();
            }}
            className={mode === 'ai' ? 'primary-btn' : 'secondary-btn'}
            style={{ padding: '6px 12px', fontSize: '0.8rem' }}
          >
            <Bot size={14} /> vs AI Bot
          </button>
          <button
            onClick={() => {
              sounds.playClick();
              setMode('pvp');
              initBoard();
            }}
            className={mode === 'pvp' ? 'primary-btn' : 'secondary-btn'}
            style={{ padding: '6px 12px', fontSize: '0.8rem' }}
          >
            <Users size={14} /> 2 Players
          </button>
          <button className="secondary-btn" onClick={initBoard} style={{ padding: '6px 12px' }}>
            <RotateCcw size={14} /> Reset
          </button>
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

      <div
        className="glass-panel"
        style={{
          padding: '24px',
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
          gap: '24px',
          alignItems: 'center',
        }}
      >
        {/* Carrom Canvas */}
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
          <canvas
            ref={canvasRef}
            width={BOARD_SIZE}
            height={BOARD_SIZE}
            onPointerDown={handlePointerDown}
            onPointerMove={handlePointerMove}
            onPointerUp={handlePointerUp}
            style={{
              width: 'min(100%, 420px)',
              aspectRatio: '1',
              borderRadius: '16px',
              boxShadow: '0 16px 40px rgba(0,0,0,0.8)',
              touchAction: 'none',
              cursor: isAiming ? 'crosshair' : 'grab',
            }}
          />

          {/* Striker Position Slider */}
          <div
            style={{
              width: 'min(100%, 400px)',
              marginTop: '16px',
              display: 'flex',
              alignItems: 'center',
              gap: '12px',
            }}
          >
            <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)', fontWeight: 600 }}>
              Position:
            </span>
            <input
              type="range"
              min={110}
              max={390}
              value={strikerX}
              onChange={handleSliderChange}
              disabled={isMoving || (turn === 'black' && mode === 'ai')}
              style={{ flex: 1, accentColor: '#06b6d4', cursor: 'pointer' }}
            />
          </div>
        </div>

        {/* Right Info & Score Panel */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          {/* Turn Banner */}
          <div
            style={{
              padding: '16px 20px',
              borderRadius: '16px',
              background: 'rgba(255, 255, 255, 0.04)',
              border: `1px solid ${turn === 'white' ? '#06b6d4' : '#f59e0b'}`,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
            }}
          >
            <div>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 700 }}>
                CURRENT TURN
              </div>
              <div
                style={{
                  fontSize: '1.35rem',
                  fontWeight: 800,
                  color: turn === 'white' ? '#06b6d4' : '#f59e0b',
                }}
              >
                {turn === 'white' ? 'White Striker' : mode === 'ai' ? 'AI Bot (Black)' : 'Black Striker'}
              </div>
            </div>
            <Crosshair size={28} color={turn === 'white' ? '#06b6d4' : '#f59e0b'} />
          </div>

          {/* Scores */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '12px' }}>
            <div
              style={{
                padding: '14px',
                borderRadius: '14px',
                background: 'rgba(6, 182, 212, 0.1)',
                border: '1px solid rgba(6, 182, 212, 0.25)',
                textAlign: 'center',
              }}
            >
              <div style={{ fontSize: '0.75rem', color: '#38bdf8', fontWeight: 700 }}>
                WHITE (YOU)
              </div>
              <div style={{ fontSize: '1.6rem', fontWeight: 800 }}>{scores.white}</div>
            </div>

            <div
              style={{
                padding: '14px',
                borderRadius: '14px',
                background: 'rgba(245, 158, 11, 0.1)',
                border: '1px solid rgba(245, 158, 11, 0.25)',
                textAlign: 'center',
              }}
            >
              <div style={{ fontSize: '0.75rem', color: '#fbbf24', fontWeight: 700 }}>
                {mode === 'ai' ? 'BLACK (AI)' : 'BLACK (P2)'}
              </div>
              <div style={{ fontSize: '1.6rem', fontWeight: 800 }}>{scores.black}</div>
            </div>
          </div>

          {/* Match Log message */}
          <div
            style={{
              padding: '16px',
              borderRadius: '14px',
              background: 'rgba(0, 0, 0, 0.35)',
              border: '1px solid var(--border-subtle)',
            }}
          >
            <div
              style={{
                fontSize: '0.72rem',
                color: 'var(--text-muted)',
                fontWeight: 700,
                textTransform: 'uppercase',
                marginBottom: '6px',
              }}
            >
              Umpire Announcement
            </div>
            <div style={{ fontSize: '0.9rem', color: '#f8fafc', fontWeight: 600 }}>
              {message}
            </div>
          </div>

          {/* Aiming Guidance Pill */}
          <div
            style={{
              fontSize: '0.8rem',
              color: 'var(--text-muted)',
              lineHeight: '1.5',
              padding: '10px 14px',
              borderRadius: '10px',
              background: 'rgba(255, 255, 255, 0.02)',
              border: '1px solid var(--border-subtle)',
            }}
          >
            💡 <strong>How to shoot:</strong> Position striker using slider. Click and drag the striker backwards to aim and charge power, then release to shoot into corners!
          </div>
        </div>
      </div>
    </div>
  );
};
