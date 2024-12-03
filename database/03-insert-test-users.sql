\connect postgres

-- Hier nötige EXTENSIONMS installieren, da diese nicht mit pg_dump eingefangen werden können müssen sie manuell hinzugefügt werden

-- Zu Beginn werden zwei default Nutzer der DB hinzugefügt: admin und user, um sofort login etc testen zu können

INSERT INTO main.users (user_name, email, password_hash, is_verified, registered_at)
VALUES 
    -- Nutzer admin                 Pwd: aaa                        für admion route nach merge is_admin auf TRUE setzen
    ('admin', 'admin@idoc.de', '$2b$10$joQOhkX9NLe2Bo1oU1FHXOLlw4S4Rc5usOifSV0Yh6UHA6X4sB9qS', true, CURRENT_TIMESTAMP),
    -- Nutzer user                  Pwd: aaa                        " is_admin auf FALSE setzen
    ('user', 'user@idoc.de', '$2b$10$joQOhkX9NLe2Bo1oU1FHXOLlw4S4Rc5usOifSV0Yh6UHA6X4sB9qS', true, CURRENT_TIMESTAMP)
ON CONFLICT (email) DO NOTHING;