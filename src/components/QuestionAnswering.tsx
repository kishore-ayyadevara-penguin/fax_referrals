import React, { useState } from 'react';
import { askQuestion } from '../services/api';

interface QuestionAnsweringProps {
  pageContents: { [key: string]: string };
}

interface Answer {
  answer: string;
  supporting_sentence: string;
  position: [number, number];
  pageNumber: string;
}

interface HighlightPopupProps {
  text: string;
  highlightStart: number;
  highlightEnd: number;
  onClose: () => void;
}

const HighlightPopup: React.FC<HighlightPopupProps> = ({ text, highlightStart, highlightEnd, onClose }) => {
  const beforeHighlight = text.slice(0, highlightStart);
  const highlighted = text.slice(highlightStart, highlightEnd);
  const afterHighlight = text.slice(highlightEnd);

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[80vh] flex flex-col">
        <div className="p-4 border-b border-gray-200 flex items-center justify-between">
          <h3 className="text-lg font-medium text-gray-800">Context</h3>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-500 transition-colors"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
        <div className="p-6 overflow-auto">
          <p className="text-gray-800 whitespace-pre-wrap">
            {beforeHighlight}
            <mark className="bg-yellow-200 px-1 rounded">{highlighted}</mark>
            {afterHighlight}
          </p>
        </div>
      </div>
    </div>
  );
};

export const QuestionAnswering: React.FC<QuestionAnsweringProps> = ({ pageContents }) => {
  const [question, setQuestion] = useState('');
  const [mainAnswer, setMainAnswer] = useState<string | null>(null);
  const [supportingContext, setSupportingContext] = useState<Answer[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedContext, setSelectedContext] = useState<{
    text: string;
    start: number;
    end: number;
  } | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!question.trim()) return;

    setIsLoading(true);
    setError(null);

    try {
      const contents = Object.values(pageContents);
      const response = await askQuestion(question, contents);
      
      // Get all answers with their page numbers
      const allAnswers = Object.entries(response).flatMap(([pageNum, answers]) =>
        answers.map(answer => ({
          ...answer,
          pageNumber: pageNum
        }))
      );

      // Set the first answer as the main answer
      if (allAnswers.length > 0) {
        setMainAnswer(allAnswers[0].answer);
        // Keep all supporting contexts including the first answer's context
        setSupportingContext(allAnswers);
      } else {
        setMainAnswer(null);
        setSupportingContext([]);
      }
    } catch (err) {
      setError('Failed to get answer. Please try again.');
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleContextClick = (context: Answer) => {
    const pageContent = pageContents[context.pageNumber];
    if (pageContent) {
      setSelectedContext({
        text: pageContent,
        start: context.position[0],
        end: context.position[1]
      });
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-sm p-6 space-y-6">
      <div className="space-y-4">
        <h2 className="text-lg font-medium text-gray-800">
          Ask a Question
        </h2>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="relative">
            <input
              type="text"
              value={question}
              onChange={(e) => setQuestion(e.target.value)}
              placeholder="Type your question here..."
              className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 text-gray-800 pr-24 bg-gray-50"
            />
            <button
              type="submit"
              disabled={isLoading || !question.trim()}
              className="absolute right-2 top-1/2 -translate-y-1/2 px-4 py-1 bg-indigo-600 text-white rounded-md text-sm font-medium hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoading ? 'Loading...' : 'Ask'}
            </button>
          </div>
        </form>

        {error && (
          <div className="text-red-500 text-sm">
            {error}
          </div>
        )}

        {mainAnswer && (
          <div className="space-y-4">
            <div className="p-4 bg-indigo-50 rounded-lg border border-indigo-100">
              <h3 className="font-medium text-indigo-800 mb-2">Answer:</h3>
              <p className="text-gray-800">{mainAnswer}</p>
            </div>

            {supportingContext.length > 0 && (
              <div className="space-y-2">
                <h3 className="font-medium text-gray-700">Supporting Context:</h3>
                <div className="space-y-3">
                  {supportingContext.map((context, index) => (
                    <button
                      key={index}
                      onClick={() => handleContextClick(context)}
                      className="w-full text-left p-3 bg-gray-50 rounded-lg border border-gray-100 hover:bg-gray-100 transition-colors"
                    >
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-sm font-medium text-gray-600">
                          From page {context.pageNumber}
                        </span>
                        <span className="text-xs text-gray-500">
                          Position: {context.position[0]}-{context.position[1]}
                        </span>
                      </div>
                      <p className="text-sm text-gray-600">
                        {context.supporting_sentence}
                      </p>
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {selectedContext && (
        <HighlightPopup
          text={selectedContext.text}
          highlightStart={selectedContext.start}
          highlightEnd={selectedContext.end}
          onClose={() => setSelectedContext(null)}
        />
      )}
    </div>
  );
};