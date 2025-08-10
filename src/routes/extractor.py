from flask import Blueprint, request, jsonify, make_response
from flask_cors import cross_origin
import pandas as pd
import io
import sys
import os

# Import the extractor functions
sys.path.insert(0, os.path.dirname(os.path.dirname(__file__)))
from src.extractor import setup_driver, extract_info
import logging

extractor_bp = Blueprint('extractor', __name__)


@extractor_bp.route('/extract', methods=['POST'])
@cross_origin()
def extract_business_info():
    """
    Extract business information from a Google Maps URL
    """
    try:
        data = request.get_json()
        url = data.get('url')

        if not url:
            return jsonify({'error': 'URL is required'}), 400

        # Removed Google Maps restriction; now accepts any URL

        # Set up the driver and extract information
        driver = None
        try:
            driver = setup_driver()
            business_data = extract_info(driver, url)

            if not business_data:
                return jsonify({'error': 'Failed to extract business information'}), 500

            return jsonify(business_data)

        except Exception as e:
            logging.error(f"Error during extraction: {e}")
            return jsonify({'error': f'Extraction failed: {str(e)}'}), 500

        finally:
            if driver:
                driver.quit()

    except Exception as e:
        logging.error(f"API error: {e}")
        return jsonify({'error': 'Internal server error'}), 500


@extractor_bp.route('/download-csv', methods=['POST'])
@cross_origin()
def download_csv():
    """
    Generate and download CSV file from extracted business data
    """
    try:
        data = request.get_json()

        if not data:
            return jsonify({'error': 'No data provided'}), 400

        # Create DataFrame from the data
        df = pd.DataFrame([data])

        # Create CSV in memory
        output = io.StringIO()
        df.to_csv(output, index=False)
        csv_data = output.getvalue()
        output.close()

        # Create response with CSV file
        response = make_response(csv_data)
        response.headers['Content-Type'] = 'text/csv'
        response.headers['Content-Disposition'] = 'attachment; filename=business_info.csv'

        return response

    except Exception as e:
        logging.error(f"CSV generation error: {e}")
        return jsonify({'error': 'Failed to generate CSV'}), 500