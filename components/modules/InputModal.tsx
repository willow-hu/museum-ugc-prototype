import React, { useState, useEffect, useRef } from 'react';
import { Mic, X, Send } from 'lucide-react';

interface InputModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (type: 'text' | 'audio', content: string | Blob, blobUrl?: string) => void;
  title?: string; // New: Custom title context
  placeholder?: string; // New: Custom placeholder
}

const InputModal: React.FC<InputModalProps> = ({ 
  isOpen, 
  onClose, 
  onSubmit, 
  title = "记录感悟", 
  placeholder = "写下你的想法..." 
}) => {
  const [text, setText] = useState('');
  const [isRecording, setIsRecording] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);
  const timerRef = useRef<number | null>(null);

  // Clear text when opening
  useEffect(() => {
    if (isOpen) {
      setText('');
      setIsRecording(false);
      setRecordingTime(0);
    }
  }, [isOpen]);

  // Cleanup timer on unmount
  useEffect(() => {
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, []);

  if (!isOpen) return null;

  const handleSendText = () => {
    if (!text.trim()) return;
    onSubmit('text', text);
    setText('');
    onClose();
  };

  const toggleRecording = () => {
    if (isRecording) {
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
      setIsRecording(false);
      const mockBlob = new Blob(["mock audio data"], { type: 'audio/webm' });
      const mockUrl = "mock_audio_url_" + Date.now();
      onSubmit('audio', mockBlob, mockUrl);
      setRecordingTime(0);
      onClose();
    } else {
      setIsRecording(true);
      setRecordingTime(0);
      timerRef.current = window.setInterval(() => {
        setRecordingTime(prev => prev + 1);
      }, 1000);
    }
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div 
      className="fixed inset-0 z-50 flex items-end justify-center pointer-events-auto"
      // Use a completely transparent background so users can see the content behind
      // But keep the div to catch clicks outside the modal
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div 
        className="bg-[#f5f5f4] w-full max-w-lg rounded-t-2xl p-6 pb-8 shadow-[0_-10px_40px_rgba(0,0,0,0.1)] animate-in slide-in-from-bottom-10 duration-200" 
        onClick={e => e.stopPropagation()}
      >
        
        {/* Header */}
        <div className="flex justify-between items-center mb-4">
          <h3 className="font-serif-sc font-bold text-sm text-stone-600 tracking-wide truncate pr-4">
            {title}
          </h3>
          <button 
            onClick={onClose} 
            className="p-2 rounded-full hover:bg-stone-200 transition-colors"
            type="button"
          >
            <X size={20} className="text-stone-400" />
          </button>
        </div>

        {/* Text Input Area */}
        <div className="relative mb-4">
          <textarea
            className="w-full h-32 p-4 bg-white rounded-xl border border-stone-200 focus:outline-none focus:ring-2 focus:ring-stone-200 focus:border-stone-400 resize-none text-stone-700 placeholder:text-stone-400 font-serif-sc leading-relaxed text-base transition-all"
            placeholder={placeholder}
            value={text}
            onChange={(e) => setText(e.target.value)}
            disabled={isRecording}
            autoFocus // Automatically trigger keyboard on mobile
          />
        </div>

        {/* Controls */}
        <div className="flex items-center justify-between">
            {/* Voice Button */}
            <button 
              onClick={toggleRecording}
              type="button"
              className={`flex items-center gap-2 px-4 py-2 rounded-full transition-all border ${
                isRecording 
                ? 'bg-red-50 text-red-800 animate-pulse border-red-200' 
                : 'bg-stone-200 text-stone-600 hover:bg-stone-300 border-transparent'
              }`}
            >
              {isRecording ? (
                <div className="w-4 h-4 bg-red-600 rounded-sm" /> 
              ) : (
                <Mic size={18} />
              )}
              <span className="text-sm font-medium">
                {isRecording ? formatTime(recordingTime) : '语音输入'}
              </span>
            </button>

            {/* Send Button */}
            <button 
              onClick={handleSendText}
              type="button"
              disabled={!text.trim() || isRecording}
              className={`flex items-center gap-2 px-6 py-2 rounded-full font-serif-sc font-bold transition-all ${
                text.trim() && !isRecording
                ? 'bg-[#1c1917] text-[#f5f5f4] shadow-lg hover:bg-black active:scale-95'
                : 'bg-stone-200 text-stone-400 cursor-not-allowed'
              }`}
            >
              <span>发布</span>
              <Send size={16} />
            </button>
        </div>
      </div>
    </div>
  );
};

export default InputModal;