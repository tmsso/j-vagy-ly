import { useState, useEffect } from 'react';
import confetti from 'canvas-confetti';
import styles from './page.module.css'; // Assuming you have this CSS module

const MAX_WORD_LENGTH = 15;
const NEW_GAME_CONFIRMATION_STORAGE_KEY = "jly_confirm_new_game";
const HIGH_SCORES_STORAGE_KEY = "jly_high_scores";
const FAILED_WORDS_STORAGE_KEY = "jly_failed_words";
const FAILED_WORD_PROBABILITY_MULTIPLIER = 100;
const FAILED_WORD_REAPPEAR_DELAY = 5;

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

  // --- Game Logic ---
  useEffect(() => {
    // Load initial data
    const loadGameData = async () => {
      const response = await fetch('/jly-pairs.json');
      const data = await response.json();
      // Filter words longer than MAX_WORD_LENGTH initially
      setAvailableWords(data.filter(item => item.correct.length <= MAX_WORD_LENGTH).map(item => item.correct));
      
      // Load high scores and failed words
      setHighScores(getFromLocalStorage(HIGH_SCORES_STORAGE_KEY, []));
      setFailedWords(getFromLocalStorage(FAILED_WORDS_STORAGE_KEY, []));
    };
    loadGameData();
  }, []);

  const selectNextWord = () => {
    let wordPool = [...availableWords];

    // Adjust probability for failed words
    const wordsToConsider = [];
    for (const word of wordPool) {
        const failedWordEntry = failedWords.find(fw => fw.word === word);
        if (failedWordEntry) {
            const wordsSinceFailure = (currentWord ? availableWords.indexOf(currentWord) : 0) - availableWords.indexOf(word); // This is a crude approximation, needs better tracking
            if (wordsSinceFailure >= FAILED_WORD_REAPPEAR_DELAY) {
                for (let i = 0; i < FAILED_WORD_PROBABILITY_MULTIPLIER; i++) {
                    wordsToConsider.push({ word, priority: 'failed' });
                }
            } else {
                wordsToConsider.push({ word, priority: 'normal' });
            }
        } else {
            wordsToConsider.push({ word, priority: 'normal' });
        }
    }
    
    // Simple selection: pick randomly from the weighted pool
    if (wordsToConsider.length === 0) {
        // Fallback if word pool is empty
        setCurrentWord(null);
        return;
    }

    // Ensure we don't pick the same word twice in a row if possible
    let nextWord;
    let attempts = 0;
    do {
        const randomIndex = Math.floor(Math.random() * wordsToConsider.length);
        nextWord = wordsToConsider[randomIndex].word;
        attempts++;
    } while (nextWord === currentWord && attempts < wordsToConsider.length * 2); // Allow a few attempts to pick a different word

    setCurrentWord(nextWord);
    // Remove the selected word from the main pool to avoid immediate repetition (unless it's a failed word with high probability)
    // This logic needs refinement for failed words. For now, a simple removal.
    setAvailableWords(prevWords => prevWords.filter(w => w !== nextWord));
  };

  const startGame = () => {
    setScore(0);
    setFailedWords([]); // Clear failed words for a new game
    setAvailableWords(availableWords); // Reset available words
    selectNextWord();
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

  const checkWord = () => {
    if (!currentWord) return;

    if (inputValue.toLowerCase() === currentWord) {
      setScore(prevScore => prevScore + 1);
      // Trigger confetti
      confetti({
        origin: { y: 0.8 },
        particleCount: 150,
        spread: 180,
        angle: 90,
      });

      // Clear failed words if a correct word is guessed
      const updatedFailedWords = failedWords.filter(fw => fw.word !== currentWord);
      setFailedWords(updatedFailedWords);
      saveToLocalStorage(FAILED_WORDS_STORAGE_KEY, updatedFailedWords);

      // Move to next word
      selectNextWord();
      setInputValue('');
    } else {
      // Handle incorrect guess
      const newFailedWord = { word: currentWord, timestamp: Date.now() };
      setFailedWords(prevFailed => {
        // Prevent adding duplicates if already failed in this session
        if (!prevFailed.some(fw => fw.word === currentWord)) {
          return [...prevFailed, newFailedWord];
        }
        return prevFailed;
      });
      saveToLocalStorage(FAILED_WORDS_STORAGE_KEY, [...failedWords, newFailedWord].filter((v,i,a)=>a.findIndex(t=>(t.word === v.word))===i)); // De-duplicate on save

      // Optionally: End game or give another chance
      // For now, we just move to the next word and make it reappear later
      selectNextWord();
      setInputValue('');
    }
  };
  
  const handleInputChange = (e) => {
      // Limit input length to MAX_WORD_LENGTH
      setInputValue(e.target.value.slice(0, MAX_WORD_LENGTH));
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter') {
      checkWord();
    }
  };

  // --- High Score Management ---
  useEffect(() => {
    const handleGameOver = () => {
      const newHighScores = [...highScores, { score, date: new Date().toLocaleDateString() }];
      newHighScores.sort((a, b) => b.score - a.score); // Sort descending
      const topScores = newHighScores.slice(0, MAX_HIGH_SCORES);
      setHighScores(topScores);
      saveToLocalStorage(HIGH_SCORES_STORAGE_KEY, topScores);
    };

    if (gameStarted && !currentWord && inputValue === '') { // Game over condition: no more words, no pending input
       handleGameOver();
       setGameStarted(false);
    }
  }, [currentWord, score, gameStarted, highScores, availableWords]); // Dependencies

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
          <div className={`text-7xl font-bold mb-6 text-balance ${styles.wordPlaceholder} `}>
             {/* Font size adaptation: a simple approach - use a container with overflow hidden and adjust font size */}
             <span className={styles.wordWrapper}>
               <span style={{ fontSize: `clamp(3rem, calc(7vw + ${Math.max(0, currentWord.length - MAX_WORD_LENGTH)} * 0.5vw), 7rem)` }}>
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

      <div className={`mt-12 w-full max-w-lg ${!gameStarted ? 'hidden' : ''}`}>
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
      
      {/* Failed words display can be added here if desired */}
    </div>
  );
}
