import React from 'react';
import { Artifact } from '../../types';
import { ChevronRight } from 'lucide-react';

interface ArtifactListProps {
  artifacts: Artifact[];
  onSelect: (artifact: Artifact) => void;
}

const ArtifactList: React.FC<ArtifactListProps> = ({ artifacts, onSelect }) => {
  return (
    <div className="min-h-full bg-[#f5f5f0] p-4 pb-20 pt-8">
      <div className="space-y-4">
        {artifacts.map((artifact) => (
          <button
            key={artifact.id}
            onClick={() => onSelect(artifact)}
            className="w-full bg-white rounded-lg shadow-sm border border-stone-200 overflow-hidden flex items-center p-3 gap-4 hover:shadow-md transition-all active:scale-[0.99]"
          >
            <div className="h-20 w-20 flex-shrink-0 bg-stone-100 rounded-md overflow-hidden relative border border-stone-100">
              <img 
                src={artifact.imageUrl} 
                alt={artifact.name} 
                className="w-full h-full object-cover"
              />
            </div>
            
            <div className="flex-1 text-left">
              <h3 className="font-serif-sc font-bold text-stone-800 text-lg leading-tight">
                {artifact.name}
              </h3>
            </div>

            <ChevronRight className="text-stone-300" size={24} />
          </button>
        ))}
      </div>
    </div>
  );
};

export default ArtifactList;