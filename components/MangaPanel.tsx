import React from 'react';
import { PanelData } from '../types';
import { Loader2, AlertCircle, Download } from 'lucide-react';

interface MangaPanelProps {
  data: PanelData;
  isColor?: boolean;
}

const MangaPanel: React.FC<MangaPanelProps> = ({ data, isColor = false }) => {
  return (
    <div className="relative w-full aspect-square border-4 border-black bg-white overflow-hidden shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] transition-transform hover:-translate-y-1 hover:shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] group">
      {/* Panel Number Badge */}
      <div className="absolute top-0 left-0 bg-black text-white px-3 py-1 text-sm font-bold z-20 border-b-2 border-r-2 border-white">
        #{data.panelNumber}
      </div>

      {/* Download Action (Individual) */}
      {data.imageState === 'generated' && data.imageUrl && (
        <a 
          href={data.imageUrl} 
          download={`panel_${data.panelNumber}.png`}
          className="absolute top-0 right-0 bg-white text-black p-2 z-20 border-b-2 border-l-2 border-black opacity-0 group-hover:opacity-100 transition-opacity hover:bg-yellow-300"
          title="Download original image"
        >
          <Download className="w-4 h-4" />
        </a>
      )}

      {/* Image State Handling */}
      <div className="w-full h-full flex items-center justify-center bg-gray-50 relative">
        {data.imageState === 'pending' && (
          <div className="text-gray-400 text-sm flex flex-col items-center">
            <div className="w-8 h-8 rounded-full border-2 border-gray-300 mb-2"></div>
            等待绘制...
          </div>
        )}
        
        {data.imageState === 'loading' && (
          <div className="flex flex-col items-center text-gray-600">
            <Loader2 className="w-8 h-8 animate-spin mb-2 text-black" />
            <span className="text-xs font-bold animate-pulse">AI 正在绘图...</span>
          </div>
        )}

        {data.imageState === 'error' && (
          <div className="flex flex-col items-center text-red-500 p-4 text-center">
            <AlertCircle className="w-8 h-8 mb-2" />
            <span className="text-xs">生成失败</span>
          </div>
        )}

        {data.imageState === 'generated' && data.imageUrl && (
          <>
            <img 
              src={data.imageUrl} 
              alt={`Panel ${data.panelNumber}`} 
              className={`w-full h-full object-cover filter contrast-[1.15] ${!isColor ? 'grayscale' : ''}`}
            />
             {/* Halftone / Screentone Overlay - Only show in B&W mode for authenticity */}
            {!isColor && (
              <div className="absolute inset-0 pointer-events-none opacity-20 bg-[radial-gradient(circle,#000_1px,transparent_1px)] [background-size:4px_4px] mix-blend-multiply"></div>
            )}
          </>
        )}
      </div>

      {/* Speech Bubble Overlay */}
      {data.dialogue && (
        <div className="absolute bottom-3 right-3 left-3 z-30 flex justify-center pointer-events-none">
          <div className="bg-white border-[3px] border-black rounded-[20px] p-3 shadow-sm max-w-full pointer-events-auto relative">
             <p className="text-black text-sm font-bold leading-snug font-sans text-justify break-words">
              {data.dialogue}
            </p>
             {/* Bubble Tail to indicate speaker (generic placement) */}
             <div className="absolute -bottom-[10px] right-[20%] w-4 h-4 bg-white border-r-[3px] border-b-[3px] border-black transform rotate-45"></div>
          </div>
        </div>
      )}
    </div>
  );
};

export default MangaPanel;