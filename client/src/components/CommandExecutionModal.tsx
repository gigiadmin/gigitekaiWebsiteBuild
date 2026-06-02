import { useState } from "react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { trpc } from "@/lib/trpc";
import { AlertCircle, CheckCircle, AlertTriangle, Loader2 } from "lucide-react";

interface CommandExecutionModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  command: {
    intent?: string;  // From AI suggestions, may use 'command' field instead
    command?: string; // From AI suggestions
    description: string;
    confidence?: number;
    parameters?: Record<string, any>; // Optional command parameters
  } | null;
  onExecutionComplete?: () => void;
}

/**
 * Command Execution Modal
 * Allows users to review, validate, and execute suggested commands
 */
export function CommandExecutionModal({
  open,
  onOpenChange,
  command,
  onExecutionComplete,
}: CommandExecutionModalProps) {
  const [dryRun, setDryRun] = useState(true);
  const [parameters, setParameters] = useState<Record<string, string>>({});
  const [executionStep, setExecutionStep] = useState<"review" | "validate" | "execute" | "result">("review");
  const [executionResult, setExecutionResult] = useState<any>(null);

  // Fetch command details
  const { data: commandDetails, isLoading: detailsLoading } = trpc.commandExecution.getCommandDetails.useQuery(
    { intent: command?.intent || command?.command || "" },
    { enabled: !!command }
  );

  // Validate command
  const validateQuery = trpc.commandExecution.validateCommand.useQuery(
    { intent: command?.intent || command?.command || '', parameters },
    { enabled: false }
  );

  // Execute command
  const executeMutation = trpc.commandExecution.executeCommand.useMutation();

  const handleValidate = async () => {
    if (!command) return;
    setExecutionStep("validate");
    // Trigger validation query
    await validateQuery.refetch();
    if (validateQuery.data?.valid) {
      setExecutionStep("execute");
    }
  };

  const handleExecute = async () => {
    if (!command) return;

    const result = await executeMutation.mutateAsync({
      intent: command.intent || command.command || '',
      description: command.description,
      parameters: parameters || undefined,
      dryRun,
      requiresApproval: (commandDetails?.command?.requiresApproval) || false,
    });

    setExecutionResult(result);
    setExecutionStep("result");

    if (result.success && !dryRun) {
      onExecutionComplete?.();
    }
  };

  const handleClose = () => {
    setExecutionStep("review");
    setParameters({});
    setExecutionResult(null);
    onOpenChange(false);
  };

  if (!command) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl bg-slate-800 border-slate-700">
        <DialogHeader>
          <DialogTitle className="text-white flex items-center gap-2">
            {executionStep === "result" && executionResult?.success ? (
              <CheckCircle className="w-5 h-5 text-green-400" />
            ) : executionStep === "result" && !executionResult?.success ? (
              <AlertCircle className="w-5 h-5 text-red-400" />
            ) : (
              <AlertTriangle className="w-5 h-5 text-yellow-400" />
            )}
            Execute Command
          </DialogTitle>
          <DialogDescription>
            {executionStep === "review" && "Review command details before execution"}
            {executionStep === "validate" && "Validating command parameters..."}
            {executionStep === "execute" && "Ready to execute command"}
            {executionStep === "result" && "Execution complete"}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Command Details Card */}
          <Card className="bg-slate-700 border-slate-600">
            <CardHeader>
              <CardTitle className="text-white text-lg">{command.intent || command.command}</CardTitle>
              <CardDescription>{command.description}</CardDescription>
            </CardHeader>
            <CardContent className="space-y-2">
              {command.confidence && (
                <div className="flex justify-between items-center">
                  <span className="text-slate-400">Confidence Score</span>
                  <span className="text-yellow-400 font-medium">{(command.confidence * 100).toFixed(0)}%</span>
                </div>
              )}
              {commandDetails?.command?.riskLevel && (
                <div className="flex justify-between items-center">
                  <span className="text-slate-400">Risk Level</span>
                  <span
                    className={`font-medium ${
                      commandDetails.command.riskLevel === "high"
                        ? "text-red-400"
                        : commandDetails.command.riskLevel === "medium"
                          ? "text-yellow-400"
                          : "text-green-400"
                    }`}
                  >
                    {commandDetails.command.riskLevel}
                  </span>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Parameters Input */}
          {commandDetails?.command?.parameters && commandDetails.command.parameters.length > 0 && (
            <Card className="bg-slate-700 border-slate-600">
              <CardHeader>
                <CardTitle className="text-white text-sm">Parameters</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {commandDetails.command.parameters.map((param: any) => (
                  <div key={param.name}>
                    <Label className="text-slate-300 text-sm">
                      {param.name}
                      {param.required && <span className="text-red-400 ml-1">*</span>}
                    </Label>
                    <Input
                      placeholder={param.description}
                      value={parameters[param.name] || ""}
                      onChange={(e) =>
                        setParameters({
                          ...parameters,
                          [param.name]: e.target.value,
                        })
                      }
                      className="bg-slate-600 border-slate-500 text-white mt-1"
                      disabled={executionStep !== "review"}
                    />
                  </div>
                ))}
              </CardContent>
            </Card>
          )}

          {/* Dry-Run Checkbox */}
          {executionStep === "review" && (
            <div className="flex items-center space-x-2 p-3 bg-slate-700 rounded">
              <Checkbox
                id="dry-run"
                checked={dryRun}
                onCheckedChange={(checked) => setDryRun(checked as boolean)}
                className="border-slate-500"
              />
              <Label htmlFor="dry-run" className="text-slate-300 cursor-pointer">
                Dry-run (validate without executing)
              </Label>
            </div>
          )}

          {/* Execution Result */}
          {executionStep === "result" && executionResult && (
            <Card
              className={`${
                executionResult.success ? "bg-green-900/20 border-green-600" : "bg-red-900/20 border-red-600"
              }`}
            >
              <CardHeader>
                <CardTitle className={`text-sm ${executionResult.success ? "text-green-400" : "text-red-400"}`}>
                  {executionResult.success ? "Execution Successful" : "Execution Failed"}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2 text-sm">
                {executionResult.dryRun && (
                  <p className="text-blue-400">
                    ✓ Dry-run validation passed. Command is ready to execute.
                  </p>
                )}
                {executionResult.execution && (
                  <>
                    <div className="flex justify-between">
                      <span className="text-slate-400">Status</span>
                      <span className="text-white font-medium">{executionResult.execution.status}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-400">Execution Time</span>
                      <span className="text-white font-medium">{executionResult.execution.executionTime}ms</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-400">Executed By</span>
                      <span className="text-white font-medium">{executionResult.execution.executedBy}</span>
                    </div>
                    <div className="mt-3 p-2 bg-slate-700 rounded text-xs text-slate-300 max-h-24 overflow-y-auto">
                      {executionResult.execution.output}
                    </div>
                  </>
                )}
                {executionResult.error && (
                  <p className="text-red-400">{executionResult.error}</p>
                )}
              </CardContent>
            </Card>
          )}

          {/* Loading State */}
          {(detailsLoading || validateQuery.isLoading || executeMutation.isPending) && (
            <div className="flex items-center justify-center py-4">
              <Loader2 className="w-5 h-5 animate-spin text-cyan-400 mr-2" />
              <span className="text-slate-400">Processing...</span>
            </div>
          )}
        </div>

        <DialogFooter className="space-x-2">
          {executionStep === "review" && (
            <>
              <Button variant="outline" onClick={handleClose} className="border-slate-600">
                Cancel
              </Button>
              <Button
                onClick={handleValidate}
                disabled={validateQuery.isLoading}
                className="bg-blue-600 hover:bg-blue-700"
              >
                {dryRun ? "Validate" : "Execute"}
              </Button>
            </>
          )}
          {executionStep === "execute" && (
            <>
              <Button variant="outline" onClick={() => setExecutionStep("review")} className="border-slate-600">
                Back
              </Button>
              <Button
                onClick={handleExecute}
                disabled={executeMutation.isPending}
                className="bg-green-600 hover:bg-green-700"
              >
                {executeMutation.isPending ? "Executing..." : "Execute Now"}
              </Button>
            </>
          )}
          {executionStep === "result" && (
            <>
              <Button onClick={handleClose} className="bg-slate-600 hover:bg-slate-700">
                Close
              </Button>
              {executionResult?.dryRun && (
                <Button
                  onClick={() => {
                    setDryRun(false);
                    handleExecute();
                  }}
                  className="bg-green-600 hover:bg-green-700"
                >
                  Execute for Real
                </Button>
              )}
            </>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
