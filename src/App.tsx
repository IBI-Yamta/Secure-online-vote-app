import { useState } from 'react';
import { AuthProvider, useAuth } from './hooks/useAuth';
import { AuthForm } from './components/Auth';
import { Sidebar } from './components/Sidebar';
import { Dashboard } from './components/Dashboard';
import { TaskList } from './components/TaskList';

type View = 'dashboard' | 'tasks';

function AppContent() {
  const { user, loading } = useAuth();
  const [currentView, setCurrentView] = useState<View>('dashboard');

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-emerald-500/30 border-t-emerald-500 rounded-full animate-spin" />
      </div>
    );
  }

  if (!user) return <AuthForm />;

  return (
    <div className="flex min-h-screen bg-slate-950">
      <Sidebar currentView={currentView} onViewChange={setCurrentView} />
      <main className="flex-1 p-4 lg:p-8 overflow-auto">
        <div className="max-w-5xl mx-auto">
          {currentView === 'dashboard' ? (
            <Dashboard onViewTasks={() => setCurrentView('tasks')} />
          ) : (
            <TaskList />
          )}
        </div>
      </main>
    </div>
  );
}

function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
}

export default App;
