import Tesseract from 'tesseract.js';

export interface OCRResult {
  text: string;
  confidence: number;
  processingTime: number;
}

/**
 * Extrai texto de uma imagem usando Tesseract.js (OCR gratuito)
 */
export const extractTextFromImage = async (
  imageSource: string | File | Blob,
  onProgress?: (progress: number) => void
): Promise<OCRResult> => {
  const startTime = Date.now();

  try {
    const result = await Tesseract.recognize(
      imageSource,
      'por', // Português
      {
        logger: (m) => {
          if (m.status === 'recognizing text' && onProgress) {
            onProgress(Math.round(m.progress * 100));
          }
        },
      }
    );

    return {
      text: result.data.text,
      confidence: result.data.confidence,
      processingTime: Date.now() - startTime,
    };
  } catch (error) {
    console.error('OCR Error:', error);
    throw new Error('Falha ao processar imagem com OCR');
  }
};

/**
 * Converte arquivo PDF para imagens e extrai texto
 * Usa a API de canvas do navegador para renderizar páginas do PDF
 */
export const extractTextFromPDF = async (
  file: File,
  onProgress?: (progress: number, page: number, totalPages: number) => void
): Promise<OCRResult> => {
  const startTime = Date.now();
  
  // Para PDFs, vamos converter para base64 e enviar direto para IA
  // pois Tesseract não processa PDF diretamente
  // A IA Gemini já tem capacidade nativa de ler PDFs
  
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      // Retornar indicador de que deve usar IA diretamente
      resolve({
        text: '__PDF_USE_AI_DIRECTLY__',
        confidence: 100,
        processingTime: Date.now() - startTime,
      });
    };
    reader.onerror = () => reject(new Error('Falha ao ler arquivo PDF'));
    reader.readAsDataURL(file);
  });
};

/**
 * Processa arquivo (imagem ou PDF) e extrai texto
 */
export const processFileForOCR = async (
  file: File,
  onProgress?: (progress: number) => void
): Promise<OCRResult> => {
  const fileType = file.type;
  
  // Se for imagem, usar Tesseract OCR gratuito
  if (fileType.startsWith('image/')) {
    return extractTextFromImage(file, onProgress);
  }
  
  // Se for PDF, indicar para usar IA diretamente (Gemini lê PDFs)
  if (fileType === 'application/pdf') {
    return extractTextFromPDF(file, onProgress);
  }
  
  throw new Error(`Tipo de arquivo não suportado: ${fileType}`);
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
