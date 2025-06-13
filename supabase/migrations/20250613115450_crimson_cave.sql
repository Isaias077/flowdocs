/*
  # Create flows table

  1. New Tables
    - `flows`
      - `id` (uuid, primary key)
      - `name` (text, required)
      - `description` (text, optional)
      - `project_id` (uuid, foreign key to projects)
      - `created_at` (timestamp)
      - `updated_at` (timestamp)

  2. Security
    - Enable RLS on `flows` table
    - Add policies for public access
    - Add foreign key constraint to projects table

  3. Indexes
    - Add index on project_id for better query performance
*/

CREATE TABLE IF NOT EXISTS flows (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  description text DEFAULT '',
  project_id uuid NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE flows ENABLE ROW LEVEL SECURITY;

-- Create policies for public access
CREATE POLICY "Allow public read access on flows"
  ON flows
  FOR SELECT
  TO public
  USING (true);

CREATE POLICY "Allow public insert access on flows"
  ON flows
  FOR INSERT
  TO public
  WITH CHECK (true);

CREATE POLICY "Allow public update access on flows"
  ON flows
  FOR UPDATE
  TO public
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Allow public delete access on flows"
  ON flows
  FOR DELETE
  TO public
  USING (true);

-- Create trigger for flows table
CREATE TRIGGER update_flows_updated_at
  BEFORE UPDATE ON flows
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Create index for better query performance
CREATE INDEX IF NOT EXISTS flows_project_id_idx ON flows(project_id);