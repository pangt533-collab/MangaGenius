import React, { useState, useRef } from 'react';
import { Difficulty, CharacterSet, CharacterConfig, ColorMode } from '../types';
import { Sparkles, BookOpen, User, Gauge, Upload, Camera, Check, RefreshCw, Palette } from 'lucide-react';
import { analyzeCharacterImage } from '../services/geminiService';

interface ConfigFormProps {
  isLoading: boolean;
  onSubmit: (topic: string, difficulty: Difficulty, characterConfig: CharacterConfig, colorMode: ColorMode) => void;
}

const ConfigForm: React.FC<ConfigFormProps> = ({ isLoading, onSubmit }) => {
  const [topic, setTopic] = useState('');
  const [difficulty, setDifficulty] = useState<Difficulty>(Difficulty.BASIC);
  const [selectedSet, setSelectedSet] = useState<CharacterSet>(CharacterSet.DORAEMON);
  const [colorMode, setColorMode] = useState<ColorMode>(ColorMode.B_AND_W);
  
  // Custom Character State
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [customImage, setCustomImage] = useState<string | null>(null);
  const [customDescription, setCustomDescription] = useState<string>('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (topic.trim()) {
      const config: CharacterConfig = {
        type: selectedSet,
        customDescription: selectedSet === CharacterSet.CUSTOM ? customDescription : undefined,
        customName: selectedSet === CharacterSet.CUSTOM ? '我的角色' : undefined,
        customImagePreview: customImage || undefined
      };
      onSubmit(topic, difficulty, config, colorMode);
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Convert to base64 for display and analysis
    const reader = new FileReader();
    reader.onloadend = async () => {
      const base64 = reader.result as string;
      setCustomImage(base64);
      
      // Analyze Image
      setIsAnalyzing(true);
      try {
        const description = await analyzeCharacterImage(base64);
        setCustomDescription(description);
      } catch (err) {
        console.error("Failed to analyze image", err);
        setCustomDescription("一个独特的自定义角色");
      } finally {
        setIsAnalyzing(false);
      }
    };
    reader.readAsDataURL(file);
  };

  // Helper to get icon/color for char sets
  const getCharStyle = (set: CharacterSet) => {
    switch(set) {
      case CharacterSet.DORAEMON: return 'bg-blue-100 text-blue-600';
      case CharacterSet.PIKACHU: return 'bg-yellow-100 text-yellow-600';
      case CharacterSet.SPONGEBOB: return 'bg-yellow-200 text-yellow-700';
      case CharacterSet.ROBOT: return 'bg-gray-100 text-gray-600';
      case CharacterSet.WIZARD: return 'bg-purple-100 text-purple-600';
      case CharacterSet.SUPERHERO: return 'bg-red-100 text-red-600';
      case CharacterSet.CUSTOM: return 'bg-green-100 text-green-600';
      default: return 'bg-gray-50';
    }
  };

  const getColorModeStyle = (mode: ColorMode) => {
    switch(mode) {
      case ColorMode.B_AND_W: return 'bg-gray-100 border-gray-400';
      case ColorMode.COLOR: return 'bg-gradient-to-br from-blue-100 to-green-100 border-blue-300';
      case ColorMode.WARM: return 'bg-orange-100 border-orange-300 text-orange-800';
      case ColorMode.COOL: return 'bg-cyan-100 border-cyan-300 text-cyan-800';
      case ColorMode.VIBRANT: return 'bg-yellow-100 border-purple-300 text-purple-800';
      default: return 'bg-white';
    }
  };

  return (
    <form onSubmit={handleSubmit} className="w-full max-w-2xl mx-auto bg-white p-6 md:p-8 border-[3px] border-black shadow-[8px_8px_0px_0px_rgba(0,0,0,1)]">
      <h2 className="text-2xl font-black mb-6 flex items-center gap-2 uppercase tracking-tighter">
        <Sparkles className="w-6 h-6" />
        漫画设定局
      </h2>

      <div className="space-y-8">
        {/* Topic Input */}
        <div>
          <label className="block font-bold mb-2 flex items-center gap-2 text-lg">
            <BookOpen className="w-5 h-5" /> 科普主题
          </label>
          <input
            type="text"
            value={topic}
            onChange={(e) => setTopic(e.target.value)}
            placeholder="例如：光合作用、黑洞形成..."
            className="w-full border-2 border-black p-4 text-lg focus:outline-none focus:ring-4 focus:ring-yellow-300 font-bold placeholder-gray-400 bg-gray-50"
            disabled={isLoading}
            required
          />
        </div>

        {/* Difficulty Selection */}
        <div>
          <label className="block font-bold mb-3 flex items-center gap-2 text-lg">
            <Gauge className="w-5 h-5" /> 难度 / 篇幅
          </label>
          <div className="grid grid-cols-3 gap-3">
            {Object.values(Difficulty).map((diff) => (
              <label key={diff} className={`
                relative flex flex-col items-center justify-center p-3 border-2 cursor-pointer transition-all h-20
                ${difficulty === diff ? 'border-black bg-yellow-300 shadow-[2px_2px_0px_0px_#000]' : 'border-gray-200 hover:border-black bg-white'}
              `}>
                <input
                  type="radio"
                  name="difficulty"
                  value={diff}
                  checked={difficulty === diff}
                  onChange={() => setDifficulty(diff)}
                  className="absolute opacity-0 w-full h-full cursor-pointer"
                  disabled={isLoading}
                />
                <span className="font-black text-lg">{diff}</span>
                <span className="text-xs font-bold mt-1 opacity-70">
                  {diff === Difficulty.BASIC ? '4格' : diff === Difficulty.ADVANCED ? '6格' : '8格'}
                </span>
              </label>
            ))}
          </div>
        </div>

        {/* Color Mode Selection */}
        <div>
          <label className="block font-bold mb-3 flex items-center gap-2 text-lg">
            <Palette className="w-5 h-5" /> 色彩风格
          </label>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-2">
            {Object.values(ColorMode).map((mode) => (
              <label key={mode} className={`
                relative flex flex-col items-center justify-center p-2 border-2 cursor-pointer transition-all h-16 text-center
                ${colorMode === mode 
                  ? 'border-black shadow-[2px_2px_0px_0px_#000] z-10 scale-105' 
                  : 'border-transparent hover:border-gray-300 opacity-70 hover:opacity-100'}
                ${getColorModeStyle(mode)}
              `}>
                <input
                  type="radio"
                  name="colorMode"
                  value={mode}
                  checked={colorMode === mode}
                  onChange={() => setColorMode(mode)}
                  className="absolute opacity-0 w-full h-full cursor-pointer"
                  disabled={isLoading}
                />
                <span className="font-bold text-xs leading-tight">{mode.split(' ')[0]}</span>
                <span className="text-[10px] opacity-80">{mode.split(' ')[1]?.replace(/[()]/g, '') || ''}</span>
              </label>
            ))}
          </div>
        </div>

        {/* Character Selection Grid */}
        <div>
          <label className="block font-bold mb-3 flex items-center gap-2 text-lg">
            <User className="w-5 h-5" /> 主角阵容
          </label>
          
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {Object.values(CharacterSet).map((char) => (
              <button
                key={char}
                type="button"
                onClick={() => setSelectedSet(char)}
                disabled={isLoading}
                className={`
                  p-3 border-2 text-sm font-bold transition-all flex flex-col items-center justify-center gap-2 min-h-[80px] text-center
                  ${selectedSet === char 
                    ? 'border-black bg-black text-white shadow-[4px_4px_0px_0px_rgba(255,230,0,1)] transform -translate-y-1' 
                    : `border-gray-200 hover:border-black ${getCharStyle(char)}`}
                `}
              >
                {char === CharacterSet.CUSTOM ? <Camera className="w-5 h-5" /> : <User className="w-5 h-5" />}
                {char}
              </button>
            ))}
          </div>

          {/* Custom Character Upload Area */}
          {selectedSet === CharacterSet.CUSTOM && (
            <div className="mt-4 p-4 border-2 border-black border-dashed bg-green-50 animate-in fade-in slide-in-from-top-2">
              <div className="flex flex-col md:flex-row gap-4 items-center">
                {/* Upload Button / Preview */}
                <div 
                  className="w-24 h-24 bg-white border-2 border-black flex items-center justify-center cursor-pointer hover:bg-gray-50 relative overflow-hidden group"
                  onClick={() => fileInputRef.current?.click()}
                >
                  {customImage ? (
                    <img src={customImage} alt="Custom" className="w-full h-full object-cover" />
                  ) : (
                    <Upload className="w-8 h-8 text-gray-400 group-hover:text-black" />
                  )}
                  {isAnalyzing && (
                     <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                        <RefreshCw className="w-6 h-6 text-white animate-spin" />
                     </div>
                  )}
                  <input 
                    type="file" 
                    ref={fileInputRef} 
                    onChange={handleFileUpload} 
                    accept="image/*" 
                    className="hidden" 
                  />
                </div>

                {/* Description Text */}
                <div className="flex-1 w-full">
                  <label className="block text-xs font-bold uppercase text-green-700 mb-1">
                    {isAnalyzing ? '正在分析角色特征...' : '角色外观描述 (AI自动生成)'}
                  </label>
                  <textarea
                    value={customDescription}
                    onChange={(e) => setCustomDescription(e.target.value)}
                    placeholder="上传图片后自动填写，或在此手动描述角色外观（例如：戴着红帽子的长发女孩...）"
                    className="w-full h-24 p-2 border-2 border-green-200 focus:border-black text-sm font-medium resize-none"
                  />
                </div>
              </div>
              <p className="text-xs text-green-700 mt-2 flex items-center gap-1">
                <Check className="w-3 h-3" /> 上传一张清晰的角色图片，AI将自动提取特征用于漫画绘制。
              </p>
            </div>
          )}
        </div>

        <button
          type="submit"
          disabled={isLoading || !topic.trim() || (selectedSet === CharacterSet.CUSTOM && !customDescription)}
          className={`
            w-full py-4 text-xl font-black border-2 border-black uppercase tracking-widest transition-all mt-4
            ${isLoading || !topic.trim() 
              ? 'bg-gray-200 text-gray-400 cursor-not-allowed border-gray-300' 
              : 'bg-black text-white hover:bg-yellow-300 hover:text-black shadow-[6px_6px_0px_0px_rgba(0,0,0,0.2)] hover:shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] hover:-translate-y-1 active:translate-y-0 active:shadow-none'}
          `}
        >
          {isLoading ? 'AI 正在创作中...' : '开始生成漫画'}
        </button>
      </div>
    </form>
  );
};

export default ConfigForm;