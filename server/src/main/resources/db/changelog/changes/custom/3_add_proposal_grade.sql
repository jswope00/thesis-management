--changeset author:add-proposal-grade
ALTER TABLE thesis_proposals ADD COLUMN grade INTEGER CHECK (grade >= 0 AND grade <= 100);
