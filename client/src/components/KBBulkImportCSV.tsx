'use client';
import { useState, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { AlertCircle, CheckCircle2, Loader2, Upload, FileText } from 'lucide-react';
import { trpc } from '@/lib/trpc';
import { toast } from 'sonner';

interface CSVArticle {
  title: string;
  content: string;
  category: string;
  tags?: string;
  tier?: number;
  audience?: string;
}

/**
 * Component to bulk import KB articles from CSV file
 */
export function KBBulkImportCSV() {
  const [isLoading, setIsLoading] = useState(false);
  const [uploadedFile, setUploadedFile] = useState<string | null>(null);
  const [importResult, setImportResult] = useState<{
    imported: number;
    failed: number;
    errors: string[];
  } | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const bulkImportMutation = trpc.helpdeskKb.bulkImport.useMutation({
    onSuccess: (data) => {
      setIsLoading(false);
      setImportResult({
        imported: data.imported,
        failed: data.failed,
        errors: data.errors,
      });
      toast.success(`✅ Imported ${data.imported} articles${data.failed > 0 ? `, ${data.failed} failed` : ''}`);
    },
    onError: (error) => {
      setIsLoading(false);
      toast.error(`❌ Import failed: ${error.message}`);
    },
  });

  const parseCSV = (csvText: string): CSVArticle[] => {
    const lines = csvText.split('\n').filter(line => line.trim());
    if (lines.length < 2) throw new Error('CSV must have header and at least one data row');

    const headers = lines[0].split(',').map(h => h.trim().toLowerCase());
    const titleIdx = headers.indexOf('title');
    const contentIdx = headers.indexOf('content');
    const categoryIdx = headers.indexOf('category');
    const tagsIdx = headers.indexOf('tags');
    const tierIdx = headers.indexOf('tier');
    const audienceIdx = headers.indexOf('audience');

    if (titleIdx === -1 || contentIdx === -1 || categoryIdx === -1) {
      throw new Error('CSV must have Title, Content, and Category columns');
    }

    const articles: CSVArticle[] = [];
    for (let i = 1; i < lines.length; i++) {
      const values = lines[i].split(',').map(v => v.trim());
      articles.push({
        title: values[titleIdx] || '',
        content: values[contentIdx] || '',
        category: values[categoryIdx] || '',
        tags: values[tagsIdx],
        tier: tierIdx !== -1 ? parseInt(values[tierIdx]) || 2 : 2,
        audience: values[audienceIdx] || 'Help Desk',
      });
    }

    return articles;
  };

  const handleFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
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

      setUploadedFile(`${file.name} (${articles.length} articles)`);
      setIsLoading(true);

      // Import articles
      await bulkImportMutation.mutateAsync({ articles });
    } catch (error) {
      toast.error(`Error parsing CSV: ${error instanceof Error ? error.message : 'Unknown error'}`);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const handleReset = () => {
    setUploadedFile(null);
    setImportResult(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  return (
    <Card className="w-full border-cyan-500/20 bg-gradient-to-br from-slate-900 to-slate-950">
      <CardHeader>
        <div className="flex items-center gap-2">
          <Upload className="h-5 w-5 text-cyan-400" />
          <div>
            <CardTitle>Bulk Import KB Articles</CardTitle>
            <CardDescription>
              Import multiple KB articles from a CSV file
            </CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* CSV Format Info */}
        <div className="rounded-lg bg-slate-800/50 p-3 border border-slate-700 space-y-2">
          <p className="text-sm font-semibold text-cyan-400 flex items-center gap-2">
            <FileText className="h-4 w-4" />
            CSV Format Required
          </p>
          <p className="text-xs text-slate-300">
            <strong>Required columns:</strong> Title, Content, Category
          </p>
          <p className="text-xs text-slate-300">
            <strong>Optional columns:</strong> Tags, Tier (1-3), Audience
          </p>
          <p className="text-xs text-slate-300">
            <strong>Max articles per import:</strong> 1000
          </p>
        </div>

        {/* Import Result */}
        {importResult && (
          <div className={`rounded-lg border p-3 flex gap-2 ${
            importResult.failed === 0
              ? 'bg-green-900/20 border-green-500/30'
              : 'bg-yellow-900/20 border-yellow-500/30'
          }`}>
            <CheckCircle2 className={`h-5 w-5 flex-shrink-0 mt-0.5 ${
              importResult.failed === 0 ? 'text-green-400' : 'text-yellow-400'
            }`} />
            <div className={`text-sm ${importResult.failed === 0 ? 'text-green-300' : 'text-yellow-300'}`}>
              <p className="font-semibold">
                ✅ Imported {importResult.imported} articles
                {importResult.failed > 0 && ` (${importResult.failed} failed)`}
              </p>
              {importResult.errors.length > 0 && (
                <ul className="mt-2 space-y-1 text-xs">
                  {importResult.errors.slice(0, 3).map((error, i) => (
                    <li key={i}>• {error}</li>
                  ))}
                  {importResult.errors.length > 3 && (
                    <li>• ... and {importResult.errors.length - 3} more errors</li>
                  )}
                </ul>
              )}
            </div>
          </div>
        )}

        {/* File Upload */}
        <div className="space-y-2">
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
            variant="outline"
            className="w-full border-cyan-500/30 hover:bg-cyan-500/10"
          >
            {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {uploadedFile ? `✅ ${uploadedFile}` : 'Select CSV File'}
          </Button>
        </div>

        {/* Action Buttons */}
        {importResult && (
          <Button
            onClick={handleReset}
            variant="outline"
            className="w-full"
          >
            Import Another File
          </Button>
        )}

        {/* Help Text */}
        <p className="text-xs text-slate-400 text-center">
          Articles will be published immediately and indexed for ARIA search.
        </p>
      </CardContent>
    </Card>
  );
}
