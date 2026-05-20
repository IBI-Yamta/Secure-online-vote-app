import { useState, useMemo } from 'react';
import { useTasks, useCategories } from '../hooks/useAuth';
import type { Task } from '../lib/supabase';
import { TaskModal } from './TaskModal';
import { Plus, Search, Filter, Import as SortAsc, Dessert as SortDesc, Calendar, MoreHorizontal, Trash2, CreditCard as Edit3, Circle, CheckCircle2, Clock, AlertCircle, ChevronDown } from 'lucide-react';

type SortKey = 'created_at' | 'due_date' | 'priority' | 'title';
type SortDir = 'asc' | 'desc';
type StatusFilter = 'all' | 'pending' | 'in_progress' | 'completed';
type PriorityFilter = 'all' | 'low' | 'medium' | 'high';

export function TaskList() {
  const { tasks, loading, toggleComplete, deleteTask, updateTask } = useTasks();
  const { categories } = useCategories();

  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all');
  const [priorityFilter, setPriorityFilter] = useState<PriorityFilter>('all');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [sortKey, setSortKey] = useState<SortKey>('created_at');
  const [sortDir, setSortDir] = useState<SortDir>('desc');
  const [showModal, setShowModal] = useState(false);
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [openMenuId, setOpenMenuId] = useState<string | null>(null);
  const [showFilters, setShowFilters] = useState(false);

  const filteredTasks = useMemo(() => {
    let result = [...tasks];

    if (search) {
      const q = search.toLowerCase();
      result = result.filter(t => t.title.toLowerCase().includes(q) || t.description?.toLowerCase().includes(q));
    }
    if (statusFilter !== 'all') result = result.filter(t => t.status === statusFilter);
    if (priorityFilter !== 'all') result = result.filter(t => t.priority === priorityFilter);
    if (categoryFilter !== 'all') result = result.filter(t => t.category_id === categoryFilter);

    const priorityOrder = { high: 0, medium: 1, low: 2 };
    result.sort((a, b) => {
      let cmp = 0;
      if (sortKey === 'priority') {
        cmp = priorityOrder[a.priority] - priorityOrder[b.priority];
      } else if (sortKey === 'due_date') {
        const aDate = a.due_date ? new Date(a.due_date).getTime() : Infinity;
        const bDate = b.due_date ? new Date(b.due_date).getTime() : Infinity;
        cmp = aDate - bDate;
      } else if (sortKey === 'title') {
        cmp = a.title.localeCompare(b.title);
      } else {
        cmp = new Date(a.created_at).getTime() - new Date(b.created_at).getTime();
      }
      return sortDir === 'asc' ? cmp : -cmp;
    });

    return result;
  }, [tasks, search, statusFilter, priorityFilter, categoryFilter, sortKey, sortDir]);

  const handleEdit = (task: Task) => {
    setEditingTask(task);
    setShowModal(true);
    setOpenMenuId(null);
  };

  const handleDelete = async (id: string) => {
    await deleteTask(id);
    setOpenMenuId(null);
  };

  const handleStatusChange = async (task: Task, newStatus: Task['status']) => {
    const completedAt = newStatus === 'completed' ? new Date().toISOString() : null;
    await updateTask(task.id, { status: newStatus, completed_at: completedAt } as Partial<Task>);
    setOpenMenuId(null);
  };

  const formatDate = (dateStr: string | null) => {
    if (!dateStr) return null;
    const date = new Date(dateStr);
    const now = new Date();
    const diffDays = Math.ceil((date.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
    if (diffDays < 0) return { text: `${Math.abs(diffDays)}d overdue`, urgent: true };
    if (diffDays === 0) return { text: 'Due today', urgent: true };
    if (diffDays === 1) return { text: 'Tomorrow', urgent: false };
    return { text: date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }), urgent: false };
  };

  const priorityConfig = {
    high: { label: 'High', color: 'text-red-400', bg: 'bg-red-500/10', dot: 'bg-red-400' },
    medium: { label: 'Medium', color: 'text-amber-400', bg: 'bg-amber-500/10', dot: 'bg-amber-400' },
    low: { label: 'Low', color: 'text-slate-400', bg: 'bg-slate-500/10', dot: 'bg-slate-400' },
  };

  const statusIcon = (status: Task['status']) => {
    if (status === 'completed') return <CheckCircle2 className="w-5 h-5 text-emerald-400" />;
    if (status === 'in_progress') return <Clock className="w-5 h-5 text-amber-400" />;
    return <Circle className="w-5 h-5 text-slate-500" />;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-8 h-8 border-2 border-emerald-500/30 border-t-emerald-500 rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-in">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Tasks</h1>
          <p className="text-slate-400 mt-1">{filteredTasks.length} task{filteredTasks.length !== 1 ? 's' : ''}</p>
        </div>
        <button
          onClick={() => { setEditingTask(null); setShowModal(true); }}
          className="flex items-center gap-2 px-4 py-2.5 bg-emerald-500 hover:bg-emerald-400 text-slate-900 font-semibold rounded-xl transition-all duration-200 hover:shadow-lg hover:shadow-emerald-500/25"
        >
          <Plus className="w-4 h-4" />
          New Task
        </button>
      </div>

      {/* Search + Filter Bar */}
      <div className="space-y-3">
        <div className="flex items-center gap-3">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
            <input
              type="text"
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Search tasks..."
              className="w-full pl-10 pr-4 py-2.5 bg-white/5 border border-white/10 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-500/50 transition-all text-sm"
            />
          </div>
          <button
            onClick={() => setShowFilters(!showFilters)}
            className={`flex items-center gap-2 px-3 py-2.5 rounded-xl border text-sm font-medium transition-all ${
              showFilters ? 'bg-emerald-500/15 border-emerald-500/30 text-emerald-400' : 'bg-white/5 border-white/10 text-slate-400 hover:text-white'
            }`}
          >
            <Filter className="w-4 h-4" />
            Filters
            <ChevronDown className={`w-3 h-3 transition-transform ${showFilters ? 'rotate-180' : ''}`} />
          </button>
          <button
            onClick={() => setSortDir(sortDir === 'asc' ? 'desc' : 'asc')}
            className="p-2.5 rounded-xl bg-white/5 border border-white/10 text-slate-400 hover:text-white transition-all"
            title={`Sort ${sortDir === 'asc' ? 'ascending' : 'descending'}`}
          >
            {sortDir === 'asc' ? <SortAsc className="w-4 h-4" /> : <SortDesc className="w-4 h-4" />}
          </button>
        </div>

        {/* Filter Panel */}
        {showFilters && (
          <div className="bg-white/5 border border-white/10 rounded-xl p-4 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 animate-in">
            <div>
              <label className="block text-xs font-medium text-slate-400 mb-1.5">Status</label>
              <select
                value={statusFilter}
                onChange={e => setStatusFilter(e.target.value as StatusFilter)}
                className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-sm text-white focus:outline-none focus:ring-2 focus:ring-emerald-500/50"
              >
                <option value="all">All Statuses</option>
                <option value="pending">Pending</option>
                <option value="in_progress">In Progress</option>
                <option value="completed">Completed</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-400 mb-1.5">Priority</label>
              <select
                value={priorityFilter}
                onChange={e => setPriorityFilter(e.target.value as PriorityFilter)}
                className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-sm text-white focus:outline-none focus:ring-2 focus:ring-emerald-500/50"
              >
                <option value="all">All Priorities</option>
                <option value="high">High</option>
                <option value="medium">Medium</option>
                <option value="low">Low</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-400 mb-1.5">Category</label>
              <select
                value={categoryFilter}
                onChange={e => setCategoryFilter(e.target.value)}
                className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-sm text-white focus:outline-none focus:ring-2 focus:ring-emerald-500/50"
              >
                <option value="all">All Categories</option>
                {categories.map(c => (
                  <option key={c.id} value={c.id}>{c.name}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-400 mb-1.5">Sort By</label>
              <select
                value={sortKey}
                onChange={e => setSortKey(e.target.value as SortKey)}
                className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-sm text-white focus:outline-none focus:ring-2 focus:ring-emerald-500/50"
              >
                <option value="created_at">Date Created</option>
                <option value="due_date">Due Date</option>
                <option value="priority">Priority</option>
                <option value="title">Title</option>
              </select>
            </div>
          </div>
        )}
      </div>

      {/* Task List */}
      {filteredTasks.length === 0 ? (
        <div className="text-center py-16">
          <div className="w-16 h-16 rounded-2xl bg-white/5 flex items-center justify-center mx-auto mb-4">
            <CheckCircle2 className="w-8 h-8 text-slate-600" />
          </div>
          <p className="text-slate-400">
            {tasks.length === 0 ? 'No tasks yet. Create your first task!' : 'No tasks match your filters.'}
          </p>
        </div>
      ) : (
        <div className="space-y-2">
          {filteredTasks.map(task => {
            const pConfig = priorityConfig[task.priority];
            const dueInfo = formatDate(task.due_date);
            const cat = task.categories;

            return (
              <div
                key={task.id}
                className="group bg-white/5 border border-white/10 rounded-xl p-4 hover:bg-white/[0.07] transition-all duration-200"
              >
                <div className="flex items-start gap-3">
                  {/* Status toggle */}
                  <button
                    onClick={() => toggleComplete(task)}
                    className="mt-0.5 flex-shrink-0 hover:scale-110 transition-transform"
                  >
                    {statusIcon(task.status)}
                  </button>

                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <h3 className={`text-sm font-medium ${
                        task.status === 'completed' ? 'text-slate-500 line-through' : 'text-white'
                      }`}>
                        {task.title}
                      </h3>
                      <span className={`inline-flex items-center gap-1 text-xs px-1.5 py-0.5 rounded-md ${pConfig.bg} ${pConfig.color}`}>
                        <span className={`w-1.5 h-1.5 rounded-full ${pConfig.dot}`} />
                        {pConfig.label}
                      </span>
                      {cat && (
                        <span
                          className="text-xs px-1.5 py-0.5 rounded-md"
                          style={{ backgroundColor: cat.color + '20', color: cat.color }}
                        >
                          {cat.name}
                        </span>
                      )}
                    </div>
                    {task.description && (
                      <p className={`text-xs mt-1 line-clamp-1 ${
                        task.status === 'completed' ? 'text-slate-600' : 'text-slate-400'
                      }`}>
                        {task.description}
                      </p>
                    )}
                    <div className="flex items-center gap-3 mt-2">
                      {dueInfo && (
                        <span className={`text-xs flex items-center gap-1 ${
                          dueInfo.urgent ? 'text-red-400' : 'text-slate-500'
                        }`}>
                          <Calendar className="w-3 h-3" />
                          {dueInfo.text}
                        </span>
                      )}
                      {task.status === 'in_progress' && (
                        <span className="text-xs text-amber-400 flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          In progress
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="relative flex-shrink-0">
                    <button
                      onClick={() => setOpenMenuId(openMenuId === task.id ? null : task.id)}
                      className="p-1.5 text-slate-500 hover:text-white rounded-lg hover:bg-white/5 transition-all opacity-0 group-hover:opacity-100"
                    >
                      <MoreHorizontal className="w-4 h-4" />
                    </button>
                    {openMenuId === task.id && (
                      <>
                        <div className="fixed inset-0 z-10" onClick={() => setOpenMenuId(null)} />
                        <div className="absolute right-0 top-8 z-20 w-48 bg-slate-800 border border-white/10 rounded-xl shadow-xl py-1 animate-in">
                          {task.status !== 'in_progress' && task.status !== 'completed' && (
                            <button
                              onClick={() => handleStatusChange(task, 'in_progress')}
                              className="w-full flex items-center gap-2 px-3 py-2 text-sm text-slate-300 hover:bg-white/5 transition-colors"
                            >
                              <Clock className="w-4 h-4 text-amber-400" />
                              Start working
                            </button>
                          )}
                          {task.status === 'in_progress' && (
                            <button
                              onClick={() => handleStatusChange(task, 'completed')}
                              className="w-full flex items-center gap-2 px-3 py-2 text-sm text-slate-300 hover:bg-white/5 transition-colors"
                            >
                              <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                              Mark complete
                            </button>
                          )}
                          {task.status === 'completed' && (
                            <button
                              onClick={() => handleStatusChange(task, 'pending')}
                              className="w-full flex items-center gap-2 px-3 py-2 text-sm text-slate-300 hover:bg-white/5 transition-colors"
                            >
                              <AlertCircle className="w-4 h-4 text-slate-400" />
                              Reopen task
                            </button>
                          )}
                          <button
                            onClick={() => handleEdit(task)}
                            className="w-full flex items-center gap-2 px-3 py-2 text-sm text-slate-300 hover:bg-white/5 transition-colors"
                          >
                            <Edit3 className="w-4 h-4 text-blue-400" />
                            Edit
                          </button>
                          <div className="border-t border-white/5 my-1" />
                          <button
                            onClick={() => handleDelete(task.id)}
                            className="w-full flex items-center gap-2 px-3 py-2 text-sm text-red-400 hover:bg-red-500/10 transition-colors"
                          >
                            <Trash2 className="w-4 h-4" />
                            Delete
                          </button>
                        </div>
                      </>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Modal */}
      {showModal && (
        <TaskModal
          task={editingTask}
          onClose={() => { setShowModal(false); setEditingTask(null); }}
        />
      )}
    </div>
  );
}
