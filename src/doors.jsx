import React, { useState, useEffect } from 'react';

const DoorAnimation = ({ isOpen, hasCar, isSelected, onClick, disabled }) => {
  const [animationFrame, setAnimationFrame] = useState(1);
  const [isAnimating, setIsAnimating] = useState(false);

  useEffect(() => {
    if (isOpen && !isAnimating) {
      setIsAnimating(true);
      let frame = 1;
      const interval = setInterval(() => {
        frame++;
        setAnimationFrame(frame);
        if (frame >= 6) {
          clearInterval(interval);
        }
      }, 100);
      return () => clearInterval(interval);
    }
  }, [isOpen]);

  // Reset animation state when game resets
  useEffect(() => {
    if (!isOpen) {
      setAnimationFrame(1);
      setIsAnimating(false);
    }
  }, [isOpen]);

  const doorClasses = [
    'relative w-40 h-56 cursor-pointer transition-all duration-300'
  ];

  // If this door is selected (either initial pick or after switch)
  if (isSelected) {
  // If door is open and has car, show green highlight (winner)
  if (isOpen && hasCar) {
    doorClasses.push('shadow-[0_0_30px_5px_rgba(34,197,94,0.7)]');
  } else {
    // Otherwise show yellow highlight for selected door
    doorClasses.push('shadow-[0_0_30px_5px_rgba(234,179,8,0.7)]');
  }
 // If door has car but isn't selected, show subtle green when revealed
 } else if (hasCar && isOpen) {
  doorClasses.push('shadow-[0_0_30px_-5px_rgba(34,197,94,0.5)]');
}

  const className = doorClasses.filter(Boolean).join(' ');
  
  return (
    <div 
      onClick={disabled ? undefined : onClick}
      className={className}
    >
      {/* Prize behind the door */}
      <div className="absolute inset-0 flex items-center justify-center text-6xl -ml-2.5">
        {hasCar ? '🚗' : '🐐'}
      </div>

      {/* Door image */}
      <img 
        src={`/assets/door${animationFrame}.png`}
        alt={`Door ${isOpen ? 'opening frame ' + animationFrame : 'closed'}`}
        className="w-full h-full object-contain relative z-10"
      />
    </div>
  );
};

const Toggle = ({ checked, onChange, disabled }) => (
  <button
    className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors
      ${checked ? 'bg-blue-500' : 'bg-gray-200'}
      ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
    onClick={() => !disabled && onChange(!checked)}
  >
    <span
      className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform
        ${checked ? 'translate-x-6' : 'translate-x-1'}`}
    />
  </button>
);

const Doors = () => {
  const [doors, setDoors] = useState([]);
  const [selectedDoor, setSelectedDoor] = useState(null);
  const [revealedDoor, setRevealedDoor] = useState(null);
  const [gameState, setGameState] = useState('initial');
  const [wonCar, setWonCar] = useState(false);
  const [simResults, setSimResults] = useState([]);
  const [simCount, setSimCount] = useState(100);
  const [isSimulating, setIsSimulating] = useState(false);
  const [switchStrategy, setSwitchStrategy] = useState(true);

  const initializeDoors = () => {
    const carPosition = Math.floor(Math.random() * 3);
    return Array(3).fill(null).map((_, i) => ({
      id: i,
      hasCar: i === carPosition,
      isOpen: false,
      isSelected: false,
    }));
  };

  // Initialize doors on first render
  useEffect(() => {
    setDoors(initializeDoors());
  }, []);

  const revealGoatDoor = () => {
    const availableDoors = doors.filter((door, idx) => 
      !door.hasCar && idx !== selectedDoor
    );
    const doorToReveal = availableDoors[Math.floor(Math.random() * availableDoors.length)];
    setRevealedDoor(doorToReveal.id);
    setDoors(prevDoors => prevDoors.map(door => 
      door.id === doorToReveal.id ? { ...door, isOpen: true } : 
      ({ ...door, isSelected: door.id === selectedDoor })
    ));
  };

  const handleDoorClick = (doorId) => {
    if (gameState === 'initial') {
      setSelectedDoor(doorId);
      setDoors(prevDoors => {
        const newDoors = prevDoors.map(door => 
          ({ ...door, isSelected: door.id === doorId })
        );
        return newDoors;
      });
      setGameState('doorPicked');
    } else if (gameState === 'switching') {
      if (doorId === selectedDoor || doorId === revealedDoor) return;
      setSelectedDoor(doorId);
      setDoors(prevDoors => {
        const newDoors = prevDoors.map(door => 
          ({ ...door, isSelected: door.id === doorId })
        );
        return newDoors;
      });
      finishGame(doorId);
    }
  };

  // Add useEffect to handle door reveal after state updates are complete
  useEffect(() => {
    if (gameState === 'doorPicked' && selectedDoor !== null) {
      revealGoatDoor();
    }
  }, [gameState, selectedDoor]);

  const finishGame = (finalDoorId) => {
    const finalDoors = doors.map(door => ({ ...door, isOpen: true }));
    setDoors(finalDoors);
    setWonCar(finalDoors[finalDoorId].hasCar);
    setGameState('gameOver');
  };

  const resetGame = () => {
    const newDoors = initializeDoors();
    setDoors(newDoors);
    setSelectedDoor(null);
    setRevealedDoor(null);
    setGameState('initial');
    setWonCar(false);
  };

  const runSimulation = () => {
    setIsSimulating(true);
    let wins = 0;
    
    for (let i = 0; i < simCount; i++) {
      const carDoor = Math.floor(Math.random() * 3);
      const initialPick = Math.floor(Math.random() * 3);
      
      if (switchStrategy) {
        if (initialPick !== carDoor) wins++;
      } else {
        if (initialPick === carDoor) wins++;
      }
    }

    const winPercentage = (wins / simCount * 100).toFixed(1);
    const newResult = {
      id: Date.now(),
      runs: simCount,
      switched: switchStrategy,
      winPercentage
    };

    setSimResults(prev => [newResult, ...prev].slice(0, 10));
    setIsSimulating(false);
  };

  return (
    <div className="flex flex-col items-center gap-8 p-8 max-w-4xl mx-auto">
      <h1 className="text-3xl font-bold">pick a door</h1>
      
      {/* Doors Section */}
      <div className="flex gap-4 justify-center">
        {doors.map((door) => (
          <DoorAnimation
            key={door.id}
            isOpen={door.isOpen}
            hasCar={door.hasCar}
            isSelected={door.isSelected}
            onClick={() => handleDoorClick(door.id)}
            disabled={
              gameState !== 'initial' && 
              (gameState !== 'switching' || door.id === selectedDoor || door.id === revealedDoor)
            }
          />
        ))}
      </div>

      {/* Game Controls */}
      <div className="flex gap-4 h-32 items-center justify-center">
        {gameState === 'doorPicked' && (
          <div className="text-center">
            <p className="mb-4">Would you like to switch your choice?</p>
            <div className="flex gap-4 justify-center">
              <button 
                className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
                onClick={() => {
                  const newSelectedDoor = doors.find(door => 
                    door.id !== selectedDoor && door.id !== revealedDoor
                  );
                  
                  // First update the selected door state and selection
                  setSelectedDoor(newSelectedDoor.id);
                  setDoors(prevDoors => prevDoors.map(door => ({
                    ...door,
                    isOpen: true,  // Open all doors
                    isSelected: door.id === newSelectedDoor.id  // Update selection
                  })));
                  
                  // Then finish the game
                  setWonCar(newSelectedDoor.hasCar);
                  setGameState('gameOver');
                }}
              >
                Switch
              </button>
              <button 
                className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
                onClick={() => {
                  // Just reveal all doors and keep current selection
                  setDoors(prevDoors => prevDoors.map(door => ({
                    ...door,
                    isOpen: true
                  })));
                  setWonCar(doors[selectedDoor].hasCar);
                  setGameState('gameOver');
                }}
              >
                Keep
              </button>
            </div>
          </div>
        )}
        
        {gameState === 'gameOver' && (
          <div className="text-center">
            <h2 className={`text-2xl font-bold mb-4 ${wonCar ? 'text-green-500' : 'text-red-500'}`}>
              {wonCar ? 'Congratulations! You won the car! 🎉' : 'Sorry! Better luck next time! 🐐'}
            </h2>
            <button 
              className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
              onClick={resetGame}
            >
              Play Again
            </button>
          </div>
        )}
      </div>

      {/* Simulation Controls */}
      <div className="w-full max-w-lg border rounded-lg p-4 mt-8">
        <h2 className="text-xl font-bold mb-4">Run Simulation</h2>
        <div className="flex flex-col gap-4 mb-4">
          <div className="flex items-center gap-4">
            <input
              type="number"
              min="1"
              max="1000"
              value={simCount}
              onChange={(e) => setSimCount(Math.min(1000, Math.max(1, parseInt(e.target.value) || 0)))}
              className="w-32 px-2 py-1 border rounded"
            />
            <div className="flex items-center gap-2">
              <span className={`${!switchStrategy ? 'font-bold' : ''}`}>Keep</span>
              <Toggle 
                checked={switchStrategy}
                onChange={setSwitchStrategy}
                disabled={isSimulating}
              />
              <span className={`${switchStrategy ? 'font-bold' : ''}`}>Switch</span>
            </div>
            <button 
              className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 disabled:opacity-50"
              onClick={runSimulation}
              disabled={isSimulating}
            >
              Run Simulation
            </button>
          </div>
        </div>

        {/* Results Table */}
        {simResults.length > 0 && (
          <div className="border rounded-lg overflow-hidden">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="p-2 text-left">Runs</th>
                  <th className="p-2 text-left">Strategy</th>
                  <th className="p-2 text-left">Win %</th>
                </tr>
              </thead>
              <tbody>
                {simResults.map(result => (
                  <tr key={result.id} className="border-t">
                    <td className="p-2">{result.runs}</td>
                    <td className="p-2">{result.switched ? 'Switch' : 'Keep'}</td>
                    <td className="p-2">{result.winPercentage}%</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

export default Doors;