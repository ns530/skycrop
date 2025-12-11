-- Create content table for admin content management
CREATE TABLE IF NOT EXISTS content (
    content_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title VARCHAR(200) NOT NULL,
    summary TEXT NOT NULL,
    body TEXT NOT NULL,
    status VARCHAR(20) NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'published')),
    published_at TIMESTAMP WITH TIME ZONE,
    created_by UUID NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- Create indexes for efficient querying
CREATE INDEX IF NOT EXISTS idx_content_status ON content(status);
CREATE INDEX IF NOT EXISTS idx_content_created_at ON content(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_content_published_at ON content(published_at DESC) WHERE published_at IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_content_created_by ON content(created_by);

-- Create trigger to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_content_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_content_updated_at
    BEFORE UPDATE ON content
    FOR EACH ROW
    EXECUTE FUNCTION update_content_updated_at();

-- Insert some sample content for testing
INSERT INTO content (title, summary, body, status, created_by, published_at)
SELECT
    'Welcome to SkyCrop',
    'Learn about our agricultural monitoring platform',
    'SkyCrop is a comprehensive platform for monitoring field health, weather conditions, and crop yields using satellite imagery and AI-powered analytics.',
    'published',
    u.user_id,
    NOW()
FROM users u
WHERE u.role = 'admin'
LIMIT 1
ON CONFLICT DO NOTHING;