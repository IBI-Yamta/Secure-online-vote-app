import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

export type Task = {
  id: string;
  title: string;
  description: string;
  status: 'pending' | 'in_progress' | 'completed';
  priority: 'low' | 'medium' | 'high';
  category_id: string | null;
  due_date: string | null;
  user_id: string;
  created_at: string;
  updated_at: string;
  completed_at: string | null;
  categories?: Category;
};

export type Category = {
  id: string;
  name: string;
  color: string;
  icon: string;
  sort_order: number;
  created_at: string;
};

export type TaskInsert = Omit<Task, 'id' | 'created_at' | 'updated_at' | 'completed_at' | 'categories'>;
export type TaskUpdate = Partial<TaskInsert> & { completed_at?: string | null };
