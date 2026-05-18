'use client';

import { useState } from 'react';

export default function Instructions() {
  const [isExpanded, setIsExpanded] = useState(false);
  
  return (
    <div className="bg-white rounded-2xl shadow-lg p-6 mb-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-xl font-bold text-gray-800">Hogyan működik?</h3>
        <button
          onClick={() => setIsExpanded(!isExpanded)}
          className="text-primary-600 hover:text-primary-700 font-medium"
          aria-expanded={isExpanded}
        >
          {isExpanded ? 'Kevesebb' : 'További információk'}
        </button>
      </div>
      
      <p className="text-gray-700 mb-4">
        A játék során két írásmód közül kell választanod. Az egyik helyes, a másik hibás.
        A választásod után rögtön látod, hogy helyes volt-e.
      </p>
      
      {isExpanded && (
        <div className="space-y-4 text-gray-700 animate-fade-in">
          <div className="border-l-4 border-primary-500 pl-4 py-2">
            <h4 className="font-bold text-gray-800 mb-1">Példa</h4>
            <p className="mb-1"><span className="font-bold">Helyes:</span> <span className="text-success-600">folyó</span></p>
            <p><span className="font-bold">Hibás:</span> <span className="text-error-600">fojó</span></p>
          </div>
          
          <div className="border-l-4 border-success-500 pl-4 py-2">
            <h4 className="font-bold text-gray-800 mb-1">Hasznos tippek</h4>
            <ul className="list-disc pl-5 space-y-1">
              <li>A <span className="font-bold">j</span> és <span className="font-bold">ly</span> hasonló hangzású, de különböző helyesírású</li>
              <li>Gyakran magas hangrendű szavakban <span className="font-bold">ly</span>, mély hangrendűekben <span className="font-bold">j</span></li>
              <li>Néhány szóra kivétel vonatkozik (pl. jég, lyuk)</li>
            </ul>
          </div>
          
          <div className="border-l-4 border-blue-500 pl-4 py-2">
            <h4 className="font-bold text-gray-800 mb-1">Gyorsbillentyűk</h4>
            <ul className="space-y-1">
              <li><span className="inline-block w-24 font-mono bg-gray-100 px-2 py-1 rounded">1</span> Első opció kiválasztása</li>
              <li><span className="inline-block w-24 font-mono bg-gray-100 px-2 py-1 rounded">2</span> Második opció kiválasztása</li>
              <li><span className="inline-block w-24 font-mono bg-gray-100 px-2 py-1 rounded">Space</span> Következő szó</li>
              <li><span className="inline-block w-24 font-mono bg-gray-100 px-2 py-1 rounded">N</span> Új játék</li>
            </ul>
          </div>
        </div>
      )}
    </div>
  );
}