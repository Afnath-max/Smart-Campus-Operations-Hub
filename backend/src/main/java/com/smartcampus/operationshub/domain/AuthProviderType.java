package com.smartcampus.operationshub.domain;

public enum AuthProviderType {
    LOCAL,
    GOOGLE,
    BOTH;

    public boolean supportsLocal() {
        return this == LOCAL || this == BOTH;
    }

    public boolean supportsGoogle() {
        return this == GOOGLE || this == BOTH;
    }
}
