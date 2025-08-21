'use client';

import { useState } from 'react';
import { Copy, Upload, Download, CheckCircle, ArrowRightLeft, Code, FileText } from 'lucide-react';
import { toast } from 'sonner';

export default function HTMLEncodeDecode() {
  const [input, setInput] = useState('');
  const [output, setOutput] = useState('');
  const [mode, setMode] = useState('encode');
  const [encodingType, setEncodingType] = useState('html-entities');
  const [copied, setCopied] = useState(false);

  // HTML Entity encoding/decoding maps
  const htmlEntities: { [key: string]: string } = {
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#39;',
    '/': '&#x2F;',
    '`': '&#x60;',
    '=': '&#x3D;'
  };

  const extendedHtmlEntities: { [key: string]: string } = {
    ...htmlEntities,
    ' ': '&nbsp;',
    '¡': '&iexcl;',
    '¢': '&cent;',
    '£': '&pound;',
    '¤': '&curren;',
    '¥': '&yen;',
    '¦': '&brvbar;',
    '§': '&sect;',
    '¨': '&uml;',
    '©': '&copy;',
    'ª': '&ordf;',
    '«': '&laquo;',
    '¬': '&not;',
    '®': '&reg;',
    '¯': '&macr;',
    '°': '&deg;',
    '±': '&plusmn;',
    '²': '&sup2;',
    '³': '&sup3;',
    '´': '&acute;',
    'µ': '&micro;',
    '¶': '&para;',
    '·': '&middot;',
    '¸': '&cedil;',
    '¹': '&sup1;',
    'º': '&ordm;',
    '»': '&raquo;',
    '¼': '&frac14;',
    '½': '&frac12;',
    '¾': '&frac34;',
    '¿': '&iquest;',
    'À': '&Agrave;',
    'Á': '&Aacute;',
    'Â': '&Acirc;',
    'Ã': '&Atilde;',
    'Ä': '&Auml;',
    'Å': '&Aring;',
    'Æ': '&AElig;',
    'Ç': '&Ccedil;',
    'È': '&Egrave;',
    'É': '&Eacute;',
    'Ê': '&Ecirc;',
    'Ë': '&Euml;',
    'Ì': '&Igrave;',
    'Í': '&Iacute;',
    'Î': '&Icirc;',
    'Ï': '&Iuml;',
    'Ð': '&ETH;',
    'Ñ': '&Ntilde;',
    'Ò': '&Ograve;',
    'Ó': '&Oacute;',
    'Ô': '&Ocirc;',
    'Õ': '&Otilde;',
    'Ö': '&Ouml;',
    '×': '&times;',
    'Ø': '&Oslash;',
    'Ù': '&Ugrave;',
    'Ú': '&Uacute;',
    'Û': '&Ucirc;',
    'Ü': '&Uuml;',
    'Ý': '&Yacute;',
    'Þ': '&THORN;',
    'ß': '&szlig;',
    'à': '&agrave;',
    'á': '&aacute;',
    'â': '&acirc;',
    'ã': '&atilde;',
    'ä': '&auml;',
    'å': '&aring;',
    'æ': '&aelig;',
    'ç': '&ccedil;',
    'è': '&egrave;',
    'é': '&eacute;',
    'ê': '&ecirc;',
    'ë': '&euml;',
    'ì': '&igrave;',
    'í': '&iacute;',
    'î': '&icirc;',
    'ï': '&iuml;',
    'ð': '&eth;',
    'ñ': '&ntilde;',
    'ò': '&ograve;',
    'ó': '&oacute;',
    'ô': '&ocirc;',
    'õ': '&otilde;',
    'ö': '&ouml;',
    '÷': '&divide;',
    'ø': '&oslash;',
    'ù': '&ugrave;',
    'ú': '&uacute;',
    'û': '&ucirc;',
    'ü': '&uuml;',
    'ý': '&yacute;',
    'þ': '&thorn;',
    'ÿ': '&yuml;'
  };

  // Create reverse maps for decoding
  const createReverseMap = (map: { [key: string]: string }) => {
    const reverse: { [key: string]: string } = {};
    Object.entries(map).forEach(([key, value]) => {
      reverse[value] = key;
    });
    return reverse;
  };

  const htmlEntitiesReverse = createReverseMap(htmlEntities);
  const extendedHtmlEntitiesReverse = createReverseMap(extendedHtmlEntities);

  // Encoding functions
  const encodeHtmlEntities = (text: string): string => {
    return text.replace(/[&<>"'\/`=]/g, (char) => htmlEntities[char] || char);
  };

  const encodeExtendedHtmlEntities = (text: string): string => {
    return text.replace(/[&<>"'\/`= ¡-ÿ]/g, (char) => extendedHtmlEntities[char] || char);
  };

  const encodeHtmlHex = (text: string): string => {
    return text.replace(/[^\w\s]/g, (char) => `&#x${char.charCodeAt(0).toString(16).toUpperCase()};`);
  };

  const encodeHtmlDecimal = (text: string): string => {
    return text.replace(/[^\w\s]/g, (char) => `&#${char.charCodeAt(0)};`);
  };

  const encodeAllChars = (text: string): string => {
    return text.split('').map(char => `&#${char.charCodeAt(0)};`).join('');
  };

  // Decoding functions
  const decodeHtmlEntities = (text: string): string => {
    // Decode named entities
    let decoded = text.replace(/&[a-zA-Z][a-zA-Z0-9]+;/g, (entity) => 
      extendedHtmlEntitiesReverse[entity] || entity
    );
    
    // Decode hex entities
    decoded = decoded.replace(/&#x([0-9a-fA-F]+);/g, (match, hex) => 
      String.fromCharCode(parseInt(hex, 16))
    );
    
    // Decode decimal entities
    decoded = decoded.replace(/&#(\d+);/g, (match, dec) => 
      String.fromCharCode(parseInt(dec, 10))
    );
    
    return decoded;
  };

  // URL component encoding/decoding
  const encodeUrlComponent = (text: string): string => {
    try {
      return encodeURIComponent(text);
    } catch (error) {
      return text;
    }
  };

  const decodeUrlComponent = (text: string): string => {
    try {
      return decodeURIComponent(text);
    } catch (error) {
      return text;
    }
  };

  // Main processing function
  const processText = (text: string): string => {
    if (!text.trim()) return '';

    try {
      if (mode === 'encode') {
        switch (encodingType) {
          case 'html-entities':
            return encodeHtmlEntities(text);
          case 'extended-entities':
            return encodeExtendedHtmlEntities(text);
          case 'html-hex':
            return encodeHtmlHex(text);
          case 'html-decimal':
            return encodeHtmlDecimal(text);
          case 'all-chars':
            return encodeAllChars(text);
          case 'url-component':
            return encodeUrlComponent(text);
          default:
            return text;
        }
      } else {
        switch (encodingType) {
          case 'html-entities':
          case 'extended-entities':
          case 'html-hex':
          case 'html-decimal':
          case 'all-chars':
            return decodeHtmlEntities(text);
          case 'url-component':
            return decodeUrlComponent(text);
          default:
            return text;
        }
      }
    } catch (error) {
      toast.error('Error processing text');
      return text;
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

  const handleEncodingTypeChange = (type: string) => {
    setEncodingType(type);
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
    a.download = `html-${mode}-${encodingType}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    toast.success('File downloaded successfully!');
  };

  return (
    <div className="min-h-screen bg-emerald-50 dark:bg-emerald-950 py-8 sm:py-12 px-4 sm:px-6 lg:px-8">
      <div className="container mx-auto max-w-6xl">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold mb-4">
            HTML Encoder Decoder Online
          </h1>
          <p className="text-base sm:text-lg text-muted-foreground max-w-3xl mx-auto">
            Advanced HTML encoding and decoding tool. Convert special characters to HTML entities, 
            decode HTML entities back to text, and handle various encoding formats for web development.
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

          {/* Encoding Type Selection */}
          <div className="mb-6">
            <label className="text-base sm:text-lg font-semibold mb-3 block">
              Encoding Type
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              <button
                onClick={() => handleEncodingTypeChange('html-entities')}
                className={`px-3 py-2 rounded-lg text-xs font-medium transition-colors ${
                  encodingType === 'html-entities'
                    ? 'bg-teal-500 text-white'
                    : 'bg-teal-100 dark:bg-teal-900/30 text-teal-600 dark:text-teal-400 hover:bg-teal-200 dark:hover:bg-teal-900/50'
                }`}
              >
                HTML Entities
              </button>
              <button
                onClick={() => handleEncodingTypeChange('extended-entities')}
                className={`px-3 py-2 rounded-lg text-xs font-medium transition-colors ${
                  encodingType === 'extended-entities'
                    ? 'bg-teal-500 text-white'
                    : 'bg-teal-100 dark:bg-teal-900/30 text-teal-600 dark:text-teal-400 hover:bg-teal-200 dark:hover:bg-teal-900/50'
                }`}
              >
                Extended Entities
              </button>
              <button
                onClick={() => handleEncodingTypeChange('html-hex')}
                className={`px-3 py-2 rounded-lg text-xs font-medium transition-colors ${
                  encodingType === 'html-hex'
                    ? 'bg-teal-500 text-white'
                    : 'bg-teal-100 dark:bg-teal-900/30 text-teal-600 dark:text-teal-400 hover:bg-teal-200 dark:hover:bg-teal-900/50'
                }`}
              >
                HTML Hex
              </button>
              <button
                onClick={() => handleEncodingTypeChange('html-decimal')}
                className={`px-3 py-2 rounded-lg text-xs font-medium transition-colors ${
                  encodingType === 'html-decimal'
                    ? 'bg-teal-500 text-white'
                    : 'bg-teal-100 dark:bg-teal-900/30 text-teal-600 dark:text-teal-400 hover:bg-teal-200 dark:hover:bg-teal-900/50'
                }`}
              >
                HTML Decimal
              </button>
              <button
                onClick={() => handleEncodingTypeChange('all-chars')}
                className={`px-3 py-2 rounded-lg text-xs font-medium transition-colors ${
                  encodingType === 'all-chars'
                    ? 'bg-teal-500 text-white'
                    : 'bg-teal-100 dark:bg-teal-900/30 text-teal-600 dark:text-teal-400 hover:bg-teal-200 dark:hover:bg-teal-900/50'
                }`}
              >
                All Characters
              </button>
              <button
                onClick={() => handleEncodingTypeChange('url-component')}
                className={`px-3 py-2 rounded-lg text-xs font-medium transition-colors ${
                  encodingType === 'url-component'
                    ? 'bg-teal-500 text-white'
                    : 'bg-teal-100 dark:bg-teal-900/30 text-teal-600 dark:text-teal-400 hover:bg-teal-200 dark:hover:bg-teal-900/50'
                }`}
              >
                URL Component
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 xl:grid-cols-2 gap-6 lg:gap-8">
            {/* Input Section */}
            <div>
              <div className="flex items-center justify-between mb-4">
                <label className="text-base sm:text-lg font-semibold">
                  Input Text
                </label>
                <div className="flex items-center space-x-2">
                  <label className="cursor-pointer bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400 px-3 py-2 rounded-lg text-sm hover:bg-emerald-200 dark:hover:bg-emerald-900/50 transition-colors">
                    <Upload className="inline h-4 w-4 mr-1 sm:mr-2" />
                    <span className="hidden sm:inline">Upload File</span>
                    <input
                      type="file"
                      className="hidden"
                      onChange={handleFileUpload}
                      accept=".txt,.html,.xml,.csv"
                    />
                  </label>
                </div>
              </div>
              <textarea
                value={input}
                onChange={handleInputChange}
                placeholder={`Enter text to ${mode}...`}
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
                  Output Text
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
                  {output || `${mode === 'encode' ? 'Encoded' : 'Decoded'} text will appear here...`}
                </code>
              </div>
              <p className="text-sm text-muted-foreground mt-2">
                Characters: {output.length}
              </p>
            </div>
          </div>
        </div>

        {/* Information Section */}
        <div className="mt-8 sm:mt-12 bg-card rounded-xl shadow-lg border p-6 sm:p-8">
          <h2 className="text-xl sm:text-2xl font-bold mb-6">
            About HTML Encoding/Decoding
          </h2>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 lg:gap-8">
            <div>
              <h3 className="text-base sm:text-lg font-semibold mb-3">What is HTML Encoding?</h3>
              <p className="text-muted-foreground mb-4 text-sm sm:text-base">
                HTML encoding converts special characters into HTML entities to prevent them from being 
                interpreted as HTML markup. This is essential for displaying special characters and preventing XSS attacks.
              </p>
              <h3 className="text-base sm:text-lg font-semibold mb-3">Encoding Types</h3>
              <ul className="text-muted-foreground space-y-1 text-sm sm:text-base">
                <li>• <strong>HTML Entities:</strong> Basic entities (&lt;, &gt;, &amp;)</li>
                <li>• <strong>Extended Entities:</strong> International characters</li>
                <li>• <strong>HTML Hex:</strong> Hexadecimal numeric entities</li>
                <li>• <strong>HTML Decimal:</strong> Decimal numeric entities</li>
                <li>• <strong>All Characters:</strong> Encode every character</li>
                <li>• <strong>URL Component:</strong> URL encoding/decoding</li>
              </ul>
            </div>
            <div>
              <h3 className="text-base sm:text-lg font-semibold mb-3">Common Use Cases</h3>
              <ul className="text-muted-foreground space-y-1 text-sm sm:text-base mb-4">
                <li>• Preventing XSS attacks</li>
                <li>• Displaying user input safely</li>
                <li>• Web scraping data processing</li>
                <li>• Email template preparation</li>
                <li>• International character handling</li>
                <li>• URL parameter encoding</li>
              </ul>
              <h3 className="text-base sm:text-lg font-semibold mb-3">Features</h3>
              <ul className="text-muted-foreground space-y-1 text-sm sm:text-base">
                <li>• Real-time encoding/decoding</li>
                <li>• Multiple encoding formats</li>
                <li>• Input/output swapping</li>
                <li>• File upload support</li>
                <li>• Copy to clipboard</li>
                <li>• Download results</li>
                <li>• Extended character support</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
