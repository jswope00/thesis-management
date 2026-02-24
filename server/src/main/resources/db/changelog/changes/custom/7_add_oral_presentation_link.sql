--changeset author:add-oral-presentation-link-to-theses
ALTER TABLE theses ADD COLUMN IF NOT EXISTS oral_presentation_link TEXT;
