'use client';

import { useState } from 'react';
import { Copy, Upload, Download, CheckCircle, Code, FileText } from 'lucide-react';
import { toast } from 'sonner';

export default function Base64EncodeDecode() {
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

  // Base64 encoding function
  const handleEncode = (text: string) => {
    try {
      if (!text) {
        setEncodeOutput('');
        return;
      }
      const encoded = btoa(unescape(encodeURIComponent(text)));
      setEncodeOutput(encoded);
    } catch (error) {
      setEncodeOutput('Error: Invalid input for Base64 encoding');
    }
  };

  // Base64 decoding function
  const handleDecode = (text: string) => {
    try {
      if (!text) {
        setDecodeOutput('');
        setDecodeError('');
        return;
      }
      
      // Clean the input (remove whitespace and newlines)
      const cleanInput = text.replace(/\s/g, '');
      
      // Validate Base64 format
      const base64Regex = /^[A-Za-z0-9+/]*={0,2}$/;
      if (!base64Regex.test(cleanInput)) {
        throw new Error('Invalid Base64 format');
      }
      
      const decoded = decodeURIComponent(escape(atob(cleanInput)));
      setDecodeOutput(decoded);
      setDecodeError('');
    } catch (error) {
      setDecodeOutput('');
      setDecodeError('Error: Invalid Base64 input. Please check your data.');
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

  const copyToClipboard = async (text: string, isEncode: boolean) => {
    try {
      await navigator.clipboard.writeText(text);
      if (isEncode) {
        setEncodeCopied(true);
        setTimeout(() => setEncodeCopied(false), 2000);
      } else {
        setDecodeCopied(true);
        setTimeout(() => setDecodeCopied(false), 2000);
      }
      toast.success('Copied to clipboard!');
    } catch (error) {
      console.error('Failed to copy to clipboard:', error);
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

  // Helper function to detect if text is likely Base64
  const isLikelyBase64 = (text: string) => {
    const base64Regex = /^[A-Za-z0-9+/]*={0,2}$/;
    return base64Regex.test(text.replace(/\s/g, '')) && text.length > 4;
  };

  const currentInput = activeTab === 'encode' ? encodeInput : decodeInput;
  const currentOutput = activeTab === 'encode' ? encodeOutput : decodeOutput;
  const currentCopied = activeTab === 'encode' ? encodeCopied : decodeCopied;

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50/50 to-indigo-100/50 dark:from-blue-950/20 dark:to-indigo-950/20 py-8 sm:py-12 px-4 sm:px-6 lg:px-8">
      <div className="container mx-auto max-w-6xl">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold mb-4">
            Base64 Encoder & Decoder Online
          </h1>
          <p className="text-base sm:text-lg text-muted-foreground max-w-3xl mx-auto">
            Convert text to Base64 encoded format or decode Base64 data back to plain text. 
            Perfect for data transmission, web development, and API integration.
          </p>
        </div>

        {/* Tab Navigation */}
        <div className="mb-8">
          <div className="flex bg-muted p-1 rounded-lg max-w-md mx-auto">
            <button
              onClick={() => setActiveTab('encode')}
              className={`flex-1 py-3 px-4 rounded-md text-sm font-medium transition-all duration-200 ${
                activeTab === 'encode'
                  ? 'bg-background shadow-sm text-foreground'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              <Code className="inline h-4 w-4 mr-2" />
              Encode
            </button>
            <button
              onClick={() => setActiveTab('decode')}
              className={`flex-1 py-3 px-4 rounded-md text-sm font-medium transition-all duration-200 ${
                activeTab === 'decode'
                  ? 'bg-background shadow-sm text-foreground'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              <FileText className="inline h-4 w-4 mr-2" />
              Decode
            </button>
          </div>
        </div>

        {/* Tool Interface */}
        <div className="bg-card rounded-xl shadow-lg border p-6 sm:p-8">
          <div className="grid grid-cols-1 xl:grid-cols-2 gap-6 lg:gap-8">
            {/* Input Section */}
            <div>
              <div className="flex items-center justify-between mb-4">
                <label className="text-base sm:text-lg font-semibold">
                  {activeTab === 'encode' ? 'Input (Plain Text)' : 'Input (Base64 Data)'}
                </label>
                <div className="flex items-center space-x-2">
                  <button
                    onClick={clearAll}
                    className="bg-gray-100 dark:bg-gray-900/30 text-gray-600 dark:text-gray-400 px-3 py-2 rounded-lg text-sm hover:bg-gray-200 dark:hover:bg-gray-900/50 transition-colors"
                  >
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
                value={currentInput}
                onChange={activeTab === 'encode' ? handleEncodeInputChange : handleDecodeInputChange}
                placeholder={
                  activeTab === 'encode' 
                    ? 'Enter text to encode in Base64 format...' 
                    : 'Enter Base64 encoded data to decode...'
                }
                className="w-full h-48 sm:h-64 p-4 border rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent resize-none bg-background"
              />
              <div className="flex items-center justify-between mt-2">
                <p className="text-sm text-muted-foreground">
                  Characters: {currentInput.length}
                </p>
                {activeTab === 'decode' && currentInput && (
                  <p className={`text-sm ${
                    isLikelyBase64(currentInput) 
                      ? 'text-green-600 dark:text-green-400' 
                      : 'text-amber-600 dark:text-amber-400'
                  }`}>
                    {isLikelyBase64(currentInput) ? '✓ Valid Base64 format' : '⚠ Check Base64 format'}
                  </p>
                )}
              </div>
              {activeTab === 'decode' && decodeError && (
                <p className="text-sm text-red-500 mt-2">{decodeError}</p>
              )}
            </div>

            {/* Output Section */}
            <div>
              <div className="flex items-center justify-between mb-4">
                <label className="text-base sm:text-lg font-semibold">
                  {activeTab === 'encode' ? 'Output (Base64 Encoded)' : 'Output (Plain Text)'}
                </label>
                <div className="flex items-center space-x-1 sm:space-x-2">
                  <button
                    onClick={() => copyToClipboard(currentOutput, activeTab === 'encode')}
                    disabled={!currentOutput}
                    className="bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400 px-3 py-2 rounded-lg text-sm hover:bg-green-200 dark:hover:bg-green-900/50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {currentCopied ? (
                      <>
                        <CheckCircle className="inline h-4 w-4 sm:mr-1" />
                        <span className="hidden sm:inline">Copied!</span>
                      </>
                    ) : (
                      <>
                        <Copy className="inline h-4 w-4 sm:mr-1" />
                        <span className="hidden sm:inline">Copy</span>
                      </>
                    )}
                  </button>
                  <button
                    onClick={() => downloadResult(
                      currentOutput, 
                      activeTab === 'encode' ? 'base64-encoded.txt' : 'base64-decoded.txt'
                    )}
                    disabled={!currentOutput}
                    className="bg-purple-100 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400 px-3 py-2 rounded-lg text-sm hover:bg-purple-200 dark:hover:bg-purple-900/50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <Download className="inline h-4 w-4 sm:mr-1" />
                    <span className="hidden sm:inline">Download</span>
                  </button>
                </div>
              </div>
              <textarea
                value={currentOutput}
                readOnly
                placeholder={
                  activeTab === 'encode' 
                    ? 'Base64 encoded output will appear here...' 
                    : 'Decoded plain text will appear here...'
                }
                className={`w-full h-48 sm:h-64 p-4 border rounded-lg bg-muted/50 resize-none text-sm ${
                  activeTab === 'encode' ? 'font-mono' : ''
                }`}
              />
              <div className="flex items-center justify-between mt-2">
                <p className="text-sm text-muted-foreground">
                  Characters: {currentOutput.length}
                </p>
                {currentOutput && activeTab === 'encode' && (
                  <p className="text-sm text-blue-600 dark:text-blue-400">
                    Size increase: {Math.round(((currentOutput.length - currentInput.length) / currentInput.length) * 100)}%
                  </p>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Quick Actions */}
        {currentOutput && (
          <div className="mt-6 bg-card rounded-xl shadow-lg border p-4">
            <h3 className="text-lg font-semibold mb-3">Quick Actions</h3>
            <div className="flex flex-wrap gap-3">
              <button
                onClick={() => {
                  if (activeTab === 'encode') {
                    setActiveTab('decode');
                    setDecodeInput(currentOutput);
                    handleDecode(currentOutput);
                  } else {
                    setActiveTab('encode');
                    setEncodeInput(currentOutput);
                    handleEncode(currentOutput);
                  }
                }}
                className="bg-indigo-100 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 px-4 py-2 rounded-lg text-sm hover:bg-indigo-200 dark:hover:bg-indigo-900/50 transition-colors"
              >
                Switch to {activeTab === 'encode' ? 'Decode' : 'Encode'} with Result
              </button>
            </div>
          </div>
        )}

        {/* Information Section */}
        <div className="mt-8 sm:mt-12 bg-card rounded-xl shadow-lg border p-6 sm:p-8">
          <h2 className="text-xl sm:text-2xl font-bold mb-6">
            About Base64 Encoding & Decoding
          </h2>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 lg:gap-8">
            <div>
              <h3 className="text-base sm:text-lg font-semibold mb-3">What is Base64?</h3>
              <p className="text-muted-foreground mb-4 text-sm sm:text-base">
                Base64 is an encoding scheme that converts binary data into ASCII text format using 
                64 printable characters. It's designed to carry data in environments that can only 
                handle text safely.
              </p>
              <h3 className="text-base sm:text-lg font-semibold mb-3">How it Works</h3>
              <ul className="text-muted-foreground space-y-1 text-sm sm:text-base">
                <li>• Uses 64 characters: A-Z, a-z, 0-9, +, /</li>
                <li>• Groups input into 3-byte chunks</li>
                <li>• Converts to 4 Base64 characters</li>
                <li>• Adds padding (=) if needed</li>
              </ul>
            </div>
            <div>
              <h3 className="text-base sm:text-lg font-semibold mb-3">Common Use Cases</h3>
              <ul className="text-muted-foreground space-y-1 text-sm sm:text-base mb-4">
                <li>• Email attachments (MIME encoding)</li>
                <li>• Embedding images in HTML/CSS</li>
                <li>• API data transmission</li>
                <li>• Data URLs in web applications</li>
                <li>• Authentication tokens</li>
                <li>• Binary data storage in text formats</li>
              </ul>
              <h3 className="text-base sm:text-lg font-semibold mb-3">Features</h3>
              <ul className="text-muted-foreground space-y-1 text-sm sm:text-base">
                <li>• Real-time encoding/decoding</li>
                <li>• Format validation for Base64</li>
                <li>• File upload support</li>
                <li>• Quick switch between modes</li>
                <li>• Size comparison display</li>
                <li>• Unicode text support</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
