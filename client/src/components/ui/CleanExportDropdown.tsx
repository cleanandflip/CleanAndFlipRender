import React, { useState, useRef, useEffect } from 'react';
import { Download, FileText, FileSpreadsheet, ChevronDown } from 'lucide-react';
import { cn } from '@/lib/utils';

interface CleanExportDropdownProps {
  onExport: (format: 'csv' | 'pdf') => void;
  disabled?: boolean;
}

export function CleanExportDropdown({ onExport, disabled = false }: CleanExportDropdownProps) {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Click outside handler
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [isOpen]);

  const handleExport = (format: 'csv' | 'pdf') => {
    onExport(format);
    setIsOpen(false);
  };

  return (
    <div className="relative" ref={dropdownRef}>
      {/* Export Trigger */}
      <button
        type="button"
        onClick={() => !disabled && setIsOpen(!isOpen)}
        disabled={disabled}
        className={cn(
          "px-4 py-2 rounded-lg transition-all duration-200 focus:outline-none flex items-center gap-2",
          disabled ? "cursor-not-allowed opacity-50" : "cursor-pointer"
        )}
        style={{
          background: 'rgba(75, 85, 99, 0.4)',
          border: '1px solid rgba(156, 163, 175, 0.4)',
          color: 'white',
          fontWeight: '500'
        }}
      >
        <Download className="w-4 h-4" />
        <span>Export</span>
        <ChevronDown 
          className={cn(
            "w-4 h-4 text-gray-400 transition-transform duration-200",
            isOpen && "rotate-180"
          )}
        />
      </button>

      {/* Dropdown Menu */}
      {isOpen && !disabled && (
        <>
          {/* Backdrop */}
          <div 
            className="fixed inset-0 z-40 bg-black/20" 
            onClick={() => setIsOpen(false)}
          />
          
          {/* Dropdown Content */}
          <div 
            className="absolute top-full right-0 mt-2 z-50 w-48 rounded-lg overflow-hidden"
            style={{
              background: 'rgba(75, 85, 99, 0.4)',
              border: '1px solid rgba(156, 163, 175, 0.4)',
              backdropFilter: 'blur(8px)',
              WebkitBackdropFilter: 'blur(8px)'
            }}
          >
            <div className="p-2 space-y-1">
              <button
                onClick={() => handleExport('csv')}
                className="w-full p-3 rounded-lg text-left transition-all duration-200 hover:bg-white/10 flex items-center gap-3"
              >
                <div className="w-8 h-8 rounded-lg bg-gray-600 flex items-center justify-center">
                  <FileSpreadsheet className="w-4 h-4 text-gray-400" />
                </div>
                <span className="text-white font-medium">Export as CSV</span>
              </button>
              
              <button
                onClick={() => handleExport('pdf')}
                className="w-full p-3 rounded-lg text-left transition-all duration-200 hover:bg-white/10 flex items-center gap-3"
              >
                <div className="w-8 h-8 rounded-lg bg-gray-600 flex items-center justify-center">
                  <FileText className="w-4 h-4 text-gray-400" />
                </div>
                <span className="text-white font-medium">Export as PDF</span>
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  );
}