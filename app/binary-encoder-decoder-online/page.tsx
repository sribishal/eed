'use client';

import { useState } from 'react';
import { Copy, Upload, Download, CheckCircle, ArrowRightLeft, Binary, Type } from 'lucide-react';
import { toast } from 'sonner';

export default function BinaryEncodeDecode() {
  const [input, setInput] = useState('');
  const [output, setOutput] = useState('');
  const [mode, setMode] = useState('encode');
  const [encoding, setEncoding] = useState('utf8');
  const [format, setFormat] = useState('spaced');
  const [copied, setCopied] = useState(false);

  // Text to Binary conversion
  const textToBinary = (text: string, encoding: string): string => {
    if (!text) return '';
    
    try {
      let bytes: number[] = [];
      
      switch (encoding) {
        case 'utf8':
          // UTF-8 encoding
          const utf8Bytes = new TextEncoder().encode(text);
          bytes = Array.from(utf8Bytes);
          break;
        case 'ascii':
          // ASCII encoding (0-127)
          for (let i = 0; i < text.length; i++) {
            const charCode = text.charCodeAt(i);
            if (charCode > 127) {
              throw new Error(`Non-ASCII character found: ${text[i]}`);
            }
            bytes.push(charCode);
          }
          break;
        case 'latin1':
          // Latin-1 encoding (0-255)
          for (let i = 0; i < text.length; i++) {
            const charCode = text.charCodeAt(i);
            if (charCode > 255) {
              throw new Error(`Character outside Latin-1 range: ${text[i]}`);
            }
            bytes.push(charCode);
          }
          break;
        case 'utf16':
          // UTF-16 encoding (little endian)
          for (let i = 0; i < text.length; i++) {
            const charCode = text.charCodeAt(i);
            bytes.push(charCode & 0xFF); // Low byte
            bytes.push((charCode >> 8) & 0xFF); // High byte
          }
          break;
        default:
          bytes = Array.from(new TextEncoder().encode(text));
      }
      
      // Convert bytes to binary
      const binaryStrings = bytes.map(byte => byte.toString(2).padStart(8, '0'));
      
      // Format output
      switch (format) {
        case 'spaced':
          return binaryStrings.join(' ');
        case 'grouped4':
          return binaryStrings.map(bin => bin.match(/.{1,4}/g)?.join(' ') || bin).join('  ');
        case 'continuous':
          return binaryStrings.join('');
        case 'newlines':
          return binaryStrings.join('\n');
        default:
          return binaryStrings.join(' ');
      }
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Encoding error');
      return '';
    }
  };

  // Binary to Text conversion
  const binaryToText = (binary: string, encoding: string): string => {
    if (!binary) return '';
    
    try {
      // Clean and validate binary string
      const cleanBinary = binary.replace(/[^01]/g, '');
      
      if (cleanBinary.length === 0) {
        throw new Error('No valid binary digits found');
      }
      
      if (cleanBinary.length % 8 !== 0) {
        throw new Error('Binary string length must be a multiple of 8');
      }
      
      // Split into 8-bit chunks
      const bytes: number[] = [];
      for (let i = 0; i < cleanBinary.length; i += 8) {
        const byte = cleanBinary.substr(i, 8);
        bytes.push(parseInt(byte, 2));
      }
      
      // Convert bytes to text based on encoding
      switch (encoding) {
        case 'utf8':
          return new TextDecoder('utf-8').decode(new Uint8Array(bytes));
        case 'ascii':
          return bytes.map(byte => {
            if (byte > 127) {
              throw new Error(`Invalid ASCII byte: ${byte}`);
            }
            return String.fromCharCode(byte);
          }).join('');
        case 'latin1':
          return bytes.map(byte => String.fromCharCode(byte)).join('');
        case 'utf16':
          // UTF-16 decoding (little endian)
          if (bytes.length % 2 !== 0) {
            throw new Error('UTF-16 requires an even number of bytes');
          }
          let result = '';
          for (let i = 0; i < bytes.length; i += 2) {
            const charCode = bytes[i] | (bytes[i + 1] << 8);
            result += String.fromCharCode(charCode);
          }
          return result;
        default:
          return new TextDecoder('utf-8').decode(new Uint8Array(bytes));
      }
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Decoding error');
      return '';
    }
  };

  // Main processing function
  const processText = (text: string): string => {
    if (!text.trim()) return '';

    if (mode === 'encode') {
      return textToBinary(text, encoding);
    } else {
      return binaryToText(text, encoding);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const value = e.target.value;
    setInput(value);
    const processed = processText(value);
    setOutput(processed);
  };

  const handleModeChange = (newMode: string) => {
    setMode(newMode);
    if (input.trim()) {
      const processed = processText(input);
      setOutput(processed);
    }
  };

  const handleEncodingChange = (newEncoding: string) => {
    setEncoding(newEncoding);
    if (input.trim()) {
      const processed = processText(input);
      setOutput(processed);
    }
  };

  const handleFormatChange = (newFormat: string) => {
    setFormat(newFormat);
    if (input.trim() && mode === 'encode') {
      const processed = processText(input);
      setOutput(processed);
    }
  };

  const swapInputOutput = () => {
    const temp = input;
    setInput(output);
    setOutput(temp);
    setMode(mode === 'encode' ? 'decode' : 'encode');
    toast.success('Input and output swapped!');
  };

  const copyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(output);
      setCopied(true);
      toast.success('Copied to clipboard!');
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      console.error('Failed to copy to clipboard:', error);
      toast.error('Failed to copy to clipboard');
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) { // 5MB limit for binary operations
        toast.error('File size must be less than 5MB');
        return;
      }
      const reader = new FileReader();
      reader.onload = (event) => {
        const content = event.target?.result as string;
        setInput(content);
        const processed = processText(content);
        setOutput(processed);
        toast.success('File uploaded successfully!');
      };
      reader.readAsText(file);
    }
  };

  const downloadResult = () => {
    if (!output) {
      toast.error('No content to download');
      return;
    }
    const blob = new Blob([output], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `binary-${mode}-${encoding}-${format}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    toast.success('File downloaded successfully!');
  };

  // Generate sample data
  const generateSample = () => {
    const samples = {
      encode: 'Hello, World!',
      decode: '01001000 01100101 01101100 01101100 01101111 00101100 00100000 01010111 01101111 01110010 01101100 01100100 00100001'
    };
    const sample = samples[mode as keyof typeof samples];
    setInput(sample);
    const processed = processText(sample);
    setOutput(processed);
    toast.success('Sample data loaded!');
  };

  return (
    <div className="min-h-screen bg-cyan-50 dark:bg-cyan-950 py-8 sm:py-12 px-4 sm:px-6 lg:px-8">
      <div className="container mx-auto max-w-6xl">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold mb-4">
            Binary Encoder Decoder Online
          </h1>
          <p className="text-base sm:text-lg text-muted-foreground max-w-3xl mx-auto">
            Convert text to binary and binary to text with support for multiple character encodings. 
            Perfect for programming, data analysis, and understanding how computers store text.
          </p>
        </div>

        {/* Tool Interface */}
        <div className="bg-card rounded-xl shadow-lg border p-6 sm:p-8">
          {/* Mode Selection */}
          <div className="mb-6">
            <label className="text-base sm:text-lg font-semibold mb-3 block">
              Operation Mode
            </label>
            <div className="flex flex-wrap gap-2 sm:gap-3">
              <button
                onClick={() => handleModeChange('encode')}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                  mode === 'encode'
                    ? 'bg-cyan-500 text-white'
                    : 'bg-cyan-100 dark:bg-cyan-900/30 text-cyan-600 dark:text-cyan-400 hover:bg-cyan-200 dark:hover:bg-cyan-900/50'
                }`}
              >
                <Binary className="inline h-4 w-4 mr-2" />
                Text to Binary
              </button>
              <button
                onClick={() => handleModeChange('decode')}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                  mode === 'decode'
                    ? 'bg-cyan-500 text-white'
                    : 'bg-cyan-100 dark:bg-cyan-900/30 text-cyan-600 dark:text-cyan-400 hover:bg-cyan-200 dark:hover:bg-cyan-900/50'
                }`}
              >
                <Type className="inline h-4 w-4 mr-2" />
                Binary to Text
              </button>
            </div>
          </div>

          {/* Encoding Selection */}
          <div className="mb-6">
            <label className="text-base sm:text-lg font-semibold mb-3 block">
              Character Encoding
            </label>
            <div className="flex flex-wrap gap-2 sm:gap-3">
              <button
                onClick={() => handleEncodingChange('utf8')}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                  encoding === 'utf8'
                    ? 'bg-blue-500 text-white'
                    : 'bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 hover:bg-blue-200 dark:hover:bg-blue-900/50'
                }`}
              >
                UTF-8
              </button>
              <button
                onClick={() => handleEncodingChange('ascii')}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                  encoding === 'ascii'
                    ? 'bg-blue-500 text-white'
                    : 'bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 hover:bg-blue-200 dark:hover:bg-blue-900/50'
                }`}
              >
                ASCII
              </button>
              <button
                onClick={() => handleEncodingChange('latin1')}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                  encoding === 'latin1'
                    ? 'bg-blue-500 text-white'
                    : 'bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 hover:bg-blue-200 dark:hover:bg-blue-900/50'
                }`}
              >
                Latin-1
              </button>
              <button
                onClick={() => handleEncodingChange('utf16')}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                  encoding === 'utf16'
                    ? 'bg-blue-500 text-white'
                    : 'bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 hover:bg-blue-200 dark:hover:bg-blue-900/50'
                }`}
              >
                UTF-16
              </button>
            </div>
          </div>

          {/* Format Selection (only for encoding) */}
          {mode === 'encode' && (
            <div className="mb-6">
              <label className="text-base sm:text-lg font-semibold mb-3 block">
                Binary Format
              </label>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                <button
                  onClick={() => handleFormatChange('spaced')}
                  className={`px-3 py-2 rounded-lg text-xs font-medium transition-colors ${
                    format === 'spaced'
                      ? 'bg-teal-500 text-white'
                      : 'bg-teal-100 dark:bg-teal-900/30 text-teal-600 dark:text-teal-400 hover:bg-teal-200 dark:hover:bg-teal-900/50'
                  }`}
                >
                  Spaced
                </button>
                <button
                  onClick={() => handleFormatChange('grouped4')}
                  className={`px-3 py-2 rounded-lg text-xs font-medium transition-colors ${
                    format === 'grouped4'
                      ? 'bg-teal-500 text-white'
                      : 'bg-teal-100 dark:bg-teal-900/30 text-teal-600 dark:text-teal-400 hover:bg-teal-200 dark:hover:bg-teal-900/50'
                  }`}
                >
                  Grouped 4
                </button>
                <button
                  onClick={() => handleFormatChange('continuous')}
                  className={`px-3 py-2 rounded-lg text-xs font-medium transition-colors ${
                    format === 'continuous'
                      ? 'bg-teal-500 text-white'
                      : 'bg-teal-100 dark:bg-teal-900/30 text-teal-600 dark:text-teal-400 hover:bg-teal-200 dark:hover:bg-teal-900/50'
                  }`}
                >
                  Continuous
                </button>
                <button
                  onClick={() => handleFormatChange('newlines')}
                  className={`px-3 py-2 rounded-lg text-xs font-medium transition-colors ${
                    format === 'newlines'
                      ? 'bg-teal-500 text-white'
                      : 'bg-teal-100 dark:bg-teal-900/30 text-teal-600 dark:text-teal-400 hover:bg-teal-200 dark:hover:bg-teal-900/50'
                  }`}
                >
                  New Lines
                </button>
              </div>
            </div>
          )}

          {/* Sample Data Button */}
          <div className="mb-6">
            <button
              onClick={generateSample}
              className="bg-gradient-to-r from-cyan-500 to-blue-500 text-white px-4 py-2 rounded-lg text-sm font-medium hover:from-cyan-600 hover:to-blue-600 transition-colors"
            >
              Load Sample Data
            </button>
          </div>

          <div className="grid grid-cols-1 xl:grid-cols-2 gap-6 lg:gap-8">
            {/* Input Section */}
            <div>
              <div className="flex items-center justify-between mb-4">
                <label className="text-base sm:text-lg font-semibold">
                  {mode === 'encode' ? 'Input Text' : 'Input Binary'}
                </label>
                <div className="flex items-center space-x-2">
                  <label className="cursor-pointer bg-cyan-100 dark:bg-cyan-900/30 text-cyan-600 dark:text-cyan-400 px-3 py-2 rounded-lg text-sm hover:bg-cyan-200 dark:hover:bg-cyan-900/50 transition-colors">
                    <Upload className="inline h-4 w-4 mr-1 sm:mr-2" />
                    <span className="hidden sm:inline">Upload File</span>
                    <input
                      type="file"
                      className="hidden"
                      onChange={handleFileUpload}
                      accept=".txt,.bin"
                    />
                  </label>
                </div>
              </div>
              <textarea
                value={input}
                onChange={handleInputChange}
                placeholder={mode === 'encode' ? 'Enter text to convert to binary...' : 'Enter binary digits (0s and 1s) to convert to text...'}
                className="w-full h-48 sm:h-64 p-4 border rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent resize-none bg-background font-mono"
              />
              <p className="text-sm text-muted-foreground mt-2">
                {mode === 'encode' ? `Characters: ${input.length}` : `Binary digits: ${input.replace(/[^01]/g, '').length}`}
              </p>
            </div>

            {/* Output Section */}
            <div>
              <div className="flex items-center justify-between mb-4">
                <label className="text-base sm:text-lg font-semibold">
                  {mode === 'encode' ? 'Output Binary' : 'Output Text'}
                </label>
                <div className="flex items-center space-x-1 sm:space-x-2">
                  <button
                    onClick={swapInputOutput}
                    disabled={!output}
                    className="bg-orange-100 dark:bg-orange-900/30 text-orange-600 dark:text-orange-400 px-3 py-2 rounded-lg text-sm hover:bg-orange-200 dark:hover:bg-orange-900/50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <ArrowRightLeft className="inline h-4 w-4 sm:mr-1" />
                    <span className="hidden sm:inline">Swap</span>
                  </button>
                  <button
                    onClick={copyToClipboard}
                    disabled={!output}
                    className="bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400 px-3 py-2 rounded-lg text-sm hover:bg-green-200 dark:hover:bg-green-900/50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {copied ? (
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
                    onClick={downloadResult}
                    disabled={!output}
                    className="bg-purple-100 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400 px-3 py-2 rounded-lg text-sm hover:bg-purple-200 dark:hover:bg-purple-900/50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <Download className="inline h-4 w-4 sm:mr-1" />
                    <span className="hidden sm:inline">Download</span>
                  </button>
                </div>
              </div>
              <div className="bg-muted/50 rounded-lg p-4 min-h-[192px] sm:min-h-[256px] overflow-y-auto">
                <code className="text-sm font-mono break-all whitespace-pre-wrap">
                  {output || `${mode === 'encode' ? 'Binary' : 'Text'} output will appear here...`}
                </code>
              </div>
              <p className="text-sm text-muted-foreground mt-2">
                {mode === 'encode' 
                  ? `Binary digits: ${output.replace(/[^01]/g, '').length}` 
                  : `Characters: ${output.length}`
                }
              </p>
            </div>
          </div>
        </div>

        {/* Information Section */}
        <div className="mt-8 sm:mt-12 bg-card rounded-xl shadow-lg border p-6 sm:p-8">
          <h2 className="text-xl sm:text-2xl font-bold mb-6">
            About Binary Encoding Decoding
          </h2>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 lg:gap-8">
            <div>
              <h3 className="text-base sm:text-lg font-semibold mb-3">What is Binary Encoding?</h3>
              <p className="text-muted-foreground mb-4 text-sm sm:text-base">
                Binary encoding converts text characters into their binary (base-2) representation using 0s and 1s. 
                This is how computers internally store and process all text data.
              </p>
              <h3 className="text-base sm:text-lg font-semibold mb-3">Character Encodings</h3>
              <ul className="text-muted-foreground space-y-1 text-sm sm:text-base">
                <li>• <strong>UTF-8:</strong> Universal encoding (1-4 bytes per character)</li>
                <li>• <strong>ASCII:</strong> 7-bit encoding (0-127 characters)</li>
                <li>• <strong>Latin-1:</strong> 8-bit encoding (0-255 characters)</li>
                <li>• <strong>UTF-16:</strong> 16-bit encoding (2 bytes per character)</li>
              </ul>
            </div>
            <div>
              <h3 className="text-base sm:text-lg font-semibold mb-3">Binary Formats</h3>
              <ul className="text-muted-foreground space-y-1 text-sm sm:text-base mb-4">
                <li>• <strong>Spaced:</strong> 01001000 01100101</li>
                <li>• <strong>Grouped 4:</strong> 0100 1000 0110 0101</li>
                <li>• <strong>Continuous:</strong> 0100100001100101</li>
                <li>• <strong>New Lines:</strong> Each byte on new line</li>
              </ul>
              <h3 className="text-base sm:text-lg font-semibold mb-3">Features</h3>
              <ul className="text-muted-foreground space-y-1 text-sm sm:text-base">
                <li>• Multiple character encodings</li>
                <li>• Various binary formats</li>
                <li>• Input/output swapping</li>
                <li>• Sample data generator</li>
                <li>• Error validation</li>
                <li>• File upload/download</li>
                <li>• Real-time conversion</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
