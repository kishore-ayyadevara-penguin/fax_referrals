import React, { useState, useRef } from 'react';
import { ProcessingSteps } from './ProcessingSteps';
import { uploadFile, processOCR } from '../services/api';
import type { OCRResponse, MedicalNotesResponse } from '../types';

interface LandingPageProps {
  onPdfUpload: (url: string, ocrData: OCRResponse, medicalNotes: MedicalNotesResponse, runId: string) => void;
}

export const LandingPage: React.FC<LandingPageProps> = ({ onPdfUpload }) => {
  const [isDragging, setIsDragging] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [showProcessing, setShowProcessing] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);
  const [processingError, setProcessingError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files[0];
    handleFile(file);
  };

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      handleFile(file);
    }
  };

  const handleFile = (file: File) => {
    if (file.type !== 'application/pdf') {
      setError('Please upload a PDF file');
      return;
    }
    setError(null);
    setProcessingError(null);
    setSelectedFile(file);
  };

  const handleSubmit = async () => {
    if (!selectedFile) {
      setError('Please select a file first');
      return;
    }
    
    setIsUploading(true);
    setShowProcessing(true);
    setProcessingError(null);
    setCurrentStep(0);

    try {
      // Upload file
      setCurrentStep(1);
      const downloadUrl = await uploadFile(selectedFile);
      const fileResponse = await fetch(downloadUrl);
      if (!fileResponse.ok) {
        throw new Error('Failed to download file');
      }
      const fileBlob = await fileResponse.blob();
      const fileUrl = URL.createObjectURL(fileBlob);

      // Process OCR
      setCurrentStep(2);
      const ocrData = await processOCR(selectedFile);

      // Create empty medical notes structure
      const medicalNotes: MedicalNotesResponse = {
        page_mappings: {},
        all_entities: []
      };

      onPdfUpload(fileUrl, ocrData, medicalNotes, 'dummy-run-id');
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to process file';
      setProcessingError(errorMessage);
      setError(errorMessage);
    } finally {
      setIsUploading(false);
    }
  };

  const handleButtonClick = () => {
    fileInputRef.current?.click();
  };

  const handleRemoveFile = () => {
    setSelectedFile(null);
    setError(null);
    setProcessingError(null);
    setShowProcessing(false);
    setCurrentStep(0);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-4" style={{ backgroundColor: '#e6f5f0' }}>
      <div className="max-w-2xl w-full">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold mb-4" style={{ color: '#181a19' }}>
            Disease Code Extraction
          </h1>
          <p className="text-lg" style={{ color: '#181a19' }}>
            Upload your medical document to start extracting disease codes
          </p>
        </div>

        <div
          className={`border-2 border-dashed rounded-lg p-8 text-center ${
            isDragging
              ? 'border-indigo-500 bg-white/50'
              : 'border-gray-300 hover:border-indigo-400 bg-white'
          }`}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
        >
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleFileInput}
            accept="application/pdf"
            className="hidden"
          />

          <div className="flex flex-col items-center justify-center space-y-4">
            <svg
              className="w-16 h-16"
              style={{ color: '#181a19' }}
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"
              />
            </svg>

            <div className="text-lg" style={{ color: '#181a19' }}>
              {isUploading ? (
                <div className="flex items-center gap-2">
                  <svg className="animate-spin h-5 w-5" style={{ color: '#ad289c' }} xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Uploading...
                </div>
              ) : (
                <>
                  Drag and drop your PDF here, or{' '}
                  <button
                    onClick={handleButtonClick}
                    style={{ color: '#ad289c' }}
                    className="font-medium focus:outline-none hover:underline"
                  >
                    browse
                  </button>
                </>
              )}
            </div>

            {selectedFile && (
              <div className="flex items-center gap-2">
                <p className="text-sm" style={{ color: '#181a19' }}>
                  Selected: {selectedFile.name}
                </p>
                <button
                  onClick={handleRemoveFile}
                  className="text-red-500 hover:text-red-700 focus:outline-none"
                  title="Remove file"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            )}

            {!selectedFile && (
              <p className="text-sm" style={{ color: '#181a19' }}>
                Supported format: PDF
              </p>
            )}

            {error && (
              <p className="text-red-500 text-sm mt-2">
                {error}
              </p>
            )}

            {selectedFile && (
              <button
                onClick={handleSubmit}
                disabled={isUploading}
                style={{ backgroundColor: '#2f3330', color: '#fefefe' }}
                className="mt-4 px-6 py-2 rounded-md hover:opacity-90 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500 transition-opacity duration-150 disabled:opacity-50"
              >
                Upload PDF
              </button>
            )}
          </div>
        </div>

        {showProcessing && (
          <ProcessingSteps 
            isVisible={showProcessing} 
            currentStep={currentStep}
            error={processingError}
          />
        )}

        <div className="mt-8 text-center text-sm" style={{ color: '#181a19' }}>
          <p>
            Your document will be processed securely.
          </p>
        </div>
      </div>
    </div>
  );
};