import React from 'react';
import { SearchBar } from './SearchBar';

interface HeaderProps {
  pages: { [key: string]: string };
  onPageSelect: (page: number) => void;
  onSearch: (term: string) => void;
}

export const Header: React.FC<HeaderProps> = ({ 
  pages,
  onPageSelect,
  onSearch
}) => {
  return (
    <header className="bg-white border-b border-gray-200">
      <div className="flex items-center justify-between px-4 py-2">
        <div className="flex items-center gap-6">
          <div className="flex items-center gap-2">
            <svg className="w-8 h-8 text-indigo-600" viewBox="0 0 24 24" fill="none" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            <div className="w-64">
              <SearchBar 
                pages={pages}
                onPageSelect={onPageSelect}
                onSearch={onSearch}
              />
            </div>
          </div>
        </div>
      </div>
    </header>
  );
};