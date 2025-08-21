'use client';

import { useState } from 'react';
import { Copy, Upload, Download, CheckCircle, RotateCcw } from 'lucide-react';
import { toast } from 'sonner';

type Mode = 'encode' | 'decode';

export default function UnicodeEncodeDecode() {
  const [input, setInput] = useState('');
  const [output, setOutput] = useState('');
  const [mode, setMode] = useState<Mode>('encode');
  const [copied, setCopied] = useState(false);

  // Unicode encoding functions
  const encodeToUnicode = (text: string): string => {
    return text
      .split('')
      .map(char => {
        const code = char.charCodeAt(0);
        if (code > 127) {
          return `\\u${code.toString(16).padStart(4, '0')}`;
        }
        return char;
      })
      .join('');
  };

  const decodeFromUnicode = (text: string): string => {
    try {
      // Handle different Unicode escape formats
      let decoded = text
        // Handle \uXXXX format
        .replace(/\\u([0-9a-fA-F]{4})/g, (match, hex) => {
          return String.fromCharCode(parseInt(hex, 16));
        })
        // Handle \u{XXXXX} format
        .replace(/\\u\{([0-9a-fA-F]+)\}/g, (match, hex) => {
          const codePoint = parseInt(hex, 16);
          return String.fromCodePoint(codePoint);
        })
        // Handle U+XXXX format
        .replace(/U\+([0-9a-fA-F]+)/g, (match, hex) => {
          const codePoint = parseInt(hex, 16);
          return String.fromCodePoint(codePoint);
        })
        // Handle &#XXXX; format (decimal)
        .replace(/&#(\d+);/g, (match, decimal) => {
          return String.fromCharCode(parseInt(decimal, 10));
        })
        // Handle &#xXXXX; format (hexadecimal)
        .replace(/&#x([0-9a-fA-F]+);/g, (match, hex) => {
          return String.fromCharCode(parseInt(hex, 16));
        });
      
      return decoded;
    } catch (error) {
      throw new Error('Invalid Unicode format');
    }
  };

  const handleConvert = (text: string, currentMode: Mode) => {
    if (!text.trim()) {
      setOutput('');
      return;
    }

    try {
      let result = '';
      if (currentMode === 'encode') {
        result = encodeToUnicode(text);
      } else {
        result = decodeFromUnicode(text);
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

  const handleModeToggle = () => {
    const newMode = mode === 'encode' ? 'decode' : 'encode';
    setMode(newMode);
    
    // If there's input, convert it with the new mode
    if (input.trim()) {
      handleConvert(input, newMode);
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
    a.download = `unicode-${mode}d.txt`;
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

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50/50 to-indigo-100/50 dark:from-blue-950/20 dark:to-indigo-950/20 py-8 sm:py-12 px-4 sm:px-6 lg:px-8">
      <div className="container mx-auto max-w-6xl">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold mb-4">
            Unicode Encoder Decoder Online
          </h1>
          <p className="text-base sm:text-lg text-muted-foreground max-w-3xl mx-auto">
            Convert text to Unicode escape sequences or decode Unicode back to readable text. 
            Supports various Unicode formats including \uXXXX, U+XXXX, and HTML entities.
          </p>
        </div>

        {/* Mode Toggle */}
        <div className="flex justify-center mb-8">
          <div className="bg-card rounded-lg p-2 border shadow-sm">
            <div className="flex space-x-2">
              <button
                onClick={() => {
                  setMode('encode');
                  if (input.trim()) handleConvert(input, 'encode');
                }}
                className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                  mode === 'encode'
                    ? 'bg-blue-500 text-white shadow-sm'
                    : 'text-muted-foreground hover:text-foreground hover:bg-muted/50'
                }`}
              >
                Encode
              </button>
              <button
                onClick={() => {
                  setMode('decode');
                  if (input.trim()) handleConvert(input, 'decode');
                }}
                className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                  mode === 'decode'
                    ? 'bg-blue-500 text-white shadow-sm'
                    : 'text-muted-foreground hover:text-foreground hover:bg-muted/50'
                }`}
              >
                Decode
              </button>
            </div>
          </div>
        </div>

        {/* Tool Interface */}
        <div className="bg-card rounded-xl shadow-lg border p-6 sm:p-8">
          <div className="grid grid-cols-1 xl:grid-cols-2 gap-6 lg:gap-8">
            {/* Input Section */}
            <div>
              <div className="flex items-center justify-between mb-4">
                <label className="text-base sm:text-lg font-semibold">
                  {mode === 'encode' ? 'Text to Encode' : 'Unicode to Decode'}
                </label>
                <div className="flex items-center space-x-2">
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
                    ? 'Enter text to encode to Unicode...'
                    : 'Enter Unicode sequences to decode (supports \\uXXXX, U+XXXX, &#XXXX; formats)...'
                }
                className="w-full h-48 sm:h-64 p-4 border rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent resize-none bg-background"
              />
              <p className="text-sm text-muted-foreground mt-2">
                Characters: {input.length}
              </p>
            </div>

            {/* Output Section */}
            <div>
              <div className="flex items-center justify-between mb-4">
                <label className="text-base sm:text-lg font-semibold">
                  {mode === 'encode' ? 'Unicode Output' : 'Decoded Text'}
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
                  {output || `${mode === 'encode' ? 'Unicode encoded text' : 'Decoded text'} will appear here...`}
                </code>
              </div>
              <p className="text-sm text-muted-foreground mt-2">
                Output length: {output.length} characters
              </p>
            </div>
          </div>
        </div>

        {/* Information Section */}
        <div className="mt-8 sm:mt-12 bg-card rounded-xl shadow-lg border p-6 sm:p-8">
          <h2 className="text-xl sm:text-2xl font-bold mb-6">
            About Unicode Encoding Decoding
          </h2>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 lg:gap-8">
            <div>
              <h3 className="text-base sm:text-lg font-semibold mb-3">What is Unicode?</h3>
              <p className="text-muted-foreground mb-4 text-sm sm:text-base">
                Unicode is a computing standard for consistent encoding, representation, and handling of text 
                expressed in most of the world's writing systems.
              </p>
              <h3 className="text-base sm:text-lg font-semibold mb-3">Supported Formats</h3>
              <ul className="text-muted-foreground space-y-1 text-sm sm:text-base">
                <li>• <code>\uXXXX</code> - JavaScript/JSON format</li>
                <li>• <code>U+XXXX</code> - Standard Unicode notation</li>
                <li>• <code>&#XXXX;</code> - HTML decimal entities</li>
                <li>• <code>&#xXXXX;</code> - HTML hex entities</li>
                <li>• <code>\u{`{XXXXX}`}</code> - ES6 Unicode format</li>
              </ul>
            </div>
            <div>
              <h3 className="text-base sm:text-lg font-semibold mb-3">Common Use Cases</h3>
              <ul className="text-muted-foreground space-y-1 text-sm sm:text-base mb-4">
                <li>• Web development and JSON handling</li>
                <li>• Internationalization (i18n)</li>
                <li>• Data migration and processing</li>
                <li>• Cross-platform text compatibility</li>
                <li>• Debugging character encoding issues</li>
              </ul>
              <h3 className="text-base sm:text-lg font-semibold mb-3">Features</h3>
              <ul className="text-muted-foreground space-y-1 text-sm sm:text-base">
                <li>• Bidirectional conversion</li>
                <li>• Multiple Unicode format support</li>
                <li>• File upload/download capability</li>
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
