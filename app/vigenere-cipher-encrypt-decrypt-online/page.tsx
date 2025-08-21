'use client';

import { useState } from 'react';
import { Copy, Upload, Download, CheckCircle, Key, Lock, Unlock } from 'lucide-react';
import { toast } from 'sonner';

export default function VigenereCipher() {
  const [input, setInput] = useState('');
  const [key, setKey] = useState('');
  const [output, setOutput] = useState('');
  const [mode, setMode] = useState<'encrypt' | 'decrypt'>('encrypt');
  const [copied, setCopied] = useState(false);

  // Vigenère cipher implementation
  const vigenereCipher = (text: string, key: string, encrypt: boolean): string => {
    if (!key) return '';
    
    const cleanKey = key.toUpperCase().replace(/[^A-Z]/g, '');
    if (!cleanKey) return '';
    
    let result = '';
    let keyIndex = 0;
    
    for (let i = 0; i < text.length; i++) {
      const char = text[i];
      
      if (char.match(/[A-Za-z]/)) {
        const isUpperCase = char === char.toUpperCase();
        const charCode = char.toUpperCase().charCodeAt(0) - 65;
        const keyCode = cleanKey.charCodeAt(keyIndex % cleanKey.length) - 65;
        
        let newCharCode;
        if (encrypt) {
          newCharCode = (charCode + keyCode) % 26;
        } else {
          newCharCode = (charCode - keyCode + 26) % 26;
        }
        
        const newChar = String.fromCharCode(newCharCode + 65);
        result += isUpperCase ? newChar : newChar.toLowerCase();
        keyIndex++;
      } else {
        result += char;
      }
    }
    
    return result;
  };

  const handleProcess = (text: string, keyValue: string, isEncrypt: boolean) => {
    if (!text.trim() || !keyValue.trim()) {
      setOutput('');
      return;
    }
    
    const result = vigenereCipher(text, keyValue, isEncrypt);
    setOutput(result);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const value = e.target.value;
    setInput(value);
    handleProcess(value, key, mode === 'encrypt');
  };

  const handleKeyChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setKey(value);
    handleProcess(input, value, mode === 'encrypt');
  };

  const handleModeChange = (newMode: 'encrypt' | 'decrypt') => {
    setMode(newMode);
    handleProcess(input, key, newMode === 'encrypt');
  };

  const generateRandomKey = () => {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
    let result = '';
    for (let i = 0; i < 8; i++) {
      result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    setKey(result);
    handleProcess(input, result, mode === 'encrypt');
    toast.success('Random key generated!');
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
        handleProcess(content, key, mode === 'encrypt');
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
    a.download = `vigenere-${mode}ed.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    toast.success('File downloaded successfully!');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-rose-50/50 to-pink-100/50 dark:from-rose-950/20 dark:to-pink-950/20 py-8 sm:py-12 px-4 sm:px-6 lg:px-8">
      <div className="container mx-auto max-w-6xl">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold mb-4">
            Vigenère Cipher Encrypt Decrypt Online
          </h1>
          <p className="text-base sm:text-lg text-muted-foreground max-w-3xl mx-auto">
            Encrypt and decrypt messages using the classic Vigenère cipher. This polyalphabetic substitution cipher uses a keyword to encrypt and decrypt messages with enhanced security.
          </p>
        </div>

        {/* Mode Selection */}
        <div className="bg-card rounded-xl shadow-lg border p-6 sm:p-8 mb-6">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex items-center space-x-4">
              <span className="text-lg font-semibold">Mode:</span>
              <div className="flex bg-rose-100 dark:bg-rose-900 rounded-lg p-1">
                <button
                  onClick={() => handleModeChange('encrypt')}
                  className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                    mode === 'encrypt'
                      ? 'bg-rose-600 text-white shadow-sm'
                      : 'text-rose-600 dark:text-rose-300 hover:text-rose-800 dark:hover:text-rose-100'
                  }`}
                >
                  <Lock className="inline h-4 w-4 mr-1" />
                  Encrypt
                </button>
                <button
                  onClick={() => handleModeChange('decrypt')}
                  className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                    mode === 'decrypt'
                      ? 'bg-rose-600 text-white shadow-sm'
                      : 'text-rose-600 dark:text-rose-300 hover:text-rose-800 dark:hover:text-rose-100'
                  }`}
                >
                  <Unlock className="inline h-4 w-4 mr-1" />
                  Decrypt
                </button>
              </div>
            </div>
            <button
              onClick={() => handleProcess(input, key, mode === 'encrypt')}
              disabled={!input.trim() || !key.trim()}
              className="bg-rose-600 text-white px-6 py-2 rounded-lg font-medium hover:bg-rose-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {mode === 'encrypt' ? 'Encrypt Message' : 'Decrypt Message'}
            </button>
          </div>
        </div>

        {/* Keyword Section */}
        <div className="bg-card rounded-xl shadow-lg border p-6 sm:p-8 mb-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 lg:gap-8">
            <div>
              <label className="text-base sm:text-lg font-semibold mb-4 block">
                <Key className="inline h-5 w-5 mr-2" />
                Cipher Keyword
              </label>
              <input
                type="text"
                value={key}
                onChange={handleKeyChange}
                placeholder="Enter keyword for cipher..."
                className="w-full p-4 border rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent bg-background"
              />
              <p className="text-sm text-muted-foreground mt-2">
                Key length: {key.length} characters (only letters will be used for encryption)
              </p>
            </div>
            <div>
              <label className="text-base sm:text-lg font-semibold mb-4 block">
                Key Actions
              </label>
              <div className="bg-muted/50 rounded-lg p-4 min-h-[120px] flex items-center justify-center">
                <button
                  onClick={generateRandomKey}
                  className="bg-rose-100 dark:bg-rose-900/30 text-rose-600 dark:text-rose-400 px-4 py-3 rounded-lg font-medium hover:bg-rose-200 dark:hover:bg-rose-900/50 transition-colors"
                >
                  <Key className="inline h-4 w-4 mr-2" />
                  Generate Random Key
                </button>
              </div>
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
                  {mode === 'encrypt' ? 'Plain Text' : 'Encrypted Text'}
                </label>
                <div className="flex items-center space-x-2">
                  <label className="cursor-pointer bg-rose-100 dark:bg-rose-900/30 text-rose-600 dark:text-rose-400 px-3 py-2 rounded-lg text-sm hover:bg-rose-200 dark:hover:bg-rose-900/50 transition-colors">
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
                value={input}
                onChange={handleInputChange}
                placeholder={mode === 'encrypt' 
                  ? "Enter plain text to encrypt..." 
                  : "Enter encrypted text to decrypt..."
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
                  {mode === 'encrypt' ? 'Encrypted Text' : 'Decrypted Text'}
                </label>
                <div className="flex items-center space-x-1 sm:space-x-2">
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
              <div className="bg-muted/50 rounded-lg p-4 min-h-[192px] sm:min-h-[256px] flex items-center">
                <code className="text-sm font-mono break-all">
                  {output || `${mode === 'encrypt' ? 'Encrypted' : 'Decrypted'} text will appear here...`}
                </code>
              </div>
              <p className="text-sm text-muted-foreground mt-2">
                Length: {output.length} characters
              </p>
            </div>
          </div>
        </div>

        {/* Information Section */}
        <div className="mt-8 sm:mt-12 bg-card rounded-xl shadow-lg border p-6 sm:p-8">
          <h2 className="text-xl sm:text-2xl font-bold mb-6">
            About Vigenère Cipher
          </h2>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 lg:gap-8">
            <div>
              <h3 className="text-base sm:text-lg font-semibold mb-3">What is Vigenère Cipher?</h3>
              <p className="text-muted-foreground mb-4 text-sm sm:text-base">
                The Vigenère cipher is a polyalphabetic substitution cipher that uses a keyword to encrypt text. 
                Each letter is shifted by a different amount based on the corresponding letter in the keyword.
              </p>
              <h3 className="text-base sm:text-lg font-semibold mb-3">How It Works</h3>
              <ul className="text-muted-foreground space-y-1 text-sm sm:text-base">
                <li>• Uses a repeating keyword for encryption</li>
                <li>• Each letter shifted by keyword letter value</li>
                <li>• Non-alphabetic characters remain unchanged</li>
                <li>• Case preservation in output text</li>
                <li>• More secure than simple Caesar cipher</li>
                <li>• Polyalphabetic substitution method</li>
              </ul>
            </div>
            <div>
              <h3 className="text-base sm:text-lg font-semibold mb-3">Historical Significance</h3>
              <p className="text-muted-foreground mb-4 text-sm sm:text-base">
                Invented by Blaise de Vigenère in 1586, this cipher was considered unbreakable for centuries 
                and was called "le chiffre indéchiffrable" (the indecipherable cipher).
              </p>
              <h3 className="text-base sm:text-lg font-semibold mb-3">Modern Applications</h3>
              <ul className="text-muted-foreground space-y-1 text-sm sm:text-base">
                <li>• Educational cryptography demonstrations</li>
                <li>• Historical cipher analysis and research</li>
                <li>• Puzzle and game creation</li>
                <li>• Understanding polyalphabetic ciphers</li>
                <li>• Basic text obfuscation methods</li>
              </ul>
            </div>
          </div>
          
          {/* SEO Information Section */}
          <div className="mt-8 pt-8 border-t">
            <h3 className="text-base sm:text-lg font-semibold mb-4">Vigenère Cipher Rules & Examples</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <h4 className="font-semibold mb-2">Encryption Process:</h4>
                <ol className="text-muted-foreground space-y-1 text-sm sm:text-base list-decimal list-inside">
                  <li>Take each letter of the plaintext</li>
                  <li>Find the corresponding keyword letter</li>
                  <li>Shift the plaintext letter by keyword letter value</li>
                  <li>Repeat keyword cyclically through the text</li>
                </ol>
              </div>
              <div>
                <h4 className="font-semibold mb-2">Key Features:</h4>
                <ul className="text-muted-foreground space-y-1 text-sm sm:text-base list-disc list-inside">
                  <li>Keyword-based encryption system</li>
                  <li>Automatic key repetition</li>
                  <li>Case-sensitive processing</li>
                  <li>Non-alphabetic character preservation</li>
                  <li>Random key generation option</li>
                </ul>
              </div>
            </div>
          </div>

          <div className="mt-6 pt-6 border-t">
            <h3 className="text-base sm:text-lg font-semibold mb-4">Security & Limitations</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <h4 className="font-semibold mb-2">Strengths:</h4>
                <ul className="text-muted-foreground space-y-1 text-sm sm:text-base list-disc list-inside">
                  <li>More secure than monoalphabetic ciphers</li>
                  <li>Frequency analysis is more difficult</li>
                  <li>Simple to implement and understand</li>
                  <li>Works with any alphabet size</li>
                  <li>Keyword provides additional security layer</li>
                </ul>
              </div>
              <div>
                <h4 className="font-semibold mb-2">Weaknesses:</h4>
                <ul className="text-muted-foreground space-y-1 text-sm sm:text-base list-disc list-inside">
                  <li>Vulnerable to Kasiski examination</li>
                  <li>Short keywords create patterns</li>
                  <li>Index of coincidence analysis possible</li>
                  <li>Not suitable for modern security needs</li>
                  <li>Frequency analysis on longer texts</li>
                </ul>
              </div>
            </div>
          </div>

          <div className="mt-6 pt-6 border-t">
            <h3 className="text-base sm:text-lg font-semibold mb-4">Tool Features</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div>
                <h4 className="font-semibold mb-2">Core Functions:</h4>
                <ul className="text-muted-foreground space-y-1 text-sm sm:text-base list-disc list-inside">
                  <li>Real-time encryption/decryption</li>
                  <li>Custom keyword support</li>
                  <li>Random key generation</li>
                  <li>Case preservation</li>
                </ul>
              </div>
              <div>
                <h4 className="font-semibold mb-2">File Operations:</h4>
                <ul className="text-muted-foreground space-y-1 text-sm sm:text-base list-disc list-inside">
                  <li>File upload support (up to 10MB)</li>
                  <li>Download encrypted/decrypted results</li>
                  <li>Multiple file format support</li>
                  <li>Batch text processing</li>
                </ul>
              </div>
              <div>
                <h4 className="font-semibold mb-2">User Experience:</h4>
                <ul className="text-muted-foreground space-y-1 text-sm sm:text-base list-disc list-inside">
                  <li>Dark mode support</li>
                  <li>Copy to clipboard functionality</li>
                  <li>Toast notifications</li>
                  <li>Responsive design</li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
