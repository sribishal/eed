'use client';

import { useState } from 'react';
import { Copy, Upload, Download, CheckCircle, Eye, EyeOff, Plus, Trash2 } from 'lucide-react';
import { toast } from 'sonner';

export default function URLEncodeDecode() {
  const [activeTab, setActiveTab] = useState<'encode' | 'decode'>('encode');
  
  // Encode state
  const [encodeInput, setEncodeInput] = useState('');
  const [encodeOutput, setEncodeOutput] = useState('');
  const [encodeCopied, setEncodeCopied] = useState(false);

  // Decode state
  const [decodeInput, setDecodeInput] = useState('');
  const [decodeOutput, setDecodeOutput] = useState('');
  const [decodeCopied, setDecodeCopied] = useState(false);
  const [decodeError, setDecodeError] = useState('');

  // URL encoding function
  const handleEncode = (text: string) => {
    try {
      if (!text) {
        setEncodeOutput('');
        return;
      }
      const encoded = encodeURIComponent(text);
      setEncodeOutput(encoded);
    } catch (error) {
      setEncodeOutput('Error: Invalid input for URL encoding');
      toast.error('Failed to encode URL');
    }
  };

  // URL decoding function
  const handleDecode = (text: string) => {
    try {
      if (!text) {
        setDecodeOutput('');
        setDecodeError('');
        return;
      }
      
      const decoded = decodeURIComponent(text);
      setDecodeOutput(decoded);
      setDecodeError('');
    } catch (error) {
      setDecodeOutput('');
      setDecodeError('Error: Invalid URL encoded input. Please check your data.');
    }
  };

  const handleEncodeInputChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const value = e.target.value;
    setEncodeInput(value);
    handleEncode(value);
  };

  const handleDecodeInputChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const value = e.target.value;
    setDecodeInput(value);
    handleDecode(value);
  };

  const copyToClipboard = async (text: string, type: 'encode' | 'decode') => {
    try {
      await navigator.clipboard.writeText(text);
      if (type === 'encode') {
        setEncodeCopied(true);
        setTimeout(() => setEncodeCopied(false), 2000);
      } else {
        setDecodeCopied(true);
        setTimeout(() => setDecodeCopied(false), 2000);
      }
      toast.success(`${type === 'encode' ? 'Encoded' : 'Decoded'} text copied to clipboard!`);
    } catch (error) {
      toast.error('Failed to copy to clipboard');
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 10 * 1024 * 1024) { // 10MB limit
        toast.error('File size must be less than 10MB');
        return;
      }
      const reader = new FileReader();
      reader.onload = (event) => {
        const content = event.target?.result as string;
        if (activeTab === 'encode') {
          setEncodeInput(content);
          handleEncode(content);
        } else {
          setDecodeInput(content);
          handleDecode(content);
        }
        toast.success('File uploaded successfully!');
      };
      reader.readAsText(file);
    }
  };

  const downloadResult = (content: string, filename: string) => {
    if (!content) {
      toast.error('No content to download');
      return;
    }
    const blob = new Blob([content], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    toast.success('File downloaded successfully!');
  };

  const clearAll = () => {
    if (activeTab === 'encode') {
      setEncodeInput('');
      setEncodeOutput('');
    } else {
      setDecodeInput('');
      setDecodeOutput('');
      setDecodeError('');
    }
    toast.success('Cleared successfully!');
  };

  // Helper function to detect if text is likely URL encoded
  const isLikelyURLEncoded = (text: string) => {
    return /%[0-9A-Fa-f]{2}/.test(text);
  };

  // Helper function to count encoded characters
  const countEncodedChars = (text: string) => {
    const matches = text.match(/%[0-9A-Fa-f]{2}/g);
    return matches ? matches.length : 0;
  };

  // Common URL encoding examples
  const urlExamples = [
    { original: 'Hello World!', encoded: 'Hello%20World%21' },
    { original: 'user@example.com', encoded: 'user%40example.com' },
    { original: 'price=$19.99', encoded: 'price%3D%2419.99' },
    { original: 'path/to/file', encoded: 'path%2Fto%2Ffile' }
  ];

  const loadExample = (example: typeof urlExamples[0], type: 'original' | 'encoded') => {
    if (type === 'original') {
      setActiveTab('encode');
      setEncodeInput(example.original);
      handleEncode(example.original);
    } else {
      setActiveTab('decode');
      setDecodeInput(example.encoded);
      handleDecode(example.encoded);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50/50 to-indigo-100/50 dark:from-blue-950/20 dark:to-indigo-950/20 py-8 sm:py-12 px-4 sm:px-6 lg:px-8">
      <div className="container mx-auto max-w-6xl">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold mb-4">
            URL Encoder Decoder Online
          </h1>
          <p className="text-base sm:text-lg text-muted-foreground max-w-3xl mx-auto">
            Encode text for safe use in URLs or decode URL-encoded strings back to plain text. 
            Perfect for query parameters, form data, and URL components.
          </p>
        </div>

        {/* Tab Navigation */}
        <div className="flex justify-center mb-8">
          <div className="bg-card rounded-xl shadow-lg border p-2">
            <div className="flex space-x-2">
              <button
                onClick={() => setActiveTab('encode')}
                className={`px-6 py-3 rounded-lg font-medium transition-colors ${
                  activeTab === 'encode'
                    ? 'bg-blue-500 text-white'
                    : 'text-blue-500 hover:bg-blue-50 dark:hover:bg-blue-950/30'
                }`}
              >
                URL Encoder
              </button>
              <button
                onClick={() => setActiveTab('decode')}
                className={`px-6 py-3 rounded-lg font-medium transition-colors ${
                  activeTab === 'decode'
                    ? 'bg-blue-500 text-white'
                    : 'text-blue-500 hover:bg-blue-50 dark:hover:bg-blue-950/30'
                }`}
              >
                URL Decoder
              </button>
            </div>
          </div>
        </div>

        {/* Encoder Tab */}
        {activeTab === 'encode' && (
          <div className="bg-card rounded-xl shadow-lg border p-6 sm:p-8">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              {/* Left Column - Input */}
              <div className="space-y-6">
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <label className="text-base sm:text-lg font-semibold text-blue-600 dark:text-blue-400">
                      Plain Text Input
                    </label>
                    <div className="flex items-center space-x-2">
                      <button
                        onClick={clearAll}
                        className="bg-gray-100 dark:bg-gray-900/30 text-gray-600 dark:text-gray-400 px-3 py-2 rounded-lg text-sm hover:bg-gray-200 dark:hover:bg-gray-900/50 transition-colors"
                      >
                        <Trash2 className="inline h-4 w-4 mr-1" />
                        Clear
                      </button>
                      <label className="cursor-pointer bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 px-3 py-2 rounded-lg text-sm hover:bg-blue-200 dark:hover:bg-blue-900/50 transition-colors">
                        <Upload className="inline h-4 w-4 mr-1 sm:mr-2" />
                        <span className="hidden sm:inline">Upload File</span>
                        <input
                          type="file"
                          className="hidden"
                          onChange={handleFileUpload}
                          accept=".txt,.json,.xml,.csv"
                        />
                      </label>
                    </div>
                  </div>
                  <textarea
                    value={encodeInput}
                    onChange={handleEncodeInputChange}
                    placeholder="Enter text to URL encode (e.g., Hello World! or user@example.com)"
                    className="w-full h-48 p-4 border rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent resize-none bg-background"
                  />
                  <p className="text-sm text-muted-foreground mt-2">
                    Characters: {encodeInput.length}
                  </p>
                </div>
              </div>

              {/* Right Column - Output */}
              <div className="space-y-6">
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <label className="text-base sm:text-lg font-semibold text-green-600 dark:text-green-400">
                      URL Encoded Output
                    </label>
                    {encodeOutput && (
                      <div className="flex items-center space-x-2">
                        <button
                          onClick={() => copyToClipboard(encodeOutput, 'encode')}
                          className="bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 px-3 py-2 rounded-lg text-sm hover:bg-blue-200 dark:hover:bg-blue-900/50 transition-colors"
                        >
                          {encodeCopied ? (
                            <>
                              <CheckCircle className="inline h-4 w-4 mr-1" />
                              Copied!
                            </>
                          ) : (
                            <>
                              <Copy className="inline h-4 w-4 mr-1" />
                              Copy
                            </>
                          )}
                        </button>
                        <button
                          onClick={() => downloadResult(encodeOutput, 'url-encoded.txt')}
                          className="bg-purple-100 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400 px-3 py-2 rounded-lg text-sm hover:bg-purple-200 dark:hover:bg-purple-900/50 transition-colors"
                        >
                          <Download className="inline h-4 w-4 mr-1" />
                          Download
                        </button>
                      </div>
                    )}
                  </div>
                  <div className="bg-muted/50 p-4 rounded-lg min-h-48">
                    {encodeOutput ? (
                      <code className="text-sm font-mono break-all text-green-700 dark:text-green-300">
                        {encodeOutput}
                      </code>
                    ) : (
                      <p className="text-muted-foreground text-sm">
                        URL encoded output will appear here...
                      </p>
                    )}
                  </div>
                  {encodeOutput && (
                    <div className="flex items-center justify-between mt-2">
                      <p className="text-sm text-muted-foreground">
                        Characters: {encodeOutput.length}
                      </p>
                      <p className="text-sm text-green-600 dark:text-green-400">
                        Encoded chars: {countEncodedChars(encodeOutput)}
                      </p>
                    </div>
                  )}
                </div>

                {/* Quick Test */}
                {encodeOutput && !encodeOutput.startsWith('Error:') && (
                  <div>
                    <h4 className="text-base font-semibold mb-3">Quick Test</h4>
                    <button
                      onClick={() => {
                        setActiveTab('decode');
                        setDecodeInput(encodeOutput);
                        handleDecode(encodeOutput);
                      }}
                      className="w-full bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 py-3 px-6 rounded-lg hover:bg-blue-200 dark:hover:bg-blue-900/50 transition-colors"
                    >
                      Test in Decoder
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Decoder Tab */}
        {activeTab === 'decode' && (
          <div className="bg-card rounded-xl shadow-lg border p-6 sm:p-8">
            {/* Input Section */}
            <div className="mb-8">
              <div className="flex items-center justify-between mb-4">
                <label className="text-base sm:text-lg font-semibold text-blue-600 dark:text-blue-400">
                  URL Encoded Input
                </label>
                <div className="flex items-center space-x-2">
                  <button
                    onClick={clearAll}
                    className="bg-gray-100 dark:bg-gray-900/30 text-gray-600 dark:text-gray-400 px-3 py-2 rounded-lg text-sm hover:bg-gray-200 dark:hover:bg-gray-900/50 transition-colors"
                  >
                    <Trash2 className="inline h-4 w-4 mr-1" />
                    Clear
                  </button>
                  <label className="cursor-pointer bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 px-3 py-2 rounded-lg text-sm hover:bg-blue-200 dark:hover:bg-blue-900/50 transition-colors">
                    <Upload className="inline h-4 w-4 mr-1 sm:mr-2" />
                    <span className="hidden sm:inline">Upload File</span>
                    <input
                      type="file"
                      className="hidden"
                      onChange={handleFileUpload}
                      accept=".txt,.json,.xml,.csv"
                    />
                  </label>
                </div>
              </div>
              <textarea
                value={decodeInput}
                onChange={handleDecodeInputChange}
                placeholder="Paste your URL encoded text here (e.g., Hello%20World%21 or user%40example.com)"
                className="w-full h-32 p-4 border rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent resize-none bg-background font-mono text-sm"
              />
              <div className="flex items-center justify-between mt-2">
                <p className="text-sm text-muted-foreground">
                  Characters: {decodeInput.length}
                </p>
                {decodeInput && (
                  <p className={`text-sm ${
                    isLikelyURLEncoded(decodeInput) 
                      ? 'text-green-600 dark:text-green-400' 
                      : 'text-amber-600 dark:text-amber-400'
                  }`}>
                    {isLikelyURLEncoded(decodeInput) 
                      ? `✓ ${countEncodedChars(decodeInput)} encoded chars found` 
                      : '⚠ No URL encoding detected'
                    }
                  </p>
                )}
              </div>
            </div>

            {/* Decoded Output */}
            {decodeInput && (
              <div className="space-y-6">
                {!decodeError ? (
                  <>
                    <div>
                      <div className="flex items-center justify-between mb-4">
                        <h3 className="text-lg font-semibold text-green-600 dark:text-green-400">
                          Decoded Output
                        </h3>
                        <button
                          onClick={() => copyToClipboard(decodeOutput, 'decode')}
                          className="bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 px-3 py-2 rounded-lg text-sm hover:bg-blue-200 dark:hover:bg-blue-900/50 transition-colors"
                        >
                          {decodeCopied ? (
                            <>
                              <CheckCircle className="inline h-4 w-4 mr-1" />
                              Copied!
                            </>
                          ) : (
                            <>
                              <Copy className="inline h-4 w-4 mr-1" />
                              Copy
                            </>
                          )}
                        </button>
                      </div>
                      <pre className="bg-muted/50 p-4 rounded-lg overflow-x-auto text-sm">
                        {decodeOutput}
                      </pre>
                    </div>

                    {/* Download Button */}
                    <div className="text-center">
                      <button
                        onClick={() => downloadResult(decodeOutput, 'url-decoded.txt')}
                        className="bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400 px-6 py-3 rounded-lg font-medium hover:bg-green-200 dark:hover:bg-green-900/50 transition-colors"
                      >
                        <Download className="inline h-4 w-4 mr-2" />
                        Download Decoded Text
                      </button>
                    </div>
                  </>
                ) : (
                  <div className="bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-800 rounded-lg p-4">
                    <h3 className="text-lg font-semibold text-red-800 dark:text-red-200 mb-2">
                      Decoding Error
                    </h3>
                    <p className="text-red-700 dark:text-red-300">
                      {decodeError}
                    </p>
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {/* Examples Section */}
        <div className="mt-8 bg-card rounded-xl shadow-lg border p-6 sm:p-8">
          <h2 className="text-xl sm:text-2xl font-bold mb-6">
            Common URL Encoding Examples
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {urlExamples.map((example, index) => (
              <div key={index} className="bg-muted/50 p-4 rounded-lg">
                <div className="space-y-3">
                  <div>
                    <span className="text-sm font-medium text-muted-foreground mb-1 block">Original:</span>
                    <div className="font-mono text-sm bg-background p-3 rounded border">
                      {example.original}
                    </div>
                  </div>
                  <div>
                    <span className="text-sm font-medium text-muted-foreground mb-1 block">Encoded:</span>
                    <div className="font-mono text-sm bg-background p-3 rounded border">
                      {example.encoded}
                    </div>
                  </div>
                  <div className="flex gap-2 pt-2">
                    <button
                      onClick={() => loadExample(example, 'original')}
                      className="flex-1 text-xs bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 px-3 py-2 rounded hover:bg-blue-200 dark:hover:bg-blue-900/50 transition-colors"
                    >
                      Try Encoding
                    </button>
                    <button
                      onClick={() => loadExample(example, 'encoded')}
                      className="flex-1 text-xs bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400 px-3 py-2 rounded hover:bg-green-200 dark:hover:bg-green-900/50 transition-colors"
                    >
                      Try Decoding
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Information Section */}
        <div className="mt-8 sm:mt-12 bg-card rounded-xl shadow-lg border p-6 sm:p-8">
          <h2 className="text-xl sm:text-2xl font-bold mb-6">
            About URL Encoding & Decoding
          </h2>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 lg:gap-8">
            <div>
              <h3 className="text-base sm:text-lg font-semibold mb-3">What is URL Encoding?</h3>
              <p className="text-muted-foreground mb-4 text-sm sm:text-base">
                URL encoding (percent-encoding) converts characters into a format that can be transmitted over the Internet. 
                Special characters are replaced with a percent sign (%) followed by two hexadecimal digits representing 
                the character's ASCII code.
              </p>
              <h3 className="text-base sm:text-lg font-semibold mb-3">Common Characters</h3>
              <ul className="text-muted-foreground space-y-1 text-sm sm:text-base">
                <li>• Space → %20</li>
                <li>• @ → %40</li>
                <li>• # → %23</li>
                <li>• & → %26</li>
                <li>• = → %3D</li>
                <li>• ? → %3F</li>
              </ul>
            </div>
            <div>
              <h3 className="text-base sm:text-lg font-semibold mb-3">Use Cases</h3>
              <ul className="text-muted-foreground space-y-1 text-sm sm:text-base mb-4">
                <li>• Query string parameters</li>
                <li>• Form data submission</li>
                <li>• API request parameters</li>
                <li>• Search engine URLs</li>
                <li>• File names in URLs</li>
                <li>• Email addresses in links</li>
              </ul>
              <h3 className="text-base sm:text-lg font-semibold mb-3">Security Notes</h3>
              <p className="text-muted-foreground text-sm sm:text-base">
                This tool processes data locally in your browser. Your data is not sent to any servers. 
                URL encoding is essential for web security and preventing injection attacks.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
