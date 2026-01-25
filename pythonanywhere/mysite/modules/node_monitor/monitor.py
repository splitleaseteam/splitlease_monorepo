#!/usr/bin/env python3
"""
Always-on task script for PythonAnywhere to check node heartbeats and send Slack alerts.
This script monitors configured nodes/scripts and sends alerts if heartbeats are missing.

This version is compatible with the Flask app route structure in routes.py.
"""
import os
import sys
import time
import requests
import logging
import traceback
import json
from datetime import datetime, timezone

# Configure logging to write to a file in the same directory as the script
script_dir = os.path.dirname(os.path.abspath(__file__))
log_dir = os.path.join(script_dir, 'logs')
os.makedirs(log_dir, exist_ok=True)
log_file = os.path.join(log_dir, 'node_monitor.log')

# Define paths for configuration and state files
STATE_FILE_PATH = os.path.join(script_dir, 'node_states.json')

logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(levelname)s - %(name)s - %(message)s',
    handlers=[
        logging.FileHandler(log_file),
        logging.StreamHandler()
    ]
)
logger = logging.getLogger(__name__)

# Log startup information now that logger is defined
logger.info(f"Monitor script starting from: {script_dir}")
logger.info(f"State file path: {STATE_FILE_PATH}")

# Add the project root to sys.path
project_root = os.path.abspath(os.path.join(script_dir, '../..'))
if project_root not in sys.path:
    sys.path.insert(0, project_root)
logger.info(f"Added {project_root} to Python path")

# Import custom loggers with fallback
try:
    from modules.logging.error_logger import log_error
    from modules.logging.success_logger import log_success
    logger.info("Successfully imported custom logging modules.")
except ImportError as e:
    logger.warning(f"Failed to import custom logging modules: {str(e)}. Using fallback loggers.")
    def log_error(error_message, webhook_url=None):
        logger.error(error_message)
        if webhook_url:
            try:
                requests.post(webhook_url, json={"text": f"Error: {error_message}"}, timeout=10)
            except Exception as e_post:
                logger.error(f"Fallback: Failed to send error to webhook: {str(e_post)}")

    def log_success(success_message, webhook_url=None):
        logger.info(success_message)
        if webhook_url:
            try:
                requests.post(webhook_url, json={"text": f"Success: {success_message}"}, timeout=10)
            except Exception as e_post:
                logger.error(f"Fallback: Failed to send success to webhook: {str(e_post)}")

# Environment variables - using variables from the main .env file
API_URL_BASE = os.getenv('API_URL', 'https://splitlease.pythonanywhere.com').rstrip('/')
MONITOR_LOOP_INTERVAL = int(os.getenv('HEARTBEAT_CHECK_INTERVAL', '60'))  # Interval for this monitor script's loop

# Slack webhooks - using existing webhooks from main .env
SLACK_ERROR_WEBHOOK = os.getenv('SLACK_ERROR_WEBHOOK') # Generic webhook for errors
SLACK_NODE_ALERTS_WEBHOOK = os.getenv('SLACK_WEBHOOK_URL', os.getenv('SLACK_NODE_ALERTS_WEBHOOK', SLACK_ERROR_WEBHOOK)) # For node alerts

# Optional authentication token for API requests
API_TOKEN = os.getenv('NODE_MONITOR_API_TOKEN', os.getenv('API_TOKEN', '')) # Get from either variable name

logger.info(f"API_URL_BASE: {API_URL_BASE}")
logger.info(f"MONITOR_LOOP_INTERVAL: {MONITOR_LOOP_INTERVAL}s")
if SLACK_ERROR_WEBHOOK: logger.info("SLACK_ERROR_WEBHOOK configured.")
else: logger.warning("SLACK_ERROR_WEBHOOK not configured.")
if SLACK_NODE_ALERTS_WEBHOOK: logger.info("SLACK_NODE_ALERTS_WEBHOOK configured.")
else: logger.warning("SLACK_NODE_ALERTS_WEBHOOK not configured (will use SLACK_ERROR_WEBHOOK if available).")

# --- Helper Functions ---
def load_json_file(filepath, default_data=None):
    """Loads a JSON file. Returns default_data if file not found or error."""
    try:
        with open(filepath, 'r') as f:
            return json.load(f)
    except FileNotFoundError:
        logger.warning(f"File not found: {filepath}. Returning default.")
        return default_data if default_data is not None else {}
    except json.JSONDecodeError:
        logger.error(f"Error decoding JSON from {filepath}. Returning default.")
        return default_data if default_data is not None else {}
    except Exception as e:
        logger.error(f"Failed to load {filepath}: {str(e)}")
        return default_data if default_data is not None else {}

def save_json_file(filepath, data):
    """Saves data to a JSON file."""
    try:
        with open(filepath, 'w') as f:
            json.dump(data, f, indent=4)
        return True
    except Exception as e:
        logger.error(f"Failed to save {filepath}: {str(e)}")
        return False

def parse_iso_datetime(dt_str):
    """Parses an ISO 8601 datetime string to a timezone-aware datetime object (UTC)."""
    if not dt_str:
        return None
    try:
        # Handle 'Z' for UTC and timezone offsets like +00:00
        if dt_str.endswith('Z'):
            dt_str = dt_str[:-1] + '+00:00'
        dt = datetime.fromisoformat(dt_str)
        if dt.tzinfo is None or dt.tzinfo.utcoffset(dt) is None:
             dt = dt.replace(tzinfo=timezone.utc) # Assume UTC if no tzinfo
        return dt.astimezone(timezone.utc)
    except ValueError:
        logger.error(f"Could not parse datetime string: {dt_str}")
        return None

# --- Core Logic ---
def check_configured_nodes():
    """
    Checks the status of the hardcoded 'splitlease6' node.
    Updates node_states.json and logs status changes.
    
    This version is compatible with the Flask app route structure defined in routes.py.
    """
    logger.info("Starting node health check cycle for 'splitlease6'...")
    current_states = load_json_file(STATE_FILE_PATH, {})
    
    # Hardcoded details for the single node 'splitlease6'
    item_id = "splitlease6"
    item_name = "SplitLease Primary Server"
    heartbeat_path = "/heartbeat/node/splitlease6" # This is the path *within* the /monitor blueprint
    max_heartbeat_age_sec = 300  # 5 minutes
    alert_interval_sec = 3600  # 1 hour
    log_prefix = "Node" # It's always a 'Node' now

    something_changed_in_states = False
    now_utc = datetime.now(timezone.utc)

    logger.info(f"Checking {log_prefix} '{item_name}' (ID: {item_id}) at {heartbeat_path}")
    
    # Get current state from state file (or create default)
    item_state = current_states.get(item_id, {
        'status': 'unknown',  # unknown, alive, dead
        'last_heartbeat_utc': None, 
        'last_alert_utc': None
    })
    
    previous_status = item_state['status']
    current_item_status_is_alive = False  # Assume dead until proven alive

    try:
        # Use our Flask app routes to check heartbeat status
        # The endpoints in the Flask app are registered under the '/monitor' blueprint prefix
        # and the heartbeat_path in the config represents the route within the blueprint
        full_url = f"{API_URL_BASE}/monitor{heartbeat_path}"
        
        # Request headers - authentication disabled for now
        headers = {}
        # Authentication disabled
        # if API_TOKEN:
        #     headers['Authorization'] = f"Bearer {API_TOKEN}"
        
        # Make the request to the Flask endpoint
        resp = requests.get(full_url, headers=headers, timeout=20)  # 20s timeout
        resp.raise_for_status()  # Raises error for 4xx/5xx responses
        
        # Process the response
        heartbeat_data = resp.json()
        
        # The '/heartbeat/node/<node_id>' endpoint returns 'last_heartbeat_utc' field
        last_heartbeat_str = heartbeat_data.get('last_heartbeat_utc')
        node_status = heartbeat_data.get('node_status', heartbeat_data.get('status'))
        
        if last_heartbeat_str:
            last_heartbeat_dt = parse_iso_datetime(last_heartbeat_str)
            if last_heartbeat_dt:
                # Update our state with the heartbeat timestamp
                item_state['last_heartbeat_utc'] = last_heartbeat_dt.isoformat()
                
                # Calculate age and determine if it's alive
                age_seconds = (now_utc - last_heartbeat_dt).total_seconds()
                
                # The API already does the age check, but we double-check here
                # to make sure we're applying our own thresholds correctly
                if age_seconds <= max_heartbeat_age_sec:
                    current_item_status_is_alive = True
                    logger.info(f"{log_prefix} '{item_name}' is ALIVE. Last heartbeat: {age_seconds:.0f}s ago.")
                else:
                    logger.warning(f"{log_prefix} '{item_name}' is DEAD. Heartbeat STALE: {age_seconds:.0f}s ago (max {max_heartbeat_age_sec}s).")
            else:
                logger.error(f"Could not parse 'last_heartbeat_utc' for {log_prefix} '{item_name}': {last_heartbeat_str}")
        else:
            # No timestamp in response
            logger.error(f"Heartbeat response for {log_prefix} '{item_name}' missing 'last_heartbeat_utc' field.")
            
        # Use node_status from the API response if available
        if node_status and node_status in ['alive', 'dead']:
            current_item_status_is_alive = (node_status == 'alive')

    except requests.exceptions.RequestException as e:
        logger.error(f"Request error checking {log_prefix} '{item_name}': {str(e)}")
        if hasattr(e, 'response') and e.response:
            try:
                error_details = e.response.json()
                logger.error(f"API response: {error_details}")
            except:
                logger.error(f"API response: {e.response.status_code} {e.response.reason}")
    except json.JSONDecodeError:
        logger.error(f"JSON decode error for {log_prefix} '{item_name}' heartbeat response.")
    except Exception as e:
        logger.error(f"Unexpected error checking {log_prefix} '{item_name}': {str(e)}\n{traceback.format_exc()}")

    # Update status in our state tracking
    item_state['status'] = 'alive' if current_item_status_is_alive else 'dead'

    # Alerting logic - when to send alerts to Slack
    if item_state['status'] != previous_status:
        something_changed_in_states = True
        
        if item_state['status'] == 'dead':
            # Node/script just went offline
            message = f" {log_prefix.upper()} OFFLINE: '{item_name}' (ID: {item_id}). Last heartbeat: {item_state.get('last_heartbeat_utc', 'N/A')}."
            logger.error(message)
            log_error(message)
            item_state['last_alert_utc'] = now_utc.isoformat()
            
        elif item_state['status'] == 'alive' and previous_status == 'dead':
            # Node/script recovered
            message = f" {log_prefix.upper()} RECOVERED: '{item_name}' (ID: {item_id}) is back online."
            logger.info(message)
            log_success(message)  # Using native success logger without webhook parameter
            item_state['last_alert_utc'] = None  # Reset alert time on recovery
            
    elif item_state['status'] == 'dead':
        # Node is still dead, check if we should send a reminder alert
        last_alert_dt_str = item_state.get('last_alert_utc')
        
        if last_alert_dt_str:
            last_alert_dt = parse_iso_datetime(last_alert_dt_str)
            
            if last_alert_dt and (now_utc - last_alert_dt).total_seconds() >= alert_interval_sec:
                # Time to send another alert
                message = f" {log_prefix.upper()} STILL OFFLINE: '{item_name}' (ID: {item_id}). Alerting again."
                logger.error(message)
                log_error(message)  # Using native error logger without webhook parameter
                item_state['last_alert_utc'] = now_utc.isoformat()
                something_changed_in_states = True
        else:
            # Should have an alert time if dead, set it now
            item_state['last_alert_utc'] = now_utc.isoformat()
            something_changed_in_states = True

    # Update the state in our tracking dictionary
    current_states[item_id] = item_state
    
    # Save changes to our state file if anything changed
    if something_changed_in_states:
        if not save_json_file(STATE_FILE_PATH, current_states):
            logger.error("CRITICAL: Failed to save updated node states to disk!")
            
    logger.info("Node health check cycle finished.")

# --- Main Execution ---
if __name__ == '__main__':
    startup_msg = (
        f"Node/Script Monitor started. "
        f"Monitoring hardcoded node 'splitlease6' every {MONITOR_LOOP_INTERVAL} seconds."
        f"\nMonitoring API URL: {API_URL_BASE}"
    )
    logger.info(startup_msg)
    
    # Log startup message using native logging
    logger.info(startup_msg)
    log_success(startup_msg)  # Use our imported success logger from the modules.logging package
    
    # Main monitoring loop
    while True:
        try:
            check_configured_nodes()
        except Exception as e:
            # This catches errors in the main loop/orchestration itself
            error_msg = f"FATAL: Unhandled error in monitor main loop: {str(e)}"
            logger.error(error_msg, exc_info=True)
            # Send to the *monitor's own* error webhook
            log_error(f"{error_msg}\n{traceback.format_exc()}", webhook_url=SLACK_ERROR_WEBHOOK)
            
        logger.debug(f"Sleeping for {MONITOR_LOOP_INTERVAL} seconds...")
        time.sleep(MONITOR_LOOP_INTERVAL)
