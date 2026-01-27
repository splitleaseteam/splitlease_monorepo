from flask import Flask, Blueprint, jsonify
from typing import Dict, Optional, List
import importlib
import logging
from .health import module_health, get_health_tracker

class ResilientApp(Flask):
    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)
        self.failed_modules: Dict[str, Exception] = {}
        self.blueprint_status: Dict[str, bool] = {}
        
        # Configure logging
        logging.basicConfig(level=logging.INFO)
        self.logger = logging.getLogger(__name__)

    def health_check(self):
        """Perform health check of the application"""
        try:
            # Get health tracker
            health_tracker = get_health_tracker()
            
            # Get module health status
            health_status = module_health()
            
            # Check blueprint status
            blueprints_health = {
                name: {'registered': status, 'error': str(self.failed_modules.get(name))} 
                for name, status in self.blueprint_status.items()
            }
            
            response = {
                'status': 'healthy' if health_status['overall_health'] else 'unhealthy',
                'modules': health_status['modules'],
                'blueprints': blueprints_health,
                'failed_modules': {
                    name: str(error) for name, error in self.failed_modules.items()
                }
            }
            
            status_code = 200 if health_status['overall_health'] else 500
            return jsonify(response), status_code
            
        except Exception as e:
            self.logger.error(f"Health check failed: {str(e)}")
            return jsonify({
                'status': 'error',
                'error': str(e)
            }), 500
    
    def register_blueprint_safely(self, 
                                import_path: str, 
                                url_prefix: str,
                                dependencies: Optional[List[str]] = None) -> bool:
        """Register blueprint with fallback and dependency checking"""
        try:
            # Check dependencies first
            if dependencies:
                for dep in dependencies:
                    if not self.blueprint_status.get(dep, False):
                        raise Exception(f"Required dependency {dep} is not available")
            
            # Import the blueprint dynamically
            module_path, blueprint_name = import_path.rsplit('.', 1)
            module = importlib.import_module(module_path)
            blueprint = getattr(module, blueprint_name)
            
            # Register the blueprint
            super().register_blueprint(blueprint, url_prefix=url_prefix)
            self.blueprint_status[import_path] = True
            self.logger.info(f"Successfully registered blueprint: {import_path}")
            return True
            
        except Exception as e:
            self.failed_modules[import_path] = e
            self.blueprint_status[import_path] = False
            self.logger.error(f"Failed to register blueprint {import_path}: {str(e)}")
            self.logger.exception(e)
            
            # Register fallback routes
            self._register_fallback_routes(url_prefix, str(e))
            return False
    
    def _register_fallback_routes(self, url_prefix: str, error_msg: str) -> None:
        """Register fallback routes for failed blueprint"""
        @self.route(f"{url_prefix}/<path:path>", methods=['GET', 'POST', 'PUT', 'DELETE'])
        def handle_failed_module(path):
            return jsonify({
                'error': 'Module unavailable',
                'message': error_msg,
                'path': f"{url_prefix}/{path}"
            }), 503
