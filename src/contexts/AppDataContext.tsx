import { createContext, useContext, useState, useCallback, ReactNode } from 'react';
import { MeasurementEntry } from '@/types/measurement';
import { MindMapData } from '@/types/mindmap';

interface SurveyItem {
  id: string;
  item_code: string | null;
  description: string;
  unit: string;
  total_quantity: number;
  partial_quantity: number;
  unit_price: number;
  total_value: number;
  location: string | null;
  floor_level: string | null;
  sector: string | null;
  notes: string | null;
  is_selected: boolean;
}

interface AppDataContextType {
  // Measurement data
  measurementData: MeasurementEntry[];
  setMeasurementData: (data: MeasurementEntry[]) => void;
  
  // Mind map data
  currentMindMap: MindMapData | null;
  setCurrentMindMap: (data: MindMapData | null) => void;
  
  // Survey/quantitative data
  surveyItems: SurveyItem[];
  setSurveyItems: (items: SurveyItem[]) => void;
  surveyName: string;
  setSurveyName: (name: string) => void;
  
  // Uploaded file info
  uploadedFileName: string | null;
  setUploadedFileName: (name: string | null) => void;
  
  // Get full context for AI
  getFullContext: () => {
    measurements: MeasurementEntry[];
    mindMap: MindMapData | null;
    survey: {
      name: string;
      items: SurveyItem[];
    };
    uploadedFile: string | null;
  };
}

const AppDataContext = createContext<AppDataContextType | undefined>(undefined);

export const AppDataProvider = ({ children }: { children: ReactNode }) => {
  const [measurementData, setMeasurementData] = useState<MeasurementEntry[]>([]);
  const [currentMindMap, setCurrentMindMap] = useState<MindMapData | null>(null);
  const [surveyItems, setSurveyItems] = useState<SurveyItem[]>([]);
  const [surveyName, setSurveyName] = useState('');
  const [uploadedFileName, setUploadedFileName] = useState<string | null>(null);

  const getFullContext = useCallback(() => {
    return {
      measurements: measurementData,
      mindMap: currentMindMap,
      survey: {
        name: surveyName,
        items: surveyItems
      },
      uploadedFile: uploadedFileName
    };
  }, [measurementData, currentMindMap, surveyItems, surveyName, uploadedFileName]);

  return (
    <AppDataContext.Provider
      value={{
        measurementData,
        setMeasurementData,
        currentMindMap,
        setCurrentMindMap,
        surveyItems,
        setSurveyItems,
        surveyName,
        setSurveyName,
        uploadedFileName,
        setUploadedFileName,
        getFullContext
      }}
    >
      {children}
    </AppDataContext.Provider>
  );
};

export const useAppData = () => {
  const context = useContext(AppDataContext);
  if (!context) {
    throw new Error('useAppData must be used within an AppDataProvider');
  }
  return context;
};
