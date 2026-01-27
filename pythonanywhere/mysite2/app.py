from flask import Flask
from flask_sqlalchemy import SQLAlchemy
from flask_session import Session
import os
import logging
import tempfile

# Import QR Code Generator Dependancies
from modules.qr_generator.routes import qr_generator

# Import URL Shortener Dependancies
from modules.url_shortener.models import db as url_db
from modules.url_shortener.routes import url_shortener

# Imports Log Forwarders to Slack for Logs Channel and Errors into noisybubble
from modules.logging.error_logger import log_error
from modules.logging.success_logger import log_success

from modules.core.monitoring import monitoring

# Initialize logger
logger = logging.getLogger(__name__)
logger.setLevel(logging.DEBUG)

# Configure logging
handler = logging.StreamHandler()
handler.setLevel(logging.DEBUG)
formatter = logging.Formatter('%(asctime)s - %(name)s - %(levelname)s - %(message)s')
handler.setFormatter(formatter)
logger.addHandler(handler)

# Initialize SQLAlchemy
db = SQLAlchemy()

def create_app():
    """Create and configure the Flask application"""
    try:
        logger.info("Creating Flask app...")
        app = Flask(__name__)

        # Configure session handling for PythonAnywhere
        app.config.update(
            SECRET_KEY='123456',  # Use a static secret key
            SESSION_TYPE='filesystem',
            SESSION_FILE_DIR=tempfile.gettempdir(),
            SESSION_PERMANENT=False,
            PERMANENT_SESSION_LIFETIME=1800
        )
        Session(app)

        # Configure SQLAlchemy
        app.config['SQLALCHEMY_DATABASE_URI'] = os.getenv('DATABASE_URL', 'sqlite:///splitlease.db')
        app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False

        # Initialize extensions
        db.init_app(app)
        url_db.init_app(app)  # Initialize URL shortener database

        # Register blueprints
        logger.info("Registering blueprints...")
        app.register_blueprint(qr_generator, url_prefix='/qr')
        app.register_blueprint(url_shortener)
        app.register_blueprint(monitoring)

        # Create database tables
        with app.app_context():
            logger.info("Creating database tables...")
            db.create_all()
            url_db.create_all()  # Create URL shortener tables

        logger.info("Flask app created successfully")
        return app

    except Exception as e:
        logger.error(f"Error creating Flask app: {str(e)}", exc_info=True)
        raise


if __name__ == '__main__':
    app = create_app()
    app.run(debug=True)
