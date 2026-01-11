import React from 'react';

interface NarratorProfileProps {
  isVisible: boolean;
  onClose: () => void;
  guideInfo: { name: string; avatarUrl: string };
}

const NarratorProfile: React.FC<NarratorProfileProps> = ({ isVisible, onClose, guideInfo }) => {
  if (!isVisible) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center px-6 bg-black/40 backdrop-blur-sm animate-in fade-in duration-300">
      <div className="w-full max-w-sm bg-white rounded-2xl shadow-2xl overflow-hidden transform transition-all scale-100 relative">
        {/* Banner/Header */}
        <div className="h-24 bg-[#0f766e]"></div>
        
        {/* Avatar */}
        <div className="absolute top-12 left-1/2 transform -translate-x-1/2">
           <div className="w-24 h-24 rounded-full border-4 border-white shadow-md overflow-hidden bg-stone-100">
             <img src={guideInfo.avatarUrl} alt={guideInfo.name} className="w-full h-full object-cover" />
           </div>
        </div>

        <div className="pt-16 pb-8 px-6 text-center">
           {/* Name */}
           <h2 className="text-xl font-bold text-stone-800 font-serif-sc mb-1">{guideInfo.name}</h2>
           <p className="text-xs text-stone-400 mb-4">ID: 8920193</p>

           {/* Stats (Mock) */}
           <div className="flex justify-center gap-6 mb-6 text-stone-600 border-b border-stone-100 pb-4">
             <div className="flex flex-col">
               <span className="font-bold text-lg">142</span>
               <span className="text-[10px] text-stone-400">关注</span>
             </div>
             <div className="flex flex-col">
               <span className="font-bold text-lg">3505</span>
               <span className="text-[10px] text-stone-400">粉丝</span>
             </div>
             <div className="flex flex-col">
               <span className="font-bold text-lg">8.2万</span>
               <span className="text-[10px] text-stone-400">获赞与收藏</span>
             </div>
           </div>

           {/* Tags */}
           <div className="flex justify-center gap-2 mb-4">
              <span className="px-3 py-1 bg-orange-50 text-orange-700 text-xs rounded-full border border-orange-100 font-medium">✨ 文化博主</span>
              <span className="px-3 py-1 bg-teal-50 text-teal-700 text-xs rounded-full border border-teal-100 font-medium">🌏 旅行博主</span>
           </div>

           {/* Intro */}
           <div className="text-sm text-stone-600 font-serif-sc leading-relaxed mb-8 flex items-center justify-center gap-2">
              <span>旅行</span> <span className="text-stone-300">|</span>
              <span>看展</span> <span className="text-stone-300">|</span>
              <span>摄影</span> <span className="text-stone-300">|</span>
              <span>苏州</span>
           </div>

           {/* Button */}
           <button 
             onClick={onClose}
             className="w-full py-3 bg-[#0f766e] hover:bg-[#0d9488] text-white rounded-full font-bold shadow-lg shadow-teal-900/20 active:scale-95 transition-all"
           >
             跟随TA
           </button>
        </div>
      </div>
    </div>
  );
};

export default NarratorProfile;