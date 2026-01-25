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
from .config import CuratedListingsConfig  # changed import to use the new config

logger = logging.getLogger(__name__)

class CuratedListingsGenerator:
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
            'property_details': "Property Details",
            'location': "Location",
            'pricing': "Pricing Information",
            'amenities': "Amenities",
            'photos': "Property Photos",
            'neighborhood': "Neighborhood Information",
            'transportation': "Transportation",
            'schools': "Nearby Schools",
            'shopping': "Shopping and Dining",
            'utilities': "Utilities Information",
            'pet_policy': "Pet Policy",
            'lease_terms': "Lease Terms",
            'application_process': "Application Process",
            'contact_info': "Contact Information"
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
                    log_error(f"Curated Listings PDF - Translation Error: {error_msg}")
                    raise ValueError("No translation choices returned from API")

                translated_text = response.choices[0].message.content
                try:
                    translated_content = json.loads(translated_text)

                    # Validate translation completeness
                    missing_keys = set(content.keys()) - set(translated_content.keys())
                    if missing_keys:
                        logger.warning(f"Translation missing keys: {missing_keys}")
                        log_error(f"Curated Listings PDF - Incomplete Translation: Missing keys {missing_keys}")

                    # Check for empty or None values
                    empty_translations = [k for k, v in translated_content.items()
                                       if not v and content.get(k)]
                    if empty_translations:
                        logger.warning(f"Empty translations for keys: {empty_translations}")
                        log_error(f"Curated Listings PDF - Empty Translations: Keys {empty_translations}")

                    logger.info(f"Successfully translated {len(translated_content)} fields")
                    log_success(f"Curated Listings PDF - Successfully translated {len(translated_content)} fields to {target_language}")
                    return translated_content

                except json.JSONDecodeError as je:
                    error_msg = f"Failed to parse translation response as JSON: {je}"
                    logger.error(error_msg)
                    logger.debug(f"Raw response content: {translated_text[:200]}...")
                    log_error(f"Curated Listings PDF - JSON Parse Error: {error_msg}")
                    raise

            except Exception as api_error:
                error_msg = f"OpenAI API error: {str(api_error)}"
                logger.error(error_msg)
                if hasattr(api_error, 'response'):
                    status_code = getattr(api_error.response, 'status_code', 'unknown')
                    error_text = getattr(api_error.response, 'text', '')[:200]
                    logger.error(f"API response status: {status_code}")
                    logger.error(f"API response body: {error_text}")
                    log_error(f"Curated Listings PDF - OpenAI API Error: Status {status_code}, {error_msg}")
                raise

        except Exception as e:
            error_msg = f"Translation error: {str(e)}"
            logger.error(error_msg)
            log_error(f"Curated Listings PDF - General Translation Error: {error_msg}")
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
            if title in ["Amenities", "Application Process"]:
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

            if title == "Amenities":
                amenities_items = content.split(',')
                col_width = (self.width - 2*self.margin - 10) / 3
                x_positions = [self.margin + 30,
                             self.margin + col_width + 10,
                             self.margin + 2*col_width + 10]
                for i, amenity in enumerate(amenities_items):
                    col = i % 3
                    x = x_positions[col]
                    if col == 0 and i != 0:
                        y_position -= 20
                    canvas_obj.drawString(x, y_position, "✓")
                    canvas_obj.drawString(x + 15, y_position, amenity.strip())
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
            title = data.get('title', 'Curated Listings')
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
            title = data.get('title', 'Curated Listings')
            c.setFont("Helvetica-Bold", self.title_font_size)
            c.setFillColor(self.title_color)
            c.drawCentredString(self.width / 2, y, title)
            c.setFillColor(colors.black)

            y -= 30

            # Render each listing as a card
            listings = data.get('listings', [])
            card_height = 120
            cards_on_page = 0
            for item in listings:
                # new page if max 2 cards reached or not enough space
                if cards_on_page >= 2 or y - card_height < self.margin:
                    self.add_border(c)
                    c.showPage()
                    y = self.height - self.margin - 20
                    cards_on_page = 0
                # capture top of this card for link annotation
                card_top_y = y
                # draw image with aspect-fit in static container
                img_url = item.get('image_url')
                try:
                    resp = requests.get(img_url, timeout=10)
                    if resp.status_code == 200:
                        img = ImageReader(BytesIO(resp.content))
                        orig_w, orig_h = img.getSize()
                        container_w = (self.width - 2*self.margin) / 3
                        container_h = card_height
                        scale = min(container_w / orig_w, container_h / orig_h)
                        draw_w = orig_w * scale
                        draw_h = orig_h * scale
                        x_img = self.margin + (container_w - draw_w) / 2
                        y_img = y - card_height + (container_h - draw_h) / 2
                        c.drawImage(img, x_img, y_img, width=draw_w, height=draw_h)
                except Exception:
                    logger.error(f"Error loading image for listing {item.get('title')}")
                # draw text block
                text_x = self.margin + (self.width - 2*self.margin) / 3 + 10
                text_y = y
                c.setFont("Helvetica-Bold", self.section_title_font_size)
                c.drawString(text_x, text_y, item.get('title', ''))
                c.setFont("Helvetica", self.content_font_size)
                text_y -= 18
                # description
                for line in textwrap.wrap(item.get('description', ''), width=50):
                    c.drawString(text_x, text_y, line)
                    text_y -= 14
                # address
                c.drawString(text_x, text_y, f"Address: {item.get('address', '')}")
                text_y -= 14
                # price
                c.drawString(text_x, text_y, f"Price: ${item.get('price', '')} per night")
                # draw 'Go to Listing' button just below price
                url = item.get('url')
                if url:
                    btn_w, btn_h = 100, 20
                    padding = 5
                    btn_x = text_x
                    btn_y = text_y - btn_h - padding
                    # button background
                    c.setFillColor(colors.HexColor("#31135D"))
                    c.rect(btn_x, btn_y, btn_w, btn_h, fill=1, stroke=0)
                    # button text
                    c.setFillColor(colors.white)
                    c.setFont("Helvetica-Bold", 10)
                    c.drawCentredString(btn_x + btn_w/2, btn_y + btn_h/2 - 4, "Go to Listing")
                    # restore fill color
                    c.setFillColor(colors.black)
                    # clickable area
                    c.linkURL(url, (btn_x, btn_y, btn_x + btn_w, btn_y + btn_h), relative=0, newWindow=1)
                # move y for next card
                y -= (card_height + 20)
                cards_on_page += 1

            # final border and save
            self.add_border(c)
            c.save()
            buffer.seek(0)
            return buffer

        except Exception as e:
            error_msg = f"Error generating PDF: {str(e)}"
            logger.error(error_msg)
            raise

    def create_listings(self, data: Dict[str, Any]) -> BytesIO:
        """
        Synchronous version of create_listings for backward compatibility.
        This method doesn't perform any translation.
        """
        return self._generate_pdf(data)

    async def create_listings_async(self, data: Dict[str, Any]) -> BytesIO:
        """
        Asynchronous version of create_listings that supports translation.
        If language is specified in data, content will be translated before PDF generation.

        Note: Address and location information will not be translated.
        """
        try:
            # Validate input data
            if not isinstance(data, dict):
                error_msg = f"Invalid input data type: expected dict, got {type(data)}"
                logger.error(error_msg)
                log_error(f"Curated Listings PDF - Input Validation Error: {error_msg}")
                raise ValueError(error_msg)

            try:
                # Validate JSON structure
                json.dumps(data)
            except (TypeError, json.JSONDecodeError) as je:
                error_msg = f"Invalid JSON structure in input data: {str(je)}"
                logger.error(error_msg)
                log_error(f"Curated Listings PDF - JSON Validation Error: {error_msg}")
                raise ValueError(error_msg)

            language = data.get('language', 'en_US')
            if language not in CuratedListingsConfig.LANGUAGE_NAMES:
                warning_msg = f"Unsupported language {language}, falling back to en_US"
                logger.warning(warning_msg)
                log_error(f"Curated Listings PDF - {warning_msg}")
                language = 'en_US'

            if language != 'en_US':
                try:
                    # Log translation scope
                    protected_fields = ['address', 'location', 'contact_info']
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
                        CuratedListingsConfig.LANGUAGE_NAMES[language]
                    )
                    translation_duration = (datetime.now() - translation_start).total_seconds()
                    success_msg = f"Content translation completed in {translation_duration:.2f} seconds"
                    logger.info(success_msg)
                    log_success(f"Curated Listings PDF - {success_msg}")

                    # Validate translation results
                    untranslated_fields = set(content_to_translate.keys()) - set(translated_content.keys())
                    if untranslated_fields:
                        warning_msg = f"Some fields were not translated: {untranslated_fields}"
                        logger.warning(warning_msg)
                        log_error(f"Curated Listings PDF - Incomplete Translation: {warning_msg}")

                    # Update data with translations
                    data.update(translated_content)

                    # Translate section titles
                    logger.info("Translating section titles")
                    
                    # Translate titles
                    translated_titles = await self.translate_content(
                        self.section_titles,
                        CuratedListingsConfig.LANGUAGE_NAMES[language]
                    )

                    # Store translated titles
                    self._translated_titles = translated_titles

                    logger.info("Translation process completed successfully")
                    log_success(f"Curated Listings PDF - Successfully translated listings to {CuratedListingsConfig.LANGUAGE_NAMES[language]}")

                except Exception as e:
                    error_msg = f"Translation failed: {str(e)}"
                    logger.error(error_msg)
                    log_error(f"Curated Listings PDF - Translation Process Failed: {error_msg}")
                    logger.info("Falling back to English titles")
                    self._translated_titles = self.section_titles
            else:
                logger.info("Using English (no translation needed)")
                self._translated_titles = self.section_titles

            # Generate PDF with available translations (or English fallback)
            pdf_buffer = self._generate_pdf(data)
            log_success(f"Curated Listings PDF - Successfully generated PDF for language: {language}")
            return pdf_buffer

        except Exception as e:
            error_msg = f"Error creating translated curated listings: {str(e)}"
            logger.error(error_msg)
            log_error(f"Curated Listings PDF - PDF Generation Failed: {error_msg}")
            raise
