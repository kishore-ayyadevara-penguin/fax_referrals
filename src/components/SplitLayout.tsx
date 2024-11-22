import React, { useState, useEffect } from 'react';
import Split from 'react-split';
import { Document, Page, pdfjs } from 'react-pdf';
import { Header } from './Header';
import { PDFViewer } from './PDFViewer';
import { PDFControls } from './PDFControls';
import { QuestionAnswering } from './QuestionAnswering';
import type { OCRResponse, MedicalNotesResponse } from '../types';
import 'react-pdf/dist/Page/AnnotationLayer.css';
import 'react-pdf/dist/Page/TextLayer.css';

pdfjs.GlobalWorkerOptions.workerSrc = `//unpkg.com/pdfjs-dist@${pdfjs.version}/build/pdf.worker.min.js`;

interface SplitLayoutProps {
  pdfUrl: string;
  ocrData: OCRResponse;
  medicalNotes: MedicalNotesResponse;
}

export const SplitLayout: React.FC<SplitLayoutProps> = ({ pdfUrl, ocrData, medicalNotes }) => {
  const [numPages, setNumPages] = useState<number | null>(null);
  const [pageNumber, setPageNumber] = useState(1);
  const [currentPageTime, setCurrentPageTime] = useState(0);
  const [pageTimes, setPageTimes] = useState<{ [key: number]: number }>({});
  const [visitedPages, setVisitedPages] = useState<Set<number>>(new Set([1]));
  const [scale, setScale] = useState(0.85);
  const [containerWidth, setContainerWidth] = useState(0);
  const [isTabVisible, setIsTabVisible] = useState(!document.hidden);
  const [layoutMode, setLayoutMode] = useState<'split' | 'pdf'>('split');
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    const handleVisibilityChange = () => {
      setIsTabVisible(!document.hidden);
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, []);

  useEffect(() => {
    const updateWidth = () => {
      const container = document.querySelector('.pdf-container');
      if (container) {
        setContainerWidth(container.clientWidth);
      }
    };

    updateWidth();
    window.addEventListener('resize', updateWidth);
    return () => window.removeEventListener('resize', updateWidth);
  }, []);

  useEffect(() => {
    const timer = setInterval(() => {
      if (isTabVisible) {
        setCurrentPageTime((prev) => prev + 1);
        setPageTimes((prev) => ({
          ...prev,
          [pageNumber]: (prev[pageNumber] || 0) + 1,
        }));
      }
    }, 1000);

    return () => clearInterval(timer);
  }, [pageNumber, isTabVisible]);

  const handlePageChange = (newPage: number) => {
    if (numPages && newPage >= 1 && newPage <= numPages) {
      setPageNumber(newPage);
      setVisitedPages((prev) => new Set([...prev, newPage]));
      setCurrentPageTime(pageTimes[newPage] || 0);
    }
  };

  const handleZoom = (newScale: number) => {
    const validScale = Math.min(1.5, Math.max(0.6, newScale));
    setScale(validScale);
  };

  const handleLayoutChange = (newMode: 'split' | 'pdf') => {
    setLayoutMode(newMode);
  };

  const onDocumentLoadSuccess = ({ numPages }: { numPages: number }) => {
    setNumPages(numPages);
  };

  const handleSearch = (term: string) => {
    setSearchTerm(term);
  };

  const totalPageTime = Object.values(pageTimes).reduce((sum, time) => sum + time, 0);
  const currentPageContent = ocrData.pages[pageNumber.toString()] || '';

  return (
    <div className="h-screen flex flex-col">
      <Header 
        pages={ocrData.pages}
        onPageSelect={handlePageChange}
        onSearch={handleSearch}
      />
      
      <div className="flex-1 relative overflow-hidden">
        <div className={`absolute inset-0 transition-all duration-500 ease-in-out ${
          layoutMode !== 'split' ? 'scale-95 opacity-0 pointer-events-none' : 'scale-100 opacity-100'
        }`}>
          <Split 
            className="h-full flex split"
            sizes={[60, 40]}
            minSize={300}
            gutterSize={10}
            snapOffset={0}
          >
            <div className="h-full flex flex-col pdf-container">
              <PDFControls
                pageNumber={pageNumber}
                numPages={numPages}
                scale={scale}
                currentPageTime={currentPageTime}
                totalPageTime={totalPageTime}
                onPageChange={handlePageChange}
                onZoom={handleZoom}
                layoutMode={layoutMode}
                onLayoutChange={handleLayoutChange}
              />
              <PDFViewer
                pdfUrl={pdfUrl}
                pageNumber={pageNumber}
                scale={scale}
                containerWidth={containerWidth}
                onPageChange={handlePageChange}
                onDocumentLoadSuccess={onDocumentLoadSuccess}
              />
            </div>

            <div className="h-full overflow-auto">
              <div className="p-4">
                <QuestionAnswering pageContents={ocrData.pages} />
              </div>
            </div>
          </Split>
        </div>

        {/* Full PDF view */}
        <div className={`absolute inset-0 transition-all duration-500 ease-in-out transform ${
          layoutMode === 'pdf' 
            ? 'translate-x-0 opacity-100' 
            : '-translate-x-full opacity-0 pointer-events-none'
        }`}>
          <div className="h-full flex flex-col">
            <PDFControls
              pageNumber={pageNumber}
              numPages={numPages}
              scale={scale}
              currentPageTime={currentPageTime}
              totalPageTime={totalPageTime}
              onPageChange={handlePageChange}
              onZoom={handleZoom}
              layoutMode={layoutMode}
              onLayoutChange={handleLayoutChange}
            />
            <PDFViewer
              pdfUrl={pdfUrl}
              pageNumber={pageNumber}
              scale={scale}
              containerWidth={window.innerWidth}
              onPageChange={handlePageChange}
              onDocumentLoadSuccess={onDocumentLoadSuccess}
            />
          </div>
        </div>
      </div>
    </div>
  );
};