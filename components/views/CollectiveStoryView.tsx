import React, { useEffect, useRef, useState } from 'react';
import { ContentItem, ModeType, Artifact, ChatMessage } from '../../types';
import { getCollectiveStoryScript, getUserAvatar } from '../../data';
import { sessionStore } from '../../services/sessionStore';
import { logger } from '../../services/logger';
import { apiClient } from '../../services/apiClient';
import { Send, CheckCircle2, Play, MapPin } from 'lucide-react';

interface CollectiveStoryViewProps {
  onTaskStart?: (artifactId?: string) => void;
}

type TourPhase = 'locating' | 'exploring';

const CollectiveStoryView: React.FC<CollectiveStoryViewProps> = ({ onTaskStart }) => {
  const bottomRef = useRef<HTMLDivElement>(null);
  const toastTimerRef = useRef<number | null>(null);
  const hasInitializedRef = useRef(false);
  
  // Data Script
  const [script, setScript] = useState<{ artifact: Artifact, content: ContentItem }[]>([]);
  
  // State
  const initialState = sessionStore.getCollectiveStoryState();
  const [currentStage, setCurrentStage] = useState(initialState?.currentStage ?? 0);
  const [chatHistory, setChatHistory] = useState<ChatMessage[]>(initialState?.history ?? []);
  const [isTourComplete, setIsTourComplete] = useState(initialState?.isTourComplete ?? false);
  
  // Flow Control States
  const [hasStarted, setHasStarted] = useState((initialState?.history?.length || 0) > 1);
  const [isFinding, setIsFinding] = useState(false); 
  const [isWaitingForUser, setIsWaitingForUser] = useState(false);

  // New: Phase tracking
  const [tourPhase, setTourPhase] = useState<TourPhase>('locating');

  const [userInput, setUserInput] = useState('');
  const [hasReplied, setHasReplied] = useState(false); 
  const [showToast, setShowToast] = useState(false);
  
  const currentUserAvatar = sessionStore.getCurrentUser().avatarUrl;
  const spriteAvatar = getUserAvatar('小精灵');

  // 1. Initialize Script
  useEffect(() => {
    setScript(getCollectiveStoryScript());
    // 不在这里计时，每个文物单独计时
  }, []);

  // 2. Resume or Start
  useEffect(() => {
    if (script.length === 0) return;

    if (initialState && initialState.history.length > 0) {
      // Restore Logic
      if (!initialState.isTourComplete) {
         const lastMsg = initialState.history[initialState.history.length - 1];
         
         // RESUME LOGIC
         if (lastMsg.type === 'intro_bubble') {
             setIsFinding(true);
             setIsWaitingForUser(false);
             setTourPhase('locating');
         } else if (lastMsg.type === 'guide_text') {
             setIsFinding(false);
             setIsWaitingForUser(true);
             setTourPhase('exploring');
         } else if (lastMsg.type === 'user_text') {
             setIsFinding(false);
             setIsWaitingForUser(true);
             setHasReplied(true);
             setTourPhase('exploring');
         }
      } else {
        setTourPhase('exploring');
      }
    } else if (chatHistory.length === 0) {
      // Start fresh
      if (!hasInitializedRef.current) {
        hasInitializedRef.current = true;
        
        const introMsg: ChatMessage = {
          id: `welcome-${Date.now()}`,
          type: 'guide_text',
          content: '欢迎你加入本次游览，看看大家对这些文物怎么说～',
          speaker: '跟TA们走'
        };
        setChatHistory([introMsg]);

        setIsWaitingForUser(true);
        setHasStarted(false);
        setTourPhase('locating');
      }
    }
  }, [script]);

  // 3. Save State & Scroll
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
    sessionStore.saveCollectiveStoryState({
        history: chatHistory,
        currentStage,
        isTourComplete
    });
  }, [chatHistory, currentStage, isTourComplete]);

  // --- PHASE 1: Start Stage ---
  const startStage = (stageData: { artifact: Artifact, content: ContentItem }) => {
    setIsWaitingForUser(false);
    setHasReplied(false); 
    setIsFinding(false);
    setTourPhase('locating'); 
    
    let delay = 500;

    if (stageData.content.transitionText) {
      setTimeout(() => {
        setChatHistory(prev => [...prev, {
          id: `trans-${Date.now()}`,
          type: 'guide_text',
          content: stageData.content.transitionText,
          speaker: '跟TA们走'
        }]);
      }, delay);
      delay += 1500; 
    }

    setTimeout(() => {
      setChatHistory(prev => [...prev, {
        id: `intro-${Date.now()}`,
        type: 'intro_bubble',
        artifact: stageData.artifact
      }]);
      
      setIsFinding(true);
    }, delay);
  };

  // --- PHASE 2: Provide Content ---
  const provideGuideContent = (stageData: { artifact: Artifact, content: ContentItem }) => {
    let delay = 500;

    setTimeout(() => {
      setChatHistory(prev => [...prev, {
        id: `guide-${Date.now()}`,
        type: 'guide_text',
        content: stageData.content.content,
        speaker: '跟TA们走',
        contributingUsers: stageData.content.contributingUsers
      }]);
      
      setIsWaitingForUser(true);
    }, delay);
  };

  const handleUserSubmit = () => {
    if (!userInput.trim()) return;

    const userMsg: ChatMessage = {
      id: `user-${Date.now()}`,
      type: 'user_text',
      content: userInput,
      speaker: '我'
    };
    
    logger.logSubmission(ModeType.COLLECTIVE_STORY, 'text', userInput);

    // 发送UGC到后端
    const participantId = sessionStore.getParticipantId();
    const currentArtifact = script[currentStage]?.artifact;
    if (participantId && currentArtifact) {
      apiClient.sendUGC({
        participantId,
        content: userInput,
        artifactId: currentArtifact.id,
        mode: ModeType.COLLECTIVE_STORY,
        timestamp: Date.now()
      });
    }

    setChatHistory(prev => [...prev, userMsg]);
    setUserInput('');
    setHasReplied(true); 
    if (showToast) setShowToast(false);
  };

  const handleMainAction = () => {
     // 1. START TOUR
    if (!hasStarted) {
      setHasStarted(true);
      setChatHistory(prev => [...prev, {
        id: `user-start-${Date.now()}`,
        type: 'user_text',
        content: '我准备好了！',
        speaker: '我'
      }]);

      setTimeout(() => {
        setChatHistory(prev => [...prev, { id: `div-start-${Date.now()}`, type: 'divider' }]);
        if (script.length > 0) {
            startStage(script[0]);
        }
      }, 600);
      return;
    }

    // 2. FOUND IT
    if (tourPhase === 'locating') {
        if (!isFinding) return;

        setIsFinding(false);
        setTourPhase('exploring');
        
        const currentArtifact = script[currentStage]?.artifact;

        // Trigger task start (Locking logic)
        if (onTaskStart) onTaskStart(currentArtifact?.id);

        // 开始计时：用户点击"找到了"，开始浏览该文物
        logger.startPageTimer(ModeType.COLLECTIVE_STORY, currentArtifact?.id || null);

        setChatHistory(prev => [...prev, {
            id: `user-found-${Date.now()}`,
            type: 'user_text',
            content: '我找到了！',
            speaker: '我'
        }]);
        provideGuideContent(script[currentStage]);
        return;
    }

    // 3. NEXT ARTIFACT
    if (tourPhase === 'exploring') {
        if (!hasReplied) {
          setShowToast(true);
          if (toastTimerRef.current) window.clearTimeout(toastTimerRef.current);
          toastTimerRef.current = window.setTimeout(() => setShowToast(false), 2000);
          return;
        }
        
        setIsWaitingForUser(false);
        setShowToast(false);

        // 结束计时：用户点击"看完了"，结束当前文物浏览
        const currentArtifact = script[currentStage]?.artifact;
        logger.logPageDwell(ModeType.COLLECTIVE_STORY, currentArtifact?.id || null);

        const nextStage = currentStage + 1;
        if (nextStage < script.length) {
          setChatHistory(prev => [...prev, {
            id: `auto-next-${Date.now()}`,
            type: 'user_text',
            content: '我们去下一个文物看看吧！',
            speaker: '我'
          }]);

          setTimeout(() => {
            setChatHistory(prev => [...prev, {
                id: `guide-feedback-${Date.now()}`,
                type: 'guide_text',
                content: '感谢您的分享！我会把您的想法加入我的总结，分享给后来人。',
                speaker: '跟TA们走'
            }]);

            setTimeout(() => {
                setCurrentStage(nextStage);
                setChatHistory(prev => [...prev, { id: `div-${Date.now()}`, type: 'divider' }]);
                startStage(script[nextStage]);
            }, 1000);

          }, 600);
        } else {
          setIsTourComplete(true);
          setTimeout(() => {
            setChatHistory(prev => [...prev, { 
              id: `end-${Date.now()}`, 
              type: 'guide_text', 
              content: '这段游览就到这里，感谢你一路同行。', 
              speaker: '跟TA们走'
            }]);
          }, 600);
        }
    }
  };

  // Button Config Logic
  const getButtonConfig = () => {
    // Unified Styles
    const activeStyle = 'bg-[#312e81] text-white border-[#312e81] hover:bg-[#1e1b4b] active:scale-95 shadow-md px-5';
    const inactiveStyle = 'bg-stone-200 text-stone-400 border-stone-200 px-5 cursor-not-allowed';

    if (!hasStarted) {
        return {
            text: '开始游览',
            icon: <Play size={16} fill="currentColor" />,
            style: activeStyle,
            disabled: false
        };
    }
    if (isTourComplete) {
       return {
          text: '已结束',
          icon: <CheckCircle2 size={16} />,
          style: inactiveStyle,
          disabled: true
       };
    }
    
    // Phase 1: Locating (Target: "Found It")
    if (tourPhase === 'locating') {
        if (isFinding) {
            return {
                text: '找到了',
                icon: <MapPin size={16} />,
                style: activeStyle,
                disabled: false
            };
        } else {
            return {
                text: '找到了',
                icon: <MapPin size={16} />,
                style: inactiveStyle,
                disabled: true
            };
        }
    }

    // Phase 2: Exploring (Target: "Finished")
    if (hasReplied) {
        return {
            text: '看完了',
            icon: <CheckCircle2 size={16} />,
            style: activeStyle,
            disabled: false
        };
    } else {
        return {
            text: '看完了',
            icon: <CheckCircle2 size={16} />,
            style: inactiveStyle,
            disabled: !isWaitingForUser // Disable if guide speaking, Enable (gray) if waiting input for toast
        };
    }
  };

  const btnConfig = getButtonConfig();
  const inputDisabled = !isWaitingForUser || !hasStarted || isFinding || isTourComplete;

  return (
    <div className="relative h-full flex flex-col bg-[#f5f5f0]">
      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-6 pb-24 scroll-smooth">
        {chatHistory.map((msg) => {
          if (msg.type === 'divider') {
             return (
               <div key={msg.id} className="flex items-center justify-center py-4 opacity-50">
                 <div className="h-px bg-stone-300 w-16"></div>
                 <div className="mx-2 text-stone-400 text-lg font-serif-sc">·</div>
                 <div className="h-px bg-stone-300 w-16"></div>
               </div>
             );
          }
          const isUser = msg.type === 'user_text';

          return (
            <div key={msg.id} className={`flex gap-3 ${isUser ? 'flex-row-reverse' : 'flex-row'}`}>
              <div className="flex-shrink-0 mt-1">
                 {isUser ? (
                    <div className="w-9 h-9 rounded-full overflow-hidden shadow-sm bg-stone-100">
                       <img src={currentUserAvatar} alt="我" className="w-full h-full object-cover" />
                    </div>
                 ) : (
                    <div className="w-9 h-9 rounded-full overflow-hidden shadow-sm bg-[#ffdfbf]">
                       <img src={spriteAvatar} alt="小精灵" className="w-full h-full object-cover" />
                    </div>
                 )}
              </div>

              <div className={`flex flex-col max-w-[85%] ${isUser ? 'items-end' : 'items-start'}`}>
                {msg.type === 'intro_bubble' && msg.artifact && (
                  <div className="bg-white p-2 rounded-lg rounded-tl-none shadow-md border border-stone-200 mb-2 flex items-center gap-3 w-auto inline-block">
                    <div className="w-10 h-10 rounded bg-stone-100 overflow-hidden flex-shrink-0"><img src={msg.artifact.imageUrl} alt="" className="w-full h-full object-cover" /></div>
                    <div className="pr-2"><div className="font-bold text-stone-800 font-serif-sc">{msg.artifact.name}</div></div>
                  </div>
                )}
                {(msg.type === 'guide_text' || msg.type === 'user_text') && (
                  <div className={`px-4 py-3 rounded-2xl text-sm leading-7 shadow-sm border font-serif-sc tracking-wide
                    ${isUser ? 'bg-stone-800 text-stone-100 rounded-tr-none border-stone-700' : 'bg-[#eef2ff] border-[#c7d2fe] text-stone-800 rounded-tl-none'}`}>
                    {msg.content}
                    
                    {/* User Contribution Stack */}
                    {!isUser && msg.contributingUsers && msg.contributingUsers.length > 0 && (
                      <div className="mt-3 pt-2 border-t border-indigo-200/50 flex items-center justify-end gap-2">
                        <div className="flex items-center pl-2">
                          {msg.contributingUsers.slice(0, 5).reverse().map((user, idx, arr) => {
                             const opacity = 0.4 + (idx * 0.15); // Gradient opacity
                             return (
                               <div 
                                 key={user}
                                 className="w-5 h-5 rounded-full border border-white overflow-hidden -ml-2 first:ml-0 bg-stone-200 shadow-sm"
                                 style={{ opacity: opacity }}
                               >
                                 <img src={getUserAvatar(user)} alt="" className="w-full h-full object-cover" />
                               </div>
                             );
                          })}
                        </div>
                        <span className="text-[10px] text-indigo-800/60 font-medium">
                          总结自{msg.contributingUsers.length}人想法
                        </span>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          );
        })}
        <div ref={bottomRef} />
      </div>

      {/* Toast */}
      {showToast && (
        <div className="absolute bottom-20 left-1/2 transform -translate-x-1/2 z-30 animate-in fade-in zoom-in-95 duration-200">
          <div className="bg-black/70 backdrop-blur-sm text-white px-4 py-2 rounded-lg shadow-lg text-sm font-serif-sc tracking-wide whitespace-nowrap">聊聊你的想法再走吧</div>
          <div className="w-0 h-0 border-l-[6px] border-l-transparent border-r-[6px] border-r-transparent border-t-[6px] border-t-black/70 absolute left-8 -bottom-[6px]"></div>
        </div>
      )}

      {/* Input Bar */}
      <div className="flex-shrink-0 bg-white border-t border-stone-200 p-3 pb-8 z-20 shadow-[0_-2px_10px_rgba(0,0,0,0.05)]">
           <div className="flex items-center gap-3">
             <button
               onClick={handleMainAction}
               disabled={btnConfig.disabled}
               className={`flex items-center gap-1 px-3 py-2.5 rounded-full text-xs font-bold font-serif-sc transition-all border ${btnConfig.style}`}
             >
               {btnConfig.icon}
               <span className="whitespace-nowrap">{btnConfig.text}</span>
             </button>
             <input type="text" value={userInput} onChange={(e) => setUserInput(e.target.value)} placeholder={!hasStarted ? "准备好就开始吧..." : (isFinding ? "请找到文物..." : (isWaitingForUser ? "留下您的想法..." : "请稍候..."))} disabled={inputDisabled} onKeyDown={(e) => e.key === 'Enter' && !inputDisabled && handleUserSubmit()} className="flex-1 bg-stone-100 border-transparent focus:border-[#b45309] focus:ring-0 rounded-full px-4 py-2.5 text-sm text-stone-800 disabled:opacity-50 transition-all placeholder:text-stone-400" />
             <button onClick={handleUserSubmit} disabled={!userInput.trim() || inputDisabled} className="p-2.5 bg-[#1c1917] text-[#f5f5f4] rounded-full disabled:opacity-50 disabled:bg-stone-300 transition-all active:scale-95"><Send size={18} /></button>
           </div>
        </div>
    </div>
  );
};

export default CollectiveStoryView;