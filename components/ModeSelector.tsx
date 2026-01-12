import React from 'react';
import { ModeType } from '../types';
import { MessageSquare, User, LayoutList, BookOpen } from 'lucide-react';

interface ModeSelectorProps {
  onSelect: (mode: ModeType) => void;
  assignedMainMode?: ModeType | null;
}

const ModeSelector: React.FC<ModeSelectorProps> = ({ onSelect, assignedMainMode }) => {
  const modes = [
    {
      id: ModeType.COMMENT_BOARD,
      title: 'TA在说',
      desc: '看看大家怎么说',
      icon: <MessageSquare size={28} />,
      color: 'bg-stone-600', // Stone / Clay
      accent: 'border-stone-200'
    },
    {
      id: ModeType.FOLLOW_ME,
      title: '跟TA走',
      desc: '专属伙伴陪你看',
      icon: <User size={28} />,
      color: 'bg-[#0f766e]', // Jade Green
      accent: 'border-teal-100'
    },
    {
      id: ModeType.CROWD_CHAT,
      title: 'TA们说',
      desc: '探索热门话题',
      icon: <LayoutList size={28} />,
      color: 'bg-[#b45309]', // Bronze / Amber
      accent: 'border-amber-100'
    },
    {
      id: ModeType.COLLECTIVE_STORY,
      title: '跟TA们走',
      desc: '聆听时光的故事',
      icon: <BookOpen size={28} />,
      color: 'bg-[#312e81]', // Indigo / Ink
      accent: 'border-indigo-100'
    },
  ];

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-6 bg-[#e7e5e4] text-stone-800">
      <div className="mb-10 text-center">
        <h1 className="text-3xl font-serif-sc font-bold text-[#292524] mb-3 tracking-wide">观展模式</h1>
        <div className="h-1 w-16 bg-[#b45309] mx-auto rounded-full mb-3"></div>
        {assignedMainMode ? (
          <p className="text-[#b45309] font-serif-sc font-bold text-base bg-amber-50 px-4 py-1 rounded-full inline-block border border-amber-200">
            您的主要模式是：{modes.find(m => m.id === assignedMainMode)?.title}
          </p>
        ) : (
          <p className="text-stone-500 font-serif-sc text-sm">选择一种视角，开启文物探索之旅</p>
        )}
      </div>
      
      <div className="grid grid-cols-2 gap-5 w-full max-w-md">
        {modes.map((mode) => (
          <button
            key={mode.id}
            onClick={() => onSelect(mode.id)}
            className="group flex flex-col items-center justify-center p-5 bg-[#fafaf9] rounded-xl shadow-md hover:shadow-xl transition-all active:scale-95 aspect-square border border-stone-200 relative overflow-hidden"
          >
            <div className={`absolute top-0 left-0 w-full h-1 ${mode.color}`}></div>
            <div className={`p-4 rounded-full ${mode.color} text-[#f5f5f4] mb-4 shadow-sm group-hover:scale-110 transition-transform duration-300`}>
              {mode.icon}
            </div>
            <h3 className="font-serif-sc font-bold text-[#44403c] text-lg tracking-wide">{mode.title}</h3>
          </button>
        ))}
      </div>
    </div>
  );
};

export default ModeSelector;