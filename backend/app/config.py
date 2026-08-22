from pydantic_settings import BaseSettings, SettingsConfigDict
from pydantic import field_validator

# Secrets that must never be used for real — if .env.example gets copied to
# .env without the placeholder being replaced, the app would sign every
# admin JWT with a value that's sitting in plain sight in this public repo.
# Anyone who has ever seen the repo could then forge a valid admin token
# and get full write access to the store. Refusing to start is deliberate:
# it turns a silent, catastrophic misconfiguration into an error you can't
# miss during setup, instead of a live deployment that's quietly backdoored.
_INSECURE_JWT_SECRETS = {
    "change-this-to-a-long-random-string",
    "secret",
    "changeme",
    "your-secret-key",
}


class Settings(BaseSettings):
    database_url: str
    jwt_secret_key: str
    jwt_algorithm: str = "HS256"
    jwt_expire_minutes: int = 1440

    cloudinary_cloud_name: str
    cloudinary_api_key: str
    cloudinary_api_secret: str

    cors_origins: str = "http://localhost:5173"

    model_config = SettingsConfigDict(env_file=".env", extra="ignore")

    @field_validator("jwt_secret_key")
    @classmethod
    def jwt_secret_must_be_strong(cls, v: str) -> str:
        if v.strip().lower() in _INSECURE_JWT_SECRETS:
            raise ValueError(
                "JWT_SECRET_KEY is still set to the placeholder value from .env.example. "
                "Set it to a long, random, unique string before running the app — "
                "anyone who has seen this value (including in the public repo) could "
                "otherwise forge admin logins. Generate one with: "
                'python -c "import secrets; print(secrets.token_hex(32))"'
            )
        if len(v) < 32:
            raise ValueError(
                "JWT_SECRET_KEY is too short (needs 32+ characters) to be secure. "
                'Generate one with: python -c "import secrets; print(secrets.token_hex(32))"'
            )
        return v

    @property
    def cors_origins_list(self) -> list[str]:
        return [origin.strip() for origin in self.cors_origins.split(",") if origin.strip()]


settings = Settings()
