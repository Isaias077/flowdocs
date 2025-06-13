/*
  # Create steps table

  1. New Tables
    - `steps`
      - `id` (uuid, primary key)
      - `name` (text, required)
      - `description` (text, optional)
      - `flow_id` (uuid, foreign key to flows)
      - `microservice` (text, required)
      - `order` (integer, for step ordering)
      - `functional_description` (text, optional)
      - `links` (text, JSON string for storing related links)
      - `created_at` (timestamp)
      - `updated_at` (timestamp)

  2. Security
    - Enable RLS on `steps` table
    - Add policies for public access
    - Add foreign key constraint to flows table

  3. Indexes
    - Add index on flow_id for better query performance
    - Add index on order for sorting
*/

CREATE TABLE IF NOT EXISTS steps (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  description text DEFAULT '',
  flow_id uuid NOT NULL REFERENCES flows(id) ON DELETE CASCADE,
  microservice text NOT NULL,
  "order" integer NOT NULL DEFAULT 0,
  functional_description text DEFAULT '',
  links text DEFAULT '[]',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE steps ENABLE ROW LEVEL SECURITY;

-- Create policies for public access
CREATE POLICY "Allow public read access on steps"
  ON steps
  FOR SELECT
  TO public
  USING (true);

CREATE POLICY "Allow public insert access on steps"
  ON steps
  FOR INSERT
  TO public
  WITH CHECK (true);

CREATE POLICY "Allow public update access on steps"
  ON steps
  FOR UPDATE
  TO public
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Allow public delete access on steps"
  ON steps
  FOR DELETE
  TO public
  USING (true);

-- Create trigger for steps table
CREATE TRIGGER update_steps_updated_at
  BEFORE UPDATE ON steps
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS steps_flow_id_idx ON steps(flow_id);
CREATE INDEX IF NOT EXISTS steps_order_idx ON steps("order");