import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { AlertCircle, CheckCircle2, Loader2, BookOpen } from 'lucide-react';
import { trpc } from '@/lib/trpc';

/**
 * Admin component to bulk insert 30 KB articles
 * Copilot Studio compliant with confidence routing and escalation logic
 */
export function AdminKBBulkInsert() {
  const [isLoading, setIsLoading] = useState(false);
  const [isCompleted, setIsCompleted] = useState(false);
  const [message, setMessage] = useState('');

  // Mutation to bulk insert KB articles
  const bulkInsertMutation = trpc.kbBulkInsert.bulkInsertArticles.useMutation({
    onSuccess: (data) => {
      setIsLoading(false);
      setIsCompleted(true);
      setMessage(`✅ Success! ${data.count} KB articles inserted successfully. Aria chat can now answer IT support questions!`);
    },
    onError: (error) => {
      setIsLoading(false);
      setMessage(`❌ Error: ${error.message || 'Failed to insert KB articles'}`);
    },
  });

  // Mutation to get KB article count
  const getCountQuery = trpc.kbBulkInsert.getArticleCount.useQuery(undefined, {
    enabled: isCompleted,
  });

  const handleBulkInsert = async () => {
    setIsLoading(true);
    setMessage('');
    try {
      await bulkInsertMutation.mutateAsync();
    } catch (error) {
      console.error('Error during bulk insert:', error);
    }
  };

  return (
    <Card className="w-full border-cyan-500/20 bg-gradient-to-br from-slate-900 to-slate-950">
      <CardHeader>
        <div className="flex items-center gap-2">
          <BookOpen className="h-5 w-5 text-cyan-400" />
          <div>
            <CardTitle>KB Bulk Insert</CardTitle>
            <CardDescription>
              Insert 30 IT support articles for Aria chat training
            </CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Info Section */}
        <div className="space-y-2 rounded-lg bg-slate-800/50 p-3 border border-slate-700">
          <p className="text-sm text-slate-300">
            <strong>Articles included:</strong> 30 Microsoft 365 & Windows IT support articles
          </p>
          <p className="text-sm text-slate-300">
            <strong>Categories:</strong> Identity & Access, Email & Collaboration, Teams, Device Management, File Storage, Office Applications, Network, Security
          </p>
          <p className="text-sm text-slate-300">
            <strong>Features:</strong> Copilot Studio compliance, confidence-based routing, escalation logic, training utterances
          </p>
        </div>

        {/* Status Section */}
        {isCompleted && (
          <div className="rounded-lg bg-green-900/20 border border-green-500/30 p-3 flex gap-2">
            <CheckCircle2 className="h-5 w-5 text-green-400 flex-shrink-0 mt-0.5" />
            <div className="text-sm text-green-300">
              <p className="font-semibold">KB articles inserted successfully!</p>
              <p>Aria chat can now answer {getCountQuery.data?.count || 30} IT support questions.</p>
            </div>
          </div>
        )}

        {/* Message Section */}
        {message && !isCompleted && (
          <div className="rounded-lg bg-red-900/20 border border-red-500/30 p-3 flex gap-2">
            <AlertCircle className="h-5 w-5 text-red-400 flex-shrink-0 mt-0.5" />
            <div className="text-sm text-red-300">
              <p>{message}</p>
            </div>
          </div>
        )}

        {/* Warning Section */}
        <div className="rounded-lg bg-yellow-900/20 border border-yellow-500/30 p-3 flex gap-2">
          <AlertCircle className="h-5 w-5 text-yellow-400 flex-shrink-0 mt-0.5" />
          <div className="text-sm text-yellow-300">
            <p className="font-semibold">One-time operation</p>
            <p>This will insert articles into the database. Run once to populate the KB.</p>
          </div>
        </div>

        {/* Action Button */}
        <Button
          onClick={handleBulkInsert}
          disabled={isLoading || isCompleted}
          className="w-full bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white font-semibold"
        >
          {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          {isCompleted ? '✅ Completed' : isLoading ? 'Inserting...' : 'Insert 30 KB Articles'}
        </Button>

        {/* Help Text */}
        <p className="text-xs text-slate-400 text-center">
          After insertion, Aria will automatically search these articles when answering user questions.
        </p>
      </CardContent>
    </Card>
  );
}
