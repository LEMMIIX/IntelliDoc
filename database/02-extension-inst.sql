CREATE SCHEMA IF NOT EXISTS main;
CREATE EXTENSION IF NOT EXISTS vector WITH SCHEMA public;
ALTER DATABASE postgres SET search_path TO public, main;
SET search_path TO public, main;