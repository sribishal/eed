'use client';

import { useState, useMemo, useCallback } from 'react';
import { Copy, Upload, Download, CheckCircle, ArrowRightLeft, Settings, Key, RotateCcw } from 'lucide-react';
import { toast } from 'sonner';

export default function CustomRotCipherTool() {
  const [input, setInput] = useState('');
  const [output, setOutput] = useState('');
  const [shift, setShift] = useState(13);
  const [copied, setCopied] = useState(false);

  // Granular Controls
  const [includeUppercase, setIncludeUppercase] = useState(true);
  const [includeLowercase, setIncludeLowercase] = useState(true);
  const [includeNumbers, setIncludeNumbers] = useState(false);

  // Preset shift values
  const presetShifts = [
    { value: 1, name: 'ROT1' },
    { value: 3, name: 'ROT3 (Caesar)' },
    { value: 5, name: 'ROT5' },
    { value: 13, name: 'ROT13' },
    { value: 18, name: 'ROT18' },
    { value: 25, name: 'ROT25' }
  ];

  // The core cipher logic
  const performRotCipher = useCallback((str: string, shiftVal: number): string => {
    if (!str || shiftVal === 0) return str;

    const rot = (char: string, startCode: number, alphabetSize: number) => {
      const code = char.charCodeAt(0);
      return String.fromCharCode(((code - startCode + shiftVal) % alphabetSize) + startCode);
    };

    return str.split('').map(char => {
      // Uppercase
      if (includeUppercase && char >= 'A' && char <= 'Z') return rot(char, 65, 26);
      // Lowercase
      if (includeLowercase && char >= 'a' && char <= 'z') return rot(char, 97, 26);
      // Numbers
      if (includeNumbers && char >= '0' && char <= '9') return rot(char, 48, 10);
      
      return char; // Return original character if not in a selected set
    }).join('');
  }, [includeUppercase, includeLowercase, includeNumbers]);

  const handleInputChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const value = e.target.value;
    setInput(value);
    const processed = performRotCipher(value, shift);
    setOutput(processed);
  };

  const handleShiftChange = (newShift: number) => {
    setShift(newShift);
    if (input.trim()) {
      const processed = performRotCipher(input, newShift);
      setOutput(processed);
    }
  };

  const handleCharacterSetChange = (type: string, checked: boolean) => {
    switch (type) {
      case 'uppercase':
        setIncludeUppercase(checked);
        break;
      case 'lowercase':
        setIncludeLowercase(checked);
        break;
      case 'numbers':
        setIncludeNumbers(checked);
        break;
    }
    if (input.trim()) {
      // Update with current settings (the useCallback will handle the new state)
      setTimeout(() => {
        const processed = performRotCipher(input, shift);
        setOutput(processed);
      }, 0);
    }
  };

  const swapInputOutput = () => {
    const temp = input;
    setInput(output);
    setOutput(temp);
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
        const processed = performRotCipher(content, shift);
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
    a.download = `rot${shift}-cipher.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    toast.success('File downloaded successfully!');
  };

  const LiveAlphabetMap = () => (
    <div className="p-3 bg-muted/50 rounded-lg text-center font-mono text-sm">
      <div className="flex flex-wrap justify-center gap-2 text-xs">
        <span>A→{performRotCipher('A', shift)}</span>
        <span>B→{performRotCipher('B', shift)}</span>
        <span>C→{performRotCipher('C', shift)}</span>
        <span className="text-muted-foreground">...</span>
        <span>X→{performRotCipher('X', shift)}</span>
        <span>Y→{performRotCipher('Y', shift)}</span>
        <span>Z→{performRotCipher('Z', shift)}</span>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-emerald-50 dark:bg-emerald-950 py-8 sm:py-12 px-4 sm:px-6 lg:px-8">
      <div className="container mx-auto max-w-6xl">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold mb-4">
            ROT Cipher Encoder Decoder Online
          </h1>
          <p className="text-base sm:text-lg text-muted-foreground max-w-3xl mx-auto">
            Advanced rotation cipher tool supporting ROT13, Caesar cipher, and custom shifts. 
            Encode and decode text with configurable character sets for cryptography and puzzle solving.
          </p>
        </div>

        {/* Tool Interface */}
        <div className="bg-card rounded-xl shadow-lg border p-6 sm:p-8">
          {/* Shift Selection */}
          <div className="mb-6">
            <label className="text-base sm:text-lg font-semibold mb-3 block">
              <Key className="inline h-5 w-5 mr-2" />
              Cipher Shift (ROT-{shift})
            </label>
            <div className="flex flex-wrap gap-2 sm:gap-3 mb-4">
              {presetShifts.map((preset) => (
                <button
                  key={preset.value}
                  onClick={() => handleShiftChange(preset.value)}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                    shift === preset.value
                      ? 'bg-emerald-500 text-white'
                      : 'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-200 dark:hover:bg-emerald-900/50'
                  }`}
                >
                  {preset.name}
                </button>
              ))}
            </div>
            <div className="flex items-center gap-4">
              <input
                type="range"
                min="1"
                max="25"
                value={shift}
                onChange={(e) => handleShiftChange(Number(e.target.value))}
                className="flex-1 h-2 bg-emerald-200 dark:bg-emerald-800 rounded-lg appearance-none cursor-pointer accent-emerald-500"
              />
              <input
                type="number"
                min="1"
                max="25"
                value={shift}
                onChange={(e) => handleShiftChange(Number(e.target.value))}
                className="w-20 px-3 py-2 border rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent bg-background"
              />
            </div>
          </div>

          {/* Character Set Selection */}
          <div className="mb-6">
            <label className="text-base sm:text-lg font-semibold mb-3 block">
              <Settings className="inline h-5 w-5 mr-2" />
              Character Sets
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="flex items-center p-3 border rounded-lg">
                <input
                  id="uppercase"
                  type="checkbox"
                  checked={includeUppercase}
                  onChange={(e) => handleCharacterSetChange('uppercase', e.target.checked)}
                  className="h-5 w-5 rounded accent-emerald-500"
                />
                <label htmlFor="uppercase" className="ml-3 text-sm font-medium">
                  Uppercase (A-Z)
                </label>
              </div>
              <div className="flex items-center p-3 border rounded-lg">
                <input
                  id="lowercase"
                  type="checkbox"
                  checked={includeLowercase}
                  onChange={(e) => handleCharacterSetChange('lowercase', e.target.checked)}
                  className="h-5 w-5 rounded accent-emerald-500"
                />
                <label htmlFor="lowercase" className="ml-3 text-sm font-medium">
                  Lowercase (a-z)
                </label>
              </div>
              <div className="flex items-center p-3 border rounded-lg">
                <input
                  id="numbers"
                  type="checkbox"
                  checked={includeNumbers}
                  onChange={(e) => handleCharacterSetChange('numbers', e.target.checked)}
                  className="h-5 w-5 rounded accent-emerald-500"
                />
                <label htmlFor="numbers" className="ml-3 text-sm font-medium">
                  Numbers (0-9)
                </label>
              </div>
            </div>
          </div>

          {/* Live Alphabet Mapping */}
          <div className="mb-6">
            <label className="text-base sm:text-lg font-semibold mb-3 block">
              Live Alphabet Mapping
            </label>
            <LiveAlphabetMap />
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
                placeholder="Enter text to encrypt/decrypt..."
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
                  {output || 'Encrypted/decrypted text will appear here...'}
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
            About ROT-n Ciphers
          </h2>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 lg:gap-8">
            <div>
              <h3 className="text-base sm:text-lg font-semibold mb-3">What is ROT-n?</h3>
              <p className="text-muted-foreground mb-4 text-sm sm:text-base">
                ROT-n (rotate by n places) is a letter substitution cipher that replaces each letter 
                with the letter n positions after it in the alphabet. ROT13 is the most famous variant, 
                shifting letters by 13 positions.
              </p>
              <h3 className="text-base sm:text-lg font-semibold mb-3">Popular Variants</h3>
              <ul className="text-muted-foreground space-y-1 text-sm sm:text-base">
                <li>• <strong>ROT13:</strong> Most common, shifts by 13</li>
                <li>• <strong>Caesar Cipher:</strong> ROT3, used by Julius Caesar</li>
                <li>• <strong>ROT5:</strong> For numbers (0-9)</li>
                <li>• <strong>ROT18:</strong> Combines ROT13 + ROT5</li>
                <li>• <strong>ROT25:</strong> Reverse cipher (ROT1 backwards)</li>
                <li>• <strong>Custom ROT-n:</strong> Any shift from 1-25</li>
              </ul>
            </div>
            <div>
              <h3 className="text-base sm:text-lg font-semibold mb-3">Common Use Cases</h3>
              <ul className="text-muted-foreground space-y-1 text-sm sm:text-base mb-4">
                <li>• Online forum spoiler protection</li>
                <li>• Simple text obfuscation</li>
                <li>• Puzzle and riddle creation</li>
                <li>• Educational cryptography examples</li>
                <li>• Quick message encoding</li>
                <li>• Historical cipher recreation</li>
              </ul>
              <h3 className="text-base sm:text-lg font-semibold mb-3">Features</h3>
              <ul className="text-muted-foreground space-y-1 text-sm sm:text-base">
                <li>• Real-time encryption/decryption</li>
                <li>• Configurable character sets</li>
                <li>• Multiple shift presets</li>
                <li>• Live alphabet mapping display</li>
                <li>• File upload and download</li>
                <li>• Input/output swapping</li>
                <li>• Copy to clipboard functionality</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
