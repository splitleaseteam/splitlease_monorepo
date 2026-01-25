from datetime import datetime, timezone
from flask_sqlalchemy import SQLAlchemy

# This will be initialized in routes.py
db = None

class Node:
    """
    Plain Python class representing a monitoring node or script heartbeat.
    This is used for data transfer when not operating within the SQLAlchemy context.
    """
    
    def __init__(self, node_id, name=None, node_type='node', last_heartbeat=None, status='unknown'):
        self.id = None  # Database ID if saved
        self.node_id = node_id  # Unique identifier for the node/script
        self.name = name or node_id  # Display name
        self.node_type = node_type  # 'node' or 'script'
        self.last_heartbeat = last_heartbeat or datetime.now(timezone.utc)
        self.status = status  # 'alive', 'dead', or 'unknown'
    
    def __repr__(self):
        return f"<{self.node_type.capitalize()} {self.name} ({self.node_id}) status={self.status} last_heartbeat={self.last_heartbeat.isoformat()}>"

# This class will be used when db is initialized
class NodeModel:
    @staticmethod
    def create_model(db_instance):
        global db
        db = db_instance
        
        class NodeDB(db.Model):
            """
            Database model representing a monitoring node or script and its heartbeat information.
            """
            __tablename__ = 'nodes'
            id = db.Column(db.Integer, primary_key=True)
            node_id = db.Column(db.String(64), unique=True, nullable=False, index=True)  # Unique ID for the node/script
            name = db.Column(db.String(128), nullable=False)  # Display name
            node_type = db.Column(db.String(16), default='node', nullable=False)  # 'node' or 'script'
            last_heartbeat = db.Column(db.DateTime, default=datetime.utcnow, nullable=False)
            last_alert_time = db.Column(db.DateTime, nullable=True)  # When we last sent an alert
            status = db.Column(db.String(16), default='unknown', nullable=False)  # 'alive', 'dead', 'unknown'
            hostname = db.Column(db.String(128), nullable=True)  # Host machine name
            ip_address = db.Column(db.String(45), nullable=True)  # IP address of the reporting node
            additional_data = db.Column(db.Text, nullable=True)  # JSON string for additional data
            created_at = db.Column(db.DateTime, default=datetime.utcnow, nullable=False)
            updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)

            def __repr__(self):
                return f"<{self.node_type.capitalize()} {self.name} ({self.node_id}) status={self.status} last_heartbeat={self.last_heartbeat.isoformat()}>"
                
            @classmethod
            def from_node(cls, node):
                """Convert a Node object to a NodeDB object"""
                return cls(
                    node_id=node.node_id, 
                    name=node.name, 
                    node_type=node.node_type,
                    last_heartbeat=node.last_heartbeat,
                    status=node.status
                )
                
            def to_dict(self):
                """Convert NodeDB object to dictionary for JSON serialization"""
                return {
                    'id': self.id,
                    'node_id': self.node_id,
                    'name': self.name,
                    'node_type': self.node_type,
                    'last_heartbeat_utc': self.last_heartbeat.isoformat() if self.last_heartbeat else None,
                    'status': self.status,
                    'hostname': self.hostname,
                    'ip_address': self.ip_address,
                    'created_at': self.created_at.isoformat() if self.created_at else None,
                    'updated_at': self.updated_at.isoformat() if self.updated_at else None,
                }
                
        return NodeDB
