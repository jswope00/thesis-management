--changeset author:make-desired-start-date-nullable
ALTER TABLE applications ALTER COLUMN desired_start_date DROP NOT NULL;
