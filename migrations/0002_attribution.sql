-- First-party enquiry attribution.
--
-- Answers "which content produced this enquiry?" from our own data rather than
-- an analytics product, and covers 100% of submissions rather than only the
-- visitors who accept measurement cookies.
--
-- Holds no identifier and nothing about the person: only where they arrived
-- from, where they landed, and which page they submitted from.

ALTER TABLE submissions ADD COLUMN referrer TEXT;
ALTER TABLE submissions ADD COLUMN landing_path TEXT;
ALTER TABLE submissions ADD COLUMN submitted_from TEXT;
ALTER TABLE submissions ADD COLUMN utm_source TEXT;
ALTER TABLE submissions ADD COLUMN utm_medium TEXT;
ALTER TABLE submissions ADD COLUMN utm_campaign TEXT;
ALTER TABLE submissions ADD COLUMN utm_term TEXT;
ALTER TABLE submissions ADD COLUMN utm_content TEXT;

-- The common question is "which sources produced enquiries this month".
CREATE INDEX IF NOT EXISTS idx_submissions_source ON submissions (utm_source, created_at);
