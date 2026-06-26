import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { AlertCircle, Trash2, CheckCircle } from "lucide-react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

export function AdminAgentCleanup() {
  const [showConfirm, setShowConfirm] = useState(false);
  const [showResults, setShowResults] = useState(false);
  const [results, setResults] = useState<any>(null);

  const getUnauthorized = trpc.agentManagement.getUnauthorizedAgents.useQuery();
  const removeUnauthorized =
    trpc.agentManagement.removeAllUnauthorizedAgents.useMutation({
      onSuccess: (data) => {
        setResults(data);
        setShowResults(true);
        setShowConfirm(false);
        // Refetch the list
        getUnauthorized.refetch();
      },
      onError: (error) => {
        alert(`Error: ${error.message}`);
      },
    });

  const unauthorizedCount = getUnauthorized.data?.count || 0;
  const isLoading =
    getUnauthorized.isLoading || removeUnauthorized.isPending;

  if (getUnauthorized.isLoading) {
    return <div className="text-gray-400">Loading agent status...</div>;
  }

  return (
    <div className="space-y-4">
      {/* Status Card */}
      <div className="border border-cyan-500/30 rounded-lg p-4 bg-cyan-500/5">
        <div className="flex items-center gap-3 mb-3">
          {unauthorizedCount > 0 ? (
            <AlertCircle className="w-5 h-5 text-orange-400" />
          ) : (
            <CheckCircle className="w-5 h-5 text-cyan-400" />
          )}
          <h3 className="text-lg font-semibold text-white">Agent Status</h3>
        </div>

        {unauthorizedCount > 0 ? (
          <div className="space-y-3">
            <p className="text-orange-300">
              ⚠️ Found {unauthorizedCount} unauthorized agent(s)
            </p>
            <div className="bg-black/40 rounded p-3 max-h-40 overflow-y-auto">
              <div className="space-y-1 text-sm">
                {getUnauthorized.data?.agents.map((agent: any) => (
                  <div key={agent.id} className="text-gray-300">
                    • {agent.email}
                  </div>
                ))}
              </div>
            </div>
            <Button
              onClick={() => setShowConfirm(true)}
              disabled={isLoading}
              className="w-full bg-red-600 hover:bg-red-700 text-white"
            >
              <Trash2 className="w-4 h-4 mr-2" />
              {removeUnauthorized.isPending
                ? "Removing..."
                : "Remove All Unauthorized Agents"}
            </Button>
          </div>
        ) : (
          <p className="text-cyan-300">✓ All agents are authorized</p>
        )}
      </div>

      {/* Results Alert */}
      {showResults && results && (
        <div
          className={`border rounded-lg p-4 ${
            results.success
              ? "border-cyan-500/30 bg-cyan-500/5"
              : "border-red-500/30 bg-red-500/5"
          }`}
        >
          <div className="flex items-start gap-3">
            {results.success ? (
              <CheckCircle className="w-5 h-5 text-cyan-400 mt-0.5" />
            ) : (
              <AlertCircle className="w-5 h-5 text-red-400 mt-0.5" />
            )}
            <div>
              <p
                className={`font-semibold ${
                  results.success ? "text-cyan-300" : "text-red-300"
                }`}
              >
                {results.message}
              </p>
              {results.removedAgents && results.removedAgents.length > 0 && (
                <div className="mt-2 text-sm text-gray-300">
                  Removed: {results.removedAgents.join(", ")}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Confirmation Dialog */}
      <AlertDialog open={showConfirm} onOpenChange={setShowConfirm}>
        <AlertDialogContent className="bg-slate-900 border-cyan-500/30">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-white">
              Remove Unauthorized Agents?
            </AlertDialogTitle>
            <AlertDialogDescription className="text-gray-300">
              This will permanently delete {unauthorizedCount} unauthorized
              agent account(s):
              <div className="mt-3 space-y-1 bg-black/40 rounded p-2 max-h-32 overflow-y-auto">
                {getUnauthorized.data?.agents.map((agent: any) => (
                  <div key={agent.id} className="text-sm">
                    • {agent.email}
                  </div>
                ))}
              </div>
              <p className="mt-3 text-orange-300">
                ⚠️ This action cannot be undone.
              </p>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div className="flex gap-3 justify-end">
            <AlertDialogCancel className="bg-slate-800 border-slate-600 text-white hover:bg-slate-700">
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={() => removeUnauthorized.mutate()}
              disabled={removeUnauthorized.isPending}
              className="bg-red-600 hover:bg-red-700 text-white"
            >
              {removeUnauthorized.isPending ? "Removing..." : "Remove All"}
            </AlertDialogAction>
          </div>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
