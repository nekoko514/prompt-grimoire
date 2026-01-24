import React, { useState, useEffect, useCallback } from 'react';
import '../styles/othello.css';
import audioEngine from '../utils/AudioEngine';

const BOARD_SIZE = 8;
const EMPTY = null;
const BLACK = 'black'; // Player
const RED = 'red';     // Alastor

const DIRECTIONS = [
    [-1, -1], [-1, 0], [-1, 1],
    [0, -1], [0, 1],
    [1, -1], [1, 0], [1, 1]
];

const OthelloGame = ({ onBack }) => {
    const [board, setBoard] = useState(Array(BOARD_SIZE).fill(null).map(() => Array(BOARD_SIZE).fill(EMPTY)));
    const [turn, setTurn] = useState(BLACK); // Black goes first
    const [gameState, setGameState] = useState('playing'); // playing, ended
    const [winner, setWinner] = useState(null);
    const [message, setMessage] = useState("さあ、貴方の番ですよ...");
    const [score, setScore] = useState({ black: 2, red: 2 });

    // Initialize Board
    const initializeBoard = useCallback(() => {
        const newBoard = Array(BOARD_SIZE).fill(null).map(() => Array(BOARD_SIZE).fill(EMPTY));
        const mid = BOARD_SIZE / 2;
        // Standard Othello/Reversi initial setup:
        // White (RED/Alastor) on d4 and e5 (diagonal)
        // Black (Player) on d5 and e4 (diagonal)
        newBoard[mid - 1][mid - 1] = RED;    // d4 - Alastor
        newBoard[mid][mid] = RED;            // e5 - Alastor  
        newBoard[mid - 1][mid] = BLACK;      // e4 - Player
        newBoard[mid][mid - 1] = BLACK;      // d5 - Player
        return newBoard;
    }, []);

    useEffect(() => {
        setBoard(initializeBoard());
    }, [initializeBoard]);

    // Check availability of moves
    const getValidMoves = (currentBoard, player) => {
        const moves = [];
        for (let r = 0; r < BOARD_SIZE; r++) {
            for (let c = 0; c < BOARD_SIZE; c++) {
                if (isValidMove(currentBoard, r, c, player)) {
                    moves.push({ r, c });
                }
            }
        }
        return moves;
    };

    const isValidMove = (currentBoard, r, c, player) => {
        if (currentBoard[r][c] !== EMPTY) return false;

        const opponent = player === BLACK ? RED : BLACK;

        for (let [dr, dc] of DIRECTIONS) {
            let nr = r + dr;
            let nc = c + dc;
            let foundOpponent = false;

            while (nr >= 0 && nr < BOARD_SIZE && nc >= 0 && nc < BOARD_SIZE) {
                if (currentBoard[nr][nc] === opponent) {
                    foundOpponent = true;
                } else if (currentBoard[nr][nc] === player) {
                    if (foundOpponent) return true; // Valid sandwich found
                    break;
                } else {
                    break; // Empty square
                }
                nr += dr;
                nc += dc;
            }
        }
        return false;
    };

    const executeMove = (currentBoard, r, c, player) => {
        const newBoard = currentBoard.map(row => [...row]);
        const opponent = player === BLACK ? RED : BLACK;
        newBoard[r][c] = player;

        DIRECTIONS.forEach(([dr, dc]) => {
            let nr = r + dr;
            let nc = c + dc;
            let path = [];

            while (nr >= 0 && nr < BOARD_SIZE && nc >= 0 && nc < BOARD_SIZE) {
                if (newBoard[nr][nc] === opponent) {
                    path.push({ r: nr, c: nc });
                } else if (newBoard[nr][nc] === player) {
                    if (path.length > 0) {
                        path.forEach(p => newBoard[p.r][p.c] = player);
                    }
                    break;
                } else {
                    break;
                }
                nr += dr;
                nc += dc;
            }
        });

        // Update counts
        let bCount = 0;
        let rCount = 0;
        newBoard.forEach(row => row.forEach(cell => {
            if (cell === BLACK) bCount++;
            if (cell === RED) rCount++;
        }));
        setScore({ black: bCount, red: rCount });

        return newBoard;
    };

    const handleCellClick = (r, c) => {
        if (gameState !== 'playing' || turn !== BLACK) return;
        if (!isValidMove(board, r, c, BLACK)) return;

        // Player Move
        const nextBoard = executeMove(board, r, c, BLACK);
        setBoard(nextBoard);
        setTurn(RED);
        setMessage("ふむ... どうしましょうか...");
        // Sound
        // audioEngine.play('click'); // Need proper sound, using static briefly for now or add click

        // AI Turn
        setTimeout(() => makeAiMove(nextBoard), 1000);
    };

    const makeAiMove = (currentBoard) => {
        // Check if AI can move
        const validMoves = getValidMoves(currentBoard, RED);

        if (validMoves.length === 0) {
            // Check if Player can move (if both can't, game over)
            const playerMoves = getValidMoves(currentBoard, BLACK);
            if (playerMoves.length === 0) {
                endGame(currentBoard);
            } else {
                setMessage("打てる手がありませんね... パスです。");
                setTurn(BLACK);
            }
            return;
        }

        // AI Logic: Prioritize Corners > Edges > Random
        // A simple weighted strategy
        let bestMove = validMoves[0];
        let maxWeight = -Infinity;

        validMoves.forEach(move => {
            let weight = Math.random() * 10; // Base random

            // Corners are valuable
            if ((move.r === 0 || move.r === 7) && (move.c === 0 || move.c === 7)) {
                weight += 100;
            }
            // Edges are okay
            else if (move.r === 0 || move.r === 7 || move.c === 0 || move.c === 7) {
                weight += 10;
            }

            if (weight > maxWeight) {
                maxWeight = weight;
                bestMove = move;
            }
        });

        const nextBoard = executeMove(currentBoard, bestMove.r, bestMove.c, RED);
        setBoard(nextBoard);

        // Check if Player can move
        const playerMoves = getValidMoves(nextBoard, BLACK);
        if (playerMoves.length === 0) {
            const aiAgain = getValidMoves(nextBoard, RED);
            if (aiAgain.length === 0) {
                endGame(nextBoard); // Both stuck
            } else {
                setMessage("おや、貴方も打てませんか？ では私がもう一度。");
                setTimeout(() => makeAiMove(nextBoard), 1000);
            }
        } else {
            setTurn(BLACK);
            setMessage("さあ、貴方の番ですよ...");
        }
    };

    const endGame = (finalBoard) => {
        setGameState('ended');
        let b = 0, r = 0;
        finalBoard.forEach(row => row.forEach(cell => {
            if (cell === BLACK) b++;
            if (cell === RED) r++;
        }));

        if (b > r) {
            setWinner('black');
            setMessage("素晴らしい！ 貴方の勝ちです！");
        } else if (r > b) {
            setWinner('red');
            setMessage("残念でしたねぇ... 私の勝ちです。");
        } else {
            setWinner('draw');
            setMessage("まさかの引き分け... 退屈ですねぇ。");
        }
    };

    return (
        <div className="othello-game">
            <header className="othello-header">
                <h3>Strategy: Reversi</h3>
                <div className="scores">
                    <span className={`score-pill black ${turn === BLACK ? 'active' : ''}`}>Player: {score.black}</span>
                    <span className={`score-pill red ${turn === RED ? 'active' : ''}`}>Alastor: {score.red}</span>
                </div>
                <div className="status-msg">{message}</div>
            </header>

            <div className="board-container">
                <div className="othello-board">
                    {board.map((row, r) => (
                        <div key={r} className="board-row">
                            {row.map((cell, c) => (
                                <div
                                    key={c}
                                    className={`board-cell ${(isValidMove(board, r, c, BLACK) && turn === BLACK) ? 'valid' : ''}`}
                                    onClick={() => handleCellClick(r, c)}
                                >
                                    {cell && <div className={`disc ${cell}`}></div>}
                                </div>
                            ))}
                        </div>
                    ))}
                </div>
            </div>

            <button className="game-btn back-btn" onClick={onBack}>Exit Game</button>
        </div>
    );
};

export default OthelloGame;
