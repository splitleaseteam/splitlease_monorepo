from flask import Blueprint, request, jsonify, redirect
from .models import db, ShortURL
from datetime import datetime
import logging
import random
import string
import requests
import os
from functools import wraps

url_shortener = Blueprint('url_shortener', __name__)
logger = logging.getLogger(__name__)

# Base URL for shortened URLs
BASE_URL = "https://www.leasesplit.com/"

# Webhook URLs from environment variables
LOG_WEBHOOK_URL = os.environ.get('URL_SHORTENER_LOG_WEBHOOK_URL')
ERROR_WEBHOOK_URL = os.environ.get('URL_SHORTENER_ERROR_WEBHOOK_URL')

def send_webhook(url, message):
    """Safely send webhook notification"""
    try:
        requests.post(url, json={"text": message}, timeout=5)
    except Exception as e:
        logger.error(f"Failed to send webhook: {str(e)}")

@url_shortener.route('/')
def base_redirect():
    """Base route that always redirects to split.lease"""
    return redirect('https://split.lease')

@url_shortener.route('/shorten', methods=['POST'])
def shorten_url():
    try:
        data = request.get_json()

        if not data or 'url' not in data:
            return jsonify({
                'success': False,
                'error': 'No URL provided'
            }), 400

        long_url = data['url']
        existing_url = ShortURL.query.filter_by(long_url=long_url).first()

        if existing_url:
            success_message = f"Returning existing short URL: {existing_url.short_url} for {long_url}"
            logger.info(success_message)
            send_webhook(LOG_WEBHOOK_URL, success_message)
            return jsonify({
                'success': True,
                'short_url': existing_url.short_url,
                'message': 'Existing short URL returned'
            }), 200

        while True:
            short_code = ''.join(random.choice(string.ascii_letters + string.digits)
                               for _ in range(6))
            if not ShortURL.query.filter_by(short_url=BASE_URL + short_code).first():
                break

        short_url = BASE_URL + short_code
        new_short_url = ShortURL(
            long_url=long_url,
            short_url=short_url
        )

        db.session.add(new_short_url)
        db.session.commit()

        success_message = f"Successfully created short URL: {short_url} for {long_url}"
        logger.info(success_message)
        send_webhook(LOG_WEBHOOK_URL, success_message)

        return jsonify({
            'success': True,
            'short_url': short_url,
            'message': 'New short URL created'
        }), 200

    except Exception as e:
        db.session.rollback()
        error_msg = f"Error processing request: {str(e)}"
        logger.error(error_msg)
        send_webhook(ERROR_WEBHOOK_URL, error_msg)
        return jsonify({
            'success': False,
            'error': error_msg
        }), 500

@url_shortener.route('/<short_url>', methods=['GET'])
def redirect_to_long_url(short_url):
    try:
        complete_short_url = BASE_URL + short_url
        short_url_obj = ShortURL.query.filter_by(short_url=complete_short_url).first()

        if short_url_obj:
            short_url_obj.access_count += 1
            short_url_obj.last_accessed = datetime.utcnow()
            db.session.commit()

            success_message = f"Redirecting {short_url} to {short_url_obj.long_url}"
            logger.info(success_message)
            send_webhook(LOG_WEBHOOK_URL, success_message)

            return redirect(short_url_obj.long_url)

        error_message = f"No long URL found for short URL: {short_url}"
        logger.error(error_message)
        send_webhook(ERROR_WEBHOOK_URL, error_message)
        return jsonify({
            'success': False,
            'error': 'Short URL not found'
        }), 404

    except Exception as e:
        db.session.rollback()
        error_msg = f"Error processing redirect: {str(e)}"
        logger.error(error_msg)
        send_webhook(ERROR_WEBHOOK_URL, error_msg)
        return jsonify({
            'success': False,
            'error': error_msg
        }), 500

@url_shortener.route('/update', methods=['PUT'])
def update_url():
    try:
        data = request.get_json()

        if not data or 'short_url' not in data or 'new_url' not in data:
            return jsonify({
                'success': False,
                'error': 'Missing short_url or new_url in request'
            }), 400

        short_url = data['short_url']
        if short_url.startswith(BASE_URL):
            short_url = short_url[len(BASE_URL):]

        complete_short_url = BASE_URL + short_url
        short_url_obj = ShortURL.query.filter_by(short_url=complete_short_url).first()

        if not short_url_obj:
            error_message = f"Failed to update {short_url}"
            logger.error(error_message)
            send_webhook(ERROR_WEBHOOK_URL, error_message)
            return jsonify({
                'success': False,
                'error': 'Short URL not found'
            }), 404

        existing_url = ShortURL.query.filter_by(long_url=data['new_url']).first()
        if existing_url and existing_url.short_url != complete_short_url:
            return jsonify({
                'success': False,
                'error': f'Long URL already has short URL: {existing_url.short_url}'
            }), 400

        short_url_obj.long_url = data['new_url']
        db.session.commit()

        success_message = f"Updated {short_url} to redirect to {data['new_url']}"
        logger.info(success_message)
        send_webhook(LOG_WEBHOOK_URL, success_message)

        return jsonify({
            'success': True,
            'message': 'URL updated successfully',
            'short_url': complete_short_url
        }), 200

    except Exception as e:
        db.session.rollback()
        error_msg = f"Error updating URL: {str(e)}"
        logger.error(error_msg)
        send_webhook(ERROR_WEBHOOK_URL, error_msg)
        return jsonify({
            'success': False,
            'error': error_msg
        }), 500
