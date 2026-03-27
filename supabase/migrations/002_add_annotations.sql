-- Add screenshot_annotations column to store marker/line data as JSON
ALTER TABLE trades ADD COLUMN screenshot_annotations JSONB DEFAULT '[]';

-- Comment for documentation
COMMENT ON COLUMN trades.screenshot_annotations IS 'JSON array of {markers, lines} per screenshot. Index matches screenshot_urls.';
