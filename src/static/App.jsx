import { useState } from 'react'
import { Button } from '@/components/ui/button.jsx'
import { Input } from '@/components/ui/input.jsx'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card.jsx'
import { Alert, AlertDescription } from '@/components/ui/alert.jsx'
import { Badge } from '@/components/ui/badge.jsx'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs.jsx'
import { Loader2, Download, MapPin, Phone, Globe, Mail, Building, ExternalLink } from 'lucide-react'
import './App.css'

function App() {
  const [url, setUrl] = useState('')
  const [extractionType, setExtractionType] = useState('auto') // 'auto', 'google-maps', 'website'
  const [loading, setLoading] = useState(false)
  const [extractedData, setExtractedData] = useState(null)
  const [error, setError] = useState('')

  // Function to detect URL type
  const detectUrlType = (url) => {
    if (url.includes('google.com/maps')) {
      return 'google-maps'
    } else if (url.match(/^https?:\/\/.+/)) {
      return 'website'
    }
    return 'unknown'
  }

  // Function to validate URL (Google Maps restriction removed)
  const validateUrl = (url, type) => {
    if (!url.trim()) {
      return 'Please enter a URL'
    }

    // Basic URL validation
    const urlPattern = /^https?:\/\/.+/
    if (!urlPattern.test(url)) {
      return 'Please enter a valid URL starting with http:// or https://'
    }

    // No more Google Maps restriction!
    return null
  }

  const handleExtract = async () => {
    const detectedType = extractionType === 'auto' ? detectUrlType(url) : extractionType
    const validationError = validateUrl(url, detectedType)

    if (validationError) {
      setError(validationError)
      return
    }

    setLoading(true)
    setError('')
    setExtractedData(null)

    try {
      const response = await fetch('/api/extract', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          url,
          extraction_type: detectedType
        }),
      })

      if (!response.ok) {
        let errorMessage = 'Failed to extract business information';
        try {
          const text = await response.text();
          if (text) {
            const errorData = JSON.parse(text);
            errorMessage = errorData.error || errorMessage;
          }
        } catch (e) {
          // Ignore JSON parse errors, use default message
        }
        throw new Error(errorMessage);
      }

      const data = await response.json()
      setExtractedData(data)
    } catch (err) {
      setError(err.message || 'An error occurred while extracting data')
    } finally {
      setLoading(false)
    }
  }

  const handleDownloadCSV = async () => {
    try {
      const response = await fetch('/api/download-csv', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(extractedData),
      })

      if (!response.ok) {
        throw new Error('Failed to generate CSV')
      }

      const blob = await response.blob()
      const downloadUrl = window.URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = downloadUrl
      link.download = 'business_info.csv'
      document.body.appendChild(link)
      link.click()
      link.remove()
      window.URL.revokeObjectURL(downloadUrl)
    } catch (err) {
      setError('Failed to download CSV file')
    }
  }

  // Get placeholder text based on extraction type
  const getPlaceholder = () => {
    if (extractionType === 'google-maps') {
      return 'https://www.google.com/maps/place/...'
    } else if (extractionType === 'website') {
      return 'https://example.com'
    }
    return 'https://www.google.com/maps/place/... or https://example.com'
  }

  // Get description text based on extraction type
  const getDescription = () => {
    if (extractionType === 'google-maps') {
      return 'Paste a Google Maps business URL to extract contact information'
    } else if (extractionType === 'website') {
      return 'Paste any business website URL to extract contact information'
    }
    return 'Paste a Google Maps URL or business website URL to extract contact information'
  }

  return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-4">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-8">
            <h1 className="text-4xl font-bold text-gray-900 mb-2">
              Business Information Extractor
            </h1>
            <p className="text-lg text-gray-600">
              Extract business details from Google Maps URLs and business websites
            </p>
          </div>

          <Card className="mb-6">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Building className="h-5 w-5" />
                Extract Business Information
              </CardTitle>
              <CardDescription>
                {getDescription()}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Extraction Type Selector */}
              <Tabs value={extractionType} onValueChange={setExtractionType} className="w-full">
                <TabsList className="grid w-full grid-cols-3">
                  <TabsTrigger value="auto" className="flex items-center gap-2">
                    <Globe className="h-4 w-4" />
                    Auto Detect
                  </TabsTrigger>
                  <TabsTrigger value="google-maps" className="flex items-center gap-2">
                    <MapPin className="h-4 w-4" />
                    Google Maps
                  </TabsTrigger>
                  <TabsTrigger value="website" className="flex items-center gap-2">
                    <ExternalLink className="h-4 w-4" />
                    Website
                  </TabsTrigger>
                </TabsList>

                <TabsContent value="auto" className="mt-4">
                  <div className="text-sm text-gray-600 mb-2">
                    Automatically detects whether the URL is a Google Maps link or a business website
                  </div>
                </TabsContent>

                <TabsContent value="google-maps" className="mt-4">
                  <div className="text-sm text-gray-600 mb-2">
                    Optimized for extracting business information from Google Maps listings
                  </div>
                </TabsContent>

                <TabsContent value="website" className="mt-4">
                  <div className="text-sm text-gray-600 mb-2">
                    Extracts contact information from business websites using general web scraping
                  </div>
                </TabsContent>
              </Tabs>

              {/* URL Input */}
              <div className="flex gap-2">
                <Input
                    placeholder={getPlaceholder()}
                    value={url}
                    onChange={(e) => setUrl(e.target.value)}
                    className="flex-1"
                    disabled={loading}
                />
                <Button
                    onClick={handleExtract}
                    disabled={loading || !url.trim()}
                    className="min-w-[120px]"
                >
                  {loading ? (
                      <>
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        Extracting...
                      </>
                  ) : (
                      'Extract Data'
                  )}
                </Button>
              </div>

              {error && (
                  <Alert variant="destructive">
                    <AlertDescription>{error}</AlertDescription>
                  </Alert>
              )}
            </CardContent>
          </Card>

          {extractedData && (
              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle className="flex items-center gap-2">
                      <Building className="h-5 w-5" />
                      Extracted Business Information
                    </CardTitle>
                    <Button onClick={handleDownloadCSV} variant="outline">
                      <Download className="h-4 w-4 mr-2" />
                      Download CSV
                    </Button>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="grid gap-4 md:grid-cols-2">
                    <div className="space-y-3">
                      <div className="flex items-start gap-3">
                        <Building className="h-5 w-5 mt-0.5 text-blue-600" />
                        <div>
                          <p className="font-medium text-sm text-gray-500">Business Name</p>
                          <p className="text-lg font-semibold">
                            {extractedData['Business Name'] || extractedData['Company Name'] || 'N/A'}
                          </p>
                        </div>
                      </div>

                      <div className="flex items-start gap-3">
                        <MapPin className="h-5 w-5 mt-0.5 text-red-600" />
                        <div>
                          <p className="font-medium text-sm text-gray-500">Address</p>
                          <p className="text-sm">
                            {extractedData['Address'] || 'N/A'}
                          </p>
                        </div>
                      </div>
                    </div>

                    <div className="space-y-3">
                      <div className="flex items-start gap-3">
                        <Phone className="h-5 w-5 mt-0.5 text-green-600" />
                        <div>
                          <p className="font-medium text-sm text-gray-500">Phone</p>
                          <p className="text-sm">
                            {extractedData['Phone'] || extractedData['Phone Number'] || 'N/A'}
                          </p>
                        </div>
                      </div>

                      <div className="flex items-start gap-3">
                        <Globe className="h-5 w-5 mt-0.5 text-purple-600" />
                        <div>
                          <p className="font-medium text-sm text-gray-500">Website</p>
                          {(extractedData['Website'] && extractedData['Website'] !== 'N/A') ? (
                              <a
                                  href={extractedData['Website']}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="text-sm text-blue-600 hover:underline break-all"
                              >
                                {extractedData['Website']}
                              </a>
                          ) : (
                              <p className="text-sm">N/A</p>
                          )}
                        </div>
                      </div>

                      <div className="flex items-start gap-3">
                        <Mail className="h-5 w-5 mt-0.5 text-orange-600" />
                        <div>
                          <p className="font-medium text-sm text-gray-500">Email</p>
                          <p className="text-sm">
                            {extractedData['Email'] || extractedData['Email Address'] || 'N/A'}
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Additional extracted data */}
                  {extractedData['Description'] && (
                      <div className="mt-4 pt-4 border-t">
                        <div className="flex items-start gap-3">
                          <Building className="h-5 w-5 mt-0.5 text-gray-600" />
                          <div>
                            <p className="font-medium text-sm text-gray-500">Description</p>
                            <p className="text-sm text-gray-700 mt-1">
                              {extractedData['Description']}
                            </p>
                          </div>
                        </div>
                      </div>
                  )}

                  <div className="mt-6 pt-4 border-t">
                    <div className="flex items-center gap-2">
                      <Badge variant="secondary">Data extracted successfully</Badge>
                      <Badge variant="outline">
                        {extractedData['Source Type'] || 'Unknown Source'}
                      </Badge>
                      <span className="text-sm text-gray-500">
                    Click "Download CSV" to save to your computer
                  </span>
                    </div>
                  </div>
                </CardContent>
              </Card>
          )}

          <div className="mt-8 text-center text-sm text-gray-500">
            <p>
              Paste any Google Maps business URL or business website URL above to extract contact information.
              The data will be displayed here and can be downloaded as a CSV file.
            </p>
          </div>
        </div>
      </div>
  )
}

export default App 