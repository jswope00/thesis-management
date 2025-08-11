--changeset author:add-thesis-research
CREATE TABLE thesis_research (
    research_id UUID PRIMARY KEY,
    thesis_id UUID NOT NULL,
    research_filename TEXT NOT NULL,
    approved_at TIMESTAMP,
    approved_by UUID,
    grade INTEGER CHECK (grade >= 0 AND grade <= 100),
    created_at TIMESTAMP NOT NULL,
    created_by UUID NOT NULL,
    FOREIGN KEY (thesis_id) REFERENCES theses (thesis_id),
    FOREIGN KEY (approved_by) REFERENCES users (user_id),
    FOREIGN KEY (created_by) REFERENCES users (user_id)
);
