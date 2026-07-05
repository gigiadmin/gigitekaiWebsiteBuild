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

// Robust CSV row parser that handles quoted fields with commas inside
function parseCSVRow(line: string): string[] {
  const result: string[] = [];
  let current = '';
  let inQuotes = false;
  for (let i = 0; i < line.length; i++) {
    const ch = line[i];
    if (ch === '"') {
      if (inQuotes && line[i + 1] === '"') {
        current += '"';
        i++;
      } else {
        inQuotes = !inQuotes;
      }
    } else if (ch === ',' && !inQuotes) {
      result.push(current.trim());
      current = '';
    } else {
      current += ch;
    }
  }
  result.push(current.trim());
  return result;
}

// Column name aliases — maps various header names to our canonical field names
const COLUMN_ALIASES: Record<string, string> = {
  // title
  title: 'title',
  'article title': 'title',
  name: 'title',
  subject: 'title',
  // content
  content: 'content',
  body: 'content',
  description: 'content',
  text: 'content',
  article: 'content',
  'article body': 'content',
  // category
  category: 'category',
  section: 'category',
  type: 'category',
  workload: 'category',
  // tags
  tags: 'tags',
  keywords: 'tags',
  tag: 'tags',
};

export function KBBulkImportCSV() {
  const [isLoading, setIsLoading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const bulkImportMutation = trpc.helpdeskKb.bulkImport.useMutation({
    onSuccess: (data) => {
      setIsLoading(false);
      toast.success(`✅ Imported ${data.imported} articles successfully`);
      if (fileInputRef.current) fileInputRef.current.value = '';
    },
    onError: (error) => {
      setIsLoading(false);
      toast.error(`❌ Import failed: ${error.message}`);
    },
  });

  const parseCSV = (csvText: string): CSVArticle[] => {
    // Normalize line endings
    const lines = csvText.replace(/\r\n/g, '\n').replace(/\r/g, '\n').split('\n').filter(line => line.trim());
    if (lines.length < 2) throw new Error('CSV must have a header row and at least one data row');

    const rawHeaders = parseCSVRow(lines[0]);
    // Normalize headers using aliases
    const headers = rawHeaders.map(h => {
      const normalized = h.toLowerCase().replace(/[^a-z0-9 ]/g, '').trim();
      return COLUMN_ALIASES[normalized] || normalized;
    });

    const titleIdx = headers.indexOf('title');
    const contentIdx = headers.indexOf('content');
    const categoryIdx = headers.indexOf('category');
    const tagsIdx = headers.indexOf('tags');

    // Build a helpful error message listing what was found
    if (titleIdx === -1 || categoryIdx === -1) {
      const found = rawHeaders.join(', ');
      const missing = [
        titleIdx === -1 ? 'Title' : null,
        categoryIdx === -1 ? 'Category' : null,
      ].filter(Boolean).join(', ');
      throw new Error(
        `Missing required columns: ${missing}. Found: ${found}. ` +
        `Accepted column names: Title/Name/Subject, Content/Body/Description, Category/Section/Workload`
      );
    }

    const articles: CSVArticle[] = [];
    for (let i = 1; i < lines.length; i++) {
      const values = parseCSVRow(lines[i]);
      const title = titleIdx >= 0 ? (values[titleIdx] || '').trim() : '';
      if (!title) continue; // skip empty rows

      // If no content column, generate a placeholder from the title
      const content = contentIdx >= 0 && values[contentIdx]
        ? values[contentIdx].trim()
        : `# ${title}\n\nThis article covers ${title}. Please update with full content.`;

      articles.push({
        title,
        content,
        category: categoryIdx >= 0 ? (values[categoryIdx] || 'General').trim() : 'General',
        tags: tagsIdx >= 0 ? (values[tagsIdx] || '').trim() : '',
      });
    }
    return articles;
  };

  const downloadTemplate = () => {
    const csv = `Title,Content,Category,Tags\n"How to Reset Your Password","## How to Reset Your Password\n\nFollow these steps to reset your password...","Email > Authentication","password, reset, sspr"\n"Fix OneDrive Sync Issues","## OneDrive Sync Issues\n\nIf OneDrive is not syncing...","OneDrive > Sync","onedrive, sync, troubleshoot"`;
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'kb-import-template.csv';
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.name.endsWith('.csv')) {
      toast.error('Please select a CSV file (.csv). To import Excel files, save as CSV first.');
      return;
    }

    try {
      const text = await file.text();
      const articles = parseCSV(text);

      if (articles.length === 0) {
        toast.error('No articles found in CSV. Make sure the file has data rows below the header.');
        return;
      }

      toast.info(`Found ${articles.length} articles — importing...`);
      setIsLoading(true);
      await bulkImportMutation.mutateAsync({ articles });
    } catch (error) {
      toast.error(`Error: ${error instanceof Error ? error.message : 'Unknown error'}`);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  return (
    <div className="w-full p-4 mb-6 bg-slate-800 border border-cyan-500/30 rounded-lg">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h3 className="text-lg font-bold text-white">📥 Bulk Import KB Articles</h3>
          <p className="text-sm text-gray-400 mt-1">
            CSV columns: <span className="text-cyan-400">Title</span>, Content, <span className="text-cyan-400">Category</span>, Tags
            &nbsp;·&nbsp; Excel: save as CSV first
          </p>
        </div>
        <div className="flex gap-2 flex-wrap">
          <Button
            onClick={downloadTemplate}
            variant="outline"
            className="border-cyan-500/40 text-cyan-400 hover:bg-cyan-500/10"
          >
            📋 Download Template
          </Button>
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
