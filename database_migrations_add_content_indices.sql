-- Add indices to the 'original_content' table
-- Assuming 'id' is already indexed as a primary key.
-- If there's a 'source_url' or similar column for frequent lookups, add an index here.
-- CREATE INDEX ON original_content (source_url);

-- Add indices to the 'generated_content' table
CREATE INDEX ON generated_content (original_content_id);
CREATE INDEX ON generated_content (status);
CREATE INDEX ON generated_content (published_at);
CREATE INDEX ON generated_content (created_at);
CREATE INDEX ON generated_content (is_published_to_site);
-- If categories are stored directly as a text column and frequently filtered, consider a GIN index for full-text search or a B-tree index if exact matches are common.
-- For now, assuming categories might be a foreign key or an array of text.
-- If 'categories' is a foreign key to a 'categories' table, the foreign key itself should be indexed.
-- If 'categories' is an array of text, a GIN index might be appropriate:
-- CREATE INDEX ON generated_content USING GIN (categories);
