# Business Information Extractor - Web Application

A complete web-based solution for extracting business and contact information from Google Maps URLs. This application features a modern React frontend and a Flask backend that uses Selenium for web scraping.

## Features

- **Web Interface**: Clean, responsive React frontend with modern UI components
- **Real-time Extraction**: Extract business information from Google Maps URLs
- **Data Display**: View extracted information in a structured format
- **CSV Download**: Download extracted data directly to your local computer
- **Error Handling**: Comprehensive error handling and user feedback
- **Loading States**: Visual feedback during extraction process

## Extracted Information

The application extracts the following business information:
- Business Name
- Address
- Phone Number
- Website URL
- Email Address (when available)

## Technology Stack

### Frontend
- React 18 with Vite
- Tailwind CSS for styling
- shadcn/ui components
- Lucide React icons

### Backend
- Flask web framework
- Selenium WebDriver for web scraping
- Pandas for data processing
- Flask-CORS for cross-origin requests

## Installation and Setup

### Prerequisites
- Python 3.11+
- Node.js 18+
- Chrome browser (for Selenium)

### Backend Setup

1. Navigate to the backend directory:
   ```bash
   cd business-extractor-backend
   ```

2. Create and activate virtual environment:
   ```bash
   python -m venv venv
   source venv/bin/activate  # On Windows: venv\\Scripts\\activate
   ```

3. Install dependencies:
   ```bash
   pip install -r requirements.txt
   ```

### Frontend Setup

1. Navigate to the frontend directory:
   ```bash
   cd business-extractor-frontend
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Build the frontend:
   ```bash
   npm run build
   ```

4. Copy built files to Flask static directory:
   ```bash
   cp -r dist/* ../business-extractor-backend/src/static/
   ```

## Running the Application

### Development Mode

1. Start the Flask backend:
   ```bash
   cd business-extractor-backend
   source venv/bin/activate
   python run_server.py
   ```

2. The application will be available at `http://localhost:3001`

### Production Deployment

The application is configured to serve the React frontend from Flask's static directory, making it a single deployable unit.

## Usage

1. **Open the Application**: Navigate to the application URL in your web browser

2. **Input Google Maps URL**: 
   - Find a business on Google Maps
   - Copy the URL from your browser's address bar
   - Paste it into the input field

3. **Extract Data**: Click the "Extract Data" button to start the extraction process

4. **View Results**: The extracted business information will be displayed in a structured format

5. **Download CSV**: Click "Download CSV" to save the data to your local computer

## API Endpoints

### POST /api/extract
Extracts business information from a Google Maps URL.

**Request Body:**
```json
{
  "url": "https://www.google.com/maps/place/..."
}
```

**Response:**
```json
{
  "Business Name": "Example Business",
  "Address": "123 Main St, City, State 12345",
  "Phone": "(555) 123-4567",
  "Website": "https://example.com",
  "Email": "contact@example.com"
}
```

### POST /api/download-csv
Generates and downloads a CSV file from extracted data.

**Request Body:**
```json
{
  "Business Name": "Example Business",
  "Address": "123 Main St, City, State 12345",
  "Phone": "(555) 123-4567",
  "Website": "https://example.com",
  "Email": "contact@example.com"
}
```

**Response:** CSV file download

## Error Handling

The application includes comprehensive error handling for:
- Invalid URLs
- Network connectivity issues
- Selenium WebDriver errors
- Data extraction failures
- Server errors

## Limitations

- **Google Maps Changes**: Google Maps frequently updates its structure, which may require updates to the extraction selectors
- **Rate Limiting**: Excessive requests may trigger Google's anti-bot measures
- **Dynamic Content**: Some business information may be loaded dynamically and might not be captured
- **Email Detection**: Email addresses are extracted using regex patterns and may not always be accurate

## Security Considerations

- The application runs Selenium in headless mode for security
- CORS is enabled for frontend-backend communication
- Input validation is performed on all user inputs
- No sensitive data is stored or logged

## Troubleshooting

### Common Issues

1. **ChromeDriver Issues**: The application automatically downloads the correct ChromeDriver version
2. **Port Conflicts**: Change the port in `run_server.py` if port 3001 is in use
3. **Extraction Failures**: Check the Flask logs for detailed error messages

### Logs

Flask logs provide detailed information about:
- Extraction attempts
- ChromeDriver status
- API requests and responses
- Error details

## Contributing

To contribute to this project:
1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## License

This project is for educational and personal use. Please respect Google's Terms of Service when using this application.

## Support

For issues or questions, please check the logs first and ensure all dependencies are properly installed.

