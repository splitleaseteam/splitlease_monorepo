from flask import Blueprint, request, jsonify, send_file
from .qr_generator import QRCodeGenerator
import logging
from datetime import datetime

qr_generator = Blueprint('qr_generator', __name__)
logger = logging.getLogger(__name__)

generator = QRCodeGenerator()

@qr_generator.route('/generate', methods=['POST'])
def generate_qr():
    """
    Generate a QR code with optional text

    Expected JSON body:
    {
        "data": "string to encode",
        "text": "optional text below QR code",
        "back_color": optional hex color code or "black"/"monotone" for the background,
        "invert_colors": optional boolean to invert QR code colors (default: false)
    }
    """
    try:
        data = request.get_json()

        if not data or 'data' not in data:
            return jsonify({
                'success': False,
                'error': 'No data provided for QR code'
            }), 400

        qr_data = data['data']
        text = data.get('text')
        back_color = data.get('back_color')
        invert_colors = data.get('invert_colors', False)

        # Generate QR code
        img_io, error = generator.generate_qr(qr_data, text, output_format='PNG', back_color=back_color, invert_colors=invert_colors)

        if error:
            return jsonify({
                'success': False,
                'error': error
            }), 500

        if not img_io:
            return jsonify({
                'success': False,
                'error': 'Failed to generate QR code'
            }), 500

        # Generate filename with timestamp
        timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
        filename = f"qr_code_{timestamp}.png"

        return send_file(
            img_io,
            mimetype='image/png',
            as_attachment=True,
            download_name=filename
        )

    except Exception as e:
        error_msg = f"Error generating QR code: {str(e)}"
        logger.error(error_msg)
        return jsonify({
            'success': False,
            'error': error_msg
        }), 500
