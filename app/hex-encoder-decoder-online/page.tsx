'use client';

import { useState } from 'react';
import { Copy, Upload, Download, CheckCircle, RotateCcw } from 'lucide-react';
import { toast } from 'sonner';

type Mode = 'encode' | 'decode';
type HexFormat = 'plain' | 'prefixed' | 'spaced' | 'c-array';

export default function HexEncodeDecode() {
  const [input, setInput] = useState('');
  const [output, setOutput] = useState('');
  const [mode, setMode] = useState<Mode>('encode');
  const [hexFormat, setHexFormat] = useState<HexFormat>('plain');
  const [copied, setCopied] = useState(false);

  // Hex encoding functions
  const encodeToHex = (text: string, format: HexFormat): string => {
    const hexArray = Array.from(new TextEncoder().encode(text))
      .map(byte => byte.toString(16).padStart(2, '0'));

    switch (format) {
      case 'plain':
        return hexArray.join('');
      case 'prefixed':
        return hexArray.map(hex => `0x${hex}`).join(' ');
      case 'spaced':
        return hexArray.join(' ');
      case 'c-array':
        return `{${hexArray.map(hex => `0x${hex}`).join(', ')}}`;
      default:
        return hexArray.join('');
    }
  };

  const decodeFromHex = (text: string): string => {
    try {
      // Clean the input - remove common prefixes and separators
      let cleanHex = text
        .replace(/0x/g, '') // Remove 0x prefixes
        .replace(/[{}\[\],\s]/g, '') // Remove brackets, commas, spaces
        .replace(/\\x/g, '') // Remove \x prefixes
        .replace(/[^0-9a-fA-F]/g, ''); // Keep only hex characters

      // Ensure even length
      if (cleanHex.length % 2 !== 0) {
        throw new Error('Invalid hex string length');
      }

      // Convert hex pairs to bytes
      const bytes = [];
      for (let i = 0; i < cleanHex.length; i += 2) {
        const hexPair = cleanHex.substr(i, 2);
        const byte = parseInt(hexPair, 16);
        if (isNaN(byte)) {
          throw new Error('Invalid hex character');
        }
        bytes.push(byte);
      }

      // Decode bytes to text
      return new TextDecoder('utf-8').decode(new Uint8Array(bytes));
    } catch (error) {
      throw new Error('Invalid hexadecimal format');
    }
  };

  const handleConvert = (text: string, currentMode: Mode, format: HexFormat = hexFormat) => {
    if (!text.trim()) {
      setOutput('');
      return;
    }

    try {
      let result = '';
      if (currentMode === 'encode') {
        result = encodeToHex(text, format);
      } else {
        result = decodeFromHex(text);
      }
      setOutput(result);
    } catch (error) {
      setOutput('Error: Invalid input format');
      toast.error('Invalid input format');
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const value = e.target.value;
    setInput(value);
    handleConvert(value, mode);
  };

  const handleModeToggle = (newMode: Mode) => {
    setMode(newMode);
    
    // If there's input, convert it with the new mode
    if (input.trim()) {
      handleConvert(input, newMode);
    }
  };

  const handleFormatChange = (format: HexFormat) => {
    setHexFormat(format);
    
    // If we're in encode mode and have input, re-encode with new format
    if (mode === 'encode' && input.trim()) {
      handleConvert(input, mode, format);
    }
  };

  const swapInputOutput = () => {
    if (!output || output.startsWith('Error:')) {
      toast.error('No valid output to swap');
      return;
    }
    
    const newInput = output;
    const newMode = mode === 'encode' ? 'decode' : 'encode';
    
    setInput(newInput);
    setMode(newMode);
    handleConvert(newInput, newMode);
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
      const reader = new FileReader();
      reader.onload = (event) => {
        const content = event.target?.result as string;
        setInput(content);
        handleConvert(content, mode);
        toast.success('File uploaded successfully!');
      };
      reader.readAsText(file);
    }
  };

  const downloadResult = () => {
    if (!output || output.startsWith('Error:')) {
      toast.error('No valid content to download');
      return;
    }
    const blob = new Blob([output], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `hex-${mode}d.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    toast.success('File downloaded successfully!');
  };

  const clearAll = () => {
    setInput('');
    setOutput('');
    toast.success('Cleared all content!');
  };

  const getFormatExample = (format: HexFormat): string => {
    switch (format) {
      case 'plain':
        return '48656c6c6f';
      case 'prefixed':
        return '0x48 0x65 0x6c 0x6c 0x6f';
      case 'spaced':
        return '48 65 6c 6c 6f';
      case 'c-array':
        return '{0x48, 0x65, 0x6c, 0x6c, 0x6f}';
      default:
        return '';
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-50/50 to-teal-100/50 dark:from-emerald-950/20 dark:to-teal-950/20 py-8 sm:py-12 px-4 sm:px-6 lg:px-8">
      <div className="container mx-auto max-w-6xl">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold mb-4">
            Hex Encoder Decoder Online
          </h1>
          <p className="text-base sm:text-lg text-muted-foreground max-w-3xl mx-auto">
            Convert text to hexadecimal representation or decode hex back to readable text. 
            Supports multiple hex formats including plain hex, prefixed, spaced, and C-style arrays.
          </p>
        </div>

        {/* Mode Toggle */}
        <div className="flex justify-center mb-8">
          <div className="bg-card rounded-lg p-2 border shadow-sm">
            <div className="flex space-x-2">
              <button
                onClick={() => handleModeToggle('encode')}
                className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                  mode === 'encode'
                    ? 'bg-emerald-500 text-white shadow-sm'
                    : 'text-muted-foreground hover:text-foreground hover:bg-muted/50'
                }`}
              >
                Encode
              </button>
              <button
                onClick={() => handleModeToggle('decode')}
                className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                  mode === 'decode'
                    ? 'bg-emerald-500 text-white shadow-sm'
                    : 'text-muted-foreground hover:text-foreground hover:bg-muted/50'
                }`}
              >
                Decode
              </button>
            </div>
          </div>
        </div>

        {/* Format Selection (only show when encoding) */}
        {mode === 'encode' && (
          <div className="flex justify-center mb-8">
            <div className="bg-card rounded-lg p-4 border shadow-sm">
              <h3 className="text-sm font-medium mb-3 text-center">Output Format</h3>
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
                {[
                  { value: 'plain', label: 'Plain', example: '48656c6c6f' },
                  { value: 'prefixed', label: 'Prefixed', example: '0x48 0x65...' },
                  { value: 'spaced', label: 'Spaced', example: '48 65 6c 6c 6f' },
                  { value: 'c-array', label: 'C Array', example: '{0x48, 0x65...}' }
                ].map((format) => (
                  <button
                    key={format.value}
                    onClick={() => handleFormatChange(format.value as HexFormat)}
                    className={`p-3 rounded-lg text-left transition-colors ${
                      hexFormat === format.value
                        ? 'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800'
                        : 'bg-muted/50 hover:bg-muted text-muted-foreground hover:text-foreground'
                    }`}
                  >
                    <div className="font-medium text-sm">{format.label}</div>
                    <div className="text-xs opacity-75 mt-1 font-mono">{format.example}</div>
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Tool Interface */}
        <div className="bg-card rounded-xl shadow-lg border p-6 sm:p-8">
          <div className="grid grid-cols-1 xl:grid-cols-2 gap-6 lg:gap-8">
            {/* Input Section */}
            <div>
              <div className="flex items-center justify-between mb-4">
                <label className="text-base sm:text-lg font-semibold">
                  {mode === 'encode' ? 'Text to Encode' : 'Hex to Decode'}
                </label>
                <div className="flex items-center space-x-2">
                  <label className="cursor-pointer bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400 px-3 py-2 rounded-lg text-sm hover:bg-emerald-200 dark:hover:bg-emerald-900/50 transition-colors">
                    <Upload className="inline h-4 w-4 mr-1 sm:mr-2" />
                    <span className="hidden sm:inline">Upload File</span>
                    <input
                      type="file"
                      className="hidden"
                      onChange={handleFileUpload}
                      accept=".txt,.json,.xml,.csv"
                    />
                  </label>
                  <button
                    onClick={clearAll}
                    className="bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 px-3 py-2 rounded-lg text-sm hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
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
                    ? 'Enter text to encode to hexadecimal...'
                    : 'Enter hexadecimal to decode (supports various formats: 48656c6c6f, 0x48 0x65..., 48 65 6c 6c 6f, etc.)...'
                }
                className="w-full h-48 sm:h-64 p-4 border rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent resize-none bg-background"
              />
              <p className="text-sm text-muted-foreground mt-2">
                Characters: {input.length}
                {mode === 'encode' && input && (
                  <span className="ml-4">
                    Bytes: {new TextEncoder().encode(input).length}
                  </span>
                )}
              </p>
            </div>

            {/* Output Section */}
            <div>
              <div className="flex items-center justify-between mb-4">
                <label className="text-base sm:text-lg font-semibold">
                  {mode === 'encode' ? 'Hex Output' : 'Decoded Text'}
                </label>
                <div className="flex items-center space-x-1 sm:space-x-2">
                  <button
                    onClick={swapInputOutput}
                    disabled={!output || output.startsWith('Error:')}
                    className="bg-orange-100 dark:bg-orange-900/30 text-orange-600 dark:text-orange-400 px-3 py-2 rounded-lg text-sm hover:bg-orange-200 dark:hover:bg-orange-900/50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    title="Swap input and output"
                  >
                    <RotateCcw className="inline h-4 w-4 sm:mr-1" />
                    <span className="hidden sm:inline">Swap</span>
                  </button>
                  <button
                    onClick={copyToClipboard}
                    disabled={!output || output.startsWith('Error:')}
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
                    disabled={!output || output.startsWith('Error:')}
                    className="bg-purple-100 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400 px-3 py-2 rounded-lg text-sm hover:bg-purple-200 dark:hover:bg-purple-900/50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <Download className="inline h-4 w-4 sm:mr-1" />
                    <span className="hidden sm:inline">Download</span>
                  </button>
                </div>
              </div>
              <div className="bg-muted/50 rounded-lg p-4 min-h-[192px] sm:min-h-[256px] flex items-center">
                <code className="text-sm font-mono break-all whitespace-pre-wrap">
                  {output || `${mode === 'encode' ? 'Hexadecimal encoded text' : 'Decoded text'} will appear here...`}
                </code>
              </div>
              <p className="text-sm text-muted-foreground mt-2">
                Output length: {output.length} characters
                {mode === 'encode' && output && !output.startsWith('Error:') && (
                  <span className="ml-4">
                    Format: {hexFormat}
                  </span>
                )}
              </p>
            </div>
          </div>
        </div>

        {/* Information Section */}
        <div className="mt-8 sm:mt-12 bg-card rounded-xl shadow-lg border p-6 sm:p-8">
          <h2 className="text-xl sm:text-2xl font-bold mb-6">
            About Hexadecimal Encoding/Decoding
          </h2>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 lg:gap-8">
            <div>
              <h3 className="text-base sm:text-lg font-semibold mb-3">What is Hexadecimal?</h3>
              <p className="text-muted-foreground mb-4 text-sm sm:text-base">
                Hexadecimal (hex) is a base-16 numbering system using digits 0-9 and letters A-F to represent values. 
                Each hex digit represents 4 bits, making it a compact way to represent binary data.
              </p>
              <h3 className="text-base sm:text-lg font-semibold mb-3">Supported Formats</h3>
              <ul className="text-muted-foreground space-y-1 text-sm sm:text-base">
                <li>• <code>Plain</code> - {getFormatExample('plain')}</li>
                <li>• <code>Prefixed</code> - {getFormatExample('prefixed')}</li>
                <li>• <code>Spaced</code> - {getFormatExample('spaced')}</li>
                <li>• <code>C Array</code> - {getFormatExample('c-array')}</li>
              </ul>
            </div>
            <div>
              <h3 className="text-base sm:text-lg font-semibold mb-3">Common Use Cases</h3>
              <ul className="text-muted-foreground space-y-1 text-sm sm:text-base mb-4">
                <li>• Binary data representation</li>
                <li>• Programming and debugging</li>
                <li>• Color codes in web design</li>
                <li>• Memory dumps analysis</li>
                <li>• Cryptographic operations</li>
                <li>• Network packet analysis</li>
              </ul>
              <h3 className="text-base sm:text-lg font-semibold mb-3">Features</h3>
              <ul className="text-muted-foreground space-y-1 text-sm sm:text-base">
                <li>• Multiple output formats</li>
                <li>• Bidirectional conversion</li>
                <li>• UTF-8 encoding support</li>
                <li>• File upload/download</li>
                <li>• Input/output swapping</li>
                <li>• Real-time processing</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
