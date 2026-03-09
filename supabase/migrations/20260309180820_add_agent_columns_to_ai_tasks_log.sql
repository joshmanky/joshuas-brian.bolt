/*
  # Add agent_name and status columns to ai_tasks_log

  1. Modified Tables
    - `ai_tasks_log`
      - Added `agent_name` (text) - which agent performed the task
      - Added `status` (text) - completed/failed/running
  2. Notes
    - Uses IF NOT EXISTS checks for safety
    - Defaults: agent_name='System', status='completed'
*/

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'ai_tasks_log' AND column_name = 'agent_name'
  ) THEN
    ALTER TABLE ai_tasks_log ADD COLUMN agent_name text NOT NULL DEFAULT 'System';
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'ai_tasks_log' AND column_name = 'status'
  ) THEN
    ALTER TABLE ai_tasks_log ADD COLUMN status text NOT NULL DEFAULT 'completed';
  END IF;
END $$;
