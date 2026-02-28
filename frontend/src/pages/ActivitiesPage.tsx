import { useState, useMemo } from 'react';
import { useInternetIdentity } from '../hooks/useInternetIdentity';
import { useGetActivities, useGetHabits, useDeleteActivity } from '../hooks/useQueries';
import { Activity, Habit } from '../backend';
import { Filter, Download, Trash2, Edit2, ChevronLeft, ChevronRight } from 'lucide-react';
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
  const { identity } = useInternetIdentity();
  const userId = identity?.getPrincipal().toString();

  const { data: activities = [], isLoading } = useGetActivities(userId);
  const { data: habits = [] } = useGetHabits(userId);
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
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to delete activities';
      toast.error(msg);
    }
  };

  const handleDelete = async (id: bigint) => {
    if (!confirm('Delete this activity?')) return;
    try {
      await deleteActivity.mutateAsync(id);
      toast.success('Activity deleted');
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to delete';
      toast.error(msg);
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
    const anchor = document.createElement('a');
    anchor.href = url;
    anchor.download = `trackflow-activities-${new Date().toISOString().split('T')[0]}.csv`;
    anchor.click();
    URL.revokeObjectURL(url);
    toast.success('CSV exported!');
  };

  return (
    <div className="space-y-6 p-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Activities</h1>
          <p className="text-muted-foreground text-sm">{filtered.length} activities found</p>
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
            <Filter className="w-4 h-4 text-muted-foreground" />
            <input
              type="date"
              value={filterDateFrom}
              onChange={e => { setFilterDateFrom(e.target.value); setPage(1); }}
              className="border border-border rounded-lg px-3 py-1.5 text-sm bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
            />
            <span className="text-muted-foreground text-sm">to</span>
            <input
              type="date"
              value={filterDateTo}
              onChange={e => { setFilterDateTo(e.target.value); setPage(1); }}
              className="border border-border rounded-lg px-3 py-1.5 text-sm bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
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
                className="text-xs text-primary hover:underline"
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
        ) : filtered.length === 0 ? (
          <CardContent className="py-16 text-center">
            <p className="text-muted-foreground">No activities found.</p>
          </CardContent>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border bg-muted/40">
                    <th className="w-10 px-4 py-3">
                      <Checkbox
                        checked={selectedIds.size === paginated.length && paginated.length > 0}
                        onCheckedChange={toggleSelectAll}
                      />
                    </th>
                    <th className="px-4 py-3 text-left font-medium text-muted-foreground">Date</th>
                    <th className="px-4 py-3 text-left font-medium text-muted-foreground">Activity</th>
                    <th className="px-4 py-3 text-left font-medium text-muted-foreground">Habit</th>
                    <th className="px-4 py-3 text-left font-medium text-muted-foreground">Time</th>
                    <th className="px-4 py-3 text-left font-medium text-muted-foreground">Duration</th>
                    <th className="px-4 py-3 text-left font-medium text-muted-foreground">Earnings</th>
                    <th className="px-4 py-3 text-left font-medium text-muted-foreground">Type</th>
                    <th className="px-4 py-3 text-left font-medium text-muted-foreground">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {paginated.map(activity => {
                    const habit = habits.find(h => String(h.id) === String(activity.habitId));
                    const isSelected = selectedIds.has(String(activity.id));
                    return (
                      <tr
                        key={String(activity.id)}
                        className={`border-b border-border transition-colors ${isSelected ? 'bg-primary/5' : 'hover:bg-muted/30'}`}
                      >
                        <td className="px-4 py-3">
                          <Checkbox
                            checked={isSelected}
                            onCheckedChange={() => toggleSelect(String(activity.id))}
                          />
                        </td>
                        <td className="px-4 py-3 text-muted-foreground whitespace-nowrap">
                          {formatDate(activity.date)}
                        </td>
                        <td className="px-4 py-3 font-medium text-foreground max-w-[160px] truncate">
                          {activity.customName || '—'}
                        </td>
                        <td className="px-4 py-3">
                          {habit ? (
                            <span className="flex items-center gap-1.5">
                              <span
                                className="w-2.5 h-2.5 rounded-full shrink-0"
                                style={{ backgroundColor: habit.color }}
                              />
                              <span className="text-foreground truncate max-w-[100px]">{habit.name}</span>
                            </span>
                          ) : (
                            <span className="text-muted-foreground">—</span>
                          )}
                        </td>
                        <td className="px-4 py-3 text-muted-foreground whitespace-nowrap">
                          {formatTime(activity.startTime)} – {formatTime(activity.endTime)}
                        </td>
                        <td className="px-4 py-3 text-muted-foreground whitespace-nowrap">
                          {formatDuration(activity.duration)}
                        </td>
                        <td className="px-4 py-3 text-foreground">
                          {Number(activity.earnings) > 0 ? `₹${Number(activity.earnings).toLocaleString('en-IN')}` : '—'}
                        </td>
                        <td className="px-4 py-3">
                          <Badge variant={activity.isProductive ? 'default' : 'secondary'} className="text-xs">
                            {activity.isProductive ? 'Productive' : 'Leisure'}
                          </Badge>
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-1">
                            <button
                              onClick={() => setEditingActivity(activity)}
                              className="p-1.5 text-muted-foreground hover:text-primary rounded-lg transition-colors"
                            >
                              <Edit2 className="w-3.5 h-3.5" />
                            </button>
                            <button
                              onClick={() => handleDelete(activity.id)}
                              className="p-1.5 text-muted-foreground hover:text-destructive rounded-lg transition-colors"
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

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex items-center justify-between px-4 py-3 border-t border-border">
                <p className="text-sm text-muted-foreground">
                  Showing {(page - 1) * PAGE_SIZE + 1}–{Math.min(page * PAGE_SIZE, filtered.length)} of {filtered.length}
                </p>
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setPage(p => Math.max(1, p - 1))}
                    disabled={page === 1}
                  >
                    <ChevronLeft className="w-4 h-4" />
                  </Button>
                  <span className="text-sm text-foreground">{page} / {totalPages}</span>
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
          </>
        )}
      </Card>

      {/* Edit Modal */}
      {editingActivity && (
        <EditActivityModal
          activity={editingActivity}
          habits={habits}
          open={!!editingActivity}
          onClose={() => setEditingActivity(null)}
        />
      )}
    </div>
  );
}
