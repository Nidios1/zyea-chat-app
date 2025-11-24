-- Grant all privileges to zalo_user on zalo_clone database
-- This ensures the user has full access to all tables
-- Note: Docker MySQL automatically creates the user, but we ensure permissions here

-- Grant all privileges on zalo_clone database
GRANT ALL PRIVILEGES ON zalo_clone.* TO 'zalo_user'@'%';

-- Flush privileges to apply changes
FLUSH PRIVILEGES;

-- Verify user exists and has permissions (this will show in logs)
SELECT User, Host FROM mysql.user WHERE User = 'zalo_user';

