import React, { useState, useEffect } from 'react';
import ModeSelector from './components/ModeSelector';
import ArtifactList from './components/modules/ArtifactList';
import CommentBoard from './components/views/CommentBoard';
import ChatInterface from './components/views/ChatInterface';
import FollowMeView from './components/views/FollowMeView';
import CollectiveStoryView from './components/views/CollectiveStoryView';
import { ModeType, Artifact } from './types';
import { getArtifactsList, initData, getFollowMeGuideProfile } from './data';
import { logger } from './services/logger';
import { ChevronLeft, Loader2 } from 'lucide-react';

// View states for the application flow
type ViewState = 'ID_INPUT' | 'HOME' | 'ARTIFACT_LIST' | 'CONTENT_VIEW';

// Helper to determine if a mode is a linear tour (Follow Me or Collective Story)
const isTourMode = (mode: ModeType | null) => 
  mode === ModeType.FOLLOW_ME || mode === ModeType.COLLECTIVE_STORY;

// EXPERIMENT CONSTANT: 3 Minutes in milliseconds (Set to 6s for testing)
const TEST_DURATION_MS = 0.1 * 60 * 1000; 

// Mode sequence for Main Mode assignment (1-based index from ID)
const MODE_SEQUENCE = [
  ModeType.COMMENT_BOARD,   // 1
  ModeType.FOLLOW_ME,       // 2
  ModeType.CROWD_CHAT,      // 3
  ModeType.COLLECTIVE_STORY // 0
];

function App() {
  const [loading, setLoading] = useState(true);
  const [view, setView] = useState<ViewState>('ID_INPUT');
  const [participantIdInput, setParticipantIdInput] = useState('');
  const [currentMode, setCurrentMode] = useState<ModeType | null>(null);
  const [selectedArtifact, setSelectedArtifact] = useState<Artifact | null>(null);

  // --- Experiment State ---
  // Assigned Main Mode (calculated from Participant ID)
  const [assignedMainMode, setAssignedMainMode] = useState<ModeType | null>(null);
  
  // Track completed artifacts to prevent re-locking
  // Stores artifactId valid for the current assigned Main Mode
  const [completedArtifacts, setCompletedArtifacts] = useState<Set<string>>(new Set());

  // Renamed to taskStartTime to reflect it starts when the specific task/interaction begins
  const [taskStartTime, setTaskStartTime] = useState<number | null>(null);
  // Current active locking Artifact ID
  const [lockingArtifactId, setLockingArtifactId] = useState<string | null>(null);
  
  const [isLocked, setIsLocked] = useState(false); // State to trigger re-renders
  const [showTimeToast, setShowTimeToast] = useState(false);

  // Initialize Data
  useEffect(() => {
    initData().then(() => {
      setLoading(false);
    });
  }, []);

  // Timer Effect: Automatically updates isLocked state when time expires
  useEffect(() => {
    // If no start time, we are not locked
    if (taskStartTime === null) {
      setIsLocked(false);
      return;
    }

    const now = Date.now();
    const unlockTime = taskStartTime + TEST_DURATION_MS;
    const remaining = unlockTime - now;

    // If time has already passed
    if (remaining <= 0) {
      if (isLocked) {
        setIsLocked(false);
        // Mark current artifact as completed
        if (lockingArtifactId) {
          setCompletedArtifacts(prev => new Set(prev).add(lockingArtifactId));
          console.log(`[App] Artifact ${lockingArtifactId} marked as completed.`);
        }
      }
      return;
    }

    // Lock and schedule unlock
    if (!isLocked) setIsLocked(true);
    console.log(`[App] Locked for ${remaining}ms`);

    const timerId = setTimeout(() => {
      console.log('[App] Timer expired, unlocking UI');
      setIsLocked(false); // This triggers the re-render!
      // Mark as completed
      if (lockingArtifactId) {
        setCompletedArtifacts(prev => new Set(prev).add(lockingArtifactId));
        console.log(`[App] Artifact ${lockingArtifactId} marked as completed.`);
      }
    }, remaining);

    return () => clearTimeout(timerId);
  }, [taskStartTime, lockingArtifactId]);

  // Callback to start the timer (passed to child components)
  const handleTaskStart = (artifactId?: string) => {
    // 1. Determine target artifact ID
    const targetId = artifactId || selectedArtifact?.id;
    
    // 2. Main Mode Check
    if (currentMode !== assignedMainMode) {
      console.log(`[App] Not in Main Mode (${assignedMainMode}), skipping lock.`);
      return;
    }

    // 3. Completed Check
    if (targetId && completedArtifacts.has(targetId)) {
      console.log(`[App] Artifact ${targetId} already completed, skipping lock.`);
      return;
    }

    if (taskStartTime === null) {
      console.log(`[App] Starting Lock Timer for Artifact: ${targetId}`);
      if (targetId) setLockingArtifactId(targetId);
      setTaskStartTime(Date.now());
    }
  };

  // Experiment Setup: Submit Participant ID
  const handleIdSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (participantIdInput.trim()) {
      const pId = `P${participantIdInput.trim()}`;
      
      // Calculate Main Mode
      const idNum = parseInt(participantIdInput.trim(), 10);
      if (!isNaN(idNum) && idNum > 0) {
        const modeIndex = (idNum - 1) % 4;
        const mainMode = MODE_SEQUENCE[modeIndex];
        setAssignedMainMode(mainMode);
        console.log(`[App] Assigned Main Mode for ${pId}: ${mainMode}`);
      }

      // 保存到 sessionStorage（用于后端数据上报）
      sessionStorage.setItem('participantId', pId);
      console.log('[App] Participant ID saved:', pId);
      
      // 设置 logger 的 userId
      logger.setUserId(pId);
      
      setView('HOME');
    }
  };

  // 1. User selects a Mode
  const handleModeSelect = (mode: ModeType) => {
    logger.logModeSelect(mode);
    setCurrentMode(mode);
    
    // Reset timer when entering a new mode sequence
    setTaskStartTime(null);
    setLockingArtifactId(null);

    // SPECIAL CASE: Tour modes (Follow Me / Collective Story) skip the artifact list 
    // and go to a guided tour of all artifacts
    if (isTourMode(mode)) {
      setView('CONTENT_VIEW');
      // Note: For tour modes, we DO NOT set start time here. 
      // It is set when the user clicks "Found It" inside the view.
    } else {
      setView('ARTIFACT_LIST');
    }
  };

  // 2. User selects an Artifact (for non-Tour modes)
  const handleArtifactSelect = (artifact: Artifact) => {
    setSelectedArtifact(artifact);
    setView('CONTENT_VIEW');
    
    // For non-tour modes (Comment/Chat), we start the timer when they enter the content view
    // Pass the artifact ID explicitly
    handleTaskStart(artifact.id);
  };

  // Back button logic
  const handleBack = () => {
    // EXPERIMENT: Check Lock State
    if (isLocked) {
      setShowTimeToast(true);
      // Reset toast state after animation
      setTimeout(() => setShowTimeToast(false), 2000);
      return;
    }

    if (view === 'CONTENT_VIEW') {
      setSelectedArtifact(null);
      // If we are in a Tour mode, go back to Home, otherwise to List
      if (isTourMode(currentMode)) {
        setCurrentMode(null);
        setView('HOME');
        setTaskStartTime(null); // Reset
        setLockingArtifactId(null);
      } else {
        setView('ARTIFACT_LIST');
        setTaskStartTime(null); // Reset when leaving content
        setLockingArtifactId(null);
      }
    } else if (view === 'ARTIFACT_LIST') {
      setCurrentMode(null);
      setView('HOME');
    }
  };

  // Render the specific content view based on mode
  const renderContentView = () => {
    if (!currentMode) return null;

    switch (currentMode) {
      case ModeType.COMMENT_BOARD:
        if (!selectedArtifact) return null;
        return <CommentBoard artifact={selectedArtifact} />;
        
      case ModeType.CROWD_CHAT:
        if (!selectedArtifact) return null;
        return <ChatInterface artifact={selectedArtifact} />;
        
      case ModeType.FOLLOW_ME:
        return <FollowMeView onTaskStart={handleTaskStart} />;
        
      case ModeType.COLLECTIVE_STORY:
        return <CollectiveStoryView onTaskStart={handleTaskStart} />;
        
      default:
        return <div>Unknown Mode</div>;
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center h-screen bg-[#f5f5f0] text-stone-500 gap-4">
        <Loader2 size={32} className="animate-spin text-[#b45309]" />
        <span className="font-serif-sc text-sm tracking-widest">正在载入文物数据...</span>
      </div>
    );
  }

  // View: Experiment ID Input
  if (view === 'ID_INPUT') {
    return (
      <div className="flex flex-col items-center justify-center h-screen bg-[#f5f5f0] text-stone-800 gap-6 p-4">
        <div className="text-center">
          <h1 className="text-2xl font-serif-sc font-bold mb-2 text-[#b45309]">参与者编号</h1>
          <p className="text-stone-500 text-sm">请输入实验分配给您的编号</p>
        </div>
        <form onSubmit={handleIdSubmit} className="flex flex-col gap-4 w-full max-w-xs">
          <div className="flex items-center gap-2 bg-white p-3 rounded-lg border border-stone-300 shadow-sm focus-within:ring-2 focus-within:ring-[#b45309]">
            <span className="text-stone-400 font-bold">P</span>
            <input 
              type="number" 
              value={participantIdInput}
              onChange={(e) => setParticipantIdInput(e.target.value)}
              placeholder="请输入数字"
              className="flex-1 bg-transparent border-none outline-none text-lg font-mono placeholder:font-sans"
              autoFocus
            />
          </div>
          <button 
            type="submit" 
            disabled={!participantIdInput}
            className="bg-[#1c1917] text-[#e7e5e4] py-3 rounded-lg font-serif-sc font-bold tracking-wider hover:bg-[#b45309] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            开始体验
          </button>
        </form>
      </div>
    );
  }

  // View: Mode Selection (Home)
  if (view === 'HOME') {
    return <ModeSelector onSelect={handleModeSelect} assignedMainMode={assignedMainMode} />;
  }

  return (
    <div className="relative h-screen w-full max-w-lg mx-auto bg-[#f5f5f0] shadow-2xl flex flex-col overflow-hidden border-x border-stone-200">
      {/* Header */}
      <header className="flex-shrink-0 h-16 bg-[#1c1917] border-b-4 border-[#b45309] flex items-center px-4 z-20 shadow-lg relative">
        <button 
          onClick={handleBack} 
          className={`p-2 -ml-2 rounded-full transition-colors flex items-center justify-center
            ${isLocked 
              ? 'text-stone-600 opacity-50 cursor-not-allowed' // Visually disabled/gray
              : 'text-stone-400 hover:text-white hover:bg-white/10' // Active state
            }`}
        >
          <ChevronLeft size={24} />
        </button>
        
        {/* Header Title changes based on view */}
        <div className="flex-1 text-center pr-8">
           {view === 'ARTIFACT_LIST' && (
             <span className="text-[#e7e5e4] font-serif-sc font-bold tracking-wide">文物列表</span>
           )}
           {view === 'CONTENT_VIEW' && (
             <div className="flex flex-col items-center justify-center leading-tight">
               <span className="text-[#e7e5e4] font-serif-sc font-bold tracking-wide">
                 {isTourMode(currentMode) 
                   ? (currentMode === ModeType.FOLLOW_ME ? getFollowMeGuideProfile().name : '跟TA们走')
                   : (currentMode === ModeType.CROWD_CHAT ? 'TA们说' : selectedArtifact?.name)}
               </span>
             </div>
           )}
        </div>
      </header>

      {/* Main Content Area */}
      <main className="flex-1 overflow-hidden relative bg-[#f5f5f0]">
        {view === 'ARTIFACT_LIST' && (
          <ArtifactList 
            artifacts={getArtifactsList()} 
            onSelect={handleArtifactSelect} 
          />
        )}
        
        {view === 'CONTENT_VIEW' && renderContentView()}
      </main>

      {/* Experiment Toast */}
      {showTimeToast && (
        <div className="absolute bottom-24 left-1/2 transform -translate-x-1/2 z-[60] w-max max-w-[80%] animate-in fade-in zoom-in-95 duration-200">
          <div className="bg-stone-800/90 backdrop-blur text-white px-6 py-3 rounded-xl shadow-2xl flex items-center justify-center border border-stone-700">
            <span className="text-sm font-serif-sc tracking-wide">时间还没到，再逛逛吧！</span>
          </div>
        </div>
      )}
    </div>
  );
}

export default App;