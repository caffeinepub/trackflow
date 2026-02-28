import { useState, useMemo } from 'react';
import { useInternetIdentity } from '../hooks/useInternetIdentity';
import { useGetActivities, useGetHabits, useDeleteActivity } from '../hooks/useQueries';
import { Activity, Habit } from '../backend';
import { Filter, Download, Trash2, Edit2, Check, X, ChevronLeft, ChevronRight } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { Skeleton } from '@/components/ui/skeleton';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from 'sonner';
import EditActivityModal from '../components/activities/EditActivityModal';

const PAGE_SIZE = 10;

function formatDuration(minutes: bigint): string {
  const m = Number(minutes);
  if (m < 60) return `${m}m`;
  return `${Math.floor(m / 60)}h ${m % 60}m`;
}

function formatDate(ts: bigint): string {
  return new Date(Number(ts) / 1_000_000).toLocaleDateString('en-IN', {
    day: 'numeric', month: 'short', year: 'numeric',
  });
}

function formatTime(ts: bigint): string {
  return new Date(Number(ts) / 1_000_000).toLocaleTimeString('en-IN', {
    hour: '2-digit', minute: '2-digit',
  });
}

export default function ActivitiesPage() {
  const { data: activities = [], isLoading } = useGetActivities();
  const { data: habits = [] } = useGetHabits();
  const deleteActivity = useDeleteActivity();

  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [page, setPage] = useState(1);
  const [filterHabit, setFilterHabit] = useState<string>('all');
  const [filterProductive, setFilterProductive] = useState<string>('all');
  const [filterDateFrom, setFilterDateFrom] = useState('');
  const [filterDateTo, setFilterDateTo] = useState('');
  const [editingActivity, setEditingActivity] = useState<Activity | null>(null);

  const filtered = useMemo(() => {
    return activities.filter(a => {
      if (filterHabit !== 'all' && String(a.habitId) !== filterHabit) return false;
      if (filterProductive === 'productive' && !a.isProductive) return false;
      if (filterProductive === 'unproductive' && a.isProductive) return false;
      if (filterDateFrom) {
        const d = new Date(Number(a.date) / 1_000_000);
        if (d < new Date(filterDateFrom)) return false;
      }
      if (filterDateTo) {
        const d = new Date(Number(a.date) / 1_000_000);
        if (d > new Date(filterDateTo + 'T23:59:59')) return false;
      }
      return true;
    }).sort((a, b) => Number(b.date) - Number(a.date));
  }, [activities, filterHabit, filterProductive, filterDateFrom, filterDateTo]);

  const totalPages = Math.ceil(filtered.length / PAGE_SIZE);
  const paginated = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  const toggleSelect = (id: string) => {
    const next = new Set(selectedIds);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    setSelectedIds(next);
  };

  const toggleSelectAll = () => {
    if (selectedIds.size === paginated.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(paginated.map(a => String(a.id))));
    }
  };

  const handleBulkDelete = async () => {
    if (selectedIds.size === 0) return;
    if (!confirm(`Delete ${selectedIds.size} activities?`)) return;
    try {
      await Promise.all([...selectedIds].map(id => deleteActivity.mutateAsync(BigInt(id))));
      setSelectedIds(new Set());
      toast.success(`Deleted ${selectedIds.size} activities`);
    } catch (err: any) {
      toast.error(err?.message || 'Failed to delete activities');
    }
  };

  const handleDelete = async (id: bigint) => {
    if (!confirm('Delete this activity?')) return;
    try {
      await deleteActivity.mutateAsync(id);
      toast.success('Activity deleted');
    } catch (err: any) {
      toast.error(err?.message || 'Failed to delete');
    }
  };

  const exportCSV = () => {
    const headers = ['Date', 'Activity', 'Duration (min)', 'Earnings (₹)', 'Productive', 'Notes'];
    const rows = filtered.map(a => [
      formatDate(a.date),
      a.customName || habits.find(h => String(h.id) === String(a.habitId))?.name || '',
      String(a.duration),
      String(a.earnings),
      a.isProductive ? 'Yes' : 'No',
      a.notes,
    ]);
    const csv = [headers, ...rows].map(r => r.map(c => `"${c}"`).join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `trackflow-activities-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success('CSV exported!');
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Activities</h1>
          <p className="text-slate-500 text-sm">{filtered.length} activities found</p>
        </div>
        <div className="flex gap-2">
          {selectedIds.size > 0 && (
            <Button
              variant="destructive"
              size="sm"
              onClick={handleBulkDelete}
              className="gap-2"
            >
              <Trash2 className="w-4 h-4" />
              Delete ({selectedIds.size})
            </Button>
          )}
          <Button variant="outline" size="sm" onClick={exportCSV} className="gap-2">
            <Download className="w-4 h-4" />
            Export CSV
          </Button>
        </div>
      </div>

      {/* Filters */}
      <Card className="border-0 shadow-sm">
        <CardContent className="pt-4 pb-4">
          <div className="flex flex-wrap gap-3 items-center">
            <Filter className="w-4 h-4 text-slate-400" />
            <input
              type="date"
              value={filterDateFrom}
              onChange={e => { setFilterDateFrom(e.target.value); setPage(1); }}
              className="border border-slate-200 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
              placeholder="From"
            />
            <span className="text-slate-400 text-sm">to</span>
            <input
              type="date"
              value={filterDateTo}
              onChange={e => { setFilterDateTo(e.target.value); setPage(1); }}
              className="border border-slate-200 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
            <Select value={filterHabit} onValueChange={v => { setFilterHabit(v); setPage(1); }}>
              <SelectTrigger className="w-36 h-9 text-sm">
                <SelectValue placeholder="All Habits" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Habits</SelectItem>
                {habits.map(h => (
                  <SelectItem key={String(h.id)} value={String(h.id)}>{h.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={filterProductive} onValueChange={v => { setFilterProductive(v); setPage(1); }}>
              <SelectTrigger className="w-40 h-9 text-sm">
                <SelectValue placeholder="All" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Activities</SelectItem>
                <SelectItem value="productive">Productive Only</SelectItem>
                <SelectItem value="unproductive">Unproductive Only</SelectItem>
              </SelectContent>
            </Select>
            {(filterHabit !== 'all' || filterProductive !== 'all' || filterDateFrom || filterDateTo) && (
              <button
                onClick={() => { setFilterHabit('all'); setFilterProductive('all'); setFilterDateFrom(''); setFilterDateTo(''); setPage(1); }}
                className="text-xs text-indigo-600 hover:text-indigo-800 underline"
              >
                Clear filters
              </button>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Table */}
      <Card className="border-0 shadow-sm overflow-hidden">
        {isLoading ? (
          <CardContent className="pt-4">
            {[...Array(5)].map((_, i) => <Skeleton key={i} className="h-12 mb-2 rounded-lg" />)}
          </CardContent>
        ) : paginated.length === 0 ? (
          <CardContent className="py-16 text-center">
            <p className="text-slate-400">No activities found. Start logging your day!</p>
          </CardContent>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-slate-50 border-b border-slate-100">
                <tr>
                  <th className="px-4 py-3 text-left">
                    <Checkbox
                      checked={selectedIds.size === paginated.length && paginated.length > 0}
                      onCheckedChange={toggleSelectAll}
                    />
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wide">Date</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wide">Activity</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wide">Duration</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wide">Earnings</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wide">Type</th>
                  <th className="px-4 py-3 text-right text-xs font-semibold text-slate-500 uppercase tracking-wide">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {paginated.map(activity => {
                  const habit = habits.find(h => String(h.id) === String(activity.habitId));
                  const name = activity.customName || habit?.name || 'Unnamed';
                  return (
                    <tr key={String(activity.id)} className="hover:bg-slate-50/50 transition-colors">
                      <td className="px-4 py-3">
                        <Checkbox
                          checked={selectedIds.has(String(activity.id))}
                          onCheckedChange={() => toggleSelect(String(activity.id))}
                        />
                      </td>
                      <td className="px-4 py-3 text-sm text-slate-600">{formatDate(activity.date)}</td>
                      <td className="px-4 py-3">
                        <div>
                          <p className="text-sm font-medium text-slate-800">{name}</p>
                          {activity.notes && <p className="text-xs text-slate-400 truncate max-w-xs">{activity.notes}</p>}
                        </div>
                      </td>
                      <td className="px-4 py-3 text-sm text-slate-600">{formatDuration(activity.duration)}</td>
                      <td className="px-4 py-3 text-sm font-medium text-slate-700">
                        {Number(activity.earnings) > 0 ? `₹${Number(activity.earnings).toLocaleString('en-IN')}` : '—'}
                      </td>
                      <td className="px-4 py-3">
                        <Badge variant={activity.isProductive ? 'default' : 'secondary'} className={activity.isProductive ? 'bg-emerald-100 text-emerald-700 border-0' : 'bg-slate-100 text-slate-600 border-0'}>
                          {activity.isProductive ? 'Productive' : 'Leisure'}
                        </Badge>
                      </td>
                      <td className="px-4 py-3 text-right">
                        <div className="flex items-center justify-end gap-1">
                          <button
                            onClick={() => setEditingActivity(activity)}
                            className="p-1.5 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => handleDelete(activity.id)}
                            className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="px-4 py-3 border-t border-slate-100 flex items-center justify-between">
            <p className="text-sm text-slate-500">
              Showing {(page - 1) * PAGE_SIZE + 1}–{Math.min(page * PAGE_SIZE, filtered.length)} of {filtered.length}
            </p>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setPage(p => Math.max(1, p - 1))}
                disabled={page === 1}
              >
                <ChevronLeft className="w-4 h-4" />
              </Button>
              <span className="flex items-center px-3 text-sm text-slate-600">
                {page} / {totalPages}
              </span>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                disabled={page === totalPages}
              >
                <ChevronRight className="w-4 h-4" />
              </Button>
            </div>
          </div>
        )}
      </Card>

      {editingActivity && (
        <EditActivityModal
          activity={editingActivity}
          habits={habits}
          onClose={() => setEditingActivity(null)}
        />
      )}
    </div>
  );
}
