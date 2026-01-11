import React, { useEffect, useRef, useState } from 'react';
import { ContentItem, ModeType, Artifact } from '../../types';
import { getArtifactContent, getUserAvatar } from '../../data';
import { sessionStore } from '../../services/sessionStore';
import { logger } from '../../services/logger';
import InputModal from '../modules/InputModal';

interface ChatInterfaceProps {
  artifact: Artifact;
}

const ChatInterface: React.FC<ChatInterfaceProps> = ({ artifact }) => {
  const bottomRef = useRef<HTMLDivElement>(null);
  const [groupedData, setGroupedData] = useState<Record<string, ContentItem[]>>({});
  
  // Track which topic card is currently being replied to
  const [activeReplyItem, setActiveReplyItem] = useState<ContentItem | null>(null);

  // Toast state
  const [showToast, setShowToast] = useState(false);
  const [toastTrigger, setToastTrigger] = useState(0);

  // Load and Group Data
  useEffect(() => {
    logger.startPageTimer();
    const staticData = getArtifactContent(artifact.id, ModeType.CROWD_CHAT);
    const userData = sessionStore.getChatMessages(artifact.id);
    const rawData = [...staticData, ...userData];
    
    // Group by topic
    const groups: Record<string, ContentItem[]> = {};
    
    rawData.forEach(item => {
        const topic = item.topic || '我的观点';
        if (!groups[topic]) {
            groups[topic] = [];
        }
        groups[topic].push(item);
    });

    setGroupedData(groups);

    return () => {
        logger.logPageDwell(ModeType.CROWD_CHAT);
    };
  }, [artifact.id, activeReplyItem]); 

  // Toast Timer Logic
  useEffect(() => {
    if (showToast) {
      const timer = setTimeout(() => {
        setShowToast(false);
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [showToast, toastTrigger]);

  const handleModalSubmit = (type: 'text' | 'audio', content: string | Blob, blobUrl?: string) => {
    if (!activeReplyItem) return;

    const currentUser = sessionStore.getCurrentUser();
    const textContent = type === 'text' ? (content as string) : '[语音留言]';
    
    const newItem: ContentItem = {
      id: `u-${Date.now()}`,
      artifactId: artifact.id,
      mode: ModeType.CROWD_CHAT,
      speaker: currentUser.name,
      avatarUrl: currentUser.avatarUrl,
      content: textContent,
      isUser: true,
      timestamp: '刚刚',
      topic: activeReplyItem.topic || '我的观点',
      contributingUsers: [currentUser.name]
    };

    logger.logSubmission(ModeType.CROWD_CHAT, type, content, blobUrl);
    sessionStore.addChatMessage(artifact.id, newItem);
    
    setGroupedData(prev => {
        const topic = newItem.topic || '我的观点';
        const newGroup = [...(prev[topic] || []), newItem];
        return { ...prev, [topic]: newGroup };
    });

    // Show Toast & Reset Timer
    setShowToast(true);
    setToastTrigger(prev => prev + 1);
  };

  return (
    <div className="flex flex-col h-full bg-[#f5f5f0] relative">
      {/* Forum Content Area */}
      <div className="flex-1 overflow-y-auto p-4 pb-12 space-y-6">
        <div className="mb-2">
            <h2 className="text-xl font-bold font-serif-sc text-[#292524] mb-1">{artifact.name}</h2>
        </div>

        {(Object.entries(groupedData) as [string, ContentItem[]][]).map(([topic, items]) => {
          if (items.length === 0) return null;
          
          const mainPost = items[0];
          const replies = items.slice(1);
          
          const allContributors = new Set<string>();
          items.forEach(i => {
             if (i.contributingUsers) i.contributingUsers.forEach(u => allContributors.add(u));
             else allContributors.add(i.speaker);
          });
          const userCount = allContributors.size;
          const isUserPost = mainPost.isUser;

          return (
            <div 
                key={mainPost.id} 
                className={`bg-white rounded-xl shadow-sm border border-stone-200 relative overflow-hidden transition-all flex flex-col
                  ${isUserPost ? 'border-l-4 border-l-[#b45309]' : 'border-l-4 border-l-stone-300'}`}
            >
                <div className="p-5 pb-2">
                    <div className="flex items-start justify-between mb-3 gap-2">
                        <h3 className={`font-serif-sc font-bold text-lg leading-tight flex-1
                            ${isUserPost ? 'text-[#b45309]' : 'text-[#44403c]'}`}>
                            {topic}
                        </h3>
                        <div className="flex flex-col items-end flex-shrink-0">
                            <div className="flex pl-2 mb-1">
                                {Array.from(allContributors).slice(0, 5).reverse().map((user, idx) => (
                                    <div key={`${topic}-u-${idx}`} className="w-6 h-6 rounded-full border border-white overflow-hidden -ml-2 bg-stone-200 shadow-sm z-10"
                                        style={{zIndex: 5-idx}}
                                    >
                                        <img src={getUserAvatar(user)} alt={user} className="w-full h-full object-cover" />
                                    </div>
                                ))}
                            </div>
                            <span className="text-[10px] text-stone-400 font-medium font-serif-sc">
                                总结自{userCount}人想法
                            </span>
                        </div>
                    </div>

                    <div className="mb-4">
                        <p className="text-stone-700 text-sm leading-7 font-serif-sc text-justify">{mainPost.content}</p>
                    </div>

                    {replies.length > 0 && (
                        <div className="mt-4 pt-4 border-t border-stone-100 space-y-3">
                            {replies.map((reply) => (
                                <div key={reply.id} className="flex gap-3 bg-stone-50 p-3 rounded-lg">
                                    <div className="w-8 h-8 rounded-full border border-white overflow-hidden flex-shrink-0 shadow-sm">
                                        <img src={reply.avatarUrl} alt={reply.speaker} className="w-full h-full object-cover" />
                                    </div>
                                    <div className="flex-1">
                                        <div className="mb-1">
                                            <span className="text-xs font-bold text-stone-600 font-serif-sc">{reply.speaker}</span>
                                        </div>
                                        <p className="text-xs text-stone-700 leading-relaxed font-serif-sc text-justify">{reply.content}</p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                <div 
                  className="bg-stone-50 p-3 border-t border-stone-100 mt-auto cursor-pointer active:bg-stone-100 transition-colors"
                  onClick={() => setActiveReplyItem(mainPost)}
                >
                    <div className="w-full bg-white border border-stone-200 rounded-full px-4 py-2.5 text-xs text-stone-400 font-serif-sc shadow-sm flex items-center">
                        <span>我也说两句...</span>
                    </div>
                </div>
            </div>
          );
        })}
        <div ref={bottomRef} />
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

      <InputModal 
        isOpen={!!activeReplyItem} 
        onClose={() => setActiveReplyItem(null)} 
        onSubmit={handleModalSubmit}
        title={activeReplyItem ? `讨论：${activeReplyItem.topic}` : '发表观点'}
        placeholder="分享你的见解..."
      />
    </div>
  );
};

export default ChatInterface;