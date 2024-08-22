'use client'
import React, { useState, useEffect, useCallback } from 'react';
import { getRandomWords, fetchNewLine, startNewGame } from './typerHelpers'; // Import the helper functions

const LINELENGTH = 15;

export default function Typer() {

    const [lines, setLines] = useState<string[][]>([]);
    const [currentLineIndex, setCurrentLineIndex] = useState(0);
    const [currentWordIndex, setCurrentWordIndex] = useState(0);
    const [currentLetterIndex, setCurrentLetterIndex] = useState(0);
    const [correctness, setCorrectness] = useState<boolean[][][]>([]);
    const [mistake, setMistake] = useState(false);

    useEffect(() => {
        startNewGame(getRandomWords, LINELENGTH, setLines, setCorrectness, setCurrentLineIndex, setCurrentWordIndex, setCurrentLetterIndex, setMistake);
    }, []);

    const handleKeyUp = useCallback((ev: React.KeyboardEvent<HTMLDivElement>) => {
        const key = ev.key;
        const currentLineWords = lines[currentLineIndex];
        const currentWord = currentLineWords[currentWordIndex];
        const currentLetter = currentWord[currentLetterIndex];

        if (key === currentLetter) {
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
                setCurrentWordIndex(prevIndex => prevIndex + 1);
                setCurrentLetterIndex(0);
            }
        } else {
            setMistake(true);
        }
    }, [lines, currentLineIndex, currentWordIndex, currentLetterIndex, fetchNewLine]);

    return (
        <div className="p-8 w-full text-left" >
            <h1 className="text-7xl text-yellow-500">Test Type</h1>
            <div className="flex flex-row justify-between text-4xl py-12 pl-5">
                <div className="timer">30</div>
                <button onClick={() => startNewGame(getRandomWords, LINELENGTH, setLines, setCorrectness, setCurrentLineIndex, setCurrentWordIndex, setCurrentLetterIndex, setMistake)}>New Game</button>
            </div>
            <div className="game relative outline-none" tabIndex={0} onKeyUp={handleKeyUp}>
                <div className="words text-4xl pt-12 pl-4 text-gray-700 flex flex-col justify-center items-center">
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
                {/* <div className='flex absolute focus-error items-center justify-center align-center w-full z-10 -translate-y-24 text-5xl'> Click here to focus</div> */}
            </div>
            
        </div>
    );
}
