--liquibase formatted sql

--changeset emilius:03-add-incoming-term-1
ALTER TABLE users ADD COLUMN IF NOT EXISTS incoming_term TEXT; 