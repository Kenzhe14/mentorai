--
-- PostgreSQL database dump
--

-- Dumped from database version 15.12
-- Dumped by pg_dump version 15.12

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

SET default_tablespace = '';

SET default_table_access_method = heap;

--
-- Name: admins; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.admins (
    id bigint NOT NULL,
    created_at timestamp with time zone,
    updated_at timestamp with time zone,
    deleted_at timestamp with time zone,
    username character varying(50) NOT NULL,
    email character varying(100) NOT NULL,
    password character varying(100) NOT NULL,
    role character varying(20) DEFAULT 'admin'::character varying NOT NULL
);


ALTER TABLE public.admins OWNER TO postgres;

--
-- Name: admins_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.admins_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE public.admins_id_seq OWNER TO postgres;

--
-- Name: admins_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.admins_id_seq OWNED BY public.admins.id;


--
-- Name: chat_messages; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.chat_messages (
    id bigint NOT NULL,
    created_at timestamp with time zone,
    updated_at timestamp with time zone,
    deleted_at timestamp with time zone,
    session_id bigint,
    content text NOT NULL,
    sender_id bigint,
    sender_type character varying(20) NOT NULL,
    status character varying(20) DEFAULT 'sent'::character varying NOT NULL,
    "timestamp" timestamp with time zone NOT NULL,
    is_read boolean DEFAULT false NOT NULL
);


ALTER TABLE public.chat_messages OWNER TO postgres;

--
-- Name: chat_messages_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.chat_messages_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE public.chat_messages_id_seq OWNER TO postgres;

--
-- Name: chat_messages_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.chat_messages_id_seq OWNED BY public.chat_messages.id;


--
-- Name: chat_sessions; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.chat_sessions (
    id bigint NOT NULL,
    created_at timestamp with time zone,
    updated_at timestamp with time zone,
    deleted_at timestamp with time zone,
    user_id bigint,
    mentor_id bigint,
    type character varying(20) DEFAULT 'ai'::character varying NOT NULL,
    title character varying(100),
    is_active boolean DEFAULT true NOT NULL,
    last_access timestamp with time zone NOT NULL,
    last_message character varying(255),
    unread_count bigint DEFAULT 0 NOT NULL
);


ALTER TABLE public.chat_sessions OWNER TO postgres;

--
-- Name: chat_sessions_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.chat_sessions_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE public.chat_sessions_id_seq OWNER TO postgres;

--
-- Name: chat_sessions_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.chat_sessions_id_seq OWNED BY public.chat_sessions.id;


--
-- Name: mentors; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.mentors (
    id bigint NOT NULL,
    created_at timestamp with time zone,
    updated_at timestamp with time zone,
    deleted_at timestamp with time zone,
    user_id bigint,
    username character varying(50) NOT NULL,
    name character varying(100) NOT NULL,
    email character varying(100) NOT NULL,
    password character varying(100) NOT NULL,
    skills text[],
    experience character varying(20) NOT NULL,
    rating numeric DEFAULT 0 NOT NULL,
    reviews bigint DEFAULT 0 NOT NULL,
    hourly_rate numeric NOT NULL,
    avatar text,
    available boolean DEFAULT true NOT NULL,
    bio text,
    social_links jsonb,
    specializations text[],
    languages text[] DEFAULT '{English}'::text[],
    timezone text,
    verified boolean DEFAULT false NOT NULL,
    display_name character varying(100),
    avatar_url character varying(255),
    phone character varying(15),
    is_mentor boolean DEFAULT true NOT NULL
);


ALTER TABLE public.mentors OWNER TO postgres;

--
-- Name: mentors_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.mentors_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE public.mentors_id_seq OWNER TO postgres;

--
-- Name: mentors_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.mentors_id_seq OWNED BY public.mentors.id;


--
-- Name: personalized_contents; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.personalized_contents (
    id bigint NOT NULL,
    created_at timestamp with time zone,
    updated_at timestamp with time zone,
    deleted_at timestamp with time zone,
    user_id bigint,
    content_type character varying(50) NOT NULL,
    recommended_topics jsonb,
    content text
);


ALTER TABLE public.personalized_contents OWNER TO postgres;

--
-- Name: personalized_contents_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.personalized_contents_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE public.personalized_contents_id_seq OWNER TO postgres;

--
-- Name: personalized_contents_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.personalized_contents_id_seq OWNED BY public.personalized_contents.id;


--
-- Name: roadmap_steps; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.roadmap_steps (
    id bigint NOT NULL,
    created_at timestamp with time zone,
    updated_at timestamp with time zone,
    deleted_at timestamp with time zone,
    name character varying(100) NOT NULL,
    "order" bigint NOT NULL,
    roadmap_id bigint,
    completed boolean DEFAULT false NOT NULL
);


ALTER TABLE public.roadmap_steps OWNER TO postgres;

--
-- Name: roadmap_steps_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.roadmap_steps_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE public.roadmap_steps_id_seq OWNER TO postgres;

--
-- Name: roadmap_steps_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.roadmap_steps_id_seq OWNED BY public.roadmap_steps.id;


--
-- Name: roadmaps; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.roadmaps (
    id bigint NOT NULL,
    created_at timestamp with time zone,
    updated_at timestamp with time zone,
    deleted_at timestamp with time zone,
    topic character varying(100) NOT NULL,
    user_id bigint
);


ALTER TABLE public.roadmaps OWNER TO postgres;

--
-- Name: roadmaps_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.roadmaps_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE public.roadmaps_id_seq OWNER TO postgres;

--
-- Name: roadmaps_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.roadmaps_id_seq OWNED BY public.roadmaps.id;


--
-- Name: users; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.users (
    id bigint NOT NULL,
    created_at timestamp with time zone,
    updated_at timestamp with time zone,
    deleted_at timestamp with time zone,
    username character varying(50) NOT NULL,
    email character varying(100),
    phone character varying(15),
    password character varying(100) NOT NULL,
    display_name character varying(100),
    avatar_url character varying(255),
    onboarding_data jsonb
);


ALTER TABLE public.users OWNER TO postgres;

--
-- Name: users_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.users_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE public.users_id_seq OWNER TO postgres;

--
-- Name: users_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.users_id_seq OWNED BY public.users.id;


--
-- Name: admins id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.admins ALTER COLUMN id SET DEFAULT nextval('public.admins_id_seq'::regclass);


--
-- Name: chat_messages id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.chat_messages ALTER COLUMN id SET DEFAULT nextval('public.chat_messages_id_seq'::regclass);


--
-- Name: chat_sessions id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.chat_sessions ALTER COLUMN id SET DEFAULT nextval('public.chat_sessions_id_seq'::regclass);


--
-- Name: mentors id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.mentors ALTER COLUMN id SET DEFAULT nextval('public.mentors_id_seq'::regclass);


--
-- Name: personalized_contents id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.personalized_contents ALTER COLUMN id SET DEFAULT nextval('public.personalized_contents_id_seq'::regclass);


--
-- Name: roadmap_steps id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.roadmap_steps ALTER COLUMN id SET DEFAULT nextval('public.roadmap_steps_id_seq'::regclass);


--
-- Name: roadmaps id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.roadmaps ALTER COLUMN id SET DEFAULT nextval('public.roadmaps_id_seq'::regclass);


--
-- Name: users id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.users ALTER COLUMN id SET DEFAULT nextval('public.users_id_seq'::regclass);


--
-- Data for Name: admins; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.admins (id, created_at, updated_at, deleted_at, username, email, password, role) FROM stdin;
\.


--
-- Data for Name: chat_messages; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.chat_messages (id, created_at, updated_at, deleted_at, session_id, content, sender_id, sender_type, status, "timestamp", is_read) FROM stdin;
\.


--
-- Data for Name: chat_sessions; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.chat_sessions (id, created_at, updated_at, deleted_at, user_id, mentor_id, type, title, is_active, last_access, last_message, unread_count) FROM stdin;
\.


--
-- Data for Name: mentors; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.mentors (id, created_at, updated_at, deleted_at, user_id, username, name, email, password, skills, experience, rating, reviews, hourly_rate, avatar, available, bio, social_links, specializations, languages, timezone, verified, display_name, avatar_url, phone, is_mentor) FROM stdin;
\.


--
-- Data for Name: personalized_contents; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.personalized_contents (id, created_at, updated_at, deleted_at, user_id, content_type, recommended_topics, content) FROM stdin;
\.


--
-- Data for Name: roadmap_steps; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.roadmap_steps (id, created_at, updated_at, deleted_at, name, "order", roadmap_id, completed) FROM stdin;
\.


--
-- Data for Name: roadmaps; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.roadmaps (id, created_at, updated_at, deleted_at, topic, user_id) FROM stdin;
\.


--
-- Data for Name: users; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.users (id, created_at, updated_at, deleted_at, username, email, phone, password, display_name, avatar_url, onboarding_data) FROM stdin;
1	2025-05-03 01:22:15.535428+00	2025-05-03 01:26:22.583365+00	\N	ayau	crnari11@gmail.com		$2a$10$KoAuruqEr0/gHlm5OHdnM.lwYK8JFnMBmVisZIX3bI6xaMy5hosny	ayau		{"age": "18-24", "goals": ["Career change"], "completed": true, "interests": ["Cybersecurity", "UI/UX Design", "Game Development"], "experience": "beginner", "learningStyle": "kinesthetic"}
\.


--
-- Name: admins_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.admins_id_seq', 1, false);


--
-- Name: chat_messages_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.chat_messages_id_seq', 1, false);


--
-- Name: chat_sessions_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.chat_sessions_id_seq', 1, false);


--
-- Name: mentors_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.mentors_id_seq', 1, false);


--
-- Name: personalized_contents_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.personalized_contents_id_seq', 1, false);


--
-- Name: roadmap_steps_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.roadmap_steps_id_seq', 1, false);


--
-- Name: roadmaps_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.roadmaps_id_seq', 1, false);


--
-- Name: users_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.users_id_seq', 2, true);


--
-- Name: admins admins_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.admins
    ADD CONSTRAINT admins_pkey PRIMARY KEY (id);


--
-- Name: chat_messages chat_messages_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.chat_messages
    ADD CONSTRAINT chat_messages_pkey PRIMARY KEY (id);


--
-- Name: chat_sessions chat_sessions_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.chat_sessions
    ADD CONSTRAINT chat_sessions_pkey PRIMARY KEY (id);


--
-- Name: mentors mentors_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.mentors
    ADD CONSTRAINT mentors_pkey PRIMARY KEY (id);


--
-- Name: personalized_contents personalized_contents_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.personalized_contents
    ADD CONSTRAINT personalized_contents_pkey PRIMARY KEY (id);


--
-- Name: roadmap_steps roadmap_steps_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.roadmap_steps
    ADD CONSTRAINT roadmap_steps_pkey PRIMARY KEY (id);


--
-- Name: roadmaps roadmaps_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.roadmaps
    ADD CONSTRAINT roadmaps_pkey PRIMARY KEY (id);


--
-- Name: users users_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_pkey PRIMARY KEY (id);


--
-- Name: idx_admins_deleted_at; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_admins_deleted_at ON public.admins USING btree (deleted_at);


--
-- Name: idx_admins_email; Type: INDEX; Schema: public; Owner: postgres
--

CREATE UNIQUE INDEX idx_admins_email ON public.admins USING btree (email);


--
-- Name: idx_admins_username; Type: INDEX; Schema: public; Owner: postgres
--

CREATE UNIQUE INDEX idx_admins_username ON public.admins USING btree (username);


--
-- Name: idx_chat_messages_deleted_at; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_chat_messages_deleted_at ON public.chat_messages USING btree (deleted_at);


--
-- Name: idx_chat_sessions_deleted_at; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_chat_sessions_deleted_at ON public.chat_sessions USING btree (deleted_at);


--
-- Name: idx_mentors_deleted_at; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_mentors_deleted_at ON public.mentors USING btree (deleted_at);


--
-- Name: idx_mentors_email; Type: INDEX; Schema: public; Owner: postgres
--

CREATE UNIQUE INDEX idx_mentors_email ON public.mentors USING btree (email);


--
-- Name: idx_mentors_username; Type: INDEX; Schema: public; Owner: postgres
--

CREATE UNIQUE INDEX idx_mentors_username ON public.mentors USING btree (username);


--
-- Name: idx_personalized_contents_deleted_at; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_personalized_contents_deleted_at ON public.personalized_contents USING btree (deleted_at);


--
-- Name: idx_roadmap_steps_deleted_at; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_roadmap_steps_deleted_at ON public.roadmap_steps USING btree (deleted_at);


--
-- Name: idx_roadmaps_deleted_at; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_roadmaps_deleted_at ON public.roadmaps USING btree (deleted_at);


--
-- Name: idx_users_deleted_at; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_users_deleted_at ON public.users USING btree (deleted_at);


--
-- Name: idx_users_email; Type: INDEX; Schema: public; Owner: postgres
--

CREATE UNIQUE INDEX idx_users_email ON public.users USING btree (email);


--
-- Name: idx_users_phone; Type: INDEX; Schema: public; Owner: postgres
--

CREATE UNIQUE INDEX idx_users_phone ON public.users USING btree (phone);


--
-- Name: idx_users_username; Type: INDEX; Schema: public; Owner: postgres
--

CREATE UNIQUE INDEX idx_users_username ON public.users USING btree (username);


--
-- Name: chat_sessions fk_chat_sessions_mentor; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.chat_sessions
    ADD CONSTRAINT fk_chat_sessions_mentor FOREIGN KEY (mentor_id) REFERENCES public.mentors(id);


--
-- Name: chat_messages fk_chat_sessions_messages; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.chat_messages
    ADD CONSTRAINT fk_chat_sessions_messages FOREIGN KEY (session_id) REFERENCES public.chat_sessions(id);


--
-- Name: chat_sessions fk_chat_sessions_user; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.chat_sessions
    ADD CONSTRAINT fk_chat_sessions_user FOREIGN KEY (user_id) REFERENCES public.users(id);


--
-- Name: personalized_contents fk_personalized_contents_user; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.personalized_contents
    ADD CONSTRAINT fk_personalized_contents_user FOREIGN KEY (user_id) REFERENCES public.users(id);


--
-- Name: roadmap_steps fk_roadmaps_steps; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.roadmap_steps
    ADD CONSTRAINT fk_roadmaps_steps FOREIGN KEY (roadmap_id) REFERENCES public.roadmaps(id);


--
-- Name: roadmaps fk_roadmaps_user; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.roadmaps
    ADD CONSTRAINT fk_roadmaps_user FOREIGN KEY (user_id) REFERENCES public.users(id);


--
-- PostgreSQL database dump complete
--

