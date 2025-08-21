'use client';

import { useState } from 'react';
import { Copy, Upload, Download, CheckCircle, ArrowRightLeft, AlertCircle, FileText, Code, Hash } from 'lucide-react';
import { toast } from 'sonner';

// Base58 alphabet (excludes 0, O, I, l)
const ALPHABET = '123456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz';
const BASE = ALPHABET.length;

export default function Base58Converter() {
  const [input, setInput] = useState('');
  const [output, setOutput] = useState('');
  const [mode, setMode] = useState('encode');
  const [encodingFormat, setEncodingFormat] = useState('text');
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState('');

  // Base58 Encoding Logic
  const encode = (buffer: Uint8Array): string => {
    if (buffer.length === 0) return '';

    let digits = [0];
    for (let i = 0; i < buffer.length; i++) {
      for (let j = 0; j < digits.length; j++) {
        digits[j] <<= 8;
      }
      digits[0] += buffer[i];
      let carry = 0;
      for (let j = 0; j < digits.length; j++) {
        digits[j] += carry;
        carry = (digits[j] / BASE) | 0;
        digits[j] %= BASE;
      }
      while (carry > 0) {
        digits.push(carry % BASE);
        carry = (carry / BASE) | 0;
      }
    }

    // Handle leading zeros
    for (let i = 0; i < buffer.length && buffer[i] === 0; i++) {
      digits.push(0);
    }

    return digits.reverse().map(digit => ALPHABET[digit]).join('');
  };

  // Base58 Decoding Logic
  const decode = (str: string): Uint8Array => {
    if (str.length === 0) return new Uint8Array();

    const bytes = [0];
    for (let i = 0; i < str.length; i++) {
      const char = str[i];
      const value = ALPHABET.indexOf(char);
      if (value === -1) {
        throw new Error(`Invalid Base58 character: ${char}`);
      }

      for (let j = 0; j < bytes.length; j++) {
        bytes[j] *= BASE;
      }
      bytes[0] += value;

      let carry = 0;
      for (let j = 0; j < bytes.length; ++j) {
        bytes[j] += carry;
        carry = bytes[j] >> 8;
        bytes[j] &= 0xff;
      }
      while (carry > 0) {
        bytes.push(carry & 0xff);
        carry >>= 8;
      }
    }

    // Handle leading ones
    for (let i = 0; i < str.length && str[i] === '1'; i++) {
      bytes.push(0);
    }

    return new Uint8Array(bytes.reverse());
  };

  // Convert hex string to Uint8Array
  const hexToUint8Array = (hex: string): Uint8Array => {
    const cleanHex = hex.replace(/[^0-9a-fA-F]/g, '');
    if (cleanHex.length % 2 !== 0) {
      throw new Error('Invalid hex string length');
    }
    const result = new Uint8Array(cleanHex.length / 2);
    for (let i = 0; i < cleanHex.length; i += 2) {
      result[i / 2] = parseInt(cleanHex.substr(i, 2), 16);
    }
    return result;
  };

  // Convert Uint8Array to hex string
  const uint8ArrayToHex = (buffer: Uint8Array): string => {
    return Array.from(buffer).map(b => b.toString(16).padStart(2, '0')).join('');
  };

  const processText = (text: string): string => {
    if (!text.trim()) return '';
    setError('');

    try {
      if (mode === 'encode') {
        let buffer: Uint8Array;
        
        switch (encodingFormat) {
          case 'text':
            buffer = new TextEncoder().encode(text);
            break;
          case 'hex':
            buffer = hexToUint8Array(text);
            break;
          case 'binary':
            const binaryStr = text.replace(/[^01]/g, '');
            if (binaryStr.length % 8 !== 0) {
              throw new Error('Binary string length must be multiple of 8');
            }
            buffer = new Uint8Array(binaryStr.length / 8);
            for (let i = 0; i < binaryStr.length; i += 8) {
              buffer[i / 8] = parseInt(binaryStr.substr(i, 8), 2);
            }
            break;
          default:
            buffer = new TextEncoder().encode(text);
        }
        
        return encode(buffer);
      } else {
        // Decode mode
        const decodedBuffer = decode(text);
        
        switch (encodingFormat) {
          case 'text':
            return new TextDecoder().decode(decodedBuffer);
          case 'hex':
            return uint8ArrayToHex(decodedBuffer);
          case 'binary':
            return Array.from(decodedBuffer).map(b => b.toString(2).padStart(8, '0')).join('');
          default:
            return new TextDecoder().decode(decodedBuffer);
        }
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Processing failed';
      setError(errorMessage);
      toast.error(errorMessage);
      return '';
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

  const handleFormatChange = (format: string) => {
    setEncodingFormat(format);
    if (input.trim()) {
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
      if (file.size > 10 * 1024 * 1024) { // 10MB limit
        toast.error('File size must be less than 10MB');
        return;
      }
      
      if (encodingFormat === 'text') {
        const reader = new FileReader();
        reader.onload = (event) => {
          const content = event.target?.result as string;
          setInput(content);
          const processed = processText(content);
          setOutput(processed);
          toast.success('File uploaded successfully!');
        };
        reader.readAsText(file);
      } else {
        const reader = new FileReader();
        reader.onload = (event) => {
          const arrayBuffer = event.target?.result as ArrayBuffer;
          const uint8Array = new Uint8Array(arrayBuffer);
          let content = '';
          
          if (encodingFormat === 'hex') {
            content = uint8ArrayToHex(uint8Array);
          } else if (encodingFormat === 'binary') {
            content = Array.from(uint8Array).map(b => b.toString(2).padStart(8, '0')).join('');
          }
          
          setInput(content);
          const processed = processText(content);
          setOutput(processed);
          toast.success('File uploaded successfully!');
        };
        reader.readAsArrayBuffer(file);
      }
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
    a.download = `base58-${mode}-${encodingFormat}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    toast.success('File downloaded successfully!');
  };

  const clearAll = () => {
    setInput('');
    setOutput('');
    setError('');
    toast.success('All fields cleared!');
  };

  return (
    <div className="min-h-screen bg-emerald-50 dark:bg-emerald-950 py-8 sm:py-12 px-4 sm:px-6 lg:px-8">
      <div className="container mx-auto max-w-6xl">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold mb-4">
            Base58 Encoder Decoder Online
          </h1>
          <p className="text-base sm:text-lg text-muted-foreground max-w-3xl mx-auto">
            Advanced Base58 encoder and decoder supporting text, hexadecimal, and binary formats. 
            Used in Bitcoin addresses, IPFS hashes, and other blockchain applications.
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
                    ? 'bg-emerald-500 text-white'
                    : 'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-200 dark:hover:bg-emerald-900/50'
                }`}
              >
                <Code className="inline h-4 w-4 mr-2" />
                Encode
              </button>
              <button
                onClick={() => handleModeChange('decode')}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                  mode === 'decode'
                    ? 'bg-emerald-500 text-white'
                    : 'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-200 dark:hover:bg-emerald-900/50'
                }`}
              >
                <FileText className="inline h-4 w-4 mr-2" />
                Decode
              </button>
            </div>
          </div>

          {/* Format Selection */}
          <div className="mb-6">
            <label className="text-base sm:text-lg font-semibold mb-3 block">
              Data Format
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
              <button
                onClick={() => handleFormatChange('text')}
                className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                  encodingFormat === 'text'
                    ? 'bg-teal-500 text-white'
                    : 'bg-teal-100 dark:bg-teal-900/30 text-teal-600 dark:text-teal-400 hover:bg-teal-200 dark:hover:bg-teal-900/50'
                }`}
              >
                <FileText className="inline h-4 w-4 mr-1" />
                Text (UTF-8)
              </button>
              <button
                onClick={() => handleFormatChange('hex')}
                className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                  encodingFormat === 'hex'
                    ? 'bg-teal-500 text-white'
                    : 'bg-teal-100 dark:bg-teal-900/30 text-teal-600 dark:text-teal-400 hover:bg-teal-200 dark:hover:bg-teal-900/50'
                }`}
              >
                <Hash className="inline h-4 w-4 mr-1" />
                Hexadecimal
              </button>
              <button
                onClick={() => handleFormatChange('binary')}
                className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                  encodingFormat === 'binary'
                    ? 'bg-teal-500 text-white'
                    : 'bg-teal-100 dark:bg-teal-900/30 text-teal-600 dark:text-teal-400 hover:bg-teal-200 dark:hover:bg-teal-900/50'
                }`}
              >
                <Code className="inline h-4 w-4 mr-1" />
                Binary
              </button>
            </div>
          </div>

          {/* Error Display */}
          {error && (
            <div className="mb-6 p-4 bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-800 rounded-lg">
              <div className="flex items-center">
                <AlertCircle className="h-5 w-5 text-red-500 mr-2" />
                <span className="text-red-700 dark:text-red-300 text-sm">{error}</span>
              </div>
            </div>
          )}

          <div className="grid grid-cols-1 xl:grid-cols-2 gap-6 lg:gap-8">
            {/* Input Section */}
            <div>
              <div className="flex items-center justify-between mb-4">
                <label className="text-base sm:text-lg font-semibold">
                  Input {mode === 'encode' ? `(${encodingFormat.toUpperCase()})` : '(Base58)'}
                </label>
                <div className="flex items-center space-x-2">
                  <label className="cursor-pointer bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400 px-3 py-2 rounded-lg text-sm hover:bg-emerald-200 dark:hover:bg-emerald-900/50 transition-colors">
                    <Upload className="inline h-4 w-4 mr-1 sm:mr-2" />
                    <span className="hidden sm:inline">Upload File</span>
                    <input
                      type="file"
                      className="hidden"
                      onChange={handleFileUpload}
                      accept=".txt,.json,.csv,.xml"
                    />
                  </label>
                  <button
                    onClick={clearAll}
                    className="bg-gray-100 dark:bg-gray-900/30 text-gray-600 dark:text-gray-400 px-3 py-2 rounded-lg text-sm hover:bg-gray-200 dark:hover:bg-gray-900/50 transition-colors"
                  >
                    Clear
                  </button>
                </div>
              </div>
              <textarea
                value={input}
                onChange={handleInputChange}
                placeholder={
                  mode === 'encode' 
                    ? `Enter ${encodingFormat} data to encode...`
                    : 'Enter Base58 string to decode...'
                }
                className="w-full h-48 sm:h-64 p-4 border rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent resize-none bg-background font-mono text-sm"
              />
              <div className="flex justify-between text-sm text-muted-foreground mt-2">
                <span>Characters: {input.length}</span>
                {encodingFormat === 'hex' && mode === 'encode' && (
                  <span>Bytes: {Math.ceil(input.replace(/[^0-9a-fA-F]/g, '').length / 2)}</span>
                )}
              </div>
            </div>

            {/* Output Section */}
            <div>
              <div className="flex items-center justify-between mb-4">
                <label className="text-base sm:text-lg font-semibold">
                  Output {mode === 'encode' ? '(Base58)' : `(${encodingFormat.toUpperCase()})`}
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
                  {output || `${mode === 'encode' ? 'Base58 encoded' : 'Decoded'} data will appear here...`}
                </code>
              </div>
              <div className="flex justify-between text-sm text-muted-foreground mt-2">
                <span>Characters: {output.length}</span>
                {mode === 'encode' && output && (
                  <span className="text-green-600 dark:text-green-400">
                    ✓ Valid Base58
                  </span>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Base58 Alphabet Display */}
        <div className="mt-8 bg-card rounded-xl shadow-lg border p-6 sm:p-8">
          <h3 className="text-lg font-semibold mb-4">Base58 Alphabet</h3>
          <div className="bg-muted/50 rounded-lg p-4">
            <code className="text-sm font-mono break-all">
              {ALPHABET}
            </code>
          </div>
          <p className="text-sm text-muted-foreground mt-2">
            Excludes: 0 (zero), O (capital o), I (capital i), l (lowercase L) to avoid visual confusion
          </p>
        </div>

        {/* Information Section */}
        <div className="mt-8 sm:mt-12 bg-card rounded-xl shadow-lg border p-6 sm:p-8">
          <h2 className="text-xl sm:text-2xl font-bold mb-6">
            About Base58 Encoding
          </h2>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 lg:gap-8">
            <div>
              <h3 className="text-base sm:text-lg font-semibold mb-3">What is Base58?</h3>
              <p className="text-muted-foreground mb-4 text-sm sm:text-base">
                Base58 is a binary-to-text encoding scheme used in Bitcoin and other cryptocurrencies. 
                It's designed to avoid visual ambiguity between similar-looking characters, making it 
                safer for manual transcription.
              </p>
              <h3 className="text-base sm:text-lg font-semibold mb-3">Key Features</h3>
              <ul className="text-muted-foreground space-y-1 text-sm sm:text-base">
                <li>• Excludes ambiguous characters (0, O, I, l)</li>
                <li>• Case-sensitive (both uppercase and lowercase)</li>
                <li>• No padding characters required</li>
                <li>• Preserves leading zeros as '1' characters</li>
                <li>• More compact than Base64 for most data</li>
                <li>• Human-readable and transcription-friendly</li>
              </ul>
            </div>
            <div>
              <h3 className="text-base sm:text-lg font-semibold mb-3">Common Applications</h3>
              <ul className="text-muted-foreground space-y-1 text-sm sm:text-base mb-4">
                <li>• Bitcoin wallet addresses</li>
                <li>• IPFS content identifiers (CIDs)</li>
                <li>• Shortened URLs (Flickr, etc.)</li>
                <li>• Blockchain transaction IDs</li>
                <li>• Cryptocurrency private keys</li>
                <li>• Distributed systems identifiers</li>
              </ul>
              <h3 className="text-base sm:text-lg font-semibold mb-3">Tool Features</h3>
              <ul className="text-muted-foreground space-y-1 text-sm sm:text-base">
                <li>• Multiple data format support</li>
                <li>• Real-time encoding/decoding</li>
                <li>• File upload and download</li>
                <li>• Input/output swapping</li>
                <li>• Comprehensive error handling</li>
                <li>• Copy to clipboard functionality</li>
                <li>• Client-side processing for privacy</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
