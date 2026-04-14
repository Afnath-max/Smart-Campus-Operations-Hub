CREATE TABLE resources (
    id UUID PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    type VARCHAR(30) NOT NULL,
    description VARCHAR(1000),
    capacity INTEGER NOT NULL,
    location VARCHAR(160) NOT NULL,
    available_from TIME NOT NULL,
    available_to TIME NOT NULL,
    status VARCHAR(30) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL
);

CREATE INDEX idx_resources_type ON resources (type);
CREATE INDEX idx_resources_status ON resources (status);
CREATE INDEX idx_resources_location ON resources (location);
