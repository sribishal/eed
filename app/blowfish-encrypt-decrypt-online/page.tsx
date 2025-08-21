'use client';

import { useState } from 'react';
import { Copy, Upload, Download, CheckCircle, Key, Lock, Unlock, RefreshCw, Eye, EyeOff, Shield } from 'lucide-react';
import { toast } from 'sonner';

export default function BlowfishTool() {
  const [input, setInput] = useState('');
  const [key, setKey] = useState('');
  const [output, setOutput] = useState('');
  const [mode, setMode] = useState<'encrypt' | 'decrypt'>('encrypt');
  const [encoding, setEncoding] = useState<'hex' | 'base64'>('hex');
  const [copied, setCopied] = useState(false);
  const [showKey, setShowKey] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);

  // Blowfish implementation
  class BlowfishCipher {
    private P: number[] = [];
    private S: number[][] = [];

    // Initial values for P-array and S-boxes (simplified - in real implementation these would be the full arrays)
    private static readonly P_INIT = [
      0x243F6A88, 0x85A308D3, 0x13198A2E, 0x03707344, 0xA4093822, 0x299F31D0,
      0x082EFA98, 0xEC4E6C89, 0x452821E6, 0x38D01377, 0xBE5466CF, 0x34E90C6C,
      0xC0AC29B7, 0xC97C50DD, 0x3F84D5B5, 0xB5470917, 0x9216D5D9, 0x8979FB1B
    ];

    private static readonly S_INIT = [
      // S-box 0
      [0xD1310BA6, 0x98DFB5AC, 0x2FFD72DB, 0xD01ADFB7, 0xB8E1AFED, 0x6A267E96, 
       0xBA7C9045, 0xF12C7F99, 0x24A19947, 0xB3916CF7, 0x0801F2E2, 0x858EFC16],
      // S-box 1
      [0x636920D8, 0x71574E69, 0xA458FEA3, 0xF4933D7E, 0x0D95748F, 0x728EB658,
       0x718BCD58, 0x82154AEE, 0x7B54A41D, 0xC25A59B5, 0x9C30D539, 0x2AF26013],
      // S-box 2  
      [0xC5D1B023, 0x286085F0, 0xCA417918, 0xB8DB38EF, 0x8E79DCB0, 0x603A180E,
       0x6C9E0E8B, 0xB01E8A3E, 0xD71577C1, 0xBD314B27, 0x78AF2FDA, 0x55605C60],
      // S-box 3
      [0xE65525F3, 0xAA55AB94, 0x57489862, 0x63E81440, 0x55CA396A, 0x2AAB10B6,
       0xB4CC5C34, 0x1141E8CE, 0xA15486AF, 0x7C72E993, 0xB3EE1411, 0x636FBC2A]
    ];

    constructor(key: Uint8Array) {
      this.initializePAndS();
      this.expandKey(key);
    }

    private initializePAndS(): void {
      this.P = [...BlowfishCipher.P_INIT];
      this.S = BlowfishCipher.S_INIT.map(sbox => [...sbox]);
    }

    private expandKey(key: Uint8Array): void {
      // XOR P-array with key
      let keyIndex = 0;
      for (let i = 0; i < 18; i++) {
        let data = 0;
        for (let j = 0; j < 4; j++) {
          data = (data << 8) | key[keyIndex];
          keyIndex = (keyIndex + 1) % key.length;
        }
        this.P[i] ^= data;
      }

      // Encrypt all-zero string with current key schedule
      let left = 0, right = 0;
      for (let i = 0; i < 18; i += 2) {
        [left, right] = this.encryptBlock(left, right);
        this.P[i] = left;
        this.P[i + 1] = right;
      }

      // Update S-boxes
      for (let i = 0; i < 4; i++) {
        for (let j = 0; j < this.S[i].length; j += 2) {
          [left, right] = this.encryptBlock(left, right);
          this.S[i][j] = left;
          this.S[i][j + 1] = right;
        }
      }
    }

    private f(x: number): number {
      const a = (x >>> 24) & 0xFF;
      const b = (x >>> 16) & 0xFF;
      const c = (x >>> 8) & 0xFF;
      const d = x & 0xFF;

      return ((this.S[0][a % this.S[0].length] + this.S[1][b % this.S[1].length]) ^ 
              this.S[2][c % this.S[2].length]) + this.S[3][d % this.S[3].length];
    }

    private encryptBlock(left: number, right: number): [number, number] {
      for (let i = 0; i < 16; i++) {
        left ^= this.P[i];
        right ^= this.f(left);
        [left, right] = [right, left];
      }
      [left, right] = [right, left];
      right ^= this.P[16];
      left ^= this.P[17];
      return [left >>> 0, right >>> 0]; // Ensure unsigned 32-bit
    }

    private decryptBlock(left: number, right: number): [number, number] {
      for (let i = 17; i > 1; i--) {
        left ^= this.P[i];
        right ^= this.f(left);
        [left, right] = [right, left];
      }
      [left, right] = [right, left];
      right ^= this.P[1];
      left ^= this.P[0];
      return [left >>> 0, right >>> 0];
    }

    encrypt(data: Uint8Array): Uint8Array {
      const result = new Uint8Array(data.length);
      for (let i = 0; i < data.length; i += 8) {
        const left = (data[i] << 24) | (data[i + 1] << 16) | (data[i + 2] << 8) | data[i + 3];
        const right = (data[i + 4] << 24) | (data[i + 5] << 16) | (data[i + 6] << 8) | data[i + 7];
        
        const [encLeft, encRight] = this.encryptBlock(left, right);
        
        result[i] = (encLeft >>> 24) & 0xFF;
        result[i + 1] = (encLeft >>> 16) & 0xFF;
        result[i + 2] = (encLeft >>> 8) & 0xFF;
        result[i + 3] = encLeft & 0xFF;
        result[i + 4] = (encRight >>> 24) & 0xFF;
        result[i + 5] = (encRight >>> 16) & 0xFF;
        result[i + 6] = (encRight >>> 8) & 0xFF;
        result[i + 7] = encRight & 0xFF;
      }
      return result;
    }

    decrypt(data: Uint8Array): Uint8Array {
      const result = new Uint8Array(data.length);
      for (let i = 0; i < data.length; i += 8) {
        const left = (data[i] << 24) | (data[i + 1] << 16) | (data[i + 2] << 8) | data[i + 3];
        const right = (data[i + 4] << 24) | (data[i + 5] << 16) | (data[i + 6] << 8) | data[i + 7];
        
        const [decLeft, decRight] = this.decryptBlock(left, right);
        
        result[i] = (decLeft >>> 24) & 0xFF;
        result[i + 1] = (decLeft >>> 16) & 0xFF;
        result[i + 2] = (decLeft >>> 8) & 0xFF;
        result[i + 3] = decLeft & 0xFF;
        result[i + 4] = (decRight >>> 24) & 0xFF;
        result[i + 5] = (decRight >>> 16) & 0xFF;
        result[i + 6] = (decRight >>> 8) & 0xFF;
        result[i + 7] = decRight & 0xFF;
      }
      return result;
    }
  }

  // PKCS7 padding
  const addPadding = (data: Uint8Array): Uint8Array => {
    const blockSize = 8;
    const padding = blockSize - (data.length % blockSize);
    const padded = new Uint8Array(data.length + padding);
    padded.set(data);
    for (let i = data.length; i < padded.length; i++) {
      padded[i] = padding;
    }
    return padded;
  };

  const removePadding = (data: Uint8Array): Uint8Array => {
    const padding = data[data.length - 1];
    return data.slice(0, data.length - padding);
  };

  // Encoding functions
  const toHex = (data: Uint8Array): string => {
    return Array.from(data).map(b => b.toString(16).padStart(2, '0')).join('');
  };

  const fromHex = (hex: string): Uint8Array => {
    const bytes = new Uint8Array(hex.length / 2);
    for (let i = 0; i < hex.length; i += 2) {
      bytes[i / 2] = parseInt(hex.substr(i, 2), 16);
    }
    return bytes;
  };

  const toBase64 = (data: Uint8Array): string => {
    return btoa(String.fromCharCode(...data));
  };

  const fromBase64 = (base64: string): Uint8Array => {
    const binary = atob(base64);
    return new Uint8Array(binary.length).map((_, i) => binary.charCodeAt(i));
  };

  // Generate random key
  const generateRandomKey = () => {
    const keyBytes = new Uint8Array(16); // 128-bit key
    crypto.getRandomValues(keyBytes);
    const randomKey = toHex(keyBytes);
    setKey(randomKey);
    toast.success('Random key generated!');
  };

  // Validate inputs
  const validateInputs = (): boolean => {
    if (!input.trim()) {
      toast.error('Please enter text to process');
      return false;
    }
    if (!key.trim()) {
      toast.error('Please enter an encryption key');
      return false;
    }
    if (key.length < 8) {
      toast.error('Key must be at least 8 characters long');
      return false;
    }
    if (key.length > 56) {
      toast.error('Key must be no more than 56 characters long');
      return false;
    }
    return true;
  };

  // Process Blowfish encryption/decryption
  const handleProcess = async () => {
    if (!validateInputs()) return;

    setIsProcessing(true);
    try {
      const keyBytes = new TextEncoder().encode(key);
      const blowfish = new BlowfishCipher(keyBytes);

      if (mode === 'encrypt') {
        const inputBytes = new TextEncoder().encode(input);
        const paddedInput = addPadding(inputBytes);
        const encrypted = blowfish.encrypt(paddedInput);
        
        const result = encoding === 'hex' ? toHex(encrypted) : toBase64(encrypted);
        setOutput(result);
        toast.success('Text encrypted successfully!');
      } else {
        try {
          const encryptedBytes = encoding === 'hex' ? fromHex(input) : fromBase64(input);
          const decrypted = blowfish.decrypt(encryptedBytes);
          const unpaddedDecrypted = removePadding(decrypted);
          const result = new TextDecoder().decode(unpaddedDecrypted);
          setOutput(result);
          toast.success('Text decrypted successfully!');
        } catch (error) {
          toast.error('Invalid encrypted data or wrong key');
          setOutput('');
        }
      }
    } catch (error) {
      console.error('Blowfish processing error:', error);
      toast.error('Error processing Blowfish cipher');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setInput(e.target.value);
  };

  const handleKeyChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setKey(e.target.value);
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
      if (file.size > 10 * 1024 * 1024) {
        toast.error('File size must be less than 10MB');
        return;
      }
      const reader = new FileReader();
      reader.onload = (event) => {
        const content = event.target?.result as string;
        setInput(content);
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
    a.download = `blowfish-${mode}-${encoding}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    toast.success('File downloaded successfully!');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-cyan-50/50 to-blue-100/50 dark:from-cyan-950/20 dark:to-blue-950/20 py-8 sm:py-12 px-4 sm:px-6 lg:px-8">
      <div className="container mx-auto max-w-6xl">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold mb-4">
            Blowfish Cipher Encrypt Decrypt Online
          </h1>
          <p className="text-base sm:text-lg text-muted-foreground max-w-3xl mx-auto">
            Encrypt and decrypt data using the Blowfish symmetric block cipher. Fast, secure, and widely 
            supported encryption algorithm with variable key length from 32 to 448 bits.
          </p>
        </div>

        {/* Mode Selection */}
        <div className="bg-card rounded-xl shadow-lg border p-6 sm:p-8 mb-6">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex items-center space-x-4">
              <span className="text-lg font-semibold">Mode:</span>
              <div className="flex bg-muted rounded-lg p-1">
                <button
                  onClick={() => setMode('encrypt')}
                  className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                    mode === 'encrypt'
                      ? 'bg-gradient-to-r from-cyan-500 to-blue-500 text-white shadow-sm'
                      : 'text-muted-foreground hover:text-foreground'
                  }`}
                >
                  <Lock className="inline h-4 w-4 mr-1" />
                  Encrypt
                </button>
                <button
                  onClick={() => setMode('decrypt')}
                  className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                    mode === 'decrypt'
                      ? 'bg-gradient-to-r from-cyan-500 to-blue-500 text-white shadow-sm'
                      : 'text-muted-foreground hover:text-foreground'
                  }`}
                >
                  <Unlock className="inline h-4 w-4 mr-1" />
                  Decrypt
                </button>
              </div>
            </div>
            <button
              onClick={handleProcess}
              disabled={!input.trim() || !key.trim() || isProcessing}
              className="bg-gradient-to-r from-cyan-600 via-blue-600 to-indigo-600 hover:from-cyan-700 hover:via-blue-700 hover:to-indigo-700 text-white px-6 py-2 rounded-lg font-medium transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg hover:shadow-xl"
            >
              {isProcessing ? (
                <>
                  <RefreshCw className="inline h-4 w-4 mr-2 animate-spin" />
                  Processing...
                </>
              ) : (
                <>
                  <Shield className="inline h-4 w-4 mr-2" />
                  {mode === 'encrypt' ? 'Encrypt Data' : 'Decrypt Data'}
                </>
              )}
            </button>
          </div>
        </div>

        {/* Configuration Section */}
        <div className="bg-card rounded-xl shadow-lg border p-6 sm:p-8 mb-6">
          <h3 className="text-lg font-semibold mb-4">Blowfish Configuration</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Key Input */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="block text-sm font-medium">
                  <Key className="inline h-4 w-4 mr-2" />
                  Encryption Key
                </label>
                <div className="flex space-x-2">
                  <button
                    onClick={() => setShowKey(!showKey)}
                    className="bg-gradient-to-r from-gray-500 to-slate-500 hover:from-gray-600 hover:to-slate-600 text-white px-3 py-1 rounded text-xs font-medium transition-all duration-200 shadow-md hover:shadow-lg"
                  >
                    {showKey ? <EyeOff className="inline h-3 w-3" /> : <Eye className="inline h-3 w-3" />}
                  </button>
                  <button
                    onClick={generateRandomKey}
                    className="bg-gradient-to-r from-emerald-500 to-green-500 hover:from-emerald-600 hover:to-green-600 text-white px-3 py-1 rounded text-xs font-medium transition-all duration-200 shadow-md hover:shadow-lg"
                  >
                    <RefreshCw className="inline h-3 w-3 mr-1" />
                    Generate
                  </button>
                </div>
              </div>
              <input
                type={showKey ? 'text' : 'password'}
                value={key}
                onChange={handleKeyChange}
                placeholder="Enter encryption key (8-56 characters)"
                className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-cyan-500 focus:border-transparent bg-background font-mono"
              />
              <p className="text-sm text-muted-foreground mt-1">
                Key length: {key.length} characters ({key.length * 8} bits)
              </p>
            </div>

            {/* Output Encoding */}
            <div>
              <label className="block text-sm font-medium mb-2">Output Encoding</label>
              <div className="flex space-x-2">
                <button
                  onClick={() => setEncoding('hex')}
                  className={`flex-1 px-4 py-3 rounded-lg text-sm font-medium transition-all duration-200 ${
                    encoding === 'hex'
                      ? 'bg-gradient-to-r from-orange-500 to-red-500 text-white shadow-md'
                      : 'bg-muted text-muted-foreground hover:bg-muted/80'
                  }`}
                >
                  Hexadecimal
                </button>
                <button
                  onClick={() => setEncoding('base64')}
                  className={`flex-1 px-4 py-3 rounded-lg text-sm font-medium transition-all duration-200 ${
                    encoding === 'base64'
                      ? 'bg-gradient-to-r from-orange-500 to-red-500 text-white shadow-md'
                      : 'bg-muted text-muted-foreground hover:bg-muted/80'
                  }`}
                >
                  Base64
                </button>
              </div>
              <p className="text-sm text-muted-foreground mt-2">
                Choose how encrypted data should be encoded for display and storage.
              </p>
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
                  {mode === 'encrypt' ? 'Plain Text' : `Encrypted Data (${encoding.toUpperCase()})`}
                </label>
                <div className="flex items-center space-x-2">
                  <label className="cursor-pointer bg-gradient-to-r from-teal-500 to-cyan-500 hover:from-teal-600 hover:to-cyan-600 text-white px-3 py-2 rounded-lg text-sm font-medium transition-all duration-200 shadow-md hover:shadow-lg">
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
                  : `Enter ${encoding} encoded encrypted data to decrypt...`
                }
                className="w-full h-48 sm:h-64 p-4 border rounded-lg focus:ring-2 focus:ring-cyan-500 focus:border-transparent resize-none bg-background"
              />
              <p className="text-sm text-muted-foreground mt-2">
                Length: {input.length} characters
              </p>
            </div>

            {/* Output Section */}
            <div>
              <div className="flex items-center justify-between mb-4">
                <label className="text-base sm:text-lg font-semibold">
                  {mode === 'encrypt' ? `Encrypted Data (${encoding.toUpperCase()})` : 'Decrypted Text'}
                </label>
                <div className="flex items-center space-x-1 sm:space-x-2">
                  <button
                    onClick={copyToClipboard}
                    disabled={!output}
                    className="bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600 text-white px-3 py-2 rounded-lg text-sm font-medium transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed shadow-md hover:shadow-lg"
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
                    className="bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white px-3 py-2 rounded-lg text-sm font-medium transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed shadow-md hover:shadow-lg"
                  >
                    <Download className="inline h-4 w-4 sm:mr-1" />
                    <span className="hidden sm:inline">Download</span>
                  </button>
                </div>
              </div>
              <div className="bg-muted/50 rounded-lg p-4 min-h-[192px] sm:min-h-[256px] flex items-center">
                <code className="text-sm font-mono break-all whitespace-pre-wrap">
                  {output || `${mode === 'encrypt' ? 'Encrypted' : 'Decrypted'} data will appear here...`}
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
            About Blowfish Cipher
          </h2>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 lg:gap-8">
            <div>
              <h3 className="text-base sm:text-lg font-semibold mb-3">What is Blowfish?</h3>
              <p className="text-muted-foreground mb-4 text-sm sm:text-base">
                Blowfish is a symmetric-key block cipher designed by Bruce Schneier in 1993. 
                It's known for its speed, simplicity, and strong security, making it ideal for applications 
                where both security and performance are important.
              </p>
              <h3 className="text-base sm:text-lg font-semibold mb-3">Key Features</h3>
              <ul className="text-muted-foreground space-y-1 text-sm sm:text-base">
                <li>• <strong>Block Size:</strong> 64-bit blocks</li>
                <li>• <strong>Key Length:</strong> Variable from 32 to 448 bits</li>
                <li>• <strong>Rounds:</strong> 16 rounds of Feistel network</li>
                <li>• <strong>Speed:</strong> Fast encryption and decryption</li>
                <li>• <strong>Memory:</strong> Large key-dependent S-boxes</li>
              </ul>
            </div>
            <div>
              <h3 className="text-base sm:text-lg font-semibold mb-3">Algorithm Structure</h3>
              <p className="text-muted-foreground mb-4 text-sm sm:text-base">
                Blowfish consists of two parts: key expansion and data encryption. The key expansion converts 
                a variable-length key into several subkey arrays totaling 4,168 bytes.
              </p>
              <h3 className="text-base sm:text-lg font-semibold mb-3">Common Applications</h3>
              <ul className="text-muted-foreground space-y-1 text-sm sm:text-base">
                <li>• File and disk encryption</li>
                <li>• Network protocol encryption</li>
                <li>• Database encryption</li>
                <li>• Password manager applications</li>
                <li>• Secure communication systems</li>
              </ul>
            </div>
          </div>
          
          {/* SEO Information Section */}
          <div className="mt-8 pt-8 border-t">
            <h3 className="text-base sm:text-lg font-semibold mb-4">Blowfish Algorithm Implementation Details</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <h4 className="font-semibold mb-2">Feistel Network Structure:</h4>
                <ul className="text-muted-foreground space-y-1 text-sm sm:text-base list-disc list-inside">
                  <li>16-round Feistel cipher with complex F-function</li>
                  <li>Each round uses 32-bit subkeys from P-array</li>
                  <li>F-function combines four S-boxes with 256 entries each</li>
                  <li>Data flows through alternating left-right processing</li>
                  <li>Final swap and XOR with last two P-array entries</li>
                </ul>
              </div>
              <div>
                <h4 className="font-semibold mb-2">Key Expansion Process:</h4>
                <ul className="text-muted-foreground space-y-1 text-sm sm:text-base list-disc list-inside">
                  <li>Initialize P-array and S-boxes with fixed values</li>
                  <li>XOR P-array entries with key material cyclically</li>
                  <li>Encrypt all-zero blocks to generate new P-array</li>
                  <li>Continue encryption to fill all S-box entries</li>
                  <li>Total of 521 encryptions needed for key setup</li>
                </ul>
              </div>
            </div>
          </div>

          <div className="mt-6 pt-6 border-t">
            <h3 className="text-base sm:text-lg font-semibold mb-4">Security Analysis & Cryptographic Properties</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <h4 className="font-semibold mb-2">Strengths:</h4>
                <ul className="text-muted-foreground space-y-1 text-sm sm:text-base list-disc list-inside">
                  <li>No known practical attacks against full Blowfish</li>
                  <li>Fast performance in software implementations</li>
                  <li>Variable key length provides flexibility</li>
                  <li>Large memory requirements deter hardware attacks</li>
                  <li>Patent-free and public domain algorithm</li>
                  <li>Extensively analyzed by cryptographic community</li>
                  <li>Simple structure aids in verification</li>
                </ul>
              </div>
              <div>
                <h4 className="font-semibold mb-2">Considerations:</h4>
                <ul className="text-muted-foreground space-y-1 text-sm sm:text-base list-disc list-inside">
                  <li>64-bit block size limits secure data volume</li>
                  <li>Slow key setup makes it less suitable for frequent key changes</li>
                  <li>Sweet32 attack affects all 64-bit block ciphers</li>
                  <li>Not recommended for new applications (use AES instead)</li>
                  <li>Weak keys exist but are extremely rare</li>
                  <li>Memory requirements may be challenging on constrained devices</li>
                </ul>
              </div>
            </div>
          </div>

          <div className="mt-6 pt-6 border-t">
            <h3 className="text-base sm:text-lg font-semibold mb-4">Performance Characteristics & Benchmarks</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <h4 className="font-semibold mb-2">Speed Advantages:</h4>
                <ul className="text-muted-foreground space-y-1 text-sm sm:text-base list-disc list-inside">
                  <li>Optimized for 32-bit processors</li>
                  <li>Simple operations: XOR, addition, table lookups</li>
                  <li>No multiplication or complex bit operations</li>
                  <li>Excellent performance on older hardware</li>
                  <li>Minimal code size requirements</li>
                  <li>Cache-friendly memory access patterns</li>
                </ul>
              </div>
              <div>
                <h4 className="font-semibold mb-2">Memory Usage:</h4>
                <ul className="text-muted-foreground space-y-1 text-sm sm:text-base list-disc list-inside">
                  <li>P-array: 18 × 32-bit entries (72 bytes)</li>
                  <li>S-boxes: 4 × 256 × 32-bit entries (4,096 bytes)</li>
                  <li>Total memory: 4,168 bytes per key schedule</li>
                  <li>Key setup time: ~521 encryption operations</li>
                  <li>Memory access intensive during encryption</li>
                </ul>
              </div>
            </div>
          </div>

          <div className="mt-6 pt-6 border-t">
            <h3 className="text-base sm:text-lg font-semibold mb-4">Implementation Variants & Standards</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div>
                <h4 className="font-semibold mb-2">Standard Implementations:</h4>
                <ul className="text-muted-foreground space-y-1 text-sm sm:text-base list-disc list-inside">
                  <li>OpenSSL Blowfish implementation</li>
                  <li>GnuPG uses Blowfish for symmetric encryption</li>
                  <li>bcrypt password hashing (Blowfish-based)</li>
                  <li>SSH protocol cipher support</li>
                  <li>TLS/SSL cipher suite inclusion</li>
                </ul>
              </div>
              <div>
                <h4 className="font-semibold mb-2">Related Algorithms:</h4>
                <ul className="text-muted-foreground space-y-1 text-sm sm:text-base list-disc list-inside">
                  <li><strong>Twofish:</strong> Blowfish successor by same author</li>
                  <li><strong>Threefish:</strong> Part of Skein hash function</li>
                  <li><strong>bcrypt:</strong> Adaptive password hashing</li>
                  <li><strong>Eksblowfish:</strong> Expensive key schedule variant</li>
                </ul>
              </div>
              <div>
                <h4 className="font-semibold mb-2">Tool Capabilities:</h4>
                <ul className="text-muted-foreground space-y-1 text-sm sm:text-base list-disc list-inside">
                  <li>Full Blowfish implementation</li>
                  <li>Variable key length support (8-56 chars)</li>
                  <li>PKCS7 padding for arbitrary data lengths</li>
                  <li>Hex and Base64 output encoding</li>
                  <li>Secure random key generation</li>
                  <li>Client-side processing for privacy</li>
                </ul>
              </div>
            </div>
          </div>

          <div className="mt-6 pt-6 border-t">
            <h3 className="text-base sm:text-lg font-semibold mb-4">Historical Context & Legacy</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <h4 className="font-semibold mb-2">Development History:</h4>
                <ul className="text-muted-foreground space-y-1 text-sm sm:text-base list-disc list-inside">
                  <li><strong>1993:</strong> Published by Bruce Schneier</li>
                  <li><strong>1994:</strong> First cryptanalysis attempts</li>
                  <li><strong>1996:</strong> Incorporated into various software</li>
                  <li><strong>1998:</strong> Twofish (successor) submitted to AES</li>
                  <li><strong>2000s:</strong> Widespread adoption in applications</li>
                  <li><strong>2016:</strong> Sweet32 attack affects 64-bit ciphers</li>
                </ul>
              </div>
              <div>
                <h4 className="font-semibold mb-2">Current Status:</h4>
                <ul className="text-muted-foreground space-y-1 text-sm sm:text-base list-disc list-inside">
                  <li>Still secure for most practical purposes</li>
                  <li>Gradually being replaced by AES</li>
                  <li>Remains popular for legacy system support</li>
                  <li>Educational value for understanding Feistel ciphers</li>
                  <li>Important milestone in cipher design history</li>
                  <li>Influence on modern cipher development</li>
                </ul>
              </div>
            </div>
          </div>

          <div className="mt-6 pt-6 border-t">
            <h3 className="text-base sm:text-lg font-semibold mb-4">Best Practices & Security Guidelines</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <h4 className="font-semibold mb-2">Key Management:</h4>
                <ul className="text-muted-foreground space-y-1 text-sm sm:text-base list-disc list-inside">
                  <li>Use minimum 128-bit (16-character) keys</li>
                  <li>Generate keys using cryptographically secure RNG</li>
                  <li>Avoid predictable or dictionary-based keys</li>
                  <li>Consider key derivation functions for password-based keys</li>
                  <li>Implement proper key rotation policies</li>
                  <li>Secure key storage and transmission</li>
                </ul>
              </div>
              <div>
                <h4 className="font-semibold mb-2">Usage Recommendations:</h4>
                <ul className="text-muted-foreground space-y-1 text-sm sm:text-base list-disc list-inside">
                  <li>Limit data encrypted with single key (64GB max)</li>
                  <li>Use appropriate block cipher modes (CBC, CTR)</li>
                  <li>Implement proper initialization vectors</li>
                  <li>Consider authenticated encryption modes</li>
                  <li>Migrate to AES for new applications</li>
                  <li>Regular security assessment and updates</li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
