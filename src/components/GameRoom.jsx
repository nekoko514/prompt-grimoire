import React, { useState, useEffect } from 'react';
import '../styles/game-room.css';
import promptData from '../data/prompts.json';
import audioEngine from '../utils/AudioEngine';
import OthelloGame from './OthelloGame';

const GameRoom = ({ setCurrentRoom }) => {
    // Chaos State
    const [chaosResult, setChaosResult] = useState('');
    const [selectedGame, setSelectedGame] = useState(null); // 'highlow', 'othello', or null (menu)

    // Card Game State
    const [deck, setDeck] = useState([]);
    const [currentCard, setCurrentCard] = useState(null);
    const [score, setScore] = useState(0);
    const [highScore, setHighScore] = useState(0);
    const [gameState, setGameState] = useState('idle'); // idle, playing, lost
    const [message, setMessage] = useState("命の次に大事なものを賭けましょうか？");
    const [animating, setAnimating] = useState(false);

    // Quotes
    const quotes = {
        start: ["運が味方するか、見ものですね...", "単純な運試しといきましょう！", "カードを配りましょう..."],
        win: ["素晴らしい！", "ツキが回ってきましたね？", "実に見事だ！", "その調子です！"],
        lose: ["おやおや、残念無念。", "次はもっとうまくやることですね！", "親の総取りですよ。", "悲劇的ですねぇ！"],
        streak: ["なかなかやるじゃないですか！", "驚きましたね！", "感服しましたよ...少しだけね。"]
    };

    const getRandomQuote = (type) => {
        const list = quotes[type];
        return list[Math.floor(Math.random() * list.length)];
    };

    // --- Chaos Logic ---
    const invokeChaos = () => {
        const categories = ['character', 'outfits', 'scenario', 'situation'];
        let story = [];
        categories.forEach(catId => {
            const category = promptData.categories.find(c => c.id === catId);
            if (category && category.items.length > 0) {
                const randomItem = category.items[Math.floor(Math.random() * category.items.length)];
                story.push(randomItem.label);
            }
        });
        setChaosResult(story.join(" + "));
        audioEngine.play('static'); // Brief static noise
        setTimeout(() => audioEngine.stop(), 500);
    };

    const exportToDesk = () => {
        const existingNote = localStorage.getItem('guest_note') || '';
        const newNote = existingNote + `\n\n[Chaos Divination]: ${chaosResult}`;
        localStorage.setItem('guest_note', newNote);
        setCurrentRoom('guest');
    };

    // --- Card Game Logic ---
    const suits = ['♠', '♥', '♦', '♣'];
    const values = ['A', '2', '3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K'];

    const createDeck = () => {
        let newDeck = [];
        for (let s of suits) {
            for (let i = 0; i < values.length; i++) {
                newDeck.push({ suit: s, value: i + 1, label: values[i] });
            }
        }
        return newDeck.sort(() => Math.random() - 0.5);
    };

    const startGame = () => {
        const newDeck = createDeck();
        const firstCard = newDeck.pop();
        setDeck(newDeck);
        setCurrentCard(firstCard);
        setScore(0);
        setGameState('playing');
        setMessage(getRandomQuote('start'));
        setAnimating(true);
        setTimeout(() => setAnimating(false), 300);
    };

    const guess = (direction) => { // 'high' or 'low'
        if (animating || gameState !== 'playing') return;

        const nextCard = deck.length > 0 ? deck[deck.length - 1] : null;
        if (!nextCard) {
            // Re-shuffle if deck empty (rare)
            setDeck(createDeck());
            return;
        }

        const newDeck = deck.slice(0, -1);
        setDeck(newDeck);

        // Win Condition
        const isWin = (direction === 'high' && nextCard.value > currentCard.value) ||
            (direction === 'low' && nextCard.value < currentCard.value);

        setAnimating(true);

        setTimeout(() => {
            setCurrentCard(nextCard);
            setAnimating(false);

            if (isWin) {
                const newScore = score + 1;
                setScore(newScore);
                if (newScore > highScore) setHighScore(newScore);
                setMessage(newScore > 5 ? getRandomQuote('streak') : getRandomQuote('win'));
            } else if (nextCard.value === currentCard.value) {
                // Draw - continue game without penalty
                setMessage("引き分けとは... 興醒めですね。もう一度！");
                // Game continues - player can guess again
            } else {
                setGameState('lost');
                setMessage(getRandomQuote('lose'));
            }
        }, 300);
    };

    const getCardColor = (suit) => (suit === '♥' || suit === '♦') ? 'red' : 'black';

    return (
        <div className="game-room">
            <header className="game-header">
                <h2>Alastor's Game Parlor</h2>
            </header>

            {!selectedGame ? (
                // --- Game Selection Menu ---
                <div className="game-selection">
                    <p>Choose your wager...</p>
                    <div className="game-menu-grid">
                        <button className="game-menu-btn" onClick={() => setSelectedGame('highlow')}>
                            <span className="menu-icon">♠️</span>
                            <span className="menu-title">High & Low</span>
                            <span className="menu-desc">A simple game of chance</span>
                        </button>
                        <button className="game-menu-btn" onClick={() => setSelectedGame('othello')}>
                            <span className="menu-icon">⚪</span>
                            <span className="menu-title">Reversi</span>
                            <span className="menu-desc">A game of strategy</span>
                        </button>
                    </div>
                </div>
            ) : selectedGame === 'othello' ? (
                // --- Othello Game ---
                <OthelloGame onBack={() => setSelectedGame(null)} />
            ) : (
                // --- High & Low Game ---
                <div className="game-card card-table">
                    <button className="small-back-btn" onClick={() => setSelectedGame(null)}>← Back</button>
                    <div className="dealer-message">"{message}"</div>

                    <div className="score-board">
                        <span>Streak: {score}</span>
                        <span>Best: {highScore}</span>
                    </div>

                    <div className="card-area">
                        {currentCard ? (
                            <div className={`playing-card ${getCardColor(currentCard.suit)} ${animating ? 'flip' : ''}`}>
                                <div className="card-top">{currentCard.label}{currentCard.suit}</div>
                                <div className="card-center">{currentCard.suit}</div>
                                <div className="card-bottom">{currentCard.label}{currentCard.suit}</div>
                            </div>
                        ) : (
                            <div className="playing-card back">?</div>
                        )}
                    </div>

                    <div className="game-controls">
                        {gameState === 'playing' ? (
                            <>
                                <button className="game-btn high-btn" onClick={() => guess('high')}>HIGHER ▲</button>
                                <button className="game-btn low-btn" onClick={() => guess('low')}>LOWER ▼</button>
                            </>
                        ) : (
                            <button className="game-btn start-btn" onClick={startGame}>
                                {gameState === 'idle' ? 'Deal Cards' : 'Try Again'}
                            </button>
                        )}
                    </div>
                </div>
            )}

            {/* Chaos Divination (Always visible below) */}
            <div className="game-card chaos-section">
                <h3>Chaos Divination</h3>
                <button className="game-btn glitch-btn" onClick={invokeChaos}>INVOKE CHAOS</button>
                {chaosResult && (
                    <div className="chaos-result-box">
                        <p>{chaosResult}</p>
                        <div className="chaos-actions">
                            <button className="small-btn" onClick={() => { navigator.clipboard.writeText(chaosResult) }}>Copy</button>
                            <button className="small-btn" onClick={exportToDesk}>To Desk ➡</button>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default GameRoom;
