\connect postgres

INSERT INTO main.users (user_name, email, password_hash, is_verified, registered_at)
VALUES 
    ('admin', 'admin@idoc.de', '$2b$10$joQOhkX9NLe2Bo1oU1FHXOLlw4S4Rc5usOifSV0Yh6UHA6X4sB9qS', true, CURRENT_TIMESTAMP),
    ('user', 'user@idoc.de', '$2b$10$joQOhkX9NLe2Bo1oU1FHXOLlw4S4Rc5usOifSV0Yh6UHA6X4sB9qS', true, CURRENT_TIMESTAMP)
ON CONFLICT (email) DO NOTHING;