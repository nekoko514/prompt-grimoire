import React, { useState } from 'react';
import './styles/App.css';
import './styles/radio-effects.css';
import './styles/time-controls.css';
import Navigation from './components/Navigation';
import PromptStudio from './components/PromptStudio';
import RadioArchives from './components/RadioArchives';
import WritingDesk from './components/WritingDesk';

import GameRoom from './components/GameRoom';

import CalendarRoom from './components/CalendarRoom';
import DiaryRoom from './components/DiaryRoom';
import MusicRoom from './components/MusicRoom';
import ContractRoom from './components/ContractRoom';
import PromptVault from './components/PromptVault';
import GalleryRoom from './components/GalleryRoom';
import RadioTicker from './components/RadioTicker';
import MoodLight from './components/MoodLight';

import promptData from './data/prompts.json';

function App() {
  const [currentRoom, setCurrentRoom] = useState('studio');
  const [timeOfDay, setTimeOfDay] = useState('all');

  // Lifted State for Library Integration
  const [selectedPrompts, setSelectedPrompts] = useState([]);
  const [activeColor, setActiveColor] = useState(promptData.categories.find(c => c.id === 'colors').items[0]);

  return (
    <>
      <MoodLight color={activeColor.hex} />
      <RadioTicker />
      <div className="crt-overlay"></div>
      <div className="crt-scanline"></div>

      {/* ROOMS */}
      {currentRoom === 'studio' && (
        <PromptStudio
          timeOfDay={timeOfDay}
          setTimeOfDay={setTimeOfDay}
          selectedPrompts={selectedPrompts}
          setSelectedPrompts={setSelectedPrompts}
          activeColor={activeColor}
          setActiveColor={setActiveColor}
        />
      )}

      {currentRoom === 'vault' && (
        <div className="room-container">
          <RadioArchives onClose={() => setCurrentRoom('studio')} />
        </div>
      )}

      {currentRoom === 'guest' && (
        <WritingDesk />
      )}

      {currentRoom === 'calendar' && (
        <CalendarRoom />
      )}

      {currentRoom === 'diary' && (
        <DiaryRoom />
      )}

      {currentRoom === 'music' && (
        <MusicRoom />
      )}

      {currentRoom === 'gallery' && (
        <GalleryRoom />
      )}

      {currentRoom === 'contracts' && (
        <ContractRoom />
      )}

      {currentRoom === 'personas' && (
        <PromptVault />
      )}

      {currentRoom === 'game' && (
        <GameRoom setCurrentRoom={setCurrentRoom} />
      )}

      <Navigation currentRoom={currentRoom} setRoom={setCurrentRoom} />
    </>
  );
}

export default App;
