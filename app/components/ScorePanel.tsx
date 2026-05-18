'use client';

interface ScorePanelProps {
  correct: number;
  total: number;
  onNewGame: () => void;
  pairCount: number;
}

export default function ScorePanel({ correct, total, onNewGame, pairCount }: ScorePanelProps) {
  const accuracy = total > 0 ? Math.round((correct / total) * 100) : 0;
  
  return (
    <div className="bg-white rounded-2xl shadow-lg p-6 mb-6">
      <div className="flex flex-col md:flex-row items-center justify-between gap-6">
        <div className="flex-1">
          <h3 className="text-xl font-bold text-gray-800 mb-3">Pontszám</h3>
          <div className="flex items-center gap-8">
            <div className="text-center">
              <div className="text-4xl font-bold text-primary-600">{correct}</div>
              <div className="text-gray-600 text-sm">helyes</div>
            </div>
            <div className="text-center">
              <div className="text-4xl font-bold text-gray-800">{total}</div>
              <div className="text-gray-600 text-sm">összes</div>
            </div>
            <div className="text-center">
              <div className="text-4xl font-bold text-success-600">{accuracy}%</div>
              <div className="text-gray-600 text-sm">pontosság</div>
            </div>
          </div>
        </div>
        
        <div className="flex flex-col items-center gap-4">
          <button
            onClick={onNewGame}
            className="btn-secondary px-6 py-3 text-lg"
            aria-label="Új játék kezdése"
          >
            Új játék
          </button>
          <div className="text-sm text-gray-500">
            {pairCount.toLocaleString()} feladat elérhető
          </div>
        </div>
      </div>
      
      <div className="mt-6">
        <div className="flex items-center gap-3">
          <div className="flex-1 h-3 bg-gray-200 rounded-full overflow-hidden">
            <div 
              className="h-full bg-success-500 transition-all duration-500 ease-out"
              style={{ width: `${accuracy}%` }}
              role="progressbar"
              aria-valuenow={accuracy}
              aria-valuemin={0}
              aria-valuemax={100}
            />
          </div>
          <div className="text-sm text-gray-600 font-medium">
            {accuracy}%
          </div>
        </div>
      </div>
    </div>
  );
}