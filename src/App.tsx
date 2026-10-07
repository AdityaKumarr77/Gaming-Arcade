import React, { useState } from 'react';
import type { GameId } from './types/game';
import { Header } from './components/Header';
import { Lobby } from './components/Lobby';
import { RulesModal } from './components/RulesModal';
import { TicTacToeGame } from './components/games/TicTacToe/TicTacToeGame';
import { LudoGame } from './components/games/Ludo/LudoGame';
import { CarromGame } from './components/games/Carrom/CarromGame';
import { BlackjackGame } from './components/games/Blackjack/BlackjackGame';
import { sounds } from './audio/soundEffects';

export const App: React.FC = () => {
  const [activeGame, setActiveGame] = useState<GameId>('hub');
  const [rulesOpen, setRulesOpen] = useState<boolean>(false);
  const [rulesInitialTab, setRulesInitialTab] = useState<GameId>('ttt');
  const [coins, setCoins] = useState<number>(() => {
    const saved = localStorage.getItem('arcade_coins');
    return saved !== null ? Number(saved) : 1000;
  });

  const handleUpdateCoins = (newAmount: number) => {
    setCoins(newAmount);
    localStorage.setItem('arcade_coins', String(newAmount));
  };

  const handleSelectGame = (game: GameId) => {
    sounds.playClick();
    setActiveGame(game);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleOpenRules = (game?: GameId) => {
    sounds.playClick();
    setRulesInitialTab(game || (activeGame === 'hub' ? 'ttt' : activeGame));
    setRulesOpen(true);
  };

  return (
    <div className="app-container">
      <Header
        activeGame={activeGame}
        onSelectGame={handleSelectGame}
        coins={coins}
        onOpenRules={() => handleOpenRules()}
      />

      <main className="main-wrapper">
        {activeGame === 'hub' && (
          <Lobby onSelectGame={handleSelectGame} onOpenRules={handleOpenRules} />
        )}

        {activeGame === 'ttt' && (
          <TicTacToeGame
            onBackToHub={() => handleSelectGame('hub')}
            onOpenRules={() => handleOpenRules('ttt')}
          />
        )}

        {activeGame === 'ludo' && (
          <LudoGame
            onBackToHub={() => handleSelectGame('hub')}
            onOpenRules={() => handleOpenRules('ludo')}
          />
        )}

        {activeGame === 'carrom' && (
          <CarromGame
            onBackToHub={() => handleSelectGame('hub')}
            onOpenRules={() => handleOpenRules('carrom')}
          />
        )}

        {activeGame === 'blackjack' && (
          <BlackjackGame
            onBackToHub={() => handleSelectGame('hub')}
            onOpenRules={() => handleOpenRules('blackjack')}
            coins={coins}
            onUpdateCoins={handleUpdateCoins}
          />
        )}
      </main>

      <RulesModal
        isOpen={rulesOpen}
        initialTab={rulesInitialTab}
        onClose={() => setRulesOpen(false)}
      />
    </div>
  );
};

export default App;
