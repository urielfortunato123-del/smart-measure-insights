import { supabase } from '@/integrations/supabase/client';

export interface OCRResult {
  text: string;
  confidence: number;
  processingTime: number;
  pagesProcessed?: number;
}

/**
 * Extrai texto de uma imagem usando OCR.space API (gratuito - 25k req/mês)
 */
export const extractTextFromImage = async (
  file: File,
  onProgress?: (progress: number) => void
): Promise<OCRResult> => {
  const startTime = Date.now();

  try {
    onProgress?.(10);

    // Convert file to base64
    const base64 = await fileToBase64(file);
    onProgress?.(30);

    // Call OCR edge function
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
    };
  } catch (error) {
    console.error('OCR Error:', error);
    throw new Error('Falha ao processar imagem com OCR');
  }
};

/**
 * Processa arquivo (imagem ou PDF) e extrai texto
 */
export const processFileForOCR = async (
  file: File,
  onProgress?: (progress: number) => void
): Promise<OCRResult> => {
  const fileType = file.type;

  // Check file size (OCR.space free tier limit is 1MB)
  const maxSize = 1 * 1024 * 1024; // 1MB
  if (file.size > maxSize) {
    console.warn('File too large for free OCR, will use AI directly');
    return {
      text: '__USE_AI_DIRECTLY__',
      confidence: 100,
      processingTime: 0,
    };
  }

  // Se for imagem, usar OCR.space gratuito
  if (fileType.startsWith('image/')) {
    return extractTextFromImage(file, onProgress);
  }

  // Se for PDF, indicar para usar IA diretamente (Gemini lê PDFs nativamente)
  if (fileType === 'application/pdf') {
    return {
      text: '__PDF_USE_AI_DIRECTLY__',
      confidence: 100,
      processingTime: 0,
    };
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
      // Remove o prefixo "data:image/...;base64,"
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
    // Remove múltiplos espaços
    .replace(/\s+/g, ' ')
    // Remove quebras de linha excessivas
    .replace(/\n{3,}/g, '\n\n')
    // Corrige caracteres comuns mal interpretados
    .replace(/[|]/g, 'I')
    .replace(/0(?=[a-zA-Z])/g, 'O')
    .replace(/1(?=[a-zA-Z])/g, 'l')
    // Remove caracteres não imprimíveis
    .replace(/[^\x20-\x7E\xA0-\xFF\n]/g, '')
    .trim();
};
