# URL Shortener Module

A Flask-based URL shortening service with database persistence and access tracking.

## Components

### Models (`models.py`)
Database model for shortened URLs with:
- Short code generation
- Long URL storage
- Access tracking
- Creation timestamp
- Last access timestamp

### Shortener (`shortener.py`)
Core URL shortening functionality:
- URL shortening
- URL retrieval
- Access counting
- URL updating

## Usage

```python
from modules.url_shortener.url_shortener import create_short_url, get_long_url

# Create a short URL
short_code = create_short_url("https://example.com/very/long/url")

# Retrieve the original URL
long_url = get_long_url(short_code)
```

## Database Schema

```sql
CREATE TABLE short_urls (
    id INTEGER PRIMARY KEY,
    short_code VARCHAR(10) UNIQUE NOT NULL,
    long_url VARCHAR(2048) NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    last_accessed DATETIME,
    access_count INTEGER DEFAULT 0
);
```

## Features
- Unique short code generation
- Access tracking
- URL validation
- Error handling
- Rate limiting support

## Configuration
- Short code length: 6 characters by default
- Valid characters: a-z, A-Z, 0-9
- Maximum URL length: 2048 characters

## Dependencies
- flask_sqlalchemy
- datetime (Python standard library)
