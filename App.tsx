import React, { useState, useRef } from 'react';
import ConfigForm from './components/ConfigForm';
import MangaPanel from './components/MangaPanel';
import { Difficulty, CharacterSet, PanelData, CharacterConfig, ColorMode } from './types';
import { generateMangaScript, generatePanelImage } from './services/geminiService';
import { ArrowLeft, Download } from 'lucide-react';

const App: React.FC = () => {
  const [loading, setLoading] = useState(false);
  const [panels, setPanels] = useState<PanelData[]>([]);
  const [currentTopic, setCurrentTopic] = useState('');
  const [error, setError] = useState<string | null>(null);
  const comicRef = useRef<HTMLDivElement>(null);
  const [isDownloading, setIsDownloading] = useState(false);
  const [characterConfig, setCharacterConfig] = useState<CharacterConfig | null>(null);
  const [selectedColorMode, setSelectedColorMode] = useState<ColorMode>(ColorMode.B_AND_W);

  const handleGenerate = async (topic: string, difficulty: Difficulty, config: CharacterConfig, colorMode: ColorMode) => {
    setLoading(true);
    setError(null);
    setPanels([]);
    setCurrentTopic(topic);
    setCharacterConfig(config);
    setSelectedColorMode(colorMode);

    try {
      // Step 1: Generate Script
      const initialPanels = await generateMangaScript(topic, difficulty, config);
      setPanels(initialPanels);
      setLoading(false);

      // Step 2: Generate Images in Parallel (Fire and forget updates)
      initialPanels.forEach(async (panel) => {
        try {
          // Update state to loading for this specific panel
          setPanels(prev => prev.map(p => 
            p.panelNumber === panel.panelNumber ? { ...p, imageState: 'loading' } : p
          ));

          const imageUrl = await generatePanelImage(panel, config, colorMode);

          // Update state with generated image
          setPanels(prev => prev.map(p => 
            p.panelNumber === panel.panelNumber ? { ...p, imageState: 'generated', imageUrl } : p
          ));
        } catch (err) {
          console.error(`Failed to generate panel ${panel.panelNumber}`, err);
          setPanels(prev => prev.map(p => 
            p.panelNumber === panel.panelNumber ? { ...p, imageState: 'error' } : p
          ));
        }
      });

    } catch (err) {
      console.error(err);
      setError("Failed to generate manga script. Please try again.");
      setLoading(false);
    }
  };

  const handleReset = () => {
    setPanels([]);
    setCurrentTopic('');
    setError(null);
    setCharacterConfig(null);
  };

  const handleDownload = async () => {
    if (!comicRef.current) return;
    setIsDownloading(true);
    
    try {
      // @ts-ignore - html2canvas is loaded globally via CDN
      const canvas = await window.html2canvas(comicRef.current, {
        useCORS: true,
        scale: 2, // High resolution
        backgroundColor: '#ffffff',
        logging: false
      });
      
      const link = document.createElement('a');
      link.download = `MangaGenius_${currentTopic}.png`;
      link.href = canvas.toDataURL('image/png');
      link.click();
    } catch (err) {
      console.error("Download failed:", err);
      alert("无法下载漫画，请稍后重试。");
    } finally {
      setIsDownloading(false);
    }
  };

  return (
    <div className="min-h-screen pb-20">
      {/* Header */}
      <header className="bg-black text-white p-4 sticky top-0 z-50 border-b-4 border-yellow-400 shadow-md">
        <div className="max-w-6xl mx-auto flex justify-between items-center">
          <div className="flex items-center gap-2">
             <h1 className="text-xl md:text-2xl font-black tracking-tighter text-yellow-300">
            MangaGenius <span className="text-white font-normal text-sm opacity-80 ml-2 hidden sm:inline">科普漫画生成器</span>
            </h1>
            {characterConfig?.customImagePreview && (
              <div className="ml-4 w-8 h-8 rounded-full border-2 border-yellow-400 overflow-hidden hidden md:block">
                <img src={characterConfig.customImagePreview} alt="User Char" className="w-full h-full object-cover" />
              </div>
            )}
          </div>
         
          <div className="flex gap-2">
            {panels.length > 0 && (
              <>
                <button 
                  onClick={handleDownload}
                  disabled={isDownloading}
                  className="flex items-center gap-1 text-sm font-bold bg-yellow-400 text-black px-3 py-1 hover:bg-yellow-300 transition-colors disabled:opacity-50"
                >
                  <Download className="w-4 h-4" /> 
                  {isDownloading ? '保存中...' : '下载全篇'}
                </button>
                <button 
                  onClick={handleReset}
                  className="flex items-center gap-1 text-sm font-bold bg-white text-black px-3 py-1 hover:bg-gray-100 transition-colors"
                >
                  <ArrowLeft className="w-4 h-4" /> <span className="hidden sm:inline">重置</span>
                </button>
              </>
            )}
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        {/* Config Form Mode */}
        {panels.length === 0 && !loading && (
          <div className="flex flex-col items-center justify-center min-h-[60vh]">
            <ConfigForm isLoading={loading} onSubmit={handleGenerate} />
            {error && (
              <div className="mt-6 bg-red-100 border-2 border-red-500 text-red-700 p-4 font-bold max-w-lg">
                {error}
              </div>
            )}
          </div>
        )}

        {/* Loading Initial Script */}
        {loading && panels.length === 0 && (
          <div className="flex flex-col items-center justify-center min-h-[50vh] animate-pulse">
            <div className="w-16 h-16 border-4 border-black border-t-yellow-400 rounded-full animate-spin mb-4"></div>
            <p className="text-xl font-bold font-mono">正在编写剧本...</p>
          </div>
        )}

        {/* Manga Grid Display */}
        {panels.length > 0 && (
          <div className="max-w-4xl mx-auto">
            {/* Download Target Area */}
            <div ref={comicRef} className="bg-white p-8 mb-8 border-2 border-transparent"> 
              <div className="mb-8 text-center border-b-2 border-black pb-4">
                 <h2 className="text-3xl font-black mb-2">{currentTopic}</h2>
                 <p className="text-gray-600 text-sm font-bold uppercase tracking-widest">
                   AI Generated Educational Comic {selectedColorMode !== ColorMode.B_AND_W && '(Color)'}
                 </p>
              </div>

              <div className={`grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-8`}>
                {panels.map((panel) => (
                  <MangaPanel 
                    key={panel.panelNumber} 
                    data={panel} 
                    isColor={selectedColorMode !== ColorMode.B_AND_W}
                  />
                ))}
              </div>

              <div className="mt-12 text-center text-gray-400 text-xs">
                Generated by MangaGenius (Gemini 2.5)
              </div>
            </div>
            
            <div className="text-center text-gray-500 text-sm mb-12">
               提示：您可以点击上方“下载全篇”保存长图，或将鼠标悬停在单格上下载原图。
            </div>
          </div>
        )}
      </main>
    </div>
  );
};

export default App;