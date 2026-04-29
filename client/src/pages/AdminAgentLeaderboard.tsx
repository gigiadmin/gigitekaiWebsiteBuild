import React, { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { trpc } from '@/lib/trpc';
import { Trophy, TrendingUp, Clock, CheckCircle } from 'lucide-react';

export default function AdminAgentLeaderboard() {
  const [timeRange, setTimeRange] = useState<'week' | 'month' | 'all'>('month');
  const [searchTerm, setSearchTerm] = useState('');

  const { data: leaderboard, isLoading } = trpc.helpdesk.getAgentLeaderboard.useQuery({ timeRange });

  const filteredAgents = leaderboard?.filter(agent =>
    agent.agentName.toLowerCase().includes(searchTerm.toLowerCase())
  ) || [];

  const getRankColor = (rank: number) => {
    if (rank === 1) return 'bg-yellow-100 text-yellow-900';
    if (rank === 2) return 'bg-gray-100 text-gray-900';
    if (rank === 3) return 'bg-orange-100 text-orange-900';
    return 'bg-blue-50 text-blue-900';
  };

  const getRankIcon = (rank: number) => {
    if (rank === 1) return '🥇';
    if (rank === 2) return '🥈';
    if (rank === 3) return '🥉';
    return `#${rank}`;
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 to-slate-800 p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-4">
            <Trophy className="w-8 h-8 text-yellow-400" />
            <h1 className="text-4xl font-bold text-white">Agent Leaderboard</h1>
          </div>
          <p className="text-slate-300">Track agent performance metrics and rankings</p>
        </div>

        {/* Controls */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
          <Input
            placeholder="Search agents..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="bg-slate-700 border-slate-600 text-white placeholder-slate-400"
          />
          <div className="flex gap-2">
            {(['week', 'month', 'all'] as const).map((range) => (
              <Button
                key={range}
                onClick={() => setTimeRange(range)}
                variant={timeRange === range ? 'default' : 'outline'}
                className="flex-1"
              >
                {range === 'week' ? 'This Week' : range === 'month' ? 'This Month' : 'All Time'}
              </Button>
            ))}
          </div>
        </div>

        {/* Leaderboard Table */}
        <div className="space-y-4">
          {isLoading ? (
            <div className="text-center py-12 text-slate-300">Loading leaderboard...</div>
          ) : filteredAgents.length === 0 ? (
            <div className="text-center py-12 text-slate-300">No agents found</div>
          ) : (
            filteredAgents.map((agent, index) => (
              <Card key={agent.agentId} className={`p-6 ${getRankColor(index + 1)}`}>
                <div className="grid grid-cols-1 md:grid-cols-6 gap-4 items-center">
                  {/* Rank */}
                  <div className="text-2xl font-bold">{getRankIcon(index + 1)}</div>

                  {/* Agent Name */}
                  <div className="md:col-span-2">
                    <h3 className="font-semibold text-lg">{agent.agentName}</h3>
                    <p className="text-sm opacity-75">{agent.email}</p>
                  </div>

                  {/* NPS Score */}
                  <div className="flex items-center gap-2">
                    <TrendingUp className="w-5 h-5" />
                    <div>
                      <p className="text-xs opacity-75">NPS Score</p>
                      <p className="font-bold text-lg">{agent.npsScore.toFixed(1)}</p>
                    </div>
                  </div>

                  {/* Response Time */}
                  <div className="flex items-center gap-2">
                    <Clock className="w-5 h-5" />
                    <div>
                      <p className="text-xs opacity-75">Avg Response</p>
                      <p className="font-bold">{agent.avgResponseTime}m</p>
                    </div>
                  </div>

                  {/* Resolution Rate */}
                  <div className="flex items-center gap-2">
                    <CheckCircle className="w-5 h-5" />
                    <div>
                      <p className="text-xs opacity-75">Resolution</p>
                      <p className="font-bold">{agent.resolutionRate}%</p>
                    </div>
                  </div>
                </div>

                {/* Badges */}
                <div className="mt-4 flex flex-wrap gap-2">
                  {agent.npsScore >= 8 && <Badge variant="default">⭐ Top Performer</Badge>}
                  {agent.resolutionRate >= 90 && <Badge variant="secondary">✓ High Resolution</Badge>}
                  {agent.avgResponseTime <= 5 && <Badge variant="outline">⚡ Fast Response</Badge>}
                </div>
              </Card>
            ))
          )}
        </div>

        {/* Summary Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-8">
          <Card className="p-6 bg-slate-700 border-slate-600">
            <p className="text-slate-300 text-sm mb-2">Total Agents</p>
            <p className="text-3xl font-bold text-white">{filteredAgents.length}</p>
          </Card>
          <Card className="p-6 bg-slate-700 border-slate-600">
            <p className="text-slate-300 text-sm mb-2">Avg NPS Score</p>
            <p className="text-3xl font-bold text-white">
              {(filteredAgents.reduce((sum, a) => sum + a.npsScore, 0) / filteredAgents.length).toFixed(1)}
            </p>
          </Card>
          <Card className="p-6 bg-slate-700 border-slate-600">
            <p className="text-slate-300 text-sm mb-2">Avg Resolution Rate</p>
            <p className="text-3xl font-bold text-white">
              {(filteredAgents.reduce((sum, a) => sum + a.resolutionRate, 0) / filteredAgents.length).toFixed(0)}%
            </p>
          </Card>
        </div>
      </div>
    </div>
  );
}
