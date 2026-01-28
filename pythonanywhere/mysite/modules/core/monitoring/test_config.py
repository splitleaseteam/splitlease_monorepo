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

    # Contract Generator endpoints
    '/contract/host_payout': {
        'method': 'POST',
        'data': {
            "Address": "123 Main St",
            "Agreement Number": "AG123",
            "Date1": "2024-01-01",
            "Date2": "2024-02-01",
            "Date3": "2024-03-01",
            "Date4": "2024-04-01",
            "Date5": "2024-05-01",
            "Date6": "2024-06-01",
            "Date7": "2024-07-01",
            "Date8": "2024-08-01",
            "Date9": "2024-09-01",
            "Date10": "2024-10-01",
            "Date11": "2024-11-01",
            "Date12": "2024-12-01",
            "Date13": "2025-01-01",
            "Host Email": "host@example.com",
            "Host Name": "John Doe",
            "Host Phone": "555-1234",
            "Maintenance Fee": "$100",
            "Payout Number": "PN123",
            "Rent1": "$1000",
            "Rent2": "$1000",
            "Rent3": "$1000",
            "Rent4": "$1000",
            "Rent5": "$1000",
            "Rent6": "$1000",
            "Rent7": "$1000",
            "Rent8": "$1000",
            "Rent9": "$1000",
            "Rent10": "$1000",
            "Rent11": "$1000",
            "Rent12": "$1000",
            "Rent13": "$1000",
            "Total1": "$1100",
            "Total2": "$1100",
            "Total3": "$1100",
            "Total4": "$1100",
            "Total5": "$1100",
            "Total6": "$1100",
            "Total7": "$1100",
            "Total8": "$1100",
            "Total9": "$1100",
            "Total10": "$1100",
            "Total11": "$1100",
            "Total12": "$1100",
            "Total13": "$1100",
            "TotalHostPayments": "$14300"
        },
        'expected_status': [200],
        'service_group': 'Contract Services'
    },
    '/contract/periodic_tenancy': {
        'method': 'POST',
        'data': {
              "Agreement Number": "AGR12345",
              "Check in Date": "09/10/24",
              "Check Out Date": "12/10/24",
              "Check In Day": "Monday",
              "Check Out Day": "Wednesday",
              "Number of weeks": 2,
              "Guests Allowed": 4,
              "Host name": "John Doe",
              "Guest name": "Jane Smith",
              "Supplemental Number": "SUP6789",
              "Authorization Card Number": "AUTH9876",
              "Host Payout Schedule Number": "PAY5432",
              "Extra Requests on Cancellation Policy": "Full refund if cancelled 7 days before check-in",
              "Damage Deposit": "$500",
              "Location": "Middle Earth",
              "Type of Space": "Shared Room",
              "House Rules": "No smoking, no pets, quiet hours from 10 PM to 7 AM",
              "Listing Title": "New age Listing",
              "Listing Description": "Enjoy a relaxing stay in our centrally located 2-bedroom apartment, perfect for exploring [City Name]. The space includes two queen-sized beds, a fully equipped kitchen, a cozy living room with a smart TV, and a balcony with city views. You’ll have access to fast WiFi, air conditioning, and on-site parking. Major attractions, restaurants, and public transit are just minutes away, making it easy to explore the best of the city. Ideal for both business and leisure travelers, we look forward to hosting you!",
              "Capacity": "2 Bed Rooms",
              "Amenity In Unit": [
                "Wi-Fi",
                "Air Conditioning",
                "Kitchen",
                "TV",
                "Washer",
                "Dryer"
              ],
              "Amenity Building": [
                "Elevator",
                "Gym",
                "Pool",
                "Parking"
              ],
              "House Rules": [
                "No smoking",
                "No pets",
                "No parties",
                "Quiet hours 10 PM - 7 AM",
                "No shoes inside"
              ],
             "Space Details": "Full"
            },
        'expected_status': [200],
        'service_group': 'Contract Services'
    },
    '/contract/supplemental': {
        'method': 'POST',
        'data': {
              "Agreement Number": "AGR-2024-001",
              "Check in Date": "09/15/24",
              "Check Out Date": "09/29/24",
              "Number of weeks": 2,
              "Guests Allowed": 4,
              "Host Name": "Jane Smith",
              "Supplemental Number": "SUP-2024-001",
              "Location": "Middle Earth",
              "Type of Space": "Shared Room",
              "Listing Title": "New age Listing",
              "Location": "New York City",
              "Listing Description": "Enjoy a relaxing stay in our centrally located 2-bedroom apartment, perfect for exploring [City Name]. The space includes two queen-sized beds, a fully equipped kitchen, a cozy living room with a smart TV, and a balcony with city views. You’ll have access to fast WiFi, air conditioning, and on-site parking. Major attractions, restaurants, and public transit are just minutes away, making it easy to explore the best of the city. Ideal for both business and leisure travelers, we look forward to hosting you!",
              "Space Details": "2 Bed Rooms",
              "image1": "https://www.travelandleisure.com/thmb/_XsBCRprdQriog2hTCkuiT3f7lc=/1500x0/filters:no_upscale():max_bytes(150000):strip_icc()/TAL-airbnb-listing-NEWAIRBNB1123-a67a0e07c4e846e2ae4e653d201e47af.jpg",
              "image2": "https://hospitable.com/wp-content/uploads/2023/06/Airbnb-luxury.jpg",
              "image3": "https://www.androidauthority.com/wp-content/uploads/2021/03/airbnb-example-home-scaled-e1644903817613.jpg"
            },
        'expected_status': [200],
        'service_group': 'Contract Services'
    },
    '/contract/recurring_card_auth_prorated': {  # Prorated version
        'method': 'POST',
        'data': {
            "Agreement Number": "12345",
            "Host Name": "John Doe",
            "Guest Name": "Jane Smith",
            "Weeks Number": "16",
            "Listing Description": "Cozy 2-bedroom apartment in downtown",
            "Number of Payments": "4",
            "Four Week Rent": "2000.00",
            "Damage Deposit": "1000.00",
            "Maintenance Fee": "50.00",
            "Total First Payment": "3050.00",
            "Penultimate Week Number": "15",
            "Total Second Payment": "2050.00",
            "Last Payment Rent": "500.00",
            "Splitlease Credit": "100.00",
            "Last Payment Weeks": 4},
        'expected_status': [200],
        'service_group': 'Contract Services'
    },
    '/contract/recurring_card_auth_nonprorated': {  # Non-prorated version
        'method': 'POST',
        'data': {
            "Agreement Number": "12345",
            "Host Name": "John Doe",
            "Guest Name": "Jane Smith",
            "Weeks Number": "16",
            "Listing Description": "Cozy 2-bedroom apartment in downtown",
            "Number of Payments": "4",
            "Four Week Rent": "2000.00",
            "Damage Deposit": "1000.00",
            "Maintenance Fee": "50.00",
            "Total First Payment": "3050.00",
            "Penultimate Week Number": "15",
            "Total Second Payment": "2050.00",
            "Last Payment Rent": "500.00",
            "Splitlease Credit": "100.00",
            "Last Payment Weeks": 4},
        'expected_status': [200],
        'service_group': 'Contract Services'
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
    'Contract Services',
    'Google Drive Services'
]
