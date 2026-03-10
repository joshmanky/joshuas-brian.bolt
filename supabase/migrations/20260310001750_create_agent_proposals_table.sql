/*
  # Create agent_proposals table

  1. New Tables
    - `agent_proposals`
      - `id` (uuid, primary key)
      - `name` (text, not null) - name of the proposed agent
      - `role` (text) - short role description
      - `status` (text, default 'pending') - pending, approved, rejected
      - `system_prompt` (text) - full system prompt for the agent
      - `test_message` (text) - message to test the agent
      - `reasoning` (text) - why this agent improves the system
      - `raw_task_description` (text) - original user description
      - `created_at` (timestamptz, default now())

  2. Security
    - Enable RLS on `agent_proposals` table
    - Add policies for authenticated users to manage their proposals
*/

CREATE TABLE IF NOT EXISTS agent_proposals (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  role text DEFAULT '',
  status text DEFAULT 'pending',
  system_prompt text DEFAULT '',
  test_message text DEFAULT '',
  reasoning text DEFAULT '',
  raw_task_description text DEFAULT '',
  created_at timestamptz DEFAULT now()
);

ALTER TABLE agent_proposals ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can read agent proposals"
  ON agent_proposals
  FOR SELECT
  TO authenticated
  USING (auth.uid() IS NOT NULL);

CREATE POLICY "Authenticated users can create agent proposals"
  ON agent_proposals
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "Authenticated users can update agent proposals"
  ON agent_proposals
  FOR UPDATE
  TO authenticated
  USING (auth.uid() IS NOT NULL)
  WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "Authenticated users can delete agent proposals"
  ON agent_proposals
  FOR DELETE
  TO authenticated
  USING (auth.uid() IS NOT NULL);
