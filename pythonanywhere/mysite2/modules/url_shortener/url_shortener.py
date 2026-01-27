import sqlite3
import string
import random
import logging
import os
from typing import Optional, Dict, Any
from datetime import datetime

class URLShortener:
    def __init__(self, base_dir: str):
        self.base_dir = base_dir
        self.db_dir = os.path.expanduser('~/mysite2')
        self.log_dir = os.path.expanduser('~/mysite2')

        # Ensure directories exist
        os.makedirs(self.db_dir, exist_ok=True)
        os.makedirs(self.log_dir, exist_ok=True)

        # Configure logging
        self.logger = logging.getLogger(__name__)
        self.logger.setLevel(logging.DEBUG)

        log_file = os.path.join(self.log_dir, 'url_shortener.log')
        file_handler = logging.FileHandler(log_file)
        file_handler.setLevel(logging.DEBUG)
        formatter = logging.Formatter('%(asctime)s - %(name)s - %(levelname)s - %(message)s')
        file_handler.setFormatter(formatter)
        self.logger.addHandler(file_handler)

        # Initialize database
        self.init_db()

    @property
    def db_path(self) -> str:
        return os.path.join(self.db_dir, 'url_shortener.db')

    def get_db_connection(self) -> sqlite3.Connection:
        try:
            conn = sqlite3.connect(self.db_path)
            conn.row_factory = sqlite3.Row
            return conn
        except sqlite3.Error as e:
            self.logger.error(f"Database connection error: {str(e)}")
            raise

    def init_db(self) -> None:
        conn = self.get_db_connection()
        try:
            cursor = conn.cursor()
            cursor.execute('''
                CREATE TABLE IF NOT EXISTS urls (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    long_url TEXT UNIQUE,
                    short_url TEXT UNIQUE,
                    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
                )
            ''')
            conn.commit()
        except sqlite3.Error as e:
            self.logger.error(f"Error creating table: {str(e)}")
            raise
        finally:
            conn.close()

    def generate_short_url(self) -> str:
        characters = string.ascii_letters + string.digits
        return ''.join(random.choice(characters) for _ in range(6))

    def check_existing_long_url(self, long_url: str) -> Optional[Dict[str, str]]:
        conn = self.get_db_connection()
        try:
            result = conn.execute('SELECT short_url FROM urls WHERE long_url = ?',
                                (long_url,)).fetchone()
            return {'short_url': result['short_url']} if result else None
        finally:
            conn.close()

    def check_short_url_uniqueness(self, short_url: str) -> bool:
        conn = self.get_db_connection()
        try:
            result = conn.execute('SELECT id FROM urls WHERE short_url = ?',
                                (short_url,)).fetchone()
            return result is None
        finally:
            conn.close()

    def create_short_url(self, long_url: str) -> Dict[str, Any]:
        try:
            existing_url = self.check_existing_long_url(long_url)
            if existing_url:
                return {
                    'success': True,
                    'short_url': existing_url['short_url'],
                    'message': 'Existing short URL returned'
                }

            while True:
                short_url = self.generate_short_url()
                if self.check_short_url_uniqueness(short_url):
                    conn = self.get_db_connection()
                    try:
                        conn.execute('INSERT INTO urls (long_url, short_url) VALUES (?, ?)',
                                   (long_url, short_url))
                        conn.commit()
                        return {
                            'success': True,
                            'short_url': short_url,
                            'message': 'New short URL created'
                        }
                    finally:
                        conn.close()

        except Exception as e:
            error_msg = f"Error creating short URL: {str(e)}"
            self.logger.error(error_msg)
            return {
                'success': False,
                'error': error_msg
            }

    def get_long_url(self, short_url: str) -> Dict[str, Any]:
        try:
            conn = self.get_db_connection()
            result = conn.execute('SELECT long_url FROM urls WHERE short_url = ?',
                                (short_url,)).fetchone()
            if result:
                return {
                    'success': True,
                    'long_url': result['long_url']
                }
            return {
                'success': False,
                'error': 'Short URL not found'
            }
        except Exception as e:
            error_msg = f"Error retrieving long URL: {str(e)}"
            self.logger.error(error_msg)
            return {
                'success': False,
                'error': error_msg
            }
        finally:
            conn.close()

    def update_long_url(self, short_url: str, new_long_url: str) -> Dict[str, Any]:
        try:
            conn = self.get_db_connection()
            try:
                existing = conn.execute('SELECT id FROM urls WHERE short_url = ?',
                                     (short_url,)).fetchone()
                if not existing:
                    return {
                        'success': False,
                        'error': 'Short URL not found'
                    }

                existing_url = self.check_existing_long_url(new_long_url)
                if existing_url and existing_url['short_url'] != short_url:
                    return {
                        'success': False,
                        'error': f'Long URL already has short URL: {existing_url["short_url"]}'
                    }

                conn.execute('UPDATE urls SET long_url = ? WHERE short_url = ?',
                           (new_long_url, short_url))
                conn.commit()
                return {
                    'success': True,
                    'message': 'Long URL updated successfully',
                    'short_url': short_url
                }
            finally:
                conn.close()
        except Exception as e:
            error_msg = f"Error updating URL: {str(e)}"
            self.logger.error(error_msg)
            return {
                'success': False,
                'error': error_msg
            }
