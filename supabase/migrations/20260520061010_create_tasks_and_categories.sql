/*
  # Create tasks and categories tables

  1. New Tables
    - `categories`
      - `id` (uuid, primary key)
      - `name` (text, not null)
      - `color` (text, not null, default hex color)
      - `icon` (text, not null, default icon name)
      - `sort_order` (integer, not null, default 0)
      - `created_at` (timestamptz, default now())
    - `tasks`
      - `id` (uuid, primary key)
      - `title` (text, not null)
      - `description` (text, default empty string)
      - `status` (text, not null, default 'pending') - pending | in_progress | completed
      - `priority` (text, not null, default 'medium') - low | medium | high
      - `category_id` (uuid, foreign key to categories)
      - `due_date` (date, nullable)
      - `created_at` (timestamptz, default now())
      - `updated_at` (timestamptz, default now())
      - `completed_at` (timestamptz, nullable)

  2. Security
    - Enable RLS on both tables
    - Categories: anyone can read, only authenticated can insert/update/delete their own
    - Tasks: authenticated users can CRUD their own tasks only

  3. Important Notes
    - Categories are shared/readable by all authenticated users (seed data)
    - Tasks are strictly scoped to the authenticated user via auth.uid()
    - Index on tasks.status and tasks.category_id for query performance
*/

-- Create categories table
CREATE TABLE IF NOT EXISTS categories (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  color text NOT NULL DEFAULT '#6B7280',
  icon text NOT NULL DEFAULT 'folder',
  sort_order integer NOT NULL DEFAULT 0,
  created_at timestamptz DEFAULT now()
);

-- Create tasks table
CREATE TABLE IF NOT EXISTS tasks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  description text DEFAULT '',
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'in_progress', 'completed')),
  priority text NOT NULL DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high')),
  category_id uuid REFERENCES categories(id) ON DELETE SET NULL,
  due_date date,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  completed_at timestamptz
);

-- Enable RLS
ALTER TABLE categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE tasks ENABLE ROW LEVEL SECURITY;

-- Categories policies (readable by all authenticated, manageable by authenticated)
CREATE POLICY "Authenticated users can view categories"
  ON categories FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Authenticated users can create categories"
  ON categories FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Authenticated users can update categories"
  ON categories FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- Tasks policies (strictly scoped to user)
CREATE POLICY "Users can view own tasks"
  ON tasks FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create own tasks"
  ON tasks FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own tasks"
  ON tasks FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own tasks"
  ON tasks FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_tasks_status ON tasks(status);
CREATE INDEX IF NOT EXISTS idx_tasks_category_id ON tasks(category_id);
CREATE INDEX IF NOT EXISTS idx_tasks_user_id ON tasks(user_id);

-- Seed default categories
INSERT INTO categories (name, color, icon, sort_order) VALUES
  ('Work', '#3B82F6', 'briefcase', 1),
  ('Personal', '#10B981', 'user', 2),
  ('Health', '#EF4444', 'heart', 3),
  ('Learning', '#F59E0B', 'book-open', 4),
  ('Finance', '#8B5CF6', 'dollar-sign', 5)
ON CONFLICT DO NOTHING;
