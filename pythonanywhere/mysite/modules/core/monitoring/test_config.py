"""Test configuration for endpoint health monitoring."""
from typing import Dict, Any, List, Union

# Base configuration
BASE_URL = "https://splitlease.pythonanywhere.com"

# Test data for each endpoint
ENDPOINT_TESTS = {
    # Doc Parser endpoints
    '/docs/parse': {
        'method': 'POST',
        'data': {
            'pdf_url': 'https://docs.google.com/document/d/12HYa3Q4tYryvS2LF5j8_69IaLKRVavlWjkBzxjNBado/edit'
        },
        'expected_status': [200, 201, 202],
        'service_group': 'Docs Services'
    },

    # House Manual endpoints
    '/housemanual/generate_manual': {
        'method': 'POST',
        'data': {
            "title": "Igor's House Manual",
            "logo": "https://images.crunchbase.com/image/upload/c_pad,f_auto,q_auto:eco,dpr_1/parrsrdzwbkylozc0aqr",
            "checkin": "3:00 PM",
            "address": "123 Cozy Lane, Relaxville, CA 90210",
            "destinationnavigation": "Turn right at the big oak tree",
            "availableparking": "Two spots in the driveway",
            "parkingtips": "Please park in the driveway if possible",
            "recordingdevices": "Recording Devices",
            "firstaid": "First aid kit under bathroom sink",
            "securitysettings": "Alarm code: 1234",
            "firesafety": "Fire extinguisher in kitchen",
            "houserules": "House Rules List",
            "hostrequests": "No smoking indoors",
            "furniture": "Return to original positions",
            "grievances": "Contact host at 555-123-4567",
            "spaceforbelongings": "Closet in bedroom",
            "offlimitareas": "Basement and attic",
            "additionalhouserules": "Quiet hours 10 PM to 7 AM",
            "thingstoknow": "Hot water takes a minute",
            "wifiname": "CozyHouse",
            "wifipassword": "relaxandenjoy2023",
            "entertainment": "Smart TV with Netflix",
            "trash": "Collection on Tuesdays",
            "laundry": "Washer and dryer available",
            "thermostatguide": "Nest in hallway",
            "kitchenguide": "Coffee maker instructions",
            "diningtips": "Menus in drawer",
            "amenitiestips": "Pool hours: 9 AM to 9 PM",
            "thingstodo": "Beach 10 minutes away",
            "checkingout": "11:00 AM",
            "departurechecklist": "Strip beds, Load dishwasher"
        },
        'expected_status': [200, 201, 202],
        'service_group': 'Housemanual Services'
    },

    # Google Drive endpoints
    '/google_drive/status': {
        'method': 'GET',
        'expected_status': [200],
        'service_group': 'Google Drive Services'
    },

    # Health check endpoint
    '/api/health': {
        'method': 'GET',
        'expected_status': [200],
        'service_group': 'Health Services'
    }
}

# Health check configuration
HEALTH_CHECK_CONFIG = {
    'max_retries': 3,
    'retry_delay': 3,  # seconds
    'timeout': 30,     # seconds
    'concurrent_checks': 3  # number of concurrent checks
}

# Service group order for report
SERVICE_GROUP_ORDER = [
    'Health Services',
    'Docs Services',
    'Housemanual Services',
    'Google Drive Services'
]
