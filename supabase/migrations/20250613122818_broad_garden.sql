/*
  # Add sections and subsections for organizing flows

  1. New Tables
    - `sections`
      - `id` (uuid, primary key)
      - `name` (text, required)
      - `description` (text, optional)
      - `project_id` (uuid, foreign key to projects)
      - `parent_section_id` (uuid, foreign key to sections, nullable for top-level sections)
      - `order` (integer, for section ordering)
      - `created_at` (timestamp)
      - `updated_at` (timestamp)

  2. Schema Changes
    - Add `section_id` column to flows table (nullable for flows not in sections)

  3. Security
    - Enable RLS on `sections` table
    - Add policies for public access
    - Add foreign key constraints

  4. Indexes
    - Add indexes for better query performance
*/

-- Create sections table
CREATE TABLE IF NOT EXISTS sections (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  description text DEFAULT '',
  project_id uuid NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  parent_section_id uuid REFERENCES sections(id) ON DELETE CASCADE,
  "order" integer NOT NULL DEFAULT 0,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE sections ENABLE ROW LEVEL SECURITY;

-- Create policies for public access
CREATE POLICY "Allow public read access on sections"
  ON sections
  FOR SELECT
  TO public
  USING (true);

CREATE POLICY "Allow public insert access on sections"
  ON sections
  FOR INSERT
  TO public
  WITH CHECK (true);

CREATE POLICY "Allow public update access on sections"
  ON sections
  FOR UPDATE
  TO public
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Allow public delete access on sections"
  ON sections
  FOR DELETE
  TO public
  USING (true);

-- Create trigger for sections table
CREATE TRIGGER update_sections_updated_at
  BEFORE UPDATE ON sections
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS sections_project_id_idx ON sections(project_id);
CREATE INDEX IF NOT EXISTS sections_parent_section_id_idx ON sections(parent_section_id);
CREATE INDEX IF NOT EXISTS sections_order_idx ON sections("order");

-- Add section_id column to flows table
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'flows' AND column_name = 'section_id'
  ) THEN
    ALTER TABLE flows ADD COLUMN section_id uuid REFERENCES sections(id) ON DELETE SET NULL;
  END IF;
END $$;

-- Create index for flows section_id
CREATE INDEX IF NOT EXISTS flows_section_id_idx ON flows(section_id);