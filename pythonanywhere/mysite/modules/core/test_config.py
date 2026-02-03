"""Test configuration for endpoint health monitoring."""

# Test data for each endpoint
ENDPOINT_TESTS = {
    # Doc Parser endpoints
    '/docs/parse': {
        'method': 'POST',
        'data': {
            'pdf_url': 'https://docs.google.com/document/d/12HYa3Q4tYryvS2LF5j8_69IaLKRVavlWjkBzxjNBado/edit'
        },
        'expected_status': [200, 201, 202]
    },

    # House Manual endpoints
    '/housemanual/generate_manual': {
        'method': 'POST',
        'data': {
            "title": "Igor's House Manual",
            "logo": "https://images.crunchbase.com/image/upload/c_pad,f_auto,q_auto:eco,dpr_1/parrsrdzwbkylozc0aqr",
            "checkin": "3:00 PM",
            "address": "123 Cozy Lane, Relaxville, CA 90210",
            "destinationnavigation": "Turn right at the big oak tree, then left at the red mailbox.",
            "availableparking": "Two spots in the driveway, street parking also available",
            "parkingtips": "Please park in the driveway if possible",
            "recordingdevices": "Recording Devices",
            "firstaid": "First aid kit is located under the bathroom sink",
            "securitysettings": "Alarm code: 1234, Remember to arm when leaving",
            "firesafety": "Fire extinguisher is in the kitchen next to the fridge",
            "houserules": "House Rules List",
            "hostrequests": "Please remove shoes when entering, No smoking indoors",
            "furniture": "Feel free to rearrange, but please return to original positions before leaving",
            "grievances": "Contact host at 555-123-4567 for any issues",
            "spaceforbelongings": "Feel free to use the closet in your bedroom",
            "offlimitareas": "Please do not enter the basement or attic",
            "additionalhouserules": "Quiet hours from 10 PM to 7 AM, No parties",
            "thingstoknow": "The hot water takes a minute to warm up",
            "wifiname": "CozyHouse",
            "wifipassword": "relaxandenjoy2023",
            "entertainment": "Smart TV in living room, Netflix and Hulu accounts available",
            "trash": "Bins are in the garage, collection is on Tuesday mornings",
            "laundry": "Washer and dryer available in the laundry room, detergent provided",
            "thermostatguide": "Nest thermostat in hallway, feel free to adjust between 68-75°F",
            "kitchenguide": "Coffee maker instructions on fridge, dishwasher safe to use",
            "diningtips": "Local restaurant menus in the drawer next to the fridge",
            "amenitiestips": "Pool hours: 9 AM to 9 PM, Gym access code: 5678",
            "thingstodo": "Beach is 10 minutes away, local attractions guide on coffee table",
            "checkingout": "Check-out time is 11:00 AM",
            "departurechecklist": "1. Strip beds, 2. Load dishwasher, 3. Turn off lights, 4. Lock doors"
        },
        'expected_status': [200, 201, 202]
    },

    # Google Drive endpoints
    '/google_drive/status': {
        'method': 'GET',
        'expected_status': [200, 202, 204]
    },

    # Nights Processor endpoints
    '/nights/get_nights_data': {
        'method': 'GET',
        'expected_status': [200, 201]
    },

    # Health check endpoint
    '/health': {
        'method': 'GET',
        'expected_status': [200]
    }
}

# Health check configuration
HEALTH_CHECK_CONFIG = {
    'max_retries': 3,
    'retry_delay': 3,  # seconds
    'timeout': 30,     # seconds
    'concurrent_checks': 3  # number of concurrent checks
}

