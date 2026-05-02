import { useState, useCallback, useRef } from 'react';
import Tesseract from 'tesseract.js';

export type OCRStatus = 'idle' | 'processing' | 'done' | 'error';

interface UseOCRReturn {
  extractAmount: (imageFile: File) => Promise<number | null>;
  status: OCRStatus;
  progress: number;
  error: string | null;
  openCameraInput: () => void;
  openGalleryInput: () => void;
  inputRef: React.RefObject<HTMLInputElement | null>;
  galleryInputRef: React.RefObject<HTMLInputElement | null>;
}

/**
 * Extracts the largest numeric value from OCR text (assumed to be the receipt total).
 * Handles both Italian (comma decimal) and international (dot decimal) formats.
 */
function extractLargestAmount(text: string): number | null {
  // Match patterns like: 12,50 | 12.50 | € 12,50 | EUR 12.50 | Total 12,50
  const patterns = [
    /(?:totale|total|tot\.?|importo|amount|pagato|paid)\s*[:\-]?\s*[\€\$\£]?\s*(\d{1,5}[.,]\d{2})/gi,
    /[\€\$\£]\s*(\d{1,5}[.,]\d{2})/g,
    /(\d{1,5}[.,]\d{2})/g,
  ];

  const amounts: number[] = [];

  for (const pattern of patterns) {
    const matches = [...text.matchAll(pattern)];
    for (const match of matches) {
      const raw = match[1].replace(',', '.');
      const val = parseFloat(raw);
      if (!isNaN(val) && val > 0 && val < 99999) {
        amounts.push(val);
      }
    }
    if (amounts.length > 0 && patterns.indexOf(pattern) < 2) break; // prefer contextual matches
  }

  if (amounts.length === 0) return null;
  return Math.max(...amounts);
}

export function useOCR(): UseOCRReturn {
  const [status, setStatus] = useState<OCRStatus>('idle');
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement | null>(null);
  const galleryInputRef = useRef<HTMLInputElement | null>(null);

  const extractAmount = useCallback(async (imageFile: File): Promise<number | null> => {
    setStatus('processing');
    setProgress(0);
    setError(null);

    try {
      const result = await Tesseract.recognize(imageFile, 'ita+eng', {
        logger: (m) => {
          if (m.status === 'recognizing text') {
            setProgress(Math.round((m.progress ?? 0) * 100));
          }
        },
      });

      const text = result.data.text;
      const amount = extractLargestAmount(text);

      setStatus('done');
      setProgress(100);
      return amount;
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Errore OCR sconosciuto';
      setError(msg);
      setStatus('error');
      return null;
    }
  }, []);

  const openCameraInput = useCallback(() => {
    inputRef.current?.click();
  }, []);

  const openGalleryInput = useCallback(() => {
    galleryInputRef.current?.click();
  }, []);

  return { extractAmount, status, progress, error, openCameraInput, openGalleryInput, inputRef, galleryInputRef };
}
