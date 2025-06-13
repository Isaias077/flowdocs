/*
  # Add status column to flows table

  1. Schema Changes
    - Add `status` column to flows table with predefined status options
    - Set default status to 'draft'

  2. Security
    - Maintain existing RLS policies for flows table
*/

-- Add status column to flows table
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'flows' AND column_name = 'status'
  ) THEN
    ALTER TABLE flows ADD COLUMN status text DEFAULT 'draft';
  END IF;
END $$;

-- Add check constraint for valid status values
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.check_constraints
    WHERE constraint_name = 'flows_status_check'
  ) THEN
    ALTER TABLE flows ADD CONSTRAINT flows_status_check 
    CHECK (status IN ('draft', 'in-progress', 'review', 'approved', 'completed', 'archived'));
  END IF;
END $$;