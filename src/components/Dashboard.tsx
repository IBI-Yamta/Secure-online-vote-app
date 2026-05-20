import { useTasks, useCategories } from '../hooks/useAuth';
import type { Task } from '../lib/supabase';
import {
  TrendingUp,
  Clock,
  CheckCircle2,
  AlertCircle,
  ArrowUpRight,
  Calendar,
} from 'lucide-react';

type DashboardProps = {
  onViewTasks: () => void;
};

export function Dashboard({ onViewTasks }: DashboardProps) {
  const { tasks, loading } = useTasks();
  const { categories } = useCategories();

  const total = tasks.length;
  const completed = tasks.filter(t => t.status === 'completed').length;
  const inProgress = tasks.filter(t => t.status === 'in_progress').length;
  const pending = tasks.filter(t => t.status === 'pending').length;
  const highPriority = tasks.filter(t => t.priority === 'high' && t.status !== 'completed').length;
  const completionRate = total > 0 ? Math.round((completed / total) * 100) : 0;

  const recentTasks = tasks.slice(0, 5);
  const overdueTasks = tasks.filter(t => {
    if (!t.due_date || t.status === 'completed') return false;
    return new Date(t.due_date) < new Date();
  });

  const stats = [
    { label: 'Total Tasks', value: total, icon: TrendingUp, color: 'text-blue-400', bg: 'bg-blue-500/10' },
    { label: 'Completed', value: completed, icon: CheckCircle2, color: 'text-emerald-400', bg: 'bg-emerald-500/10' },
    { label: 'In Progress', value: inProgress, icon: Clock, color: 'text-amber-400', bg: 'bg-amber-500/10' },
    { label: 'High Priority', value: highPriority, icon: AlertCircle, color: 'text-red-400', bg: 'bg-red-500/10' },
  ];

  const getCategoryName = (task: Task) => {
    if (!task.categories) return null;
    return task.categories;
  };

  const formatDate = (dateStr: string | null) => {
    if (!dateStr) return null;
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-8 h-8 border-2 border-emerald-500/30 border-t-emerald-500 rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-in">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-white">Dashboard</h1>
        <p className="text-slate-400 mt-1">Here's what's happening with your tasks</p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map(stat => (
          <div
            key={stat.label}
            className="bg-white/5 border border-white/10 rounded-2xl p-5 hover:bg-white/[0.07] transition-all duration-300 group"
          >
            <div className="flex items-center justify-between mb-3">
              <div className={`w-10 h-10 rounded-xl ${stat.bg} flex items-center justify-center`}>
                <stat.icon className={`w-5 h-5 ${stat.color}`} />
              </div>
            </div>
            <p className="text-2xl font-bold text-white">{stat.value}</p>
            <p className="text-sm text-slate-400 mt-0.5">{stat.label}</p>
          </div>
        ))}
      </div>

      {/* Completion Rate + Overdue */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Completion Rate */}
        <div className="bg-white/5 border border-white/10 rounded-2xl p-6">
          <h3 className="text-sm font-medium text-slate-300 mb-4">Completion Rate</h3>
          <div className="flex items-end gap-4">
            <div className="text-5xl font-bold text-white">{completionRate}%</div>
            <div className="text-sm text-slate-400 mb-2">
              {completed} of {total} tasks done
            </div>
          </div>
          <div className="mt-4 h-2 bg-slate-700 rounded-full overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-emerald-500 to-emerald-400 rounded-full transition-all duration-1000 ease-out"
              style={{ width: `${completionRate}%` }}
            />
          </div>
        </div>

        {/* Overdue */}
        <div className="bg-white/5 border border-white/10 rounded-2xl p-6">
          <h3 className="text-sm font-medium text-slate-300 mb-4">Overdue Tasks</h3>
          {overdueTasks.length === 0 ? (
            <div className="flex items-center gap-2 text-emerald-400">
              <CheckCircle2 className="w-5 h-5" />
              <span className="text-sm">All tasks are on track</span>
            </div>
          ) : (
            <div className="space-y-2">
              {overdueTasks.slice(0, 3).map(task => (
                <div key={task.id} className="flex items-center gap-3 text-sm">
                  <AlertCircle className="w-4 h-4 text-red-400 flex-shrink-0" />
                  <span className="text-white truncate">{task.title}</span>
                  <span className="text-red-400 text-xs ml-auto flex-shrink-0">
                    {formatDate(task.due_date)}
                  </span>
                </div>
              ))}
              {overdueTasks.length > 3 && (
                <p className="text-xs text-slate-500">+{overdueTasks.length - 3} more</p>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Recent Tasks */}
      <div className="bg-white/5 border border-white/10 rounded-2xl p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-sm font-medium text-slate-300">Recent Tasks</h3>
          <button
            onClick={onViewTasks}
            className="text-xs text-emerald-400 hover:text-emerald-300 flex items-center gap-1 transition-colors"
          >
            View all
            <ArrowUpRight className="w-3 h-3" />
          </button>
        </div>

        {recentTasks.length === 0 ? (
          <p className="text-slate-500 text-sm py-4 text-center">No tasks yet. Create your first task!</p>
        ) : (
          <div className="space-y-2">
            {recentTasks.map(task => {
              const cat = getCategoryName(task);
              return (
                <div
                  key={task.id}
                  className="flex items-center gap-3 p-3 rounded-xl hover:bg-white/5 transition-colors"
                >
                  <div className={`w-2 h-2 rounded-full flex-shrink-0 ${
                    task.status === 'completed' ? 'bg-emerald-400' :
                    task.status === 'in_progress' ? 'bg-amber-400' : 'bg-slate-500'
                  }`} />
                  <span className={`text-sm flex-1 truncate ${
                    task.status === 'completed' ? 'text-slate-500 line-through' : 'text-white'
                  }`}>
                    {task.title}
                  </span>
                  {cat && (
                    <span
                      className="text-xs px-2 py-0.5 rounded-md flex-shrink-0"
                      style={{ backgroundColor: cat.color + '20', color: cat.color }}
                    >
                      {cat.name}
                    </span>
                  )}
                  {task.due_date && (
                    <span className="text-xs text-slate-500 flex items-center gap-1 flex-shrink-0">
                      <Calendar className="w-3 h-3" />
                      {formatDate(task.due_date)}
                    </span>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Category Breakdown */}
      <div className="bg-white/5 border border-white/10 rounded-2xl p-6">
        <h3 className="text-sm font-medium text-slate-300 mb-4">Tasks by Category</h3>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
          {categories.map(cat => {
            const count = tasks.filter(t => t.category_id === cat.id && t.status !== 'completed').length;
            return (
              <div
                key={cat.id}
                className="text-center p-4 rounded-xl border border-white/5 hover:border-white/10 transition-all"
              >
                <div
                  className="w-10 h-10 rounded-xl mx-auto mb-2 flex items-center justify-center"
                  style={{ backgroundColor: cat.color + '20' }}
                >
                  <span style={{ color: cat.color }} className="text-lg font-bold">{count}</span>
                </div>
                <p className="text-xs text-slate-400">{cat.name}</p>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
