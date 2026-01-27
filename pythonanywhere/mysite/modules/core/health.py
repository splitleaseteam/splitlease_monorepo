"""Core health tracking module."""
import threading
from typing import Dict, Any
from datetime import datetime, timedelta

class HealthTracker:
    """Singleton class for tracking application health status."""
    _instance = None
    _lock = threading.Lock()

    def __new__(cls):
        with cls._lock:
            if cls._instance is None:
                cls._instance = super().__new__(cls)
                cls._instance._initialize()
            return cls._instance

    def _initialize(self):
        """Initialize the health tracker."""
        self._status = {
            'status': 'healthy',
            'last_check': datetime.utcnow().isoformat(),
            'services': {},
            'uptime': 0,
            'start_time': datetime.utcnow().isoformat()
        }
        self._lock = threading.Lock()

    def update_service_status(self, service: str, healthy: bool, message: str = None):
        """Update the status of a specific service."""
        with self._lock:
            self._status['services'][service] = {
                'status': 'healthy' if healthy else 'unhealthy',
                'last_check': datetime.utcnow().isoformat(),
                'message': message
            }
            
            # Update overall status
            self._status['status'] = 'healthy'
            for service_status in self._status['services'].values():
                if service_status['status'] != 'healthy':
                    self._status['status'] = 'degraded'
                    break

    def get_status(self) -> Dict[str, Any]:
        """Get the current health status."""
        with self._lock:
            # Update uptime
            start_time = datetime.fromisoformat(self._status['start_time'])
            uptime = datetime.utcnow() - start_time
            self._status['uptime'] = str(uptime)
            self._status['last_check'] = datetime.utcnow().isoformat()
            
            return dict(self._status)

_health_tracker = None

def get_health_tracker() -> HealthTracker:
    """Get the singleton health tracker instance."""
    global _health_tracker
    if _health_tracker is None:
        _health_tracker = HealthTracker()
    return _health_tracker
