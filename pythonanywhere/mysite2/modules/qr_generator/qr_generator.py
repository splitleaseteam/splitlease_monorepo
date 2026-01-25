import qrcode
from io import BytesIO
import requests
from PIL import Image, ImageDraw, ImageFont
from PIL import UnidentifiedImageError
import logging
from typing import Tuple, Optional, Union
import cairosvg

logger = logging.getLogger(__name__)

class QRCodeGenerator:
    def __init__(self):
        self.logo_url = "https://s3.amazonaws.com/appforest_uf/f1587601671931x294112149689599100/split%20lease%20purple%20circle.png"
        self.qr_fill_color = "#ffffff"
        self.qr_back_color = "#31135D"
        self.box_size = 30  # Increased for better resolution at 1024px
        self.border = 0     # We'll handle border ourselves
        self.fixed_size = 1080  # Increased to 1024px as requested
        self.padding = 72   # Reduced padding by half as requested
        self.text_spacing = 2  # Space between QR code and text in pixels
        self.text_size = 63  # Scaled up text size for larger image
        self.font_paths = [
                    "/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf",
                    "/usr/share/fonts/truetype/liberation/LiberationSans-Regular.ttf",
                    "/usr/share/fonts/truetype/freefont/FreeSans.ttf"
                ]

    def _get_font(self, text_size: int) -> Optional[ImageFont.FreeTypeFont]:
        """Try to load a font from available system fonts"""
        for font_path in self.font_paths:
            try:
                font = ImageFont.truetype(font_path, size=text_size)
                logger.info(f"Successfully loaded font: {font_path} with size {text_size}")
                return font
            except Exception as e:
                logger.debug(f"Failed to load font {font_path}: {str(e)}")
                continue

        logger.warning("No system fonts available. Using default font.")
        return ImageFont.load_default()

    def _download_logo(self, is_black_background=False) -> Tuple[Optional[Image.Image], Optional[str]]:
        """Download and process the logo image"""
        try:
            # Select the appropriate logo URL based on background color
            logo_url = self.black_logo_url if is_black_background else self.logo_url

            response = requests.get(logo_url, stream=True, timeout=10)
            response.raise_for_status()

            logo_bytes = BytesIO(response.content)
            logo_bytes.seek(0)

            # Check if it's an SVG file
            if logo_url.lower().endswith('.svg'):
                # Convert SVG to PNG in memory
                png_bytes = BytesIO()
                cairosvg.svg2png(bytestring=response.content, write_to=png_bytes)
                png_bytes.seek(0)
                logo = Image.open(png_bytes)
            else:
                logo = Image.open(logo_bytes)

            # Ensure proper alpha channel handling
            return logo.convert('RGBA'), None
        except (requests.RequestException, UnidentifiedImageError) as e:
            error_msg = f"Failed to download or process logo: {str(e)}"
            logger.error(error_msg)
            return None, error_msg

    def generate_qr(self, data: str, text: Optional[str] = None,
                   output_format: str = 'PNG',
                   back_color: Optional[str] = None,
                   invert_colors: bool = False) -> Tuple[Optional[BytesIO], Optional[str]]:
        """
        Generate a QR code with embedded logo and optional text

        Args:
            data: The data to encode in the QR code
            text: Optional text to add below the QR code
            output_format: Format of the output image ('PNG' or 'SVG')
            back_color: Optional background color (hex format) to override the default
            invert_colors: Whether to invert the QR code colors (swap background and foreground)

        Returns:
            Tuple of (BytesIO containing the image, error message if any)
        """
        try:
            output_format = output_format.upper()
            if output_format not in ['PNG', 'SVG']:
                return None, f"Unsupported output format: {output_format}. Use 'PNG' or 'SVG'."

            # Use provided background color if available, otherwise use default
            qr_back_color = back_color if back_color else self.qr_back_color

            # Handle special color values
            is_black_background = False
            if qr_back_color and qr_back_color.lower() in ["monotone", "black"]:
                qr_back_color = "#000000"  # Black color
                is_black_background = True

            # Handle color inversion if requested
            fill_color = self.qr_back_color if invert_colors else self.qr_fill_color
            back_color = self.qr_fill_color if invert_colors else qr_back_color

            # Create QR code
            qr = qrcode.QRCode(
                version=None,
                error_correction=qrcode.constants.ERROR_CORRECT_H,
                box_size=self.box_size,
                border=self.border,
            )
            qr.add_data(data)
            qr.make(fit=True)

            if output_format == 'SVG':
                # For SVG, we generate a basic QR code without logo
                qr_image = qr.make_image(image_factory=SvgPathImage,
                                       fill_color=fill_color,
                                       back_color=back_color)
                img_io = BytesIO()
                qr_image.save(img_io)
                img_io.seek(0)
                return img_io, None

            # For PNG format, continue with the existing logic
            qr_image = qr.make_image(
                fill_color=fill_color,
                back_color=back_color
            ).convert('RGBA')

            # Create a fixed-size empty square image with the background color
            final_image = Image.new('RGBA', (self.fixed_size, self.fixed_size), back_color)

            # Calculate QR code display size with equal padding on all sides
            qr_display_size = self.fixed_size - (self.padding * 2)

            # Resize QR code to fit within our fixed size
            qr_image_resized = qr_image.resize((qr_display_size, qr_display_size), Image.LANCZOS)

            # Position QR code with equal padding on all sides
            qr_x = self.padding
            qr_y = self.padding

            # Paste QR code
            final_image.paste(qr_image_resized, (qr_x, qr_y))

            # Only download logo for PNG format
            logo, error = self._download_logo(is_black_background)
            if error:
                return None, error

            # Calculate dimensions for the logo - make it proportional to QR size
            logo_size = qr_display_size // 4  # Base logo size on the QR display size
            logo = logo.resize((logo_size, logo_size), Image.LANCZOS)

            # Create a white circle background for the logo
            circle_size = int(logo_size * 1.26)  # Increased from 1.2 to 1.5 for larger circle
            circle_bg = Image.new('RGBA', (circle_size, circle_size), (0, 0, 0, 0))
            draw = ImageDraw.Draw(circle_bg)

            # Draw white circle
            draw.ellipse((0, 0, circle_size, circle_size), fill='white')

            # Create a transparent container for both circle and logo
            container_width = circle_size
            container_height = circle_size
            container = Image.new('RGBA', (container_width, container_height), (0, 0, 0, 0))

            # Paste white circle into container
            container.paste(circle_bg, (0, 0), circle_bg)

            # Paste logo into center of white circle
            logo_offset = (circle_size - logo_size) // 2
            container.paste(logo, (logo_offset, logo_offset), logo)

            # Calculate the center of the QR code for proper logo placement
            qr_center_x = qr_x + (qr_display_size // 2)
            qr_center_y = qr_y + (qr_display_size // 2)

            # Position logo precisely in the center of the QR code
            logo_x = qr_center_x - (container_width // 2)
            logo_y = qr_center_y - (container_height // 2)

            # Paste the logo container onto the QR code
            final_image.paste(container, (logo_x, logo_y), container)

            # Add text if provided
            if text:
                draw = ImageDraw.Draw(final_image)
                text = text.upper()

                # Use fixed text size for consistent appearance
                font = self._get_font(self.text_size)
                text_width = draw.textlength(text, font=font)

                # Calculate text height
                text_height = font.getbbox(text)[3]

                # Position text 3 pixels below the QR code
                text_y = qr_y + qr_display_size + self.text_spacing

                # Center text horizontally, but ensure it doesn't exceed QR width
                text_x = qr_x + (qr_display_size - text_width) // 2

                # Ensure text doesn't exceed QR code width
                if text_width > qr_display_size:
                    # Reduce text size further to fit within QR width
                    while text_width > qr_display_size and current_text_size > 20:
                        current_text_size -= 2
                        font = self._get_font(current_text_size)
                        text_width = draw.textlength(text, font=font)

                    # Recalculate position with new width
                    text_x = qr_x + (qr_display_size - text_width) // 2

                # Draw text
                text_color = fill_color if not invert_colors else back_color
                draw.text((text_x, text_y), text, fill=text_color, font=font)

            # Save to BytesIO
            img_io = BytesIO()
            final_image.save(img_io, 'PNG')
            img_io.seek(0)
            return img_io, None

        except Exception as e:
            error_msg = f"Error in QR generation: {str(e)}"
            logger.error(error_msg)
            return None, error_msg
