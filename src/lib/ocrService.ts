import { supabase } from '@/integrations/supabase/client';
import Tesseract from 'tesseract.js';

export interface OCRResult {
  text: string;
  confidence: number;
  processingTime: number;
  pagesProcessed?: number;
  method?: 'local' | 'cloud' | 'mistral';
  format?: 'plain' | 'markdown';
}

/**
 * Extrai texto usando Tesseract.js local (gratuito, sem limites)
 */
export const extractTextLocal = async (
  file: File,
  onProgress?: (progress: number) => void
): Promise<OCRResult> => {
  const startTime = Date.now();

  try {
    onProgress?.(5);

    const imageUrl = URL.createObjectURL(file);
    
    const result = await Tesseract.recognize(imageUrl, 'por', {
      logger: (m) => {
        if (m.status === 'recognizing text' && m.progress) {
          onProgress?.(10 + Math.round(m.progress * 80));
        }
      },
    });

    URL.revokeObjectURL(imageUrl);
    onProgress?.(100);

    return {
      text: result.data.text,
      confidence: result.data.confidence,
      processingTime: Date.now() - startTime,
      method: 'local',
    };
  } catch (error) {
    console.error('Local OCR Error:', error);
    throw new Error('Falha no OCR local');
  }
};

/**
 * Extrai texto usando OCR.space API (cloud - 25k req/mês grátis)
 */
export const extractTextCloud = async (
  file: File,
  onProgress?: (progress: number) => void
): Promise<OCRResult> => {
  const startTime = Date.now();

  try {
    onProgress?.(10);

    const base64 = await fileToBase64(file);
    onProgress?.(30);

    const { data, error } = await supabase.functions.invoke('ocr-extract', {
      body: {
        imageBase64: base64,
        language: 'por',
        isTable: true,
      },
    });

    onProgress?.(90);

    if (error) {
      console.error('OCR function error:', error);
      throw new Error(error.message || 'Erro ao processar OCR');
    }

    if (!data.success) {
      throw new Error(data.error || 'Falha no OCR');
    }

    onProgress?.(100);

    return {
      text: data.text,
      confidence: data.confidence,
      processingTime: Date.now() - startTime,
      pagesProcessed: data.pagesProcessed,
      method: 'cloud',
    };
  } catch (error) {
    console.error('Cloud OCR Error:', error);
    throw new Error('Falha no OCR cloud');
  }
};

/**
 * Extrai texto usando Mistral Vision (OCR com output Markdown)
 */
export const extractTextMistral = async (
  file: File,
  onProgress?: (progress: number) => void
): Promise<OCRResult> => {
  const startTime = Date.now();

  try {
    onProgress?.(10);

    const base64 = await fileToBase64(file);
    onProgress?.(30);

    const { data, error } = await supabase.functions.invoke('ocr-mistral', {
      body: {
        imageBase64: base64,
        fileName: file.name,
        mimeType: file.type,
      },
    });

    onProgress?.(90);

    if (error) {
      console.error('Mistral OCR function error:', error);
      throw new Error(error.message || 'Erro ao processar OCR Mistral');
    }

    if (!data.success) {
      throw new Error(data.error || 'Falha no OCR Mistral');
    }

    onProgress?.(100);

    return {
      text: data.text,
      confidence: data.confidence || 95,
      processingTime: Date.now() - startTime,
      method: 'mistral',
      format: 'markdown',
    };
  } catch (error) {
    console.error('Mistral OCR Error:', error);
    throw new Error('Falha no OCR Mistral');
  }
};

export type OCRMode = 'auto' | 'local' | 'cloud' | 'mistral';

/**
 * Extrai texto de imagem com modo selecionável
 */
export const extractTextFromImage = async (
  file: File,
  onProgress?: (progress: number) => void,
  mode: OCRMode = 'auto'
): Promise<OCRResult> => {
  // Modo Mistral: usa Mistral Vision direto
  if (mode === 'mistral') {
    return extractTextMistral(file, onProgress);
  }

  // Modo cloud: usa cloud direto
  if (mode === 'cloud') {
    return extractTextCloud(file, onProgress);
  }

  // Modo local: usa apenas local
  if (mode === 'local') {
    return extractTextLocal(file, onProgress);
  }

  // Modo auto: tenta Mistral primeiro, depois local, depois cloud
  try {
    return await extractTextMistral(file, onProgress);
  } catch (mistralError) {
    console.warn('Mistral OCR failed, trying local:', mistralError);
    try {
      const result = await extractTextLocal(file, onProgress);
      if (result.confidence < 50) {
        console.log('Low confidence from local OCR, trying cloud...');
        return extractTextCloud(file, onProgress);
      }
      return result;
    } catch (localError) {
      console.warn('Local OCR failed, falling back to cloud:', localError);
      return extractTextCloud(file, onProgress);
    }
  }
};

/**
 * Processa arquivo (imagem ou PDF) e extrai texto
 */
export const processFileForOCR = async (
  file: File,
  onProgress?: (progress: number) => void,
  mode: OCRMode = 'auto'
): Promise<OCRResult> => {
  const fileType = file.type;

  // PDFs: usar Mistral diretamente (suporta multi-página)
  if (fileType === 'application/pdf') {
    if (mode === 'mistral' || mode === 'auto') {
      return extractTextMistral(file, onProgress);
    }
    // Fallback para outros modos: sinalizar para usar IA
    return {
      text: '__PDF_USE_AI_DIRECTLY__',
      confidence: 100,
      processingTime: 0,
      method: 'local',
    };
  }

  // Se for imagem, usar OCR com modo selecionado
  if (fileType.startsWith('image/')) {
    return extractTextFromImage(file, onProgress, mode);
  }

  throw new Error(`Tipo de arquivo não suportado: ${fileType}`);
};

/**
 * Converte File para base64 (sem o prefixo data:...)
 */
const fileToBase64 = (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result as string;
      const base64 = result.split(',')[1];
      resolve(base64);
    };
    reader.onerror = () => reject(new Error('Falha ao ler arquivo'));
    reader.readAsDataURL(file);
  });
};

/**
 * Pré-processa texto extraído por OCR para melhorar qualidade
 */
export const cleanOCRText = (text: string): string => {
  return text
    .replace(/\s+/g, ' ')
    .replace(/\n{3,}/g, '\n\n')
    .replace(/[|]/g, 'I')
    .replace(/0(?=[a-zA-Z])/g, 'O')
    .replace(/1(?=[a-zA-Z])/g, 'l')
    .replace(/[^\x20-\x7E\xA0-\xFF\n]/g, '')
    .trim();
};
