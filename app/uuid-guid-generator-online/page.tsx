'use client';

import { useState } from 'react';
import { Copy, Download, CheckCircle, RefreshCw, Shuffle } from 'lucide-react';
import { toast } from 'sonner';

export default function UUIDGenerator() {
  const [uuidType, setUuidType] = useState('v4');
  const [format, setFormat] = useState('standard');
  const [quantity, setQuantity] = useState(1);
  const [output, setOutput] = useState<string[]>([]);
  const [copied, setCopied] = useState(false);

  // UUID v4 generation (random)
  const generateUUIDv4 = (): string => {
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
      const r = Math.random() * 16 | 0;
      const v = c === 'x' ? r : (r & 0x3 | 0x8);
      return v.toString(16);
    });
  };

  // UUID v1 generation (timestamp-based - simplified)
  const generateUUIDv1 = (): string => {
    const timestamp = Date.now();
    const random = Math.random().toString(16).substring(2, 15);
    const timeHex = timestamp.toString(16).padStart(12, '0');
    
    return `${timeHex.substring(0, 8)}-${timeHex.substring(8, 12)}-1${random.substring(0, 3)}-${random.substring(3, 7)}-${random.substring(7, 19)}`.toLowerCase();
  };

  // NIL UUID
  const generateNilUUID = (): string => {
    return '00000000-0000-0000-0000-000000000000';
  };

  // Max UUID
  const generateMaxUUID = (): string => {
    return 'ffffffff-ffff-ffff-ffff-ffffffffffff';
  };

  // Format UUID based on selected format
  const formatUUID = (uuid: string): string => {
    const cleanUuid = uuid.replace(/-/g, '');
    
    switch (format) {
      case 'standard':
        return uuid;
      case 'uppercase':
        return uuid.toUpperCase();
      case 'no-hyphens':
        return cleanUuid;
      case 'no-hyphens-upper':
        return cleanUuid.toUpperCase();
      case 'braces':
        return `{${uuid}}`;
      case 'braces-upper':
        return `{${uuid.toUpperCase()}}`;
      case 'parentheses':
        return `(${uuid})`;
      case 'hex-array':
        return `[${cleanUuid.match(/.{2}/g)?.map(byte => `0x${byte}`).join(', ')}]`;
      default:
        return uuid;
    }
  };

  // Generate UUIDs based on type and quantity
  const generateUUIDs = () => {
    const uuids: string[] = [];
    
    for (let i = 0; i < quantity; i++) {
      let uuid: string;
      
      switch (uuidType) {
        case 'v1':
          uuid = generateUUIDv1();
          break;
        case 'v4':
          uuid = generateUUIDv4();
          break;
        case 'nil':
          uuid = generateNilUUID();
          break;
        case 'max':
          uuid = generateMaxUUID();
          break;
        default:
          uuid = generateUUIDv4();
      }
      
      uuids.push(formatUUID(uuid));
    }
    
    setOutput(uuids);
    toast.success(`Generated ${quantity} UUID${quantity > 1 ? 's' : ''}!`);
  };

  const handleTypeChange = (type: string) => {
    setUuidType(type);
    if (output.length > 0) {
      generateUUIDs();
    }
  };

  const handleFormatChange = (newFormat: string) => {
    setFormat(newFormat);
    if (output.length > 0) {
      generateUUIDs();
    }
  };

  const handleQuantityChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = Math.min(Math.max(1, parseInt(e.target.value) || 1), 100);
    setQuantity(value);
  };

  const copyToClipboard = async () => {
    if (output.length === 0) return;
    
    try {
      const text = output.join('\n');
      await navigator.clipboard.writeText(text);
      setCopied(true);
      toast.success('Copied to clipboard!');
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      console.error('Failed to copy to clipboard:', error);
      toast.error('Failed to copy to clipboard');
    }
  };

  const downloadResult = () => {
    if (output.length === 0) {
      toast.error('No UUIDs to download');
      return;
    }
    
    const text = output.join('\n');
    const blob = new Blob([text], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `uuids-${uuidType}-${quantity}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    toast.success('File downloaded successfully!');
  };

  return (
    <div className="min-h-screen bg-purple-50 dark:bg-slate-950 py-8 sm:py-12 px-4 sm:px-6 lg:px-8">
      <div className="container mx-auto max-w-6xl">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold mb-4">
            UUID GUID Generator Online
          </h1>
          <p className="text-base sm:text-lg text-muted-foreground max-w-3xl mx-auto">
            Generate Universally Unique Identifiers (UUIDs) and Globally Unique Identifiers (GUIDs) 
            in various formats and versions for your applications.
          </p>
        </div>

        {/* Tool Interface */}
        <div className="bg-card rounded-xl shadow-lg border p-6 sm:p-8">
          {/* UUID Type Selection */}
          <div className="mb-6">
            <label className="text-base sm:text-lg font-semibold mb-3 block">
              UUID Version
            </label>
            <div className="flex flex-wrap gap-2 sm:gap-3">
              <button
                onClick={() => handleTypeChange('v4')}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                  uuidType === 'v4'
                    ? 'bg-purple-500 text-white'
                    : 'bg-purple-100 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400 hover:bg-purple-200 dark:hover:bg-purple-900/50'
                }`}
              >
                UUID v4 (Random)
              </button>
              <button
                onClick={() => handleTypeChange('v1')}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                  uuidType === 'v1'
                    ? 'bg-purple-500 text-white'
                    : 'bg-purple-100 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400 hover:bg-purple-200 dark:hover:bg-purple-900/50'
                }`}
              >
                UUID v1 (Timestamp)
              </button>
              <button
                onClick={() => handleTypeChange('nil')}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                  uuidType === 'nil'
                    ? 'bg-purple-500 text-white'
                    : 'bg-purple-100 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400 hover:bg-purple-200 dark:hover:bg-purple-900/50'
                }`}
              >
                NIL UUID
              </button>
              <button
                onClick={() => handleTypeChange('max')}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                  uuidType === 'max'
                    ? 'bg-purple-500 text-white'
                    : 'bg-purple-100 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400 hover:bg-purple-200 dark:hover:bg-purple-900/50'
                }`}
              >
                MAX UUID
              </button>
            </div>
          </div>

          {/* Format Selection */}
          <div className="mb-6">
            <label className="text-base sm:text-lg font-semibold mb-3 block">
              Output Format
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              <button
                onClick={() => handleFormatChange('standard')}
                className={`px-3 py-2 rounded-lg text-xs font-medium transition-colors ${
                  format === 'standard'
                    ? 'bg-pink-500 text-white'
                    : 'bg-pink-100 dark:bg-pink-900/30 text-pink-600 dark:text-pink-400 hover:bg-pink-200 dark:hover:bg-pink-900/50'
                }`}
              >
                Standard
              </button>
              <button
                onClick={() => handleFormatChange('uppercase')}
                className={`px-3 py-2 rounded-lg text-xs font-medium transition-colors ${
                  format === 'uppercase'
                    ? 'bg-pink-500 text-white'
                    : 'bg-pink-100 dark:bg-pink-900/30 text-pink-600 dark:text-pink-400 hover:bg-pink-200 dark:hover:bg-pink-900/50'
                }`}
              >
                Uppercase
              </button>
              <button
                onClick={() => handleFormatChange('no-hyphens')}
                className={`px-3 py-2 rounded-lg text-xs font-medium transition-colors ${
                  format === 'no-hyphens'
                    ? 'bg-pink-500 text-white'
                    : 'bg-pink-100 dark:bg-pink-900/30 text-pink-600 dark:text-pink-400 hover:bg-pink-200 dark:hover:bg-pink-900/50'
                }`}
              >
                No Hyphens
              </button>
              <button
                onClick={() => handleFormatChange('no-hyphens-upper')}
                className={`px-3 py-2 rounded-lg text-xs font-medium transition-colors ${
                  format === 'no-hyphens-upper'
                    ? 'bg-pink-500 text-white'
                    : 'bg-pink-100 dark:bg-pink-900/30 text-pink-600 dark:text-pink-400 hover:bg-pink-200 dark:hover:bg-pink-900/50'
                }`}
              >
                No Hyphens Upper
              </button>
              <button
                onClick={() => handleFormatChange('braces')}
                className={`px-3 py-2 rounded-lg text-xs font-medium transition-colors ${
                  format === 'braces'
                    ? 'bg-pink-500 text-white'
                    : 'bg-pink-100 dark:bg-pink-900/30 text-pink-600 dark:text-pink-400 hover:bg-pink-200 dark:hover:bg-pink-900/50'
                }`}
              >
                Braces {}
              </button>
              <button
                onClick={() => handleFormatChange('braces-upper')}
                className={`px-3 py-2 rounded-lg text-xs font-medium transition-colors ${
                  format === 'braces-upper'
                    ? 'bg-pink-500 text-white'
                    : 'bg-pink-100 dark:bg-pink-900/30 text-pink-600 dark:text-pink-400 hover:bg-pink-200 dark:hover:bg-pink-900/50'
                }`}
              >
                Braces Upper
              </button>
              <button
                onClick={() => handleFormatChange('parentheses')}
                className={`px-3 py-2 rounded-lg text-xs font-medium transition-colors ${
                  format === 'parentheses'
                    ? 'bg-pink-500 text-white'
                    : 'bg-pink-100 dark:bg-pink-900/30 text-pink-600 dark:text-pink-400 hover:bg-pink-200 dark:hover:bg-pink-900/50'
                }`}
              >
                Parentheses ()
              </button>
              <button
                onClick={() => handleFormatChange('hex-array')}
                className={`px-3 py-2 rounded-lg text-xs font-medium transition-colors ${
                  format === 'hex-array'
                    ? 'bg-pink-500 text-white'
                    : 'bg-pink-100 dark:bg-pink-900/30 text-pink-600 dark:text-pink-400 hover:bg-pink-200 dark:hover:bg-pink-900/50'
                }`}
              >
                Hex Array
              </button>
            </div>
          </div>

          {/* Quantity and Generate */}
          <div className="mb-6 flex flex-col sm:flex-row items-start sm:items-end gap-4">
            <div className="flex-1">
              <label className="text-base sm:text-lg font-semibold mb-3 block">
                Quantity
              </label>
              <input
                type="number"
                min="1"
                max="100"
                value={quantity}
                onChange={handleQuantityChange}
                className="w-full sm:w-32 p-3 border rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent bg-background"
              />
            </div>
            <button
              onClick={generateUUIDs}
              className="bg-purple-500 text-white px-6 py-3 rounded-lg text-sm font-medium hover:bg-purple-600 transition-colors flex items-center gap-2"
            >
              <Shuffle className="h-4 w-4" />
              Generate UUIDs
            </button>
          </div>

          {/* Output Section */}
          <div>
            <div className="flex items-center justify-between mb-4">
              <label className="text-base sm:text-lg font-semibold">
                Generated UUIDs
              </label>
              <div className="flex items-center space-x-1 sm:space-x-2">
                <button
                  onClick={copyToClipboard}
                  disabled={output.length === 0}
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
                  disabled={output.length === 0}
                  className="bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 px-3 py-2 rounded-lg text-sm hover:bg-blue-200 dark:hover:bg-blue-900/50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <Download className="inline h-4 w-4 sm:mr-1" />
                  <span className="hidden sm:inline">Download</span>
                </button>
                <button
                  onClick={generateUUIDs}
                  disabled={output.length === 0}
                  className="bg-purple-100 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400 px-3 py-2 rounded-lg text-sm hover:bg-purple-200 dark:hover:bg-purple-900/50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <RefreshCw className="inline h-4 w-4 sm:mr-1" />
                  <span className="hidden sm:inline">Refresh</span>
                </button>
              </div>
            </div>
            <div className="bg-muted/50 rounded-lg p-4 min-h-[200px] max-h-[400px] overflow-y-auto">
              <code className="text-sm font-mono">
                {output.length > 0 ? (
                  <div className="space-y-1">
                    {output.map((uuid, index) => (
                      <div key={index} className="break-all">
                        {uuid}
                      </div>
                    ))}
                  </div>
                ) : (
                  'Generated UUIDs will appear here...'
                )}
              </code>
            </div>
            <p className="text-sm text-muted-foreground mt-2">
              Generated: {output.length} UUID{output.length !== 1 ? 's' : ''}
            </p>
          </div>
        </div>

        {/* Information Section */}
        <div className="mt-8 sm:mt-12 bg-card rounded-xl shadow-lg border p-6 sm:p-8">
          <h2 className="text-xl sm:text-2xl font-bold mb-6">
            About UUIDs / GUIDs
          </h2>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 lg:gap-8">
            <div>
              <h3 className="text-base sm:text-lg font-semibold mb-3">What are UUIDs?</h3>
              <p className="text-muted-foreground mb-4 text-sm sm:text-base">
                A UUID (Universally Unique Identifier) is a 128-bit identifier used to uniquely 
                identify information in computer systems. GUIDs are Microsoft's implementation of UUIDs.
              </p>
              <h3 className="text-base sm:text-lg font-semibold mb-3">UUID Versions</h3>
              <ul className="text-muted-foreground space-y-1 text-sm sm:text-base">
                <li>• <strong>Version 1:</strong> Timestamp-based</li>
                <li>• <strong>Version 4:</strong> Random or pseudo-random</li>
                <li>• <strong>NIL:</strong> All zeros (special case)</li>
                <li>• <strong>MAX:</strong> All ones (special case)</li>
              </ul>
            </div>
            <div>
              <h3 className="text-base sm:text-lg font-semibold mb-3">Common Use Cases</h3>
              <ul className="text-muted-foreground space-y-1 text-sm sm:text-base mb-4">
                <li>• Database primary keys</li>
                <li>• API request tracking</li>
                <li>• Session identifiers</li>
                <li>• File naming</li>
                <li>• Distributed systems</li>
              </ul>
              <h3 className="text-base sm:text-lg font-semibold mb-3">Features</h3>
              <ul className="text-muted-foreground space-y-1 text-sm sm:text-base">
                <li>• Multiple UUID versions</li>
                <li>• Various output formats</li>
                <li>• Bulk generation (1-100)</li>
                <li>• Copy to clipboard</li>
                <li>• Download results</li>
                <li>• Real-time generation</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
