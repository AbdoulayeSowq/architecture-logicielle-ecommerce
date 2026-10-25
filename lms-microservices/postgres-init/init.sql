CREATE DATABASE user_db;
CREATE DATABASE course_db;
CREATE DATABASE university_db;
CREATE DATABASE announcement_db;
CREATE DATABASE ai_db;
CREATE DATABASE meeting_db;
CREATE DATABASE practice_db;

-- Enable pgvector extension on ai_db
\c ai_db;
CREATE EXTENSION IF NOT EXISTS vector;
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
