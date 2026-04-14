CREATE TABLE users (
    id UUID PRIMARY KEY,
    campus_id VARCHAR(40) NOT NULL UNIQUE,
    email VARCHAR(255) NOT NULL UNIQUE,
    full_name VARCHAR(120) NOT NULL,
    role VARCHAR(20) NOT NULL,
    account_status VARCHAR(20) NOT NULL,
    auth_provider_type VARCHAR(20) NOT NULL,
    google_id VARCHAR(255) UNIQUE,
    password_hash VARCHAR(255),
    profile_image_url VARCHAR(500),
    created_at TIMESTAMP WITH TIME ZONE NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL
);

CREATE TABLE invitations (
    id UUID PRIMARY KEY,
    invitee_email VARCHAR(255) NOT NULL,
    invited_role VARCHAR(20) NOT NULL,
    inviter_user_id UUID NOT NULL,
    invitation_status VARCHAR(20) NOT NULL,
    invite_token VARCHAR(120) NOT NULL UNIQUE,
    expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL
);

CREATE INDEX idx_users_role ON users (role);
CREATE INDEX idx_users_account_status ON users (account_status);
CREATE INDEX idx_users_auth_provider_type ON users (auth_provider_type);
CREATE INDEX idx_invitations_invitee_email ON invitations (invitee_email);
CREATE INDEX idx_invitations_status ON invitations (invitation_status);
