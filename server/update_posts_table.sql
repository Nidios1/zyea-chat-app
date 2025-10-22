-- Add privacy column to posts table if it doesn't exist
ALTER TABLE posts 
ADD COLUMN IF NOT EXISTS privacy ENUM('public', 'friends', 'private') DEFAULT 'public' 
AFTER post_type;
