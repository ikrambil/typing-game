'use client'
import React, { useState, useEffect, useCallback, useRef } from 'react';
import { getRandomWords, fetchNewLine, startNewGame } from './typerHelpers'; // Import the helper functions

const LINELENGTH = 15;
const CHASER_SPEED = 0.3; // Speed at which the chaser moves (pixels per second)
const PLAYER_SPEED = 10; // Speed at which the player moves (pixels per character)
const INITIAL_PLAYER_POSITION = 100; // Start player further ahead
const INITIAL_CHASER_POSITION = 0; // Start chaser at the beginning

export default function Typer() {

    // Track lines
    const [lines, setLines] = useState<string[][]>([]);
    const [currentLineIndex, setCurrentLineIndex] = useState(0);
    
    // Track which word and letter user is on
    const [currentWordIndex, setCurrentWordIndex] = useState(0);
    const [currentLetterIndex, setCurrentLetterIndex] = useState(0);
    
    // Track if the typing is correct
    const [correctness, setCorrectness] = useState<boolean[][][]>([]);
    const [mistake, setMistake] = useState(false);
    
    // Track time and typing speed
    const [startTime, setStartTime] = useState<number | null>(null);
    const [typedCharacters, setTypedCharacters] = useState(0);
    const [wpm, setWpm] = useState(0);
    const [timeElapsed, setTimeElapsed] = useState(0);

    // Player and chaser positions
    const [playerPosition, setPlayerPosition] = useState(INITIAL_PLAYER_POSITION);
    const [chaserPosition, setChaserPosition] = useState(INITIAL_CHASER_POSITION);
    const [gameOver, setGameOver] = useState(false);

    const chaserRef = useRef<number>(chaserPosition);
    const playerRef = useRef<number>(playerPosition);
    const animationFrameRef = useRef<number | null>(null);
    const gameRef = useRef<HTMLDivElement>(null); // Reference to the game container

    const updatePositions = useCallback(() => {
        if (startTime !== null) {
            const elapsedSeconds = Math.floor((Date.now() - startTime) / 1000);
            setTimeElapsed(elapsedSeconds);

            // Update chaser position
            chaserRef.current += CHASER_SPEED;
            setChaserPosition(chaserRef.current);

            // Check if the game is over
            if (chaserRef.current >= playerRef.current) {
                setGameOver(true);
                if (animationFrameRef.current) {
                    cancelAnimationFrame(animationFrameRef.current);
                }
                return;
            }

            // Continue the game loop
            animationFrameRef.current = requestAnimationFrame(updatePositions);
        }
    }, [startTime]);

    useEffect(() => {
        if (!gameOver) {
            animationFrameRef.current = requestAnimationFrame(updatePositions);
        }

        // Cleanup on component unmount or game over
        return () => {
            if (animationFrameRef.current) {
                cancelAnimationFrame(animationFrameRef.current);
            }
        };
    }, [startTime, gameOver, updatePositions]);

    const calculateWpm = (typedChars: number, elapsedTime: number) => {
        const minutes = elapsedTime / 60000; // Convert milliseconds to minutes
        return Math.round((typedChars / 5) / minutes);
    };

    const handleKeyUp = useCallback((ev: React.KeyboardEvent<HTMLDivElement>) => {
        const key = ev.key;
        const currentLineWords = lines[currentLineIndex];
        const currentWord = currentLineWords[currentWordIndex];
        const currentLetter = currentWord[currentLetterIndex];

        if (gameOver) return;

        if (key === currentLetter) {
            setTypedCharacters(prevTypedChars => {
                const newTypedChars = prevTypedChars + 1;
                playerRef.current = INITIAL_PLAYER_POSITION + newTypedChars * PLAYER_SPEED;
                setPlayerPosition(playerRef.current); // Update player position
                return newTypedChars;
            });
            setCorrectness(prevCorrectness => {
                const newCorrectness = [...prevCorrectness];
                newCorrectness[currentLineIndex][currentWordIndex][currentLetterIndex] = true;
                return newCorrectness;
            });
            setMistake(false);
            if (currentLetterIndex + 1 === currentWord.length) {
                if (currentWordIndex + 1 === currentLineWords.length) {
                    if (currentLineIndex === 1 && lines.length === 3) {
                        setCurrentLineIndex(1);
                        fetchNewLine(getRandomWords, lines, correctness, setLines, setCorrectness, LINELENGTH);
                    } else {
                        setCurrentLineIndex(prevIndex => prevIndex + 1);
                    }
                    setCurrentWordIndex(0);
                    setCurrentLetterIndex(0);
                } else {
                    setCurrentWordIndex(prevIndex => prevIndex + 1);
                    setCurrentLetterIndex(0);
                }
            } else {
                setCurrentLetterIndex(prevIndex => prevIndex + 1);
            }
        } else if (key === ' ') {
            // Handle space at the end of the word
            if (currentLetterIndex === currentWord.length) {
                setTypedCharacters(prevTypedChars => prevTypedChars + 1);
                setCurrentWordIndex(prevIndex => prevIndex + 1);
                setCurrentLetterIndex(0);
            }
        } else {
            setMistake(true);
        }

        // Update WPM
        if (startTime) {
            const elapsedTime = Date.now() - startTime;
            setWpm(calculateWpm(typedCharacters + 1, elapsedTime)); // +1 to include the current character
        }
    }, [lines, currentLineIndex, currentWordIndex, currentLetterIndex, fetchNewLine, startTime, typedCharacters, gameOver]);

    const handleStartNewGame = () => {
        // Set the start time and reset the elapsed time
        const now = Date.now();
        setStartTime(now);
        setTimeElapsed(0);

        // Reset other states and start a new game
        setTypedCharacters(0);
        setPlayerPosition(INITIAL_PLAYER_POSITION);
        setChaserPosition(INITIAL_CHASER_POSITION);
        chaserRef.current = INITIAL_CHASER_POSITION;
        playerRef.current = INITIAL_PLAYER_POSITION;
        setGameOver(false);
        startNewGame(getRandomWords, LINELENGTH, setLines, setCorrectness, setCurrentLineIndex, setCurrentWordIndex, setCurrentLetterIndex, setMistake, setStartTime, setTypedCharacters, setWpm);
        // Automatically focus on the game container
        
        if (gameRef.current) {
            gameRef.current.focus();
        }
    };

    return (
        <div className="p-8 w-full text-left">
            <h1 className="text-7xl text-yellow-500">Test Type</h1>
            <div className="flex flex-row justify-between text-4xl py-12 pl-5">
                <div className="timer">Time: {timeElapsed}s</div>
                <div className="wpm">WPM: {wpm}</div>
                <button onClick={handleStartNewGame}>New Game</button>
            </div>
            <div className="game relative outline-none" tabIndex={0} onKeyUp={handleKeyUp} ref={gameRef} >
                <div className="words pt-12 pl-4 text-gray-700 flex flex-col justify-center items-center text-xl">
                    {lines.map((line, lineIndex) => (
                        <div key={lineIndex} className="line">
                            {line.map((word, wordIndex) => (
                                <div key={wordIndex} className="word mr-2 my-2 inline-block">
                                    {word.split('').map((letter, letterIndex) => {
                                        const isCorrect = correctness[lineIndex]?.[wordIndex]?.[letterIndex];
                                        const isCurrent =
                                            lineIndex === currentLineIndex &&
                                            wordIndex === currentWordIndex &&
                                            letterIndex === currentLetterIndex;

                                        let letterClass = "letter";
                                        if (isCurrent) {
                                            if (mistake) {
                                                letterClass += ' text-red-500';
                                            }
                                            letterClass += " bg-black";
                                        } else if (isCorrect) {
                                            letterClass += " text-white";
                                        }

                                        return (
                                            <span key={letterIndex} className={letterClass}>
                                                {letter}
                                            </span>
                                        );
                                    })}
                                </div>
                            ))}
                        </div>
                    ))}
                </div>

                {/* Player and Chaser squares */}
                <div className="relative w-full h-32 mt-8">
                    <div
                        className="absolute top-0 left-0 bg-blue-500 w-16 h-16"
                        style={{ transform: `translateX(${playerPosition}px)` }}
                    >
                        Player
                    </div>
                    <div
                        className="absolute top-0 left-0 bg-red-500 w-16 h-16"
                        style={{ transform: `translateX(${chaserPosition}px)` }}
                    >
                        Chaser
                    </div>
                </div>

                {gameOver && (
                    <div className="absolute inset-0 flex flex-col items-center justify-center bg-black bg-opacity-75 text-white text-4xl">
                        <div>Game Over! The chaser caught you.</div>
                        <div> Time survived: {timeElapsed} seconds.</div>
                        <div> Avg WPM: {wpm}.</div>
                    </div>
                )}
            </div>
        </div>
    );
}
