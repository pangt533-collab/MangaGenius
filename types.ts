export enum Difficulty {
  BASIC = '基础',
  ADVANCED = '进阶',
  DEEP = '深入',
}

export enum ColorMode {
  B_AND_W = '黑白 (经典)',
  COLOR = '彩色 (标准)',
  WARM = '暖色 (温馨)',
  COOL = '冷色 (科技)',
  VIBRANT = '鲜艳 (波普)',
}

export enum CharacterSet {
  DORAEMON = '哆啦A梦与大雄',
  PIKACHU = '皮卡丘与小智',
  SPONGEBOB = '海绵宝宝与派大星',
  SCIENTIST = '疯狂科学家与助手',
  ROBOT = '未来机器人',
  WIZARD = '魔法学徒',
  SUPERHERO = '少年英雄',
  CUSTOM = '自定义/上传'
}

export interface CharacterConfig {
  type: CharacterSet;
  customDescription?: string; // Generated from image or manually entered
  customName?: string; // Name for the script
  customImagePreview?: string; // For UI display only
}

export interface PanelData {
  panelNumber: number;
  visualDescription: string;
  dialogue: string;
  imageState: 'pending' | 'loading' | 'generated' | 'error';
  imageUrl?: string;
}

export interface MangaScript {
  topic: string;
  difficulty: Difficulty;
  panels: PanelData[];
}