import React from 'react';
import { Download, FileText, FileSpreadsheet, ChevronDown } from 'lucide-react';
import { SimpleDropdown, SimpleDropdownItem } from './SimpleDropdown';
import { Button } from './button';

interface CleanExportDropdownProps {
  onExport: (format: 'csv' | 'pdf') => void;
  disabled?: boolean;
}

export function CleanExportDropdown({ onExport, disabled = false }: CleanExportDropdownProps) {
  return (
    <SimpleDropdown
      trigger={
        <Button 
          variant="outline" 
          size="sm" 
          className="gap-2 h-8"
          disabled={disabled}
        >
          <Download className="w-4 h-4" />
          Export
          <ChevronDown className="w-4 h-4" />
        </Button>
      }
      align="end"
    >
      <SimpleDropdownItem
        icon={<FileSpreadsheet size={16} />}
        onClick={() => onExport('csv')}
      >
        Export as CSV
      </SimpleDropdownItem>
      <SimpleDropdownItem
        icon={<FileText size={16} />}
        onClick={() => onExport('pdf')}
      >
        Export as PDF
      </SimpleDropdownItem>
    </SimpleDropdown>
  );
}