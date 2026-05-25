"use client";

import { useState, useEffect } from 'react';
import confetti from 'canvas-confetti';
import styles from './page.module.css'; // Assuming you have this CSS module

const MAX_WORD_LENGTH = 15;
const NEW_GAME_CONFIRMATION_STORAGE_KEY = "jly_confirm_new_game";
const HIGH_SCORES_STORAGE_KEY = "jly_high_scores";
const FAILED_WORDS_STORAGE_KEY = "jly_failed_words";
const FAILED_WORD_PROBABILITY_MULTIPLIER = 100;
const FAILED_WORD_REAPPEAR_DELAY = 5; // The number of words to appear after failing before reappearing

export default function Home() {
  const [availableWords, setAvailableWords] = useState([]);
  const [currentWord, setCurrentWord] = useState(null);
  const [inputValue, setInputValue] = useState('');
  const [score, setScore] = useState(0);
  const [highScores, setHighScores] = useState([]);
  const [failedWords, setFailedWords] = useState([]);
  const [isNewGameConfirmationVisible, setIsNewGameConfirmationVisible] = useState(false);
  const [gameStarted, setGameStarted] = useState(false);

  // --- Local Storage Logic ---
  const getFromLocalStorage = (key, defaultValue) => {
    try {
      const value = localStorage.getItem(key);
      if (!value) return defaultValue;
      return JSON.parse(value);
    } catch (error) {
      console.error("Error getting from localStorage:", error);
      return defaultValue;
    }
  };

  const saveToLocalStorage = (key, value) => {
    try {
      localStorage.setItem(key, JSON.stringify(value));
    } catch (error) {
      console.error("Error saving to localStorage:", error);
    }
  };

  // --- Game Initialization ---
  useEffect(() => {
    const loadGameData = async () => {
      try {
        const response = await fetch('/jly-pairs.json');
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        const data = await response.json();
        
        // Filter words and store them
        const initialWords = data
          .filter(item => item.correct.length <= MAX_WORD_LENGTH)
          .map(item => item.correct);
        setAvailableWords(initialWords);
        
        // Load high scores and failed words
        setHighScores(getFromLocalStorage(HIGH_SCORES_STORAGE_KEY, []));
        setFailedWords(getFromLocalStorage(FAILED_WORDS_STORAGE_KEY, []));
      } catch (error) {
        console.error("Failed to load game data:", error);
        // Handle error, perhaps display a message to the user
      }
    };
    loadGameData();
  }, []);

  // --- Word Selection Logic ---
  const selectNextWord = () => {
    let wordPool = [...availableWords]; // Use current list of available words
    let wordToReturn = null;
    let attempts = 0;

    // Augment pool with failed words based on probability
    const weightedPool = [];
    for (const word of wordPool) {
        const failedWordEntry = failedWords.find(fw => fw.word === word);
        if (failedWordEntry) {
            // Crude approximation of words since failure: count words in the original list
            // This needs a better mechanism to track word sequence.
            // For now, we'll assume if it's in failedWords, it gets a boost.
             for (let i = 0; i < FAILED_WORD_PROBABILITY_MULTIPLIER; i++) {
                weightedPool.push({ word: word, priority: 'failed' });
            }
        } else {
            weightedPool.push({ word: word, priority: 'normal' });
        }
    }
    // Add all words from availableWords as normal priority to ensure they are considered
     for (const word of availableWords) {
        if (!weightedPool.some(wp => wp.word === word)) {
             weightedPool.push({ word: word, priority: 'normal' });
        }
    }

    // Shuffle the weighted pool to randomize selection
    weightedPool.sort(() => Math.random() - 0.5);

    // Attempt to pick a word that isn't the current word
    for (const item of weightedPool) {
        if (item.word !== currentWord || attempts >= weightedPool.length * 2) {
            wordToReturn = item.word;
            break;
        }
        attempts++;
    }

    if (wordToReturn) {
        // Remove the chosen word from the immediate pool to prevent immediate repetition
        setAvailableWords(prevWords => prevWords.filter(w => w !== wordToReturn));
        setCurrentWord(wordToReturn);
    } else {
        // No words left or couldn't find a different one
        setCurrentWord(null); // Signal end of game
    }
  };

  // --- Game State Management ---
  const startGame = () => {
    setScore(0);
    setFailedWords([]); // Clear failed words for a new game
    // Reload all words for a new game
    const loadAllWords = async () => {
      const response = await fetch('/jly-pairs.json');
      const data = await response.json();
      setAvailableWords(data.filter(item => item.correct.length <= MAX_WORD_LENGTH).map(item => item.correct));
    };
    loadAllWords();
    selectNextWord(); // Pick the first word
    setGameStarted(true);
    setIsNewGameConfirmationVisible(false); // Hide confirmation
  };

  const handleNewGameClick = () => {
    if (getFromLocalStorage(NEW_GAME_CONFIRMATION_STORAGE_KEY, true)) { // Default to showing confirmation
      setIsNewGameConfirmationVisible(true);
    } else {
      startGame();
    }
  };

  const confirmNewGame = () => {
    startGame();
  };

  const cancelNewGame = () => {
    setIsNewGameConfirmationVisible(false);
  };
  
  const disableNewGameConfirmation = () => {
    saveToLocalStorage(NEW_GAME_CONFIRMATION_STORAGE_KEY, false);
    setIsNewGameConfirmationVisible(false); // Hide confirmation if disabled
  };

  // --- Input Handling ---
  const checkWord = () => {
    if (!currentWord) return;

    if (inputValue.toLowerCase() === currentWord) {
      setScore(prevScore => prevScore + 1);
      confetti({ origin: { y: 0.8 }, particleCount: 150, spread: 180, angle: 90 });

      // Remove from failed words if it was failed before
      const updatedFailedWords = failedWords.filter(fw => fw.word !== currentWord);
      setFailedWords(updatedFailedWords);
      saveToLocalStorage(FAILED_WORDS_STORAGE_KEY, updatedFailedWords);

      selectNextWord();
      setInputValue('');
    } else {
      // Record as failed word
      const newFailedWord = { word: currentWord, timestamp: Date.now() };
      setFailedWords(prevFailed => {
        // Add only if not already in the list for this session to avoid duplicates
        if (!prevFailed.some(fw => fw.word === currentWord)) {
          return [...prevFailed, newFailedWord];
        }
        return prevFailed;
      });
      saveToLocalStorage(FAILED_WORDS_STORAGE_KEY, [...failedWords, newFailedWord].filter((v,i,a)=>a.findIndex(t=>(t.word === v.word))===i)); // Ensure unique words on save

      selectNextWord(); // Move to the next word
      setInputValue('');
    }
  };
  
  const handleInputChange = (e) => {
      setInputValue(e.target.value.slice(0, MAX_WORD_LENGTH));
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter') {
      checkWord();
    }
  };

  // --- Game Over and High Score Logic ---
  useEffect(() => {
    if (gameStarted && currentWord === null && availableWords.length === 0) { // Game over condition: no more words available
      const updatedHighScores = [...highScores, { score, date: new Date().toLocaleDateString() }];
      updatedHighScores.sort((a, b) => b.score - a.score); // Sort descending
      const topScores = updatedHighScores.slice(0, MAX_HIGH_SCORES);
      setHighScores(topScores);
      saveToLocalStorage(HIGH_SCORES_STORAGE_KEY, topScores);
      setGameStarted(false); // Reset game state
    }
  }, [currentWord, availableWords, score, gameStarted, highScores]); // Dependencies

  // --- Dynamic Font Size -------------
  const calculateFontSize = (word) => {
      const baseSize = 5; // vh units or similar
      const wordLength = word.length;
      const maxLength = MAX_WORD_LENGTH;
      // Simple scaling: font size decreases as word length increases beyond a certain point
      // This is a basic approach; a proper solution might use a measuring element.
      // For now, let's use a clamp-like calculation in CSS/inline style.
      let fontSize;
      if (wordLength <= 10) {
          fontSize = '6rem'; // Large font for shorter words
      } else if (wordLength <= 15) {
          fontSize = '5rem'; // Slightly smaller
      } else {
          fontSize = '4rem'; // Smallest for longest words
      }
      // Further dynamic adjustment based on screen width could be added here.
      // The clamp() CSS function is ideal for this, but needs to be applied via CSS.
      // For inline style, we can approximate:
      const maxWidthFactor = 0.8; // Adjust this factor
      const scale = Math.min(1, (maxLength - wordLength) / (maxLength - 10)) * maxWidthFactor + (1 - maxWidthFactor);
      // Example: word 10 chars -> scale 1; word 15 chars -> scale 0.5
      // This is just an idea, actual implementation with clamp in CSS is better.
      
      // Using clamp function directly for approximation:
      // clamp(min, preferred, max)
      // min: 3rem, preferred: calc(6vw + X%), max: 7rem
      // The CSS `clamp` function is superior, applying it dynamically via inline style is complex.
      // Let's rely on the CSS class and a simple inline style for demonstration.

      return `clamp(3rem, calc(5vw + ${Math.max(0, wordLength - 10)} * 0.5vw), 7rem)`; 

  };


  // --- Render ---
  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-4" style={{ backgroundColor: 'var(--background)', color: 'var(--foreground)' }}>
      <h1 className="text-5xl font-bold mb-8 text-balance">J vs LY</h1>
      
      {!gameStarted && !isNewGameConfirmationVisible && (
        <div className="text-center">
          <p className="text-xl mb-6">Test your Hungarian j/ly spelling skills!</p>
          <button onClick={handleNewGameClick} className="btn-primary px-12 py-6 text-2xl">Start New Game</button>
          <div className="mt-4">
            <label className="inline-flex items-center cursor-pointer">
              <input type="checkbox" className="form-checkbox h-5 w-5 text-blue-600" defaultChecked={getFromLocalStorage(NEW_GAME_CONFIRMATION_STORAGE_KEY, true)} onChange={(e) => saveToLocalStorage(NEW_GAME_CONFIRMATION_STORAGE_KEY, e.target.checked)} />
              <span className="ml-2 text-gray-700 dark:text-gray-300">Show confirmation before new game</span>
            </label>
          </div>
        </div>
      )}

      {isNewGameConfirmationVisible && (
        <div className="text-center p-8 bg-gray-100 dark:bg-gray-800 rounded-xl shadow-lg">
          <h2 className="text-3xl font-bold mb-4">Confirm New Game</h2>
          <p className="text-xl mb-6">Are you sure you want to start a new game? This will reset your current score.</p>
          <div className="flex justify-center space-x-4">
            <button onClick={confirmNewGame} className="btn-success px-6 py-3 text-xl">Yes, Start New Game</button>
            <button onClick={cancelNewGame} className="btn-secondary px-6 py-3 text-xl">Cancel</button>
          </div>
          <div className="mt-4">
            <button onClick={disableNewGameConfirmation} className="text-sm text-blue-500 hover:underline">Do not show this confirmation again</button>
          </div>
        </div>
      )}
      
      {gameStarted && currentWord && (
        <div className="text-center">
          <p className="text-xl mb-4">Score: {score}</p>
          <div className={`${styles.wordPlaceholder} text-7xl font-bold mb-6 text-balance`}>
             {/* Font size adaptation using the CSS class and an inline style for demonstration */}
             <span className={styles.wordWrapper}>
               <span style={{ fontSize: calculateFontSize(currentWord) }}>
                 {currentWord}
               </span>
             </span>
          </div>
          <div className="mb-4">
            <input
              type="text"
              value={inputValue}
              onChange={handleInputChange}
              onKeyPress={handleKeyPress}
              maxLength={MAX_WORD_LENGTH}
              autoFocus
              className="text-4xl text-center p-4 border-4 border-gray-300 rounded-lg w-64 focus:outline-none focus:border-blue-500"
              placeholder="Type the word..."
            />
          </div>
          <button onClick={checkWord} className="btn-primary px-8 py-4 text-2xl">Check</button>
        </div>
      )}

      {gameStarted && currentWord === null && availableWords.length === 0 && (
        <div className="text-center">
            <h2 className="text-3xl font-bold mb-4">Game Over!</h2>
            <p className="text-xl mb-6">Your final score: {score}</p>
            <button onClick={handleNewGameClick} className="btn-primary px-8 py-4 text-2xl">Play Again</button>
        </div>
      )}

      <div className={`mt-12 w-full max-w-lg ${gameStarted ? 'hidden' : ''}`}>
        <h3 className="text-3xl font-bold mb-4 text-center">High Scores</h3>
        <ul className="list-none p-0 m-0">
          {highScores.length > 0 ? (
            highScores.map((hs, index) => (
              <li key={index} className="flex justify-between py-2 px-4 bg-gray-50 dark:bg-gray-800 rounded-lg mb-2">
                <span className="text-xl">{index + 1}.</span>
                <span className="text-xl font-semibold">{hs.score}</span>
                <span className="text-sm text-gray-600 dark:text-gray-400">{hs.date}</span>
              </li>
            ))
          ) : (
            <li className="text-center text-gray-500 dark:text-gray-400 py-4">No high scores yet!</li>
          )}
        </ul>
      </div>
    </div>
  );
}
