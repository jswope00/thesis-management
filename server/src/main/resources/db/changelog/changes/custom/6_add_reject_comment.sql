--changeset author:add-reject-comment-to-applications
ALTER TABLE applications ADD COLUMN IF NOT EXISTS reject_comment TEXT;
