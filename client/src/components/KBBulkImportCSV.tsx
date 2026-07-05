'use client';
import { useState, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { trpc } from '@/lib/trpc';
import { toast } from 'sonner';

interface CSVArticle {
  title: string;
  content: string;
  category: string;
  tags?: string;
}

export function KBBulkImportCSV() {
  const [isLoading, setIsLoading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const bulkImportMutation = trpc.helpdeskKb.bulkImport.useMutation({
    onSuccess: (data) => {
      setIsLoading(false);
      toast.success(`✅ Imported ${data.imported} articles`);
      if (fileInputRef.current) fileInputRef.current.value = '';
    },
    onError: (error) => {
      setIsLoading(false);
      toast.error(`❌ Import failed: ${error.message}`);
    },
  });

  const parseCSV = (csvText: string): CSVArticle[] => {
    const lines = csvText.split('\n').filter(line => line.trim());
    if (lines.length < 2) throw new Error('CSV must have header and data rows');

    const headers = lines[0].split(',').map(h => h.trim().toLowerCase());
    const titleIdx = headers.indexOf('title');
    const contentIdx = headers.indexOf('content');
    const categoryIdx = headers.indexOf('category');
    const tagsIdx = headers.indexOf('tags');

    if (titleIdx === -1 || contentIdx === -1 || categoryIdx === -1) {
      throw new Error('CSV must have Title, Content, and Category columns');
    }

    const articles: CSVArticle[] = [];
    for (let i = 1; i < lines.length; i++) {
      const values = lines[i].split(',').map(v => v.trim());
      if (values.length > titleIdx) {
        articles.push({
          title: values[titleIdx] || '',
          content: values[contentIdx] || '',
          category: values[categoryIdx] || 'General',
          tags: tagsIdx >= 0 ? values[tagsIdx] : '',
        });
      }
    }
    return articles;
  };

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.name.endsWith('.csv')) {
      toast.error('Please select a CSV file');
      return;
    }

    try {
      const text = await file.text();
      const articles = parseCSV(text);

      if (articles.length === 0) {
        toast.error('No articles found in CSV');
        return;
      }

      setIsLoading(true);
      await bulkImportMutation.mutateAsync({ articles });
    } catch (error) {
      toast.error(`Error: ${error instanceof Error ? error.message : 'Unknown error'}`);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  return (
    <div className="w-full p-4 mb-6 bg-slate-800 border border-cyan-500/30 rounded-lg">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-bold text-white">📥 Bulk Import KB Articles</h3>
          <p className="text-sm text-gray-400 mt-1">Upload CSV with columns: Title, Content, Category</p>
        </div>
        <div className="flex gap-2">
          <input
            ref={fileInputRef}
            type="file"
            accept=".csv"
            onChange={handleFileSelect}
            disabled={isLoading}
            className="hidden"
          />
          <Button
            onClick={() => fileInputRef.current?.click()}
            disabled={isLoading}
            className="bg-cyan-600 hover:bg-cyan-700 text-white"
          >
            {isLoading ? '⏳ Importing...' : '📤 Select CSV File'}
          </Button>
        </div>
      </div>
    </div>
  );
}
