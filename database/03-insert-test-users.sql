\connect postgres

-- Hier nötige EXTENSIONMS installieren, da diese nicht mit pg_dump eingefangen werden können müssen sie manuell hinzugefügt werden

-- Zu Beginn werden zwei default Nutzer der DB hinzugefügt: admin und user, um sofort login etc testen zu können

INSERT INTO main.users (user_name, email, password_hash, is_verified, registered_at)
VALUES 
    ('admin', 'admin@idoc.de', '$2b$10$joQOhkX9NLe2Bo1oU1FHXOLlw4S4Rc5usOifSV0Yh6UHA6X4sB9qS', true, CURRENT_TIMESTAMP),
    ('user', 'user@idoc.de', '$2b$10$joQOhkX9NLe2Bo1oU1FHXOLlw4S4Rc5usOifSV0Yh6UHA6X4sB9qS', true, CURRENT_TIMESTAMP)
ON CONFLICT (email) DO NOTHING;

------------------------------------------------------------------------ |

-- Role Mapping --
-- Admin-Rolle hinzufügen
INSERT INTO main.user_roles(role_id, role_name)
VALUES
    ('1', 'admin');

-- Nutzer "admin" die Admin-Rolle geben
INSERT INTO main.user_roles_mapping (user_id, role_id, assigned_at)
VALUES
    ('1', '1', CURRENT_TIMESTAMP)

------------------------------------------------------------------------ |

-- NUTZER SETUP --
-- 
-- user_id  user_name   email           password    role_id (role_name)
-- 1        admin       admin@idoc.de   aaa         1       admin
-- 2        user        user@idoc.de    aaa         NULL    NULL
--

------------------------------------------------------------------------ |