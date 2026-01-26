from flask_sqlalchemy import SQLAlchemy
from datetime import datetime

db = SQLAlchemy()

class ShortURL(db.Model):
    """Model for storing shortened URLs"""
    __tablename__ = 'urls'
    
    id = db.Column(db.Integer, primary_key=True)
    long_url = db.Column(db.String(2048), unique=True, nullable=False)
    short_url = db.Column(db.String(10), unique=True, nullable=False)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    last_accessed = db.Column(db.DateTime)
    access_count = db.Column(db.Integer, default=0)
    
    def to_dict(self):
        """Convert URL to dictionary"""
        return {
            'id': self.id,
            'long_url': self.long_url,
            'short_url': self.short_url,
            'created_at': self.created_at.isoformat(),
            'last_accessed': self.last_accessed.isoformat() if self.last_accessed else None,
            'access_count': self.access_count
        }
