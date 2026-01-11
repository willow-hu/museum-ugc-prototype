import React, { useState, useEffect } from 'react';
import { ContentItem, ModeType, Artifact } from '../../types';
import { Quote, PenTool } from 'lucide-react';
import { getArtifactContent } from '../../data';
import { sessionStore } from '../../services/sessionStore';
import { logger } from '../../services/logger';
import InputModal from '../modules/InputModal';

interface CommentBoardProps {
  artifact: Artifact;
}

const CommentBoard: React.FC<CommentBoardProps> = ({ artifact }) => {
  const [data, setData] = useState<ContentItem[]>([]);
  const [isInputModalOpen, setIsInputModalOpen] = useState(false);
  
  // Toast State
  const [showToast, setShowToast] = useState(false);
  // Use a counter to reset the timer if user submits multiple times quickly
  const [toastTrigger, setToastTrigger] = useState(0);

  // Load Data
  useEffect(() => {
    logger.startPageTimer();
    const staticData = getArtifactContent(artifact.id, ModeType.COMMENT_BOARD);
    const userData = sessionStore.getComments(artifact.id);
    setData([...userData, ...staticData]);
    
    return () => {
        logger.logPageDwell(ModeType.COMMENT_BOARD);
    };
  }, [artifact.id]);

  // Toast Timer Logic
  useEffect(() => {
    if (showToast) {
      const timer = setTimeout(() => {
        setShowToast(false);
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [showToast, toastTrigger]);

  const handleInputSubmit = (type: 'text' | 'audio', content: string | Blob, blobUrl?: string) => {
    const currentUser = sessionStore.getCurrentUser();
    
    const newItem: ContentItem = {
      id: `u-${Date.now()}`,
      artifactId: artifact.id,
      mode: ModeType.COMMENT_BOARD,
      speaker: currentUser.name,
      avatarUrl: currentUser.avatarUrl,
      content: type === 'text' ? (content as string) : '[语音留言]',
      isUser: true,
      timestamp: '刚刚'
    };

    logger.logSubmission(ModeType.COMMENT_BOARD, type, content, blobUrl);
    sessionStore.addComment(artifact.id, newItem);
    setData(prev => [newItem, ...prev]);

    // Show Toast & Reset Timer
    setShowToast(true);
    setToastTrigger(prev => prev + 1);
  };

  return (
    <div className="h-full relative bg-[#f5f5f0]">
      <div className="h-full overflow-y-auto">
        <div className="p-3 pb-32">
          {/* Masonry Layout */}
          <div className="columns-2 gap-3 space-y-3">
            {data.map((item) => {
              const isUser = item.isUser;
              return (
                <div key={item.id} className="break-inside-avoid mb-3 p-3 rounded-sm shadow-sm border relative bg-[#fffefb] border-stone-200">
                  <Quote className="absolute top-2 right-2 text-stone-100" size={20} />
                  <div className="relative z-10">
                    <div className="flex items-center gap-2 mb-2">
                       <div className={`w-6 h-6 rounded-full overflow-hidden flex-shrink-0 border ${isUser ? 'border-[#1c1917]' : 'border-stone-200'}`}>
                         <img src={item.avatarUrl} alt={item.speaker} className="w-full h-full object-cover"/>
                       </div>
                       <span className={`text-xs font-serif-sc tracking-wide truncate ${isUser ? 'font-bold text-[#1c1917]' : 'font-bold text-[#57534e]'}`}>
                         {item.speaker}
                       </span>
                    </div>
                    <p className="text-xs leading-relaxed font-serif-sc tracking-wide text-justify break-words text-[#292524]">
                      {item.content}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
          
          {data.length === 0 && (
            <div className="text-center text-stone-400 py-16 font-serif-sc">
              <p>纸短情长，静待君语。</p>
            </div>
          )}
        </div>
      </div>

      {/* Centered Success Toast */}
      <div 
        className={`fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-[100] transition-all duration-500 ease-in-out pointer-events-none 
          ${showToast ? 'opacity-100 scale-100' : 'opacity-0 scale-95'}`}
      >
        <div className="bg-black/80 backdrop-blur-md text-white p-6 rounded-2xl shadow-2xl flex flex-col items-center justify-center text-center w-64 border border-white/10">
          <div className="text-4xl mb-3">😊</div>
          <h3 className="text-base font-bold font-serif-sc mb-2 tracking-wide">感谢您的分享！</h3>
          <p className="text-xs text-stone-300 font-serif-sc leading-relaxed opacity-90">
            您的想法可能会被记录<br/>并分享给其他用户
          </p>
        </div>
      </div>

      <div className="absolute bottom-6 right-6 z-40">
        <button 
          onClick={() => setIsInputModalOpen(true)}
          type="button"
          className="w-14 h-14 bg-[#9f1239] text-white rounded-full shadow-xl flex items-center justify-center hover:bg-[#881337] active:scale-90 transition-all ring-1 ring-white/20 cursor-pointer"
          style={{boxShadow: "0 4px 20px rgba(159, 18, 57, 0.4)"}}
        >
          <PenTool size={24} />
        </button>
      </div>

      <InputModal 
        isOpen={isInputModalOpen} 
        onClose={() => setIsInputModalOpen(false)} 
        onSubmit={handleInputSubmit}
      />
    </div>
  );
};

export default CommentBoard;