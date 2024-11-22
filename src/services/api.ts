const BASE_URL = 'https://7ff4-122-175-5-80.ngrok-free.app';

interface RunsResponse {
  runs: { [runId: string]: string };
}

interface QnAResponse {
  [key: string]: Array<{
    answer: string;
    supporting_sentence: string;
    position: [number, number];
  }>;
}

export const uploadFile = async (file: File): Promise<string> => {
  const formData = new FormData();
  formData.append('file', file);

  const response = await fetch(`${BASE_URL}/upload`, {
    method: 'POST',
    body: formData,
  });

  if (!response.ok) {
    throw new Error('Failed to upload file');
  }

  const { download_url } = await response.json();
  return download_url;
};

export const processOCR = async (file: File): Promise<OCRResponse> => {
  const formData = new FormData();
  formData.append('file', file);

  const response = await fetch(`${BASE_URL}/ocr`, {
    method: 'POST',
    body: formData,
    headers: {
      'accept': 'application/json',
    },
  });

  if (!response.ok) {
    throw new Error('OCR processing failed');
  }

  return response.json();
};

export const askQuestion = async (question: string, pageContents: string[]): Promise<QnAResponse> => {
  const response = await fetch(`${BASE_URL}/qna?question=${encodeURIComponent(question)}`, {
    method: 'POST',
    headers: {
      'accept': 'application/json',
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(pageContents),
  });

  if (!response.ok) {
    throw new Error('Failed to get answer');
  }

  return response.json();
};

// Simplified run data fetching
export const fetchRunData = async (runId: string) => {
  const downloadResponse = await fetch(`${BASE_URL}/download`, {
    method: 'POST',
    headers: {
      'accept': 'application/json'
    }
  });

  if (!downloadResponse.ok) {
    throw new Error('Failed to download PDF');
  }

  const { download_url } = await downloadResponse.json();
  const fileResponse = await fetch(download_url);
  if (!fileResponse.ok) {
    throw new Error('Failed to fetch PDF file');
  }
  const fileBlob = await fileResponse.blob();
  const pdfUrl = URL.createObjectURL(fileBlob);

  // Get OCR data
  const ocrResponse = await fetch(`${BASE_URL}/ocr`, {
    method: 'POST',
    headers: {
      'accept': 'application/json'
    }
  });

  if (!ocrResponse.ok) {
    throw new Error('Failed to fetch OCR data');
  }

  const ocrData = await ocrResponse.json();

  // Create empty medical notes structure
  const medicalNotes = {
    page_mappings: {},
    all_entities: []
  };

  return {
    pdfUrl,
    ocrData,
    medicalNotes
  };
};

// Simplified runs fetching
export const fetchRuns = async (): Promise<RunsResponse> => {
  const response = await fetch(`${BASE_URL}/runs`, {
    method: 'POST',
    headers: {
      'accept': 'application/json'
    }
  });

  if (!response.ok) {
    throw new Error('Failed to fetch runs');
  }

  return response.json();
};