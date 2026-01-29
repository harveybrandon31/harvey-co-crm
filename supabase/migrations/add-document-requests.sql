-- Document Requests: allows staff to send upload links to clients
-- and track per-document upload status

-- Main request table (one per email sent)
CREATE TABLE IF NOT EXISTS document_requests (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id uuid NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
  token text UNIQUE NOT NULL,
  status text NOT NULL DEFAULT 'pending'
    CHECK (status IN ('pending', 'partially_uploaded', 'completed', 'expired')),
  expires_at timestamptz NOT NULL,
  created_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  task_id uuid REFERENCES tasks(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- Individual items within a request
CREATE TABLE IF NOT EXISTS document_request_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  document_request_id uuid NOT NULL REFERENCES document_requests(id) ON DELETE CASCADE,
  name text NOT NULL,
  description text,
  status text NOT NULL DEFAULT 'pending'
    CHECK (status IN ('pending', 'uploaded')),
  uploaded_at timestamptz,
  document_id uuid REFERENCES documents(id) ON DELETE SET NULL,
  file_path text,
  file_name text,
  file_size bigint,
  file_type text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- Indexes
CREATE INDEX idx_document_requests_token ON document_requests(token);
CREATE INDEX idx_document_requests_client_id ON document_requests(client_id);
CREATE INDEX idx_document_requests_status ON document_requests(status);
CREATE INDEX idx_document_requests_expires_at ON document_requests(expires_at);
CREATE INDEX idx_document_request_items_request_id ON document_request_items(document_request_id);

-- RLS policies
ALTER TABLE document_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE document_request_items ENABLE ROW LEVEL SECURITY;

-- Staff can see their own requests
CREATE POLICY "Staff can view own document requests"
  ON document_requests FOR SELECT
  USING (created_by = auth.uid());

CREATE POLICY "Staff can insert document requests"
  ON document_requests FOR INSERT
  WITH CHECK (created_by = auth.uid());

CREATE POLICY "Staff can update own document requests"
  ON document_requests FOR UPDATE
  USING (created_by = auth.uid());

-- Items inherit access through their parent request
CREATE POLICY "Staff can view items of own requests"
  ON document_request_items FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM document_requests
      WHERE document_requests.id = document_request_items.document_request_id
        AND document_requests.created_by = auth.uid()
    )
  );

CREATE POLICY "Staff can insert items for own requests"
  ON document_request_items FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM document_requests
      WHERE document_requests.id = document_request_items.document_request_id
        AND document_requests.created_by = auth.uid()
    )
  );

CREATE POLICY "Staff can update items of own requests"
  ON document_request_items FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM document_requests
      WHERE document_requests.id = document_request_items.document_request_id
        AND document_requests.created_by = auth.uid()
    )
  );

-- Service role bypass (for public API endpoints)
CREATE POLICY "Service role full access to document_requests"
  ON document_requests FOR ALL
  USING (auth.role() = 'service_role');

CREATE POLICY "Service role full access to document_request_items"
  ON document_request_items FOR ALL
  USING (auth.role() = 'service_role');
