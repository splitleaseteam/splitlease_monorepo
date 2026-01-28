from reportlab.lib.pagesizes import letter
from reportlab.pdfgen import canvas
from reportlab.lib.utils import ImageReader
from reportlab.lib import colors
from io import BytesIO
import requests
import textwrap
import math
import logging
import os
from typing import Dict, Any, Optional, Union
import asyncio
import json
from openai import AsyncOpenAI, OpenAIError
from datetime import datetime
from ..logging.logger import log_success, log_error
from .config import LANGUAGE_NAMES  # centralized language mapping

logger = logging.getLogger(__name__)

class HouseManualGenerator:
    def __init__(self):
        self.width, self.height = letter
        self.title_font_size = 14
        self.section_title_font_size = 13
        self.content_font_size = 11
        self.border_color = colors.HexColor("#31135D")
        self.title_color = colors.HexColor("#31135D")
        self.margin = 3
        self.logo_url = "https://images.crunchbase.com/image/upload/c_pad,f_auto,q_auto:eco,dpr_1/parrsrdzwbkylozc0aqr"

        # Initialize OpenAI client for translation via env variable
        api_key = os.getenv('OPENAI_API_KEY')
        logger.debug(f"OpenAI API key present: {bool(api_key)}")  # indicate presence
        if not api_key:
            logger.error('OPENAI_API_KEY missing. Set in .env or environment.')
            raise RuntimeError('Missing OPENAI_API_KEY environment variable')
        try:
            self.client = AsyncOpenAI(api_key=api_key)
        except OpenAIError as e:
            logger.error(f"Failed initializing AsyncOpenAI: {e}")
            raise

        # Default section titles in English
        self.section_titles = {
            'getting_inside': "Getting Inside",
            'address': "Address",
            'tips_to_place': "Tips to get to your place",
            'parking': "Parking",
            'recording_devices': "Recording Devices",
            'first_aid': "First Aid",
            'security_settings': "Security Settings",
            'fire_safety': "Fire Safety",
            'house_rules': "House Rules",
            'host_asks': "Asks from the Host",
            'furniture_policy': "Furniture Policy",
            'issue_resolution': "Issue Resolution",
            'storage_space': "Storage Space",
            'off_limit_areas': "Off-limit Areas",
            'additional_rules': "Additional House Rules",
            'things_to_know': "Things to Know",
            'wifi': "Wi-Fi",
            'entertainment': "Entertainment Guide",
            'trash': "Trash Guidelines",
            'laundry': "Laundry Information",
            'temperature': "Temperature Control",
            'kitchen': "Kitchen Guide",
            'dining': "Dining Tips",
            'amenities': "Amenities Guide",
            'activities': "Local Activities",
            'checkout': "Checkout Information",
            'departure': "Departure Checklist"
        }

    async def translate_content(self, content: Dict[str, Any], target_language: str) -> Dict[str, Any]:
        """Translate all content in the dictionary to the target language."""
        try:
            system_message = (
                f"You are a professional translator. Translate the following JSON content to {target_language}. "
                "Maintain all formatting, including newlines and special characters. "
                "Keep technical terms, proper nouns, and placeholders unchanged. "
                "Return only the translated JSON without any additional text."
            )

            content_str = json.dumps(content, ensure_ascii=False, indent=2)
            logger.info(f"Initiating translation to {target_language} for {len(content)} fields")

            try:
                response = await self.client.chat.completions.create(
                    model=os.getenv('OPENAI_MODEL'),
                    messages=[
                        {"role": "system", "content": system_message},
                        {"role": "user", "content": content_str}
                    ],
                    temperature=float(os.getenv('OPENAI_TEMPERATURE', 0.3)),
                    response_format={"type": "json_object"}
                )

                if not response.choices:
                    error_msg = "OpenAI API returned empty choices array"
                    logger.error(error_msg)
                    log_error(f"House Manual PDF - Translation Error: {error_msg}")
                    raise ValueError("No translation choices returned from API")

                translated_text = response.choices[0].message.content
                try:
                    translated_content = json.loads(translated_text)

                    # Validate translation completeness
                    missing_keys = set(content.keys()) - set(translated_content.keys())
                    if missing_keys:
                        logger.warning(f"Translation missing keys: {missing_keys}")
                        log_error(f"House Manual PDF - Incomplete Translation: Missing keys {missing_keys}")

                    # Check for empty or None values
                    empty_translations = [k for k, v in translated_content.items()
                                       if not v and content.get(k)]
                    if empty_translations:
                        logger.warning(f"Empty translations for keys: {empty_translations}")
                        log_error(f"House Manual PDF - Empty Translations: Keys {empty_translations}")

                    logger.info(f"Successfully translated {len(translated_content)} fields")
                    log_success(f"House Manual PDF - Successfully translated {len(translated_content)} fields to {target_language}")
                    return translated_content

                except json.JSONDecodeError as je:
                    error_msg = f"Failed to parse translation response as JSON: {je}"
                    logger.error(error_msg)
                    logger.debug(f"Raw response content: {translated_text[:200]}...")
                    log_error(f"House Manual PDF - JSON Parse Error: {error_msg}")
                    raise

            except Exception as api_error:
                error_msg = f"OpenAI API error: {str(api_error)}"
                logger.error(error_msg)
                if hasattr(api_error, 'response'):
                    status_code = getattr(api_error.response, 'status_code', 'unknown')
                    error_text = getattr(api_error.response, 'text', '')[:200]
                    logger.error(f"API response status: {status_code}")
                    logger.error(f"API response body: {error_text}")
                    log_error(f"House Manual PDF - OpenAI API Error: Status {status_code}, {error_msg}")
                raise

        except Exception as e:
            error_msg = f"Translation error: {str(e)}"
            logger.error(error_msg)
            log_error(f"House Manual PDF - General Translation Error: {error_msg}")
            raise

    async def translate_text(self, text: str, target_language: str) -> str:
        """Translate a single text string to the target language."""
        try:
            if not text or not text.strip():
                logger.warning("Empty text provided for translation")
                return text

            system_message = (
                f"You are a professional translator. Translate the following text to {target_language}. "
                "Maintain all formatting and special characters. "
                "Keep technical terms and proper nouns unchanged. "
                "Return only the translated text without any additional content."
            )

            logger.info(f"Translating text of length {len(text)} to {target_language}")

            try:
                response = await self.client.chat.completions.create(
                    model=os.getenv('OPENAI_MODEL'),
                    messages=[
                        {"role": "system", "content": system_message},
                        {"role": "user", "content": text}
                    ],
                    temperature=float(os.getenv('OPENAI_TEMPERATURE', 0.3))
                )

                if not response.choices:
                    logger.error("OpenAI API returned empty choices array")
                    raise ValueError("No translation choices returned from API")

                translated_text = response.choices[0].message.content.strip()

                # Basic validation of translation
                if not translated_text:
                    logger.error("API returned empty translation")
                    raise ValueError("Empty translation received from API")

                if len(translated_text) < len(text) * 0.5:
                    logger.warning(f"Translation suspiciously short. Original: {len(text)} chars, Translated: {len(translated_text)} chars")

                logger.info("Successfully translated text")
                return translated_text

            except Exception as api_error:
                logger.error(f"OpenAI API error during text translation: {str(api_error)}")
                if hasattr(api_error, 'response'):
                    logger.error(f"API response status: {api_error.response.status_code}")
                    logger.error(f"API response body: {api_error.response.text[:200]}...")
                raise

        except Exception as e:
            logger.error(f"Text translation error: {str(e)}")
            raise

    def add_border(self, canvas_obj):
        canvas_obj.setStrokeColor(self.border_color)
        canvas_obj.setLineWidth(0.72)
        canvas_obj.rect(self.margin, self.margin,
                       self.width - 2*self.margin,
                       self.height - 2*self.margin)

    def add_section(self, canvas_obj, title: str, content: str, y_position: float) -> float:
        try:
            estimated_height = 30
            if title in ["Departure Checklist", "House Rules"]:
                num_items = len(content.split(',')) if content else 0
                num_rows = math.ceil(num_items / 3)
                estimated_height += 20 * num_rows
            else:
                wrapped_content = textwrap.wrap(content, width=55)
                estimated_height += 15 * len(wrapped_content)

            if y_position - estimated_height < self.margin + 20:
                self.add_border(canvas_obj)
                canvas_obj.showPage()
                y_position = self.height - self.margin - 20

            canvas_obj.setFont("Helvetica-Bold", self.section_title_font_size)
            canvas_obj.drawCentredString(self.width / 2, y_position, title)

            canvas_obj.setFont("Helvetica", self.content_font_size)
            y_position -= 20

            if title == "Departure Checklist":
                checklist_items = content.split(',')
                for item in checklist_items:
                    canvas_obj.rect(self.width / 2 - 100, y_position - 3, 10, 10, fill=0)
                    canvas_obj.drawString(self.width / 2 - 85, y_position, item.strip())
                    y_position -= 20
            elif title == "House Rules":
                rules = content.split(',')
                col_width = (self.width - 2*self.margin - 10) / 3
                x_positions = [self.margin + 30,
                             self.margin + col_width + 10,
                             self.margin + 2*col_width + 10]
                for i, rule in enumerate(rules):
                    col = i % 3
                    x = x_positions[col]
                    if col == 0 and i != 0:
                        y_position -= 20
                    canvas_obj.drawString(x, y_position, "✔")
                    canvas_obj.drawString(x + 15, y_position, rule.strip())
            else:
                wrapped_content = textwrap.wrap(content, width=55)
                for line in wrapped_content:
                    canvas_obj.drawCentredString(self.width / 2, y_position, line)
                    y_position -= 15

            return y_position
        except Exception as e:
            logger.error(f"Error adding section {title}: {str(e)}")
            raise

    def _generate_pdf(self, data: Dict[str, Any]) -> BytesIO:
        """Internal method to generate the PDF."""
        try:
            buffer = BytesIO()
            c = canvas.Canvas(buffer, pagesize=letter)
            
            # Set PDF metadata title to match the visible title
            title = data.get('title', 'Your House Manual')
            c.setTitle(title)
            
            y = self.height - self.margin - 20

            # Add Logo
            try:
                logo_response = requests.get(self.logo_url, timeout=10)
                if logo_response.status_code == 200:
                    logo_image = ImageReader(BytesIO(logo_response.content))
                    logo_width = logo_height = 45
                    x_position = (self.width - logo_width) / 2
                    y_position = self.height - self.margin - logo_height - 20
                    c.drawImage(logo_image, x_position, y_position,
                              width=logo_width, height=logo_height)
                    y = y_position - 44
            except Exception as e:
                logger.error(f"Error adding logo: {str(e)}")

            # Add title
            title = data.get('title', 'Your House Manual')
            c.setFont("Helvetica-Bold", self.title_font_size)
            c.setFillColor(self.title_color)
            c.drawCentredString(self.width / 2, y, title)
            c.setFillColor(colors.black)

            y -= 30

            # Get translated titles and labels
            titles = getattr(self, '_translated_titles', self.section_titles)
            labels = getattr(self, '_translated_labels', {
                'name': 'Name',
                'password': 'Password'
            })

            # Prepare sections with translated titles
            wifi_content = []
            if data.get('wifiname'):
                wifi_content.append(f"{labels.get('name', 'Name')}: {data['wifiname']}")
            if data.get('wifipassword'):
                wifi_content.append(f"{labels.get('password', 'Password')}: {data['wifipassword']}")
            wifi_section = (titles.get('wifi', "Wi-Fi"), "\n".join(wifi_content) if wifi_content else None)

            specific_guidelines_title = data.get('guidelinename', titles.get('specific_guidelines', 'Specific Guidelines')) if data.get('specificguidelines') else ''

            sections = [
                (titles.get('getting_inside', "Getting Inside"), data.get('checkin')),
                (titles.get('address', "Address"), data.get('address')),
            ]

            # Conditionally add specific guidelines
            if data.get('specificguidelines') and specific_guidelines_title:
                sections.append((specific_guidelines_title, data.get('specificguidelines')))

            sections += [
                (titles.get('tips_to_place', "Tips to get to your place"), data.get('destinationnavigation')),
                (titles.get('parking', "Parking"), self._format_parking(data)),
                (titles.get('recording_devices', "Recording Devices"), data.get('recordingdevices')),
                (titles.get('first_aid', "First Aid"), data.get('firstaid')),
                (titles.get('security_settings', "Security Settings"), data.get('securitysettings')),
                (titles.get('fire_safety', "Fire Safety"), data.get('firesafety')),
                (titles.get('house_rules', "House Rules"), data.get('houserules')),
                (titles.get('host_asks', "Asks from the Host"), data.get('hostrequests')),
                (titles.get('furniture_policy', "Furniture Policy"), data.get('furniture')),
                (titles.get('issue_resolution', "Issue Resolution"), data.get('grievances')),
                (titles.get('storage_space', "Storage Space"), data.get('spaceforbelongings')),
                (titles.get('off_limit_areas', "Off-limit Areas"), data.get('offlimitareas')),
                (titles.get('additional_rules', "Additional House Rules"), data.get('additionalhouserules')),
                (titles.get('things_to_know', "Things to Know"), data.get('thingstoknow')),
                wifi_section,
                (titles.get('entertainment', "Entertainment Guide"), data.get('entertainment')),
                (titles.get('trash', "Trash Guidelines"), data.get('trash')),
                (titles.get('laundry', "Laundry Information"), data.get('laundry')),
                (titles.get('temperature', "Temperature Control"), data.get('thermostatguide')),
                (titles.get('kitchen', "Kitchen Guide"), data.get('kitchenguide')),
                (titles.get('dining', "Dining Tips"), data.get('diningtips')),
                (titles.get('amenities', "Amenities Guide"), data.get('amenitiestips')),
                (titles.get('activities', "Local Activities"), data.get('thingstodo')),
                (titles.get('checkout', "Checkout Information"), data.get('checkingout')),
                (titles.get('departure', "Departure Checklist"), data.get('departurechecklist'))
            ]

            for title, content in sections:
                if content:
                    y = self.add_section(c, title, content, y)
                    y -= 20

            self.add_border(c)
            c.save()
            buffer.seek(0)
            return buffer

        except Exception as e:
            error_msg = f"Error generating PDF: {str(e)}"
            logger.error(error_msg)
            raise

    def create_manual(self, data: Dict[str, Any]) -> BytesIO:
        """
        Synchronous version of create_manual for backward compatibility.
        This method doesn't perform any translation.
        """
        return self._generate_pdf(data)

    async def create_manual_async(self, data: Dict[str, Any]) -> BytesIO:
        """
        Asynchronous version of create_manual that supports translation.
        If language is specified in data, content will be translated before PDF generation.

        Note: Address, WiFi name, and WiFi password will not be translated.
        """
        try:
            # Validate input data
            if not isinstance(data, dict):
                error_msg = f"Invalid input data type: expected dict, got {type(data)}"
                logger.error(error_msg)
                log_error(f"House Manual PDF - Input Validation Error: {error_msg}")
                raise ValueError(error_msg)

            try:
                # Validate JSON structure
                json.dumps(data)
            except (TypeError, json.JSONDecodeError) as je:
                error_msg = f"Invalid JSON structure in input data: {str(je)}"
                logger.error(error_msg)
                log_error(f"House Manual PDF - JSON Validation Error: {error_msg}")
                raise ValueError(error_msg)

            language = data.get('language', 'en_US')
            if language not in LANGUAGE_NAMES:
                warning_msg = f"Unsupported language {language}, falling back to en_US"
                logger.warning(warning_msg)
                log_error(f"House Manual PDF - {warning_msg}")
                language = 'en_US'

            if language != 'en_US':
                try:
                    # Log translation scope
                    protected_fields = ['address', 'wifiname', 'wifipassword']
                    date_time_fields = []
                    translatable_fields = [k for k, v in data.items()
                                        if k != 'language' and isinstance(v, str) and
                                        k not in protected_fields and k not in date_time_fields]
                    logger.info(f"Preparing to translate {len(translatable_fields)} fields to {language}")
                    logger.debug(f"Fields to translate: {translatable_fields}")

                    # Create a copy of data for translation
                    content_to_translate = {
                        k: v for k, v in data.items()
                        if k != 'language' and isinstance(v, str) and
                        k not in protected_fields and k not in date_time_fields
                    }

                    # Track translation progress
                    translation_start = datetime.now()

                    # Translate content
                    translated_content = await self.translate_content(
                        content_to_translate,
                        LANGUAGE_NAMES[language]
                    )
                    translation_duration = (datetime.now() - translation_start).total_seconds()
                    success_msg = f"Content translation completed in {translation_duration:.2f} seconds"
                    logger.info(success_msg)
                    log_success(f"House Manual PDF - {success_msg}")

                    # Validate translation results
                    untranslated_fields = set(content_to_translate.keys()) - set(translated_content.keys())
                    if untranslated_fields:
                        warning_msg = f"Some fields were not translated: {untranslated_fields}"
                        logger.warning(warning_msg)
                        log_error(f"House Manual PDF - Incomplete Translation: {warning_msg}")

                    # Update data with translations
                    data.update(translated_content)

                    # Translate section titles and common labels
                    logger.info("Translating section titles and common labels")
                    titles_to_translate = {
                        **self.section_titles,
                        'name': 'Name',
                        'password': 'Password',
                        'available': 'Available',
                        'tips': 'Tips'
                    }

                    # Translate titles
                    translated_titles = await self.translate_content(
                        titles_to_translate,
                        LANGUAGE_NAMES[language]
                    )

                    # Store translated titles and labels
                    self._translated_titles = {
                        k: v for k, v in translated_titles.items()
                        if k in self.section_titles
                    }
                    self._translated_labels = {
                        k: v for k, v in translated_titles.items()
                        if k in ['name', 'password', 'available', 'tips']
                    }

                    logger.info("Translation process completed successfully")
                    log_success(f"House Manual PDF - Successfully translated manual to {LANGUAGE_NAMES[language]}")

                except Exception as e:
                    error_msg = f"Translation failed: {str(e)}"
                    logger.error(error_msg)
                    log_error(f"House Manual PDF - Translation Process Failed: {error_msg}")
                    logger.info("Falling back to English titles and labels")
                    self._translated_titles = self.section_titles
                    self._translated_labels = {
                        'name': 'Name',
                        'password': 'Password',
                        'available': 'Available',
                        'tips': 'Tips'
                    }
            else:
                logger.info("Using English (no translation needed)")
                self._translated_titles = self.section_titles
                self._translated_labels = {
                    'name': 'Name',
                    'password': 'Password',
                    'available': 'Available',
                    'tips': 'Tips'
                }

            # Generate PDF with available translations (or English fallback)
            pdf_buffer = self._generate_pdf(data)
            log_success(f"House Manual PDF - Successfully generated PDF for language: {language}")
            return pdf_buffer

        except Exception as e:
            error_msg = f"Error creating translated house manual: {str(e)}"
            logger.error(error_msg)
            log_error(f"House Manual PDF - PDF Generation Failed: {error_msg}")
            raise

    def _format_parking(self, data: Dict[str, Any]) -> Optional[str]:
        try:
            if data.get('availableparking') and data.get('parkingtips'):
                # Use translated labels if available
                available_label = getattr(self, '_translated_labels', {}).get('available', 'Available')
                tips_label = getattr(self, '_translated_labels', {}).get('tips', 'Tips')
                return f"{available_label}: {data['availableparking']}\n{tips_label}: {data['parkingtips']}"
            return data.get('availableparking') or data.get('parkingtips')
        except Exception as e:
            logger.error(f"Error formatting parking information: {str(e)}")
            # Fall back to English labels
            if data.get('availableparking') and data.get('parkingtips'):
                return f"Available: {data['availableparking']}\nTips: {data['parkingtips']}"
            return data.get('availableparking') or data.get('parkingtips')
