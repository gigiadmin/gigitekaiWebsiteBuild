import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Brain, Plus, Trash2, Save, X, Zap, MessageSquare, ToggleLeft, ToggleRight,
} from "lucide-react";
import { toast } from "sonner";

export default function AdminAriaIntents() {

  const [showCreate, setShowCreate] = useState(false);
  const [newIntent, setNewIntent] = useState({ intentName: "", description: "", responseTemplate: "", action: "respond", actionTarget: "" });
  const [newExamples, setNewExamples] = useState<string[]>([""]);

  const { data: intents, refetch } = trpc.ariaIntents.listIntents.useQuery();
  const createIntent = trpc.ariaIntents.createIntent.useMutation({
    onSuccess: () => {
      toast.success("Intent created — Aria will now recognize this intent.");
      setShowCreate(false);
      setNewIntent({ intentName: "", description: "", responseTemplate: "", action: "respond", actionTarget: "" });
      setNewExamples([""]);
      refetch();
    },
    onError: (e: any) => toast.error(e.message),
  });
  const toggleIntent = trpc.ariaIntents.toggleIntent.useMutation({ onSuccess: () => refetch() });
  const deleteIntent = trpc.ariaIntents.deleteIntent.useMutation({
    onSuccess: () => { toast.success("Intent deleted"); refetch(); },
  });
  const addExample = trpc.ariaIntents.addExample.useMutation({ onSuccess: () => refetch() });
  const deleteExample = trpc.ariaIntents.deleteExample.useMutation({ onSuccess: () => refetch() });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-2">
            <Brain className="w-6 h-6 text-cyan-400" />
            Aria Intent Training
          </h1>
          <p className="text-slate-400 mt-1">
            Teach Aria new commands by providing example phrases and response templates.
          </p>
        </div>
        <Button onClick={() => setShowCreate(true)} className="bg-cyan-600 hover:bg-cyan-700">
          <Plus className="w-4 h-4 mr-1" /> New Intent
        </Button>
      </div>

      {/* Create Form */}
      {showCreate && (
        <Card className="bg-slate-900/80 border-cyan-500/30">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm text-cyan-300 flex items-center gap-2">
              <Zap className="w-4 h-4" /> Create Custom Intent
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="text-xs text-slate-400 mb-1 block">Intent Name *</label>
                <Input
                  value={newIntent.intentName}
                  onChange={(e) => setNewIntent({ ...newIntent, intentName: e.target.value })}
                  placeholder="e.g., check_vpn_status"
                  className="bg-slate-800 border-slate-700 text-white"
                />
              </div>
              <div>
                <label className="text-xs text-slate-400 mb-1 block">Action Type</label>
                <select
                  value={newIntent.action}
                  onChange={(e) => setNewIntent({ ...newIntent, action: e.target.value })}
                  className="w-full rounded-md bg-slate-800 border border-slate-700 text-white px-3 py-2 text-sm"
                >
                  <option value="respond">Respond with template</option>
                  <option value="redirect">Redirect to page</option>
                  <option value="run_procedure">Run procedure</option>
                </select>
              </div>
            </div>
            <div>
              <label className="text-xs text-slate-400 mb-1 block">Description</label>
              <Input
                value={newIntent.description}
                onChange={(e) => setNewIntent({ ...newIntent, description: e.target.value })}
                placeholder="What does this intent do?"
                className="bg-slate-800 border-slate-700 text-white"
              />
            </div>
            <div>
              <label className="text-xs text-slate-400 mb-1 block">
                {newIntent.action === "respond" ? "Response Template" : newIntent.action === "redirect" ? "Target URL" : "Procedure Name"}
              </label>
              {newIntent.action === "respond" ? (
                <Textarea
                  value={newIntent.responseTemplate}
                  onChange={(e) => setNewIntent({ ...newIntent, responseTemplate: e.target.value })}
                  placeholder="The response Aria will give when this intent is detected..."
                  className="bg-slate-800 border-slate-700 text-white min-h-[80px]"
                />
              ) : (
                <Input
                  value={newIntent.actionTarget}
                  onChange={(e) => setNewIntent({ ...newIntent, actionTarget: e.target.value })}
                  placeholder={newIntent.action === "redirect" ? "/admin/helpdesk" : "getSystemStatus"}
                  className="bg-slate-800 border-slate-700 text-white"
                />
              )}
            </div>
            <div>
              <label className="text-xs text-slate-400 mb-1 block">Example Phrases (at least 3 recommended)</label>
              <div className="space-y-2">
                {newExamples.map((ex, i) => (
                  <div key={i} className="flex gap-2">
                    <Input
                      value={ex}
                      onChange={(e) => {
                        const updated = [...newExamples];
                        updated[i] = e.target.value;
                        setNewExamples(updated);
                      }}
                      placeholder={`Example phrase ${i + 1}...`}
                      className="bg-slate-800 border-slate-700 text-white"
                    />
                    {newExamples.length > 1 && (
                      <Button variant="ghost" size="sm" onClick={() => setNewExamples(newExamples.filter((_, idx) => idx !== i))} className="text-red-400">
                        <X className="w-3.5 h-3.5" />
                      </Button>
                    )}
                  </div>
                ))}
                <Button variant="ghost" size="sm" onClick={() => setNewExamples([...newExamples, ""])} className="text-cyan-400">
                  <Plus className="w-3.5 h-3.5 mr-1" /> Add Example
                </Button>
              </div>
            </div>
            <div className="flex gap-2 pt-2">
              <Button
                onClick={() => {
                  createIntent.mutate({
                    intentName: newIntent.intentName,
                    description: newIntent.description,
                    responseTemplate: newIntent.action === "respond" ? newIntent.responseTemplate : undefined,
                    action: newIntent.action,
                    actionTarget: newIntent.action !== "respond" ? newIntent.actionTarget : undefined,
                    examples: newExamples.filter(e => e.trim()),
                  });
                }}
                disabled={!newIntent.intentName || newExamples.filter(e => e.trim()).length === 0}
                className="bg-cyan-600 hover:bg-cyan-700"
              >
                <Save className="w-4 h-4 mr-1" /> Create Intent
              </Button>
              <Button variant="ghost" onClick={() => setShowCreate(false)} className="text-slate-400">
                Cancel
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Existing Intents */}
      {intents?.length === 0 ? (
        <Card className="bg-slate-900/60 border-slate-700/50">
          <CardContent className="p-8 text-center">
            <Brain className="w-10 h-10 text-slate-600 mx-auto mb-3" />
            <p className="text-slate-400">No custom intents yet. Create one to teach Aria new commands.</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {intents?.map((intent: any) => (
            <Card key={intent.id} className={`border ${intent.isActive ? "bg-slate-900/60 border-slate-700/50" : "bg-slate-900/30 border-slate-800/50 opacity-60"}`}>
              <CardContent className="p-4">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <h3 className="text-sm font-semibold text-white font-mono">{intent.intentName}</h3>
                      <Badge variant="outline" className={`text-[10px] ${intent.action === "respond" ? "text-emerald-400 border-emerald-500/30" : intent.action === "redirect" ? "text-blue-400 border-blue-500/30" : "text-purple-400 border-purple-500/30"}`}>
                        {intent.action}
                      </Badge>
                      {!intent.isActive && <Badge variant="outline" className="text-[10px] text-slate-500 border-slate-600">Disabled</Badge>}
                    </div>
                    {intent.description && <p className="text-xs text-slate-400 mt-1">{intent.description}</p>}
                    {intent.responseTemplate && (
                      <p className="text-xs text-slate-500 mt-1 italic truncate max-w-[400px]">"{intent.responseTemplate}"</p>
                    )}
                    {/* Examples */}
                    <div className="flex flex-wrap gap-1.5 mt-2">
                      {intent.examples?.map((ex: any) => (
                        <span key={ex.id} className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-slate-800 text-[11px] text-slate-300 border border-slate-700">
                          <MessageSquare className="w-2.5 h-2.5" /> {ex.examplePhrase}
                          <button onClick={() => deleteExample.mutate({ exampleId: ex.id })} className="text-red-400 hover:text-red-300 ml-0.5">
                            <X className="w-2.5 h-2.5" />
                          </button>
                        </span>
                      ))}
                    </div>
                  </div>
                  <div className="flex items-center gap-1">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => toggleIntent.mutate({ intentId: intent.id, isActive: !intent.isActive })}
                      className={intent.isActive ? "text-emerald-400" : "text-slate-500"}
                    >
                      {intent.isActive ? <ToggleRight className="w-5 h-5" /> : <ToggleLeft className="w-5 h-5" />}
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => deleteIntent.mutate({ intentId: intent.id })}
                      className="text-red-400 hover:text-red-300"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
