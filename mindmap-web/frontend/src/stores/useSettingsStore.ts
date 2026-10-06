import { create } from 'zustand';

export type Language = 'fa' | 'en';
export type ThemeMode = 'dark' | 'light';
export type CanvasBackground = 'nebula' | 'grid' | 'dots' | 'obsidian' | 'image' | 'solid';

export const DEFAULT_GEMINI_API_KEY = '';
export const DEFAULT_GEMINI_MODEL = 'gemini-1.5-flash';
export const GRAY_LIGHT_CANVAS_COLOR = '#E2E8F0';
export const NAVY_LIGHT_CANVAS_COLOR = '#0B1E38';

export interface BackgroundImageItem {
  id: string;
  label: string;
  labelEn: string;
  path: string;
  filename: string;
}

export const DARK_BACKGROUND_IMAGES: BackgroundImageItem[] = [
  { id: 'black_1', label: 'طرح دارک ۱ (Black_1)', labelEn: 'Dark Style 1 (Black_1)', path: '/Backgrounds/Black_1.jpg', filename: 'Black_1.jpg' },
  { id: 'black_2', label: 'طرح دارک ۲ (Black_2)', labelEn: 'Dark Style 2 (Black_2)', path: '/Backgrounds/Black_2.png', filename: 'Black_2.png' },
  { id: 'black_3', label: 'طرح دارک ۳ (Black_3)', labelEn: 'Dark Style 3 (Black_3)', path: '/Backgrounds/Black_3.jpg', filename: 'Black_3.jpg' },
];

export const LIGHT_BACKGROUND_IMAGES: BackgroundImageItem[] = [
  { id: 'white_2', label: 'طرح لایت ۲ (white_2)', labelEn: 'Light Style 2 (white_2)', path: '/Backgrounds/white_2.png', filename: 'white_2.png' },
  { id: 'white_1', label: 'طرح لایت ۱ (White_1)', labelEn: 'Light Style 1 (White_1)', path: '/Backgrounds/White_1.jpg', filename: 'White_1.jpg' },
  { id: 'white_3', label: 'طرح لایت ۳ (white_3)', labelEn: 'Light Style 3 (white_3)', path: '/Backgrounds/white_3.png', filename: 'white_3.png' },
];

export const DEFAULT_DARK_BACKGROUND_IMAGE = '/Backgrounds/Black_1.jpg';
export const DEFAULT_LIGHT_BACKGROUND_IMAGE = '/Backgrounds/white_2.png';

interface SettingsState {
  language: Language;
  themeMode: ThemeMode;
  canvasBackground: CanvasBackground;
  customBackgroundImage: string;
  customBackgroundColor: string;
  backgroundOverlayOpacity: number;
  showBackgroundGrid: boolean;
  showEdgeLabels: boolean;
  geminiApiKey: string;
  geminiModel: string;

  // Actions
  setLanguage: (lang: Language) => void;
  setThemeMode: (mode: ThemeMode) => void;
  setCanvasBackground: (bg: CanvasBackground) => void;
  setCustomBackgroundImage: (img: string) => void;
  setCustomBackgroundColor: (color: string) => void;
  setBackgroundOverlayOpacity: (opacity: number) => void;
  setShowBackgroundGrid: (show: boolean) => void;
  setShowEdgeLabels: (show: boolean) => void;
  setGeminiApiKey: (key: string) => void;
  setGeminiModel: (model: string) => void;
}

const STORAGE_KEY = 'mindmap_studio_settings';

const loadSavedSettings = (): {
  language: Language;
  themeMode: ThemeMode;
  canvasBackground: CanvasBackground;
  customBackgroundImage: string;
  customBackgroundColor: string;
  backgroundOverlayOpacity: number;
  showBackgroundGrid: boolean;
  showEdgeLabels: boolean;
  geminiApiKey: string;
  geminiModel: string;
} => {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      const isLight = parsed.themeMode === 'light';
      const savedBg = parsed.customBackgroundColor;
      const effectiveBg = isLight
        ? (!savedBg || savedBg === '#0B0F19' || savedBg === '#0B1E38' || savedBg === '#f8fafc' || savedBg === '#ffffff' ? GRAY_LIGHT_CANVAS_COLOR : savedBg)
        : (savedBg || '#0B0F19');

      let savedImage = parsed.customBackgroundImage;
      const defaultImg = isLight ? DEFAULT_LIGHT_BACKGROUND_IMAGE : DEFAULT_DARK_BACKGROUND_IMAGE;

      if (!savedImage || savedImage === '/Background.jpg' || savedImage === '/Backgrounds/White_1.jpg') {
        savedImage = defaultImg;
      } else if (isLight && DARK_BACKGROUND_IMAGES.some((d) => d.path === savedImage)) {
        savedImage = DEFAULT_LIGHT_BACKGROUND_IMAGE;
      } else if (!isLight && LIGHT_BACKGROUND_IMAGES.some((l) => l.path === savedImage)) {
        savedImage = DEFAULT_DARK_BACKGROUND_IMAGE;
      }

      return {
        language: parsed.language === 'en' ? 'en' : 'fa',
        themeMode: isLight ? 'light' : 'dark',
        canvasBackground: parsed.canvasBackground || 'image',
        customBackgroundImage: savedImage,
        customBackgroundColor: effectiveBg,
        backgroundOverlayOpacity: typeof parsed.backgroundOverlayOpacity === 'number' ? parsed.backgroundOverlayOpacity : (isLight ? 0.15 : 0.35),
        showBackgroundGrid: typeof parsed.showBackgroundGrid === 'boolean' ? parsed.showBackgroundGrid : true,
        showEdgeLabels: Boolean(parsed.showEdgeLabels ?? false),
        geminiApiKey: parsed.geminiApiKey || DEFAULT_GEMINI_API_KEY,
        geminiModel: parsed.geminiModel || DEFAULT_GEMINI_MODEL,
      };
    }
  } catch (e) {
    console.error('Failed to load settings:', e);
  }
  return {
    language: 'fa',
    themeMode: 'dark',
    canvasBackground: 'image',
    customBackgroundImage: DEFAULT_DARK_BACKGROUND_IMAGE,
    customBackgroundColor: '#0B0F19',
    backgroundOverlayOpacity: 0.35,
    showBackgroundGrid: true,
    showEdgeLabels: false,
    geminiApiKey: DEFAULT_GEMINI_API_KEY,
    geminiModel: DEFAULT_GEMINI_MODEL,
  };
};

const initial = loadSavedSettings();

export const useSettingsStore = create<SettingsState>((set, get) => ({
  language: initial.language,
  themeMode: initial.themeMode,
  canvasBackground: initial.canvasBackground,
  customBackgroundImage: initial.customBackgroundImage,
  customBackgroundColor: initial.customBackgroundColor,
  backgroundOverlayOpacity: initial.backgroundOverlayOpacity,
  showBackgroundGrid: initial.showBackgroundGrid,
  showEdgeLabels: initial.showEdgeLabels,
  geminiApiKey: initial.geminiApiKey,
  geminiModel: initial.geminiModel,

  setLanguage: (language: Language) => {
    set({ language });
    try {
      localStorage.setItem(
        STORAGE_KEY,
        JSON.stringify({ ...get(), language })
      );
      document.documentElement.lang = language;
      document.documentElement.dir = language === 'fa' ? 'rtl' : 'ltr';
    } catch (e) {
      console.error('Failed to save language:', e);
    }
  },

  setThemeMode: (themeMode: ThemeMode) => {
    const isNowLight = themeMode === 'light';
    const currentCustomBg = get().customBackgroundColor;
    const currentImg = get().customBackgroundImage;

    const shouldUpdateBg =
      !currentCustomBg ||
      currentCustomBg === '#0B0F19' ||
      currentCustomBg === '#0B1E38' ||
      currentCustomBg === '#f8fafc' ||
      currentCustomBg === '#ffffff';

    const newBg = isNowLight
      ? (shouldUpdateBg ? GRAY_LIGHT_CANVAS_COLOR : currentCustomBg)
      : (shouldUpdateBg ? '#0B0F19' : currentCustomBg);

    let newImage = currentImg;
    if (isNowLight) {
      if (
        !currentImg ||
        currentImg === '/Background.jpg' ||
        DARK_BACKGROUND_IMAGES.some((d) => d.path === currentImg)
      ) {
        newImage = DEFAULT_LIGHT_BACKGROUND_IMAGE;
      }
    } else {
      if (
        !currentImg ||
        currentImg === '/Background.jpg' ||
        LIGHT_BACKGROUND_IMAGES.some((l) => l.path === currentImg)
      ) {
        newImage = DEFAULT_DARK_BACKGROUND_IMAGE;
      }
    }

    set({
      themeMode,
      customBackgroundColor: newBg,
      customBackgroundImage: newImage,
      canvasBackground: 'image',
    });
    try {
      localStorage.setItem(
        STORAGE_KEY,
        JSON.stringify({
          ...get(),
          themeMode,
          customBackgroundColor: newBg,
          customBackgroundImage: newImage,
          canvasBackground: 'image',
        })
      );
      if (themeMode === 'light') {
        document.documentElement.classList.add('light-theme');
      } else {
        document.documentElement.classList.remove('light-theme');
      }
    } catch (e) {
      console.error('Failed to save theme mode:', e);
    }
  },

  setCanvasBackground: (canvasBackground: CanvasBackground) => {
    set({ canvasBackground });
    try {
      localStorage.setItem(
        STORAGE_KEY,
        JSON.stringify({ ...get(), canvasBackground })
      );
    } catch (e) {
      console.error('Failed to save canvas background:', e);
    }
  },

  setCustomBackgroundImage: (customBackgroundImage: string) => {
    set({ customBackgroundImage, canvasBackground: 'image' });
    try {
      // Wrap in try-catch in case of localStorage quota exceeded for large images
      localStorage.setItem(
        STORAGE_KEY,
        JSON.stringify({ ...get(), customBackgroundImage, canvasBackground: 'image' })
      );
    } catch (e) {
      console.warn('Could not persist large image to localStorage, stored in memory:', e);
    }
  },

  setCustomBackgroundColor: (customBackgroundColor: string) => {
    set({ customBackgroundColor, canvasBackground: 'solid' });
    try {
      localStorage.setItem(
        STORAGE_KEY,
        JSON.stringify({ ...get(), customBackgroundColor, canvasBackground: 'solid' })
      );
    } catch (e) {
      console.error('Failed to save customBackgroundColor:', e);
    }
  },

  setBackgroundOverlayOpacity: (backgroundOverlayOpacity: number) => {
    set({ backgroundOverlayOpacity });
    try {
      localStorage.setItem(
        STORAGE_KEY,
        JSON.stringify({ ...get(), backgroundOverlayOpacity })
      );
    } catch (e) {
      console.error('Failed to save backgroundOverlayOpacity:', e);
    }
  },

  setShowBackgroundGrid: (showBackgroundGrid: boolean) => {
    set({ showBackgroundGrid });
    try {
      localStorage.setItem(
        STORAGE_KEY,
        JSON.stringify({ ...get(), showBackgroundGrid })
      );
    } catch (e) {
      console.error('Failed to save showBackgroundGrid:', e);
    }
  },

  setShowEdgeLabels: (showEdgeLabels: boolean) => {
    set({ showEdgeLabels });
    try {
      localStorage.setItem(
        STORAGE_KEY,
        JSON.stringify({ ...get(), showEdgeLabels })
      );
    } catch (e) {
      console.error('Failed to save showEdgeLabels:', e);
    }
  },

  setGeminiApiKey: (geminiApiKey: string) => {
    set({ geminiApiKey });
    try {
      localStorage.setItem(
        STORAGE_KEY,
        JSON.stringify({ ...get(), geminiApiKey })
      );
    } catch (e) {
      console.error('Failed to save geminiApiKey:', e);
    }
  },

  setGeminiModel: (geminiModel: string) => {
    set({ geminiModel });
    try {
      localStorage.setItem(
        STORAGE_KEY,
        JSON.stringify({ ...get(), geminiModel })
      );
    } catch (e) {
      console.error('Failed to save geminiModel:', e);
    }
  },
}));
