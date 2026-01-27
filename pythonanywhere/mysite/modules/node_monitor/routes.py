from flask import Blueprint, request, jsonify, current_app, render_template_string
from datetime import datetime, timedelta, timezone
import os
import json
import logging
from modules.logging.success_logger import log_success
from modules.logging.error_logger import log_error
from modules.node_monitor.models import Node, NodeModel

# Initialize logger
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Create blueprint
bp = Blueprint('node_monitor', __name__)

# Configuration (from environment or defaults)
HEARTBEAT_THRESHOLD = int(os.getenv('HEARTBEAT_THRESHOLD', 300))  # Default: 5 minutes
RE_ALERT_INTERVAL = int(os.getenv('RE_ALERT_INTERVAL', 3600))  # Default: 1 hour
# Try both env var names for backward compatibility
API_TOKEN = os.getenv('NODE_MONITOR_API_TOKEN', os.getenv('API_TOKEN', ''))  # Optional API token for authentication

# This will be set when the blueprint is registered with the app
NodeDB = None
db = None

@bp.record
def record_params(setup_state):
    """Initialize the database model when the blueprint is registered."""
    app = setup_state.app
    global NodeDB, db
    # Get db from app - avoid circular import
    db = setup_state.app.extensions['sqlalchemy'].db
    
    # Initialize the model with the db instance
    NodeDB = NodeModel.create_model(db)
    
    # Ensure the table exists
    with app.app_context():
        db.create_all()
        
    logger.info("Node monitor database model initialized")

@bp.route('/init_db', methods=['GET'])
def init_db():
    """Initialize the database tables. This endpoint can be called to create or recreate tables.
    Warning: Be careful with this in production environments.
    """
    try:
        # Create all tables
        db.create_all()
        
        # Create the test node if it doesn't exist
        node = NodeDB.query.filter_by(node_id='splitlease6').first()
        if not node:
            node = NodeDB(
                node_id='splitlease6',
                name='splitlease6',
                node_type='node',
                hostname='initial_setup',
                status='unknown',
                last_heartbeat=datetime.now(timezone.utc)
            )
            db.session.add(node)
            db.session.commit()
            
        return jsonify({
            'status': 'success',
            'message': 'Database tables created successfully',
            'tables': [table.name for table in db.metadata.tables.values()],
            'test_node_created': True
        }), 200
    except Exception as e:
        error_msg = f"Error initializing database: {str(e)}"
        log_error(error_msg)
        return jsonify({'error': error_msg}), 500

def validate_token(request):
    """Validate API token if configured"""
    if not API_TOKEN:
        return True  # No validation needed if token not configured
        
    auth_header = request.headers.get('Authorization', '')
    if auth_header.startswith('Bearer '):
        token = auth_header[7:]  # Remove 'Bearer ' prefix
        return token == API_TOKEN
    return False

@bp.route('/report_heartbeat/<node_id>', methods=['POST'])
def report_heartbeat(node_id):
    """Receive heartbeat from a node or script and update its status.
    
    Expected JSON payload:
    {
        "hostname": "optional-hostname",
        "timestamp": "2023-01-01T12:00:00Z",  # ISO8601 format (optional)
        "status": "optional-status",
        "message": "optional-message"
    }
    """
    # Authentication disabled for now
    # if API_TOKEN and not validate_token(request):
    #     return jsonify({'error': 'Invalid or missing API token'}), 401
        
    data = request.get_json() or {}
    
    # Get or set timestamp (use current UTC time if not provided)
    timestamp_str = data.get('timestamp')
    if timestamp_str:
        try:
            # Handle 'Z' for UTC
            if timestamp_str.endswith('Z'):
                timestamp_str = timestamp_str[:-1] + '+00:00'
            timestamp = datetime.fromisoformat(timestamp_str)
            if timestamp.tzinfo is None:
                timestamp = timestamp.replace(tzinfo=timezone.utc)
        except ValueError:
            timestamp = datetime.now(timezone.utc)
            logger.warning(f"Could not parse timestamp: {timestamp_str}, using current time")
    else:
        timestamp = datetime.now(timezone.utc)
    
    # Extract other data
    hostname = data.get('hostname', request.remote_addr)
    node_name = data.get('name', node_id)  # Use node_id as fallback for name
    node_type = data.get('node_type', 'node')  # Default to 'node' if not specified
    status = data.get('status', 'alive')  # Default to 'alive' for heartbeats
    message = data.get('message', '')
    
    try:
        # Look up the node by node_id
        node = NodeDB.query.filter_by(node_id=node_id).first()
        
        if not node:
            # Create new node record
            node = NodeDB(
                node_id=node_id,
                name=node_name,
                node_type=node_type,
                hostname=hostname,
                ip_address=request.remote_addr,
                status=status,
                last_heartbeat=timestamp
            )
            
            if message:
                node.additional_data = json.dumps({'message': message})
                
            db.session.add(node)
            log_success(f"New {node_type} registered: {node_name} (ID: {node_id})")
        else:
            # Update existing node
            node.last_heartbeat = timestamp
            node.hostname = hostname
            node.status = status
            node.ip_address = request.remote_addr
            
            # Store message in additional_data if provided
            if message:
                try:
                    additional_data = json.loads(node.additional_data or '{}')
                    additional_data['last_message'] = message
                    additional_data['last_message_time'] = datetime.now(timezone.utc).isoformat()
                    node.additional_data = json.dumps(additional_data)
                except json.JSONDecodeError:
                    # If existing data is corrupt, start fresh
                    node.additional_data = json.dumps({
                        'last_message': message,
                        'last_message_time': datetime.now(timezone.utc).isoformat()
                    })
                
            # Reset alert time if node was previously dead and is now reporting
            if node.status == 'dead':
                node.last_alert_time = None
        
        # Commit changes
        db.session.commit()
        
        log_success(f"Heartbeat received from {node_type} '{node_name}' (ID: {node_id}) at {timestamp.isoformat()}")
        
        return jsonify({
            'status': 'success', 
            'message': f"Heartbeat recorded for {node_id}",
            'timestamp': timestamp.isoformat(),
            'received_at': datetime.now(timezone.utc).isoformat()
        }), 200
        
    except Exception as e:
        error_msg = f"Error processing heartbeat for {node_id}: {str(e)}"
        log_error(error_msg)
        return jsonify({'error': error_msg}), 500

@bp.route('/heartbeat/node/<node_id>', methods=['GET'])
@bp.route('/heartbeat/script/<node_id>', methods=['GET'])
def get_heartbeat(node_id):
    """Get the heartbeat status for a specific node or script.
    Used by the monitor script to check heartbeat status.
    """
    try:
        node = NodeDB.query.filter_by(node_id=node_id).first()
        
        if not node:
            return jsonify({
                'status': 'not_found',
                'message': f"No heartbeat data found for {node_id}",
                'last_heartbeat_utc': None
            }), 404
        
        # Get current heartbeat status
        now = datetime.now(timezone.utc)
        threshold = now - timedelta(seconds=HEARTBEAT_THRESHOLD)
        
        # Convert naive datetime to aware datetime if needed
        last_heartbeat = node.last_heartbeat
        if last_heartbeat and last_heartbeat.tzinfo is None:
            # If the database datetime is naive (no timezone), assume it's UTC
            last_heartbeat = last_heartbeat.replace(tzinfo=timezone.utc)
            
        is_alive = last_heartbeat >= threshold if last_heartbeat else False
        status = 'alive' if is_alive else 'dead'
        
        # Update status in the database if it has changed
        if node.status != status:
            node.status = status
            db.session.commit()
        
        return jsonify({
            'status': 'success',
            'node_status': status,
            'last_heartbeat_utc': node.last_heartbeat.isoformat() if node.last_heartbeat else None,
            'node_type': node.node_type,
            'node_name': node.name
        }), 200
        
    except Exception as e:
        error_msg = f"Error retrieving heartbeat for {node_id}: {str(e)}"
        log_error(error_msg)
        return jsonify({
            'status': 'error',
            'message': error_msg,
            'last_heartbeat_utc': None
        }), 500

@bp.route('/status', methods=['GET'])
def status():
    """Return status of all nodes and scripts, marking any overdue heartbeats.
    Used by the monitor script to get an overview of all monitored items.
    """
    try:
        # Calculate threshold for alive/dead status
        now = datetime.now(timezone.utc)
        threshold = now - timedelta(seconds=HEARTBEAT_THRESHOLD)
        
        # Get all nodes from the database
        nodes = NodeDB.query.all()
        result = []
        
        alive_count = 0
        dead_count = 0
        
        for node in nodes:
            # Determine if the node is alive based on threshold
            is_alive = node.last_heartbeat >= threshold if node.last_heartbeat else False
            status = 'alive' if is_alive else 'dead'
            
            # Update status in database if needed
            if node.status != status:
                node.status = status
                db.session.commit()
            
            # Count alive/dead nodes
            if status == 'alive':
                alive_count += 1
            else:
                dead_count += 1
            
            # Build response
            result.append({
                'id': node.id,
                'node_id': node.node_id,
                'name': node.name,
                'type': node.node_type,
                'last_heartbeat': node.last_heartbeat.isoformat() if node.last_heartbeat else None,
                'status': status,
                'hostname': node.hostname,
                'ip_address': node.ip_address
            })

        return jsonify({
            'status': 'success',
            'alive_count': alive_count,
            'dead_count': dead_count,
            'total_count': len(result),
            'nodes': result
        }), 200
        
    except Exception as e:
        error_msg = f"Error retrieving node status: {str(e)}"
        log_error(error_msg)
        return jsonify({'error': error_msg}), 500

@bp.route('/admin', methods=['GET'])
def admin_dashboard():
    """Simple admin dashboard to view monitored nodes and scripts."""
    try:
        # Get all nodes from the database
        nodes = NodeDB.query.all()
        node_list = []
        
        now = datetime.now(timezone.utc)
        threshold = now - timedelta(seconds=HEARTBEAT_THRESHOLD)
        
        for node in nodes:
            # Determine status and age
            is_alive = node.last_heartbeat >= threshold if node.last_heartbeat else False
            status = 'alive' if is_alive else 'dead'
            
            # Calculate age description
            age_seconds = 0
            age_display = 'Never'
            
            if node.last_heartbeat:
                age_seconds = (now - node.last_heartbeat).total_seconds()
                age_display = f"{age_seconds:.1f} seconds ago"
                
                if age_seconds > 60:
                    age_display = f"{age_seconds/60:.1f} minutes ago"
                if age_seconds > 3600:
                    age_display = f"{age_seconds/3600:.1f} hours ago"
                if age_seconds > 86400:
                    age_display = f"{age_seconds/86400:.1f} days ago"
            
            # Add to result list
            node_list.append({
                'id': node.id,
                'node_id': node.node_id,
                'name': node.name,
                'type': node.node_type,
                'status': status,
                'status_class': 'success' if status == 'alive' else 'danger',
                'last_heartbeat': node.last_heartbeat.strftime('%Y-%m-%d %H:%M:%S UTC') if node.last_heartbeat else 'Never',
                'age': age_display,
                'age_seconds': int(age_seconds),
                'hostname': node.hostname or 'Unknown',
                'ip': node.ip_address or 'Unknown'
            })
        
        # Sort by status (dead first) then by age
        node_list.sort(key=lambda x: (0 if x['status'] == 'dead' else 1, x['age_seconds']))
        
        # Simple HTML template for the dashboard
        html_template = """<!DOCTYPE html>
<html>
<head>
    <title>Node Monitor Dashboard</title>
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <link href="https://cdn.jsdelivr.net/npm/bootstrap@5.2.3/dist/css/bootstrap.min.css" rel="stylesheet">
    <style>
        .table-responsive { margin-top: 20px; }
        .status-badge { width: 80px; text-align: center; }
        .refresh-btn { margin-bottom: 10px; }
        .dead-row { background-color: rgba(255, 0, 0, 0.05); }
    </style>
</head>
<body>
    <div class="container mt-4">
        <h1 class="mb-4">Node Monitor Dashboard</h1>
        
        <div class="d-flex justify-content-between align-items-center">
            <div>
                <span class="badge bg-success me-2">{{ alive_count }} Alive</span>
                <span class="badge bg-danger me-2">{{ dead_count }} Dead</span>
                <span class="badge bg-secondary">{{ total_count }} Total</span>
            </div>
            <button class="btn btn-primary btn-sm refresh-btn" onclick="window.location.reload()">Refresh</button>
        </div>
        
        <div class="table-responsive">
            <table class="table table-striped table-bordered">
                <thead class="table-dark">
                    <tr>
                        <th>Name</th>
                        <th>Type</th>
                        <th>Status</th>
                        <th>Last Heartbeat</th>
                        <th>Hostname</th>
                        <th>IP Address</th>
                    </tr>
                </thead>
                <tbody>
                    {% for node in nodes %}
                    <tr class="{% if node.status == 'dead' %}dead-row{% endif %}">
                        <td>{{ node.name }} <small class="text-muted">({{ node.node_id }})</small></td>
                        <td>{{ node.type }}</td>
                        <td><span class="badge bg-{{ node.status_class }} status-badge">{{ node.status }}</span></td>
                        <td>{{ node.last_heartbeat }}<br><small class="text-muted">{{ node.age }}</small></td>
                        <td>{{ node.hostname }}</td>
                        <td>{{ node.ip }}</td>
                    </tr>
                    {% endfor %}
                </tbody>
            </table>
        </div>
    </div>
</body>
</html>
"""
        
        # Count stats
        alive_count = sum(1 for node in node_list if node['status'] == 'alive')
        dead_count = len(node_list) - alive_count
        
        # Render HTML template with node data
        return render_template_string(
            html_template, 
            nodes=node_list,
            alive_count=alive_count,
            dead_count=dead_count,
            total_count=len(node_list)
        )
        
    except Exception as e:
        error_msg = f"Error generating admin dashboard: {str(e)}"
        log_error(error_msg)
        return f"<h1>Error</h1><p>{error_msg}</p>", 500
