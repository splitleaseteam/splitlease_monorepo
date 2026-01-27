from flask import Blueprint, jsonify, current_app
from functools import wraps
import logging
import traceback
from datetime import datetime

logger = logging.getLogger(__name__)

class ResilientBlueprint(Blueprint):
    """A Flask Blueprint that handles errors gracefully and prevents them from affecting other endpoints"""
    
    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)
        self.error_handlers = {}
        self.before_request_funcs = {}
        self.after_request_funcs = {}

    def endpoint_wrapper(self, f):
        """Wrapper for endpoints to catch and handle errors"""
        @wraps(f)
        async def wrapped(*args, **kwargs):
            try:
                # If the function is async
                if hasattr(f, '__awaitable__'):
                    return await f(*args, **kwargs)
                # If the function is sync
                return f(*args, **kwargs)
            except Exception as e:
                logger.error(f"Error in endpoint {f.__name__}: {str(e)}")
                logger.error(traceback.format_exc())
                
                error_response = {
                    'status': 'error',
                    'error': str(e),
                    'endpoint': f.__name__,
                    'timestamp': str(datetime.now())
                }
                
                # Add debug information in development
                if current_app.debug:
                    error_response['traceback'] = traceback.format_exc()
                
                return jsonify(error_response), 500
        return wrapped

    def route(self, rule, **options):
        """Override route decorator to add error handling"""
        def decorator(f):
            endpoint = options.pop('endpoint', f.__name__)
            # Wrap the function with our error handler
            wrapped = self.endpoint_wrapper(f)
            self.add_url_rule(rule, endpoint, wrapped, **options)
            return wrapped
        return decorator

def create_resilient_blueprint(name, import_name, **kwargs):
    """Factory function to create a new ResilientBlueprint"""
    return ResilientBlueprint(name, import_name, **kwargs)

def convert_to_resilient(blueprint):
    """Convert an existing blueprint to a resilient one"""
    if isinstance(blueprint, ResilientBlueprint):
        return blueprint
        
    # Create a new resilient blueprint
    resilient_bp = ResilientBlueprint(blueprint.name, blueprint.import_name)
    
    # Copy over all the registered view functions and their options
    for deferred in blueprint.deferred_functions:
        resilient_bp.deferred_functions.append(deferred)
    
    # Copy over URL rules
    for rule in blueprint.url_map._rules:
        if rule.endpoint.startswith(blueprint.name + '.'):
            view_func = blueprint.view_functions[rule.endpoint]
            # Wrap the view function with error handling
            wrapped = resilient_bp.endpoint_wrapper(view_func)
            resilient_bp.add_url_rule(
                rule.rule,
                endpoint=rule.endpoint[len(blueprint.name + '.'):],
                view_func=wrapped,
                methods=rule.methods
            )
    
    return resilient_bp
