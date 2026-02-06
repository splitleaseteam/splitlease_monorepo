-- Create document_change_request table
CREATE TABLE IF NOT EXISTS document_change_request (
  _id text PRIMARY KEY DEFAULT generate_bubble_id(),
  document_id text NOT NULL REFERENCES documentssent(_id) ON DELETE CASCADE,
  user_id text NOT NULL REFERENCES "user"(_id) ON DELETE CASCADE,
  user_email text NOT NULL,
  user_name text,
  user_type text NOT NULL CHECK (user_type IN ('Host', 'Guest')),
  request_text text NOT NULL,
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'reviewed', 'resolved')),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- Create indexes
CREATE INDEX idx_document_change_request_document_id ON document_change_request(document_id);
CREATE INDEX idx_document_change_request_user_id ON document_change_request(user_id);
CREATE INDEX idx_document_change_request_status ON document_change_request(status);
CREATE INDEX idx_document_change_request_created_at ON document_change_request(created_at DESC);

-- Create updated_at trigger
CREATE TRIGGER set_document_change_request_updated_at
  BEFORE UPDATE ON document_change_request
  FOR EACH ROW
  EXECUTE FUNCTION set_updated_at();

-- Enable RLS
ALTER TABLE document_change_request ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can view their own change requests"
  ON document_change_request FOR SELECT
  USING (user_id = auth.uid()::text);

CREATE POLICY "Users can create change requests"
  ON document_change_request FOR INSERT
  WITH CHECK (user_id = auth.uid()::text);

-- Admin policy (for internal tools)
CREATE POLICY "Service role can do anything"
  ON document_change_request FOR ALL
  USING (true);

COMMENT ON TABLE document_change_request IS 'User-submitted change requests for draft documents';
