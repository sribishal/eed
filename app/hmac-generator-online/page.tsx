'use client';

import { useState } from 'react';
import { Copy, Upload, Download, CheckCircle, Key } from 'lucide-react';
import { toast } from 'sonner';

export default function HMACGenerator() {
  const [input, setInput] = useState('');
  const [secretKey, setSecretKey] = useState('');
  const [algorithm, setAlgorithm] = useState('SHA-256');
  const [output, setOutput] = useState('');
  const [copied, setCopied] = useState(false);

  // HMAC implementation using Web Crypto API
  const generateHMAC = async (message: string, key: string, algorithm: string): Promise<string> => {
    if (!message.trim() || !key.trim()) {
      return '';
    }

    try {
      const encoder = new TextEncoder();
      const keyData = encoder.encode(key);
      const messageData = encoder.encode(message);

      // Map algorithm names to Web Crypto API format
      const algoMap: { [key: string]: string } = {
        'SHA-1': 'SHA-1',
        'SHA-256': 'SHA-256',
        'SHA-384': 'SHA-384',
        'SHA-512': 'SHA-512'
      };

      const cryptoKey = await crypto.subtle.importKey(
        'raw',
        keyData,
        { name: 'HMAC', hash: algoMap[algorithm] },
        false,
        ['sign']
      );

      const signature = await crypto.subtle.sign('HMAC', cryptoKey, messageData);
      const hashArray = Array.from(new Uint8Array(signature));
      const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
      
      return hashHex;
    } catch (error) {
      console.error('HMAC generation error:', error);
      return '';
    }
  };

  const handleGenerate = async (text: string, key: string) => {
    if (!text.trim() || !key.trim()) {
      setOutput('');
      return;
    }
    const hash = await generateHMAC(text, key, algorithm);
    setOutput(hash);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const value = e.target.value;
    setInput(value);
    handleGenerate(value, secretKey);
  };

  const handleKeyChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setSecretKey(value);
    handleGenerate(input, value);
  };

  const handleAlgorithmChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const value = e.target.value;
    setAlgorithm(value);
    if (input.trim() && secretKey.trim()) {
      handleGenerate(input, secretKey);
    }
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
        handleGenerate(content, secretKey);
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
    a.download = `hmac-${algorithm.toLowerCase().replace('-', '')}-hash.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    toast.success('File downloaded successfully!');
  };

  const generateRandomKey = () => {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    let result = '';
    for (let i = 0; i < 32; i++) {
      result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    setSecretKey(result);
    handleGenerate(input, result);
    toast.success('Random key generated!');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50/50 to-indigo-100/50 dark:from-blue-950/20 dark:to-indigo-950/20 py-8 sm:py-12 px-4 sm:px-6 lg:px-8">
      <div className="container mx-auto max-w-6xl">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold mb-4">
            HMAC Generator Online
          </h1>
          <p className="text-base sm:text-lg text-muted-foreground max-w-3xl mx-auto">
            Generate HMAC (Hash-based Message Authentication Code) using various hash algorithms. 
            HMAC provides both data integrity and authentication with a secret key.
          </p>
        </div>

        {/* Tool Interface */}
        <div className="bg-card rounded-xl shadow-lg border p-6 sm:p-8">
          {/* Algorithm Selection */}
          <div className="mb-6">
            <label className="text-base sm:text-lg font-semibold mb-3 block">
              Hash Algorithm
            </label>
            <div className="flex flex-wrap gap-2 sm:gap-3">
              <button
                onClick={() => handleAlgorithmChange({ target: { value: 'SHA-1' } } as any)}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                  algorithm === 'SHA-1'
                    ? 'bg-blue-500 text-white'
                    : 'bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 hover:bg-blue-200 dark:hover:bg-blue-900/50'
                }`}
              >
                HMAC-SHA1
              </button>
              <button
                onClick={() => handleAlgorithmChange({ target: { value: 'SHA-256' } } as any)}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                  algorithm === 'SHA-256'
                    ? 'bg-blue-500 text-white'
                    : 'bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 hover:bg-blue-200 dark:hover:bg-blue-900/50'
                }`}
              >
                HMAC-SHA256
              </button>
              <button
                onClick={() => handleAlgorithmChange({ target: { value: 'SHA-384' } } as any)}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                  algorithm === 'SHA-384'
                    ? 'bg-blue-500 text-white'
                    : 'bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 hover:bg-blue-200 dark:hover:bg-blue-900/50'
                }`}
              >
                HMAC-SHA384
              </button>
              <button
                onClick={() => handleAlgorithmChange({ target: { value: 'SHA-512' } } as any)}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                  algorithm === 'SHA-512'
                    ? 'bg-blue-500 text-white'
                    : 'bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 hover:bg-blue-200 dark:hover:bg-blue-900/50'
                }`}
              >
                HMAC-SHA512
              </button>
            </div>
          </div>

          {/* Secret Key Section */}
          <div className="mb-6">
            <div className="flex items-center justify-between mb-4">
              <label className="text-base sm:text-lg font-semibold">
                Secret Key
              </label>
              <button
                onClick={generateRandomKey}
                className="bg-indigo-100 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 px-3 py-2 rounded-lg text-sm hover:bg-indigo-200 dark:hover:bg-indigo-900/50 transition-colors"
              >
                <Key className="inline h-4 w-4 mr-1 sm:mr-2" />
                <span className="hidden sm:inline">Generate Key</span>
              </button>
            </div>
            <input
              type="text"
              value={secretKey}
              onChange={handleKeyChange}
              placeholder="Enter your secret key..."
              className="w-full p-4 border rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent bg-background"
            />
            <p className="text-sm text-muted-foreground mt-2">
              Key length: {secretKey.length} characters
            </p>
          </div>

          <div className="grid grid-cols-1 xl:grid-cols-2 gap-6 lg:gap-8">
            {/* Input Section */}
            <div>
              <div className="flex items-center justify-between mb-4">
                <label className="text-base sm:text-lg font-semibold">
                  Input Message
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
                </div>
              </div>
              <textarea
                value={input}
                onChange={handleInputChange}
                placeholder="Enter message to generate HMAC..."
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
                  HMAC Hash
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
                  {output || 'HMAC hash will appear here...'}
                </code>
              </div>
              <p className="text-sm text-muted-foreground mt-2">
                Hash length: {output.length} characters
              </p>
            </div>
          </div>
        </div>

        {/* Information Section */}
        <div className="mt-8 sm:mt-12 bg-card rounded-xl shadow-lg border p-6 sm:p-8">
          <h2 className="text-xl sm:text-2xl font-bold mb-6">
            About HMAC
          </h2>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 lg:gap-8">
            <div>
              <h3 className="text-base sm:text-lg font-semibold mb-3">What is HMAC?</h3>
              <p className="text-muted-foreground mb-4 text-sm sm:text-base">
                HMAC (Hash-based Message Authentication Code) is a specific type of message authentication 
                code that uses a cryptographic hash function and a secret key to verify data integrity and authenticity.
              </p>
              <h3 className="text-base sm:text-lg font-semibold mb-3">Common Use Cases</h3>
              <ul className="text-muted-foreground space-y-1 text-sm sm:text-base">
                <li>• API authentication</li>
                <li>• JWT token signing</li>
                <li>• Message integrity verification</li>
                <li>• Secure communications</li>
                <li>• Digital signatures</li>
              </ul>
            </div>
            <div>
              <h3 className="text-base sm:text-lg font-semibold mb-3">Security Benefits</h3>
              <p className="text-muted-foreground mb-4 text-sm sm:text-base">
                HMAC provides both data integrity and authentication. It's resistant to length extension 
                attacks and provides strong security when used with secure hash functions like SHA-256.
              </p>
              <h3 className="text-base sm:text-lg font-semibold mb-3">Features</h3>
              <ul className="text-muted-foreground space-y-1 text-sm sm:text-base">
                <li>• Multiple hash algorithms</li>
                <li>• Random key generation</li>
                <li>• Real-time hash generation</li>
                <li>• File upload support</li>
                <li>• Copy to clipboard</li>
                <li>• Download hash results</li>
                <li>• Client-side processing</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
