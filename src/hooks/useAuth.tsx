import { useEffect, useState, createContext, useContext, type ReactNode } from 'react';
import { supabase, type Task, type Category } from '../lib/supabase';
import type { User, Session } from '@supabase/supabase-js';

type AuthContextType = {
  user: User | null;
  session: Session | null;
  loading: boolean;
  signUp: (email: string, password: string) => Promise<{ error: string | null }>;
  signIn: (email: string, password: string) => Promise<{ error: string | null }>;
  signOut: () => Promise<void>;
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      setLoading(false);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      setUser(session?.user ?? null);
    });

    return () => subscription.unsubscribe();
  }, []);

  const signUp = async (email: string, password: string) => {
    const { error } = await supabase.auth.signUp({ email, password });
    return { error: error?.message ?? null };
  };

  const signIn = async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    return { error: error?.message ?? null };
  };

  const signOut = async () => {
    await supabase.auth.signOut();
  };

  return (
    <AuthContext.Provider value={{ user, session, loading, signUp, signIn, signOut }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within AuthProvider');
  return context;
}

export function useTasks() {
  const { user } = useAuth();
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchTasks = async () => {
    if (!user) { setTasks([]); setLoading(false); return; }
    setLoading(true);
    const { data, error } = await supabase
      .from('tasks')
      .select('*, categories(*)')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false });
    if (!error && data) setTasks(data as Task[]);
    setLoading(false);
  };

  useEffect(() => { fetchTasks(); }, [user]);

  const addTask = async (task: Omit<Task, 'id' | 'created_at' | 'updated_at' | 'completed_at' | 'categories' | 'user_id'>) => {
    if (!user) return;
    const { data, error } = await supabase
      .from('tasks')
      .insert({ ...task, user_id: user.id })
      .select('*, categories(*)')
      .maybeSingle();
    if (!error && data) setTasks(prev => [data as Task, ...prev]);
    return { error };
  };

  const updateTask = async (id: string, updates: Partial<Task>) => {
    const { data, error } = await supabase
      .from('tasks')
      .update({ ...updates, updated_at: new Date().toISOString() })
      .eq('id', id)
      .select('*, categories(*)')
      .maybeSingle();
    if (!error && data) {
      setTasks(prev => prev.map(t => t.id === id ? (data as Task) : t));
    }
    return { error };
  };

  const deleteTask = async (id: string) => {
    const { error } = await supabase.from('tasks').delete().eq('id', id);
    if (!error) setTasks(prev => prev.filter(t => t.id !== id));
    return { error };
  };

  const toggleComplete = async (task: Task) => {
    const newStatus = task.status === 'completed' ? 'pending' : 'completed';
    const completedAt = newStatus === 'completed' ? new Date().toISOString() : null;
    return updateTask(task.id, { status: newStatus, completed_at: completedAt } as Partial<Task>);
  };

  return { tasks, loading, addTask, updateTask, deleteTask, toggleComplete, refetch: fetchTasks };
}

export function useCategories() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchCategories = async () => {
      const { data, error } = await supabase
        .from('categories')
        .select('*')
        .order('sort_order', { ascending: true });
      if (!error && data) setCategories(data as Category[]);
      setLoading(false);
    };
    fetchCategories();
  }, []);

  return { categories, loading };
}
