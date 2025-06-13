/*
  # Add documentation links to projects and BDD cases to steps

  1. Schema Changes
    - Add `documentation_links` column to projects table (JSON field for storing documentation links)
    - Add `bdd_cases` column to steps table (text field for BDD scenarios)

  2. Security
    - Maintain existing RLS policies for both tables
*/

-- Add documentation_links column to projects table
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'projects' AND column_name = 'documentation_links'
  ) THEN
    ALTER TABLE projects ADD COLUMN documentation_links text DEFAULT '[]';
  END IF;
END $$;

-- Add bdd_cases column to steps table
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'steps' AND column_name = 'bdd_cases'
  ) THEN
    ALTER TABLE steps ADD COLUMN bdd_cases text DEFAULT '';
  END IF;
END $$;