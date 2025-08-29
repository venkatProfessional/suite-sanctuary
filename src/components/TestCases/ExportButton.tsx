import React, { useState } from 'react';
import { Download, FileSpreadsheet, FileJson, FileText } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { useToast } from '@/hooks/use-toast';
import { TestCase } from '@/types';
import * as XLSX from 'xlsx';

interface ExportButtonProps {
  testCases: TestCase[];
}

export const ExportButton: React.FC<ExportButtonProps> = ({ testCases }) => {
  const { toast } = useToast();
  const [isExporting, setIsExporting] = useState(false);

  const exportToExcel = async () => {
    try {
      setIsExporting(true);
      
      const worksheetData = testCases.map(tc => ({
        ID: tc.id,
        Title: tc.title,
        Description: tc.description,
        Preconditions: tc.preconditions,
        Steps: tc.steps.map((step, index) => `${index + 1}. ${step.description} → ${step.expectedResult}`).join('\n'),
        'Expected Results': tc.expectedResults,
        'Actual Result': tc.actualResult || '',
        Priority: tc.priority,
        Status: tc.status,
        'Execution Status': tc.executionStatus || 'Not Run',
        'Custom Status': tc.customStatus || '',
        'Suite Name': tc.suiteId ? (tc.suiteId === 'no-suite' ? 'No Suite' : tc.suiteId) : 'No Suite',
        Tags: tc.tags.join(', '),
        'Screenshots Count': tc.screenshots?.length || 0,
        'Created Date': new Date(tc.createdAt).toLocaleDateString(),
        'Updated Date': new Date(tc.updatedAt).toLocaleDateString(),
        Version: tc.version
      }));

      const worksheet = XLSX.utils.json_to_sheet(worksheetData);
      
      // Set column widths
      worksheet['!cols'] = [
        { wch: 40 }, // ID
        { wch: 50 }, // Title
        { wch: 60 }, // Description
        { wch: 40 }, // Preconditions
        { wch: 80 }, // Steps
        { wch: 60 }, // Expected Results
        { wch: 60 }, // Actual Result
        { wch: 12 }, // Priority
        { wch: 12 }, // Status
        { wch: 15 }, // Execution Status
        { wch: 15 }, // Custom Status
        { wch: 25 }, // Suite Name
        { wch: 30 }, // Tags
        { wch: 15 }, // Screenshots Count
        { wch: 15 }, // Created Date
        { wch: 15 }, // Updated Date
        { wch: 10 }  // Version
      ];

      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, worksheet, 'Test Cases');

      const fileName = `test-cases-${new Date().toISOString().split('T')[0]}.xlsx`;
      XLSX.writeFile(workbook, fileName);

      toast({
        title: 'Export Successful',
        description: `Exported ${testCases.length} test cases to Excel`
      });
    } catch (error) {
      console.error('Export error:', error);
      toast({
        title: 'Export Failed',
        description: 'Failed to export test cases to Excel',
        variant: 'destructive'
      });
    } finally {
      setIsExporting(false);
    }
  };

  const exportToJson = async () => {
    try {
      setIsExporting(true);
      
      const exportData = {
        exportedAt: new Date().toISOString(),
        totalTestCases: testCases.length,
        testCases: testCases
      };

      const blob = new Blob([JSON.stringify(exportData, null, 2)], {
        type: 'application/json'
      });

      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `test-cases-${new Date().toISOString().split('T')[0]}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      toast({
        title: 'Export Successful',
        description: `Exported ${testCases.length} test cases to JSON`
      });
    } catch (error) {
      console.error('Export error:', error);
      toast({
        title: 'Export Failed',
        description: 'Failed to export test cases to JSON',
        variant: 'destructive'
      });
    } finally {
      setIsExporting(false);
    }
  };

  const exportToCsv = async () => {
    try {
      setIsExporting(true);
      
      const headers = [
        'ID', 'Title', 'Description', 'Preconditions', 'Steps', 
        'Expected Results', 'Actual Result', 'Priority', 'Status', 
        'Execution Status', 'Custom Status', 'Suite Name', 'Tags', 
        'Screenshots Count', 'Created Date', 'Updated Date', 'Version'
      ];

      const csvData = [
        headers.join(','),
        ...testCases.map(tc => [
          `"${tc.id}"`,
          `"${tc.title.replace(/"/g, '""')}"`,
          `"${tc.description.replace(/"/g, '""')}"`,
          `"${tc.preconditions.replace(/"/g, '""')}"`,
          `"${tc.steps.map((step, index) => `${index + 1}. ${step.description} → ${step.expectedResult}`).join('\n').replace(/"/g, '""')}"`,
          `"${tc.expectedResults.replace(/"/g, '""')}"`,
          `"${(tc.actualResult || '').replace(/"/g, '""')}"`,
          `"${tc.priority}"`,
          `"${tc.status}"`,
          `"${tc.executionStatus || 'Not Run'}"`,
          `"${(tc.customStatus || '').replace(/"/g, '""')}"`,
          `"${tc.suiteId ? (tc.suiteId === 'no-suite' ? 'No Suite' : tc.suiteId) : 'No Suite'}"`,
          `"${tc.tags.join(', ')}"`,
          `"${tc.screenshots?.length || 0}"`,
          `"${new Date(tc.createdAt).toLocaleDateString()}"`,
          `"${new Date(tc.updatedAt).toLocaleDateString()}"`,
          `"${tc.version}"`
        ].join(','))
      ].join('\n');

      const blob = new Blob([csvData], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `test-cases-${new Date().toISOString().split('T')[0]}.csv`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      toast({
        title: 'Export Successful',
        description: `Exported ${testCases.length} test cases to CSV`
      });
    } catch (error) {
      console.error('Export error:', error);
      toast({
        title: 'Export Failed',
        description: 'Failed to export test cases to CSV',
        variant: 'destructive'
      });
    } finally {
      setIsExporting(false);
    }
  };

  if (testCases.length === 0) {
    return (
      <Button variant="outline" disabled>
        <Download className="w-4 h-4 mr-2" />
        Export
      </Button>
    );
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" disabled={isExporting}>
          <Download className="w-4 h-4 mr-2" />
          {isExporting ? 'Exporting...' : 'Export'}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuItem onClick={exportToExcel}>
          <FileSpreadsheet className="w-4 h-4 mr-2 text-green-600" />
          Export to Excel (.xlsx)
        </DropdownMenuItem>
        <DropdownMenuItem onClick={exportToCsv}>
          <FileText className="w-4 h-4 mr-2 text-blue-600" />
          Export to CSV
        </DropdownMenuItem>
        <DropdownMenuItem onClick={exportToJson}>
          <FileJson className="w-4 h-4 mr-2 text-orange-600" />
          Export to JSON
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
};