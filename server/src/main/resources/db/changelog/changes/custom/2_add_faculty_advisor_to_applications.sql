--changeset author:add-faculty-advisor-to-applications
ALTER TABLE applications ADD COLUMN faculty_advisor_id UUID;
ALTER TABLE applications ADD CONSTRAINT fk_applications_faculty_advisor FOREIGN KEY (faculty_advisor_id) REFERENCES users (user_id);
