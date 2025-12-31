import React, { createContext, useContext, useState, useCallback, useEffect } from 'react';

export interface GridItem {
  i: string;
  x: number;
  y: number;
  w: number;
  h: number;
  minW?: number;
  minH?: number;
}

export type SidebarPosition = 'left' | 'right' | 'bottom' | 'top' | 'hidden';

export interface LayoutConfig {
  sidebarPosition: SidebarPosition;
  sidebarSize: number;
  gridLayout: GridItem[];
}

export type PresetName = 'classic' | 'compact' | 'custom';

// Preset: Classic - Sidebar left, standard layout
const classicLayout: LayoutConfig = {
  sidebarPosition: 'left',
  sidebarSize: 20,
  gridLayout: [
    { i: 'kpi-1', x: 0, y: 0, w: 3, h: 2 },
    { i: 'kpi-2', x: 3, y: 0, w: 3, h: 2 },
    { i: 'kpi-3', x: 6, y: 0, w: 3, h: 2 },
    { i: 'kpi-4', x: 9, y: 0, w: 3, h: 2 },
    { i: 'evolution-chart', x: 0, y: 2, w: 8, h: 4 },
    { i: 'composition-chart', x: 8, y: 2, w: 4, h: 4 },
    { i: 'alerts', x: 0, y: 6, w: 3, h: 4 },
    { i: 'data-table', x: 3, y: 6, w: 9, h: 4 },
  ]
};

// Preset: Compact - Sidebar bottom, charts side by side
const compactLayout: LayoutConfig = {
  sidebarPosition: 'bottom',
  sidebarSize: 25,
  gridLayout: [
    { i: 'kpi-1', x: 0, y: 0, w: 3, h: 2 },
    { i: 'kpi-2', x: 3, y: 0, w: 3, h: 2 },
    { i: 'kpi-3', x: 6, y: 0, w: 3, h: 2 },
    { i: 'kpi-4', x: 9, y: 0, w: 3, h: 2 },
    { i: 'alerts', x: 0, y: 2, w: 4, h: 3 },
    { i: 'evolution-chart', x: 4, y: 2, w: 4, h: 3 },
    { i: 'composition-chart', x: 8, y: 2, w: 4, h: 3 },
    { i: 'data-table', x: 0, y: 5, w: 12, h: 4 },
  ]
};

const presets: Record<PresetName, LayoutConfig> = {
  classic: classicLayout,
  compact: compactLayout,
  custom: classicLayout, // Will be overwritten by user's saved layout
};

interface LayoutContextType {
  layout: LayoutConfig;
  currentPreset: PresetName;
  setLayout: (layout: LayoutConfig) => void;
  setSidebarPosition: (position: SidebarPosition) => void;
  setSidebarSize: (size: number) => void;
  setGridLayout: (layout: GridItem[]) => void;
  applyPreset: (preset: PresetName) => void;
  saveAsCustom: () => void;
  resetToDefault: () => void;
  isEditMode: boolean;
  setIsEditMode: (value: boolean) => void;
}

const LayoutContext = createContext<LayoutContextType | undefined>(undefined);

const STORAGE_KEY = 'dashboard-layout-config';
const PRESET_KEY = 'dashboard-current-preset';

export const LayoutProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [currentPreset, setCurrentPreset] = useState<PresetName>('classic');
  const [layout, setLayoutState] = useState<LayoutConfig>(classicLayout);
  const [isEditMode, setIsEditMode] = useState(false);

  // Load saved layout on mount
  useEffect(() => {
    try {
      const savedLayout = localStorage.getItem(STORAGE_KEY);
      const savedPreset = localStorage.getItem(PRESET_KEY) as PresetName | null;
      
      if (savedLayout) {
        const parsed = JSON.parse(savedLayout);
        setLayoutState(parsed);
        presets.custom = parsed;
      }
      
      if (savedPreset && presets[savedPreset]) {
        setCurrentPreset(savedPreset);
        if (savedPreset !== 'custom') {
          setLayoutState(presets[savedPreset]);
        }
      }
    } catch (error) {
      console.error('Error loading layout:', error);
    }
  }, []);

  // Save layout changes
  const saveLayout = useCallback((newLayout: LayoutConfig) => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(newLayout));
    } catch (error) {
      console.error('Error saving layout:', error);
    }
  }, []);

  const setLayout = useCallback((newLayout: LayoutConfig) => {
    setLayoutState(newLayout);
    setCurrentPreset('custom');
    localStorage.setItem(PRESET_KEY, 'custom');
    saveLayout(newLayout);
  }, [saveLayout]);

  const setSidebarPosition = useCallback((position: SidebarPosition) => {
    setLayoutState(prev => {
      const newLayout = { ...prev, sidebarPosition: position };
      setCurrentPreset('custom');
      localStorage.setItem(PRESET_KEY, 'custom');
      saveLayout(newLayout);
      return newLayout;
    });
  }, [saveLayout]);

  const setSidebarSize = useCallback((size: number) => {
    setLayoutState(prev => {
      const newLayout = { ...prev, sidebarSize: size };
      saveLayout(newLayout);
      return newLayout;
    });
  }, [saveLayout]);

  const setGridLayout = useCallback((gridLayout: GridItem[]) => {
    setLayoutState(prev => {
      const newLayout = { ...prev, gridLayout };
      setCurrentPreset('custom');
      localStorage.setItem(PRESET_KEY, 'custom');
      saveLayout(newLayout);
      return newLayout;
    });
  }, [saveLayout]);

  const applyPreset = useCallback((preset: PresetName) => {
    const presetLayout = presets[preset];
    setLayoutState(presetLayout);
    setCurrentPreset(preset);
    localStorage.setItem(PRESET_KEY, preset);
    if (preset !== 'custom') {
      saveLayout(presetLayout);
    }
  }, [saveLayout]);

  const saveAsCustom = useCallback(() => {
    presets.custom = layout;
    setCurrentPreset('custom');
    localStorage.setItem(PRESET_KEY, 'custom');
    saveLayout(layout);
  }, [layout, saveLayout]);

  const resetToDefault = useCallback(() => {
    applyPreset('classic');
  }, [applyPreset]);

  return (
    <LayoutContext.Provider value={{
      layout,
      currentPreset,
      setLayout,
      setSidebarPosition,
      setSidebarSize,
      setGridLayout,
      applyPreset,
      saveAsCustom,
      resetToDefault,
      isEditMode,
      setIsEditMode,
    }}>
      {children}
    </LayoutContext.Provider>
  );
};

export const useLayout = () => {
  const context = useContext(LayoutContext);
  if (!context) {
    throw new Error('useLayout must be used within a LayoutProvider');
  }
  return context;
};
