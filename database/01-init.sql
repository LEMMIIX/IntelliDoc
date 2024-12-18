--
-- PostgreSQL database dump
--

-- Dumped from database version 16.4
-- Dumped by pg_dump version 16.4

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;

--
-- Name: main; Type: SCHEMA; Schema: -; Owner: -
--

CREATE SCHEMA main;


--
-- Name: adminpack; Type: EXTENSION; Schema: -; Owner: -
--

CREATE EXTENSION IF NOT EXISTS adminpack WITH SCHEMA pg_catalog;


--
-- Name: EXTENSION adminpack; Type: COMMENT; Schema: -; Owner: -
--

COMMENT ON EXTENSION adminpack IS 'administrative functions for PostgreSQL';


--
-- Name: vector; Type: EXTENSION; Schema: -; Owner: -
--

CREATE EXTENSION IF NOT EXISTS vector WITH SCHEMA main;


--
-- Name: EXTENSION vector; Type: COMMENT; Schema: -; Owner: -
--

COMMENT ON EXTENSION vector IS 'vector data type and ivfflat and hnsw access methods';


SET default_tablespace = '';

SET default_table_access_method = heap;

--
-- Name: files; Type: TABLE; Schema: main; Owner: -
--

CREATE TABLE main.files (
    file_id integer NOT NULL,
    user_id integer NOT NULL,
    file_name character varying(255) NOT NULL,
    file_type character varying(255) NOT NULL,
    file_data bytea NOT NULL,
    folder_id integer,
    uploaded_at timestamp without time zone DEFAULT now(),
    embedding main.vector(768),
    cluster_label integer,
    keywords text,
    version integer,
    original_file_id integer
);


--
-- Name: files_file_id_seq; Type: SEQUENCE; Schema: main; Owner: -
--

CREATE SEQUENCE main.files_file_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: files_file_id_seq; Type: SEQUENCE OWNED BY; Schema: main; Owner: -
--

ALTER SEQUENCE main.files_file_id_seq OWNED BY main.files.file_id;


--
-- Name: folders; Type: TABLE; Schema: main; Owner: -
--

CREATE TABLE main.folders (
    folder_id integer NOT NULL,
    user_id integer NOT NULL,
    parent_folder_id integer,
    folder_name character varying(255) NOT NULL,
    created_at timestamp without time zone DEFAULT now(),
    embedding main.vector(768)
);


--
-- Name: folders_folder_id_seq; Type: SEQUENCE; Schema: main; Owner: -
--

CREATE SEQUENCE main.folders_folder_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: folders_folder_id_seq; Type: SEQUENCE OWNED BY; Schema: main; Owner: -
--

ALTER SEQUENCE main.folders_folder_id_seq OWNED BY main.folders.folder_id;


--
-- Name: user_roles; Type: TABLE; Schema: main; Owner: -
--

CREATE TABLE main.user_roles (
    role_id integer NOT NULL,
    role_name character varying(255) NOT NULL
);


--
-- Name: user_roles_mapping; Type: TABLE; Schema: main; Owner: -
--

CREATE TABLE main.user_roles_mapping (
    user_id integer NOT NULL,
    role_id integer NOT NULL,
    assigned_at timestamp without time zone DEFAULT now()
);


--
-- Name: user_roles_role_id_seq; Type: SEQUENCE; Schema: main; Owner: -
--

CREATE SEQUENCE main.user_roles_role_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: user_roles_role_id_seq; Type: SEQUENCE OWNED BY; Schema: main; Owner: -
--

ALTER SEQUENCE main.user_roles_role_id_seq OWNED BY main.user_roles.role_id;


--
-- Name: users; Type: TABLE; Schema: main; Owner: -
--

CREATE TABLE main.users (
    user_id integer NOT NULL,
    user_name character varying(255) NOT NULL,
    email character varying(255) NOT NULL,
    password_hash character varying(255) NOT NULL,
    verification_key character varying(255),
    is_verified boolean DEFAULT false,
    registered_at timestamp without time zone DEFAULT now()
);


--
-- Name: users_user_id_seq; Type: SEQUENCE; Schema: main; Owner: -
--

CREATE SEQUENCE main.users_user_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: users_user_id_seq; Type: SEQUENCE OWNED BY; Schema: main; Owner: -
--

ALTER SEQUENCE main.users_user_id_seq OWNED BY main.users.user_id;


--
-- Name: files file_id; Type: DEFAULT; Schema: main; Owner: -
--

ALTER TABLE ONLY main.files ALTER COLUMN file_id SET DEFAULT nextval('main.files_file_id_seq'::regclass);


--
-- Name: folders folder_id; Type: DEFAULT; Schema: main; Owner: -
--

ALTER TABLE ONLY main.folders ALTER COLUMN folder_id SET DEFAULT nextval('main.folders_folder_id_seq'::regclass);


--
-- Name: user_roles role_id; Type: DEFAULT; Schema: main; Owner: -
--

ALTER TABLE ONLY main.user_roles ALTER COLUMN role_id SET DEFAULT nextval('main.user_roles_role_id_seq'::regclass);


--
-- Name: users user_id; Type: DEFAULT; Schema: main; Owner: -
--

ALTER TABLE ONLY main.users ALTER COLUMN user_id SET DEFAULT nextval('main.users_user_id_seq'::regclass);


--
-- Name: files files_pkey; Type: CONSTRAINT; Schema: main; Owner: -
--

ALTER TABLE ONLY main.files
    ADD CONSTRAINT files_pkey PRIMARY KEY (file_id);


--
-- Name: folders folders_pkey; Type: CONSTRAINT; Schema: main; Owner: -
--

ALTER TABLE ONLY main.folders
    ADD CONSTRAINT folders_pkey PRIMARY KEY (folder_id);


--
-- Name: user_roles_mapping user_roles_mapping_pkey; Type: CONSTRAINT; Schema: main; Owner: -
--

ALTER TABLE ONLY main.user_roles_mapping
    ADD CONSTRAINT user_roles_mapping_pkey PRIMARY KEY (user_id, role_id);


--
-- Name: user_roles user_roles_pkey; Type: CONSTRAINT; Schema: main; Owner: -
--

ALTER TABLE ONLY main.user_roles
    ADD CONSTRAINT user_roles_pkey PRIMARY KEY (role_id);


--
-- Name: user_roles user_roles_role_name_key; Type: CONSTRAINT; Schema: main; Owner: -
--

ALTER TABLE ONLY main.user_roles
    ADD CONSTRAINT user_roles_role_name_key UNIQUE (role_name);


--
-- Name: users users_email_key; Type: CONSTRAINT; Schema: main; Owner: -
--

ALTER TABLE ONLY main.users
    ADD CONSTRAINT users_email_key UNIQUE (email);


--
-- Name: users users_pkey; Type: CONSTRAINT; Schema: main; Owner: -
--

ALTER TABLE ONLY main.users
    ADD CONSTRAINT users_pkey PRIMARY KEY (user_id);


--
-- Name: files_embedding_idx; Type: INDEX; Schema: main; Owner: -
--

CREATE INDEX files_embedding_idx ON main.files USING ivfflat (embedding main.vector_cosine_ops);


--
-- Name: files fk_files_folder; Type: FK CONSTRAINT; Schema: main; Owner: -
--

ALTER TABLE ONLY main.files
    ADD CONSTRAINT fk_files_folder FOREIGN KEY (folder_id) REFERENCES main.folders(folder_id) ON DELETE SET NULL;


--
-- Name: files fk_files_user; Type: FK CONSTRAINT; Schema: main; Owner: -
--

ALTER TABLE ONLY main.files
    ADD CONSTRAINT fk_files_user FOREIGN KEY (user_id) REFERENCES main.users(user_id) ON DELETE CASCADE;


--
-- Name: folders fk_folders_parent_folder; Type: FK CONSTRAINT; Schema: main; Owner: -
--

ALTER TABLE ONLY main.folders
    ADD CONSTRAINT fk_folders_parent_folder FOREIGN KEY (parent_folder_id) REFERENCES main.folders(folder_id) ON DELETE SET NULL;


--
-- Name: folders fk_folders_user; Type: FK CONSTRAINT; Schema: main; Owner: -
--

ALTER TABLE ONLY main.folders
    ADD CONSTRAINT fk_folders_user FOREIGN KEY (user_id) REFERENCES main.users(user_id) ON DELETE CASCADE;


--
-- Name: user_roles_mapping fk_user_roles_mapping_role; Type: FK CONSTRAINT; Schema: main; Owner: -
--

ALTER TABLE ONLY main.user_roles_mapping
    ADD CONSTRAINT fk_user_roles_mapping_role FOREIGN KEY (role_id) REFERENCES main.user_roles(role_id) ON DELETE CASCADE;


--
-- Name: user_roles_mapping fk_user_roles_mapping_user; Type: FK CONSTRAINT; Schema: main; Owner: -
--

ALTER TABLE ONLY main.user_roles_mapping
    ADD CONSTRAINT fk_user_roles_mapping_user FOREIGN KEY (user_id) REFERENCES main.users(user_id) ON DELETE CASCADE;


--
-- PostgreSQL database dump complete
--

