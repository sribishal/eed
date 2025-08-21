'use client';

import { useState } from 'react';
import { Copy, Upload, Download, CheckCircle, Eye, EyeOff, Plus, Trash2 } from 'lucide-react';
import { toast } from 'sonner';


interface JWTPayload {
  [key: string]: any;
}

interface DecodedJWT {
  header: any;
  payload: JWTPayload;
  signature: string;
  isValid: boolean;
  error?: string;
}

export default function JWTEncoderDecoder() {
  // Decoder states
  const [decoderInput, setDecoderInput] = useState('');
  const [decoded, setDecoded] = useState<DecodedJWT | null>(null);
  const [showSignature, setShowSignature] = useState(false);
  const [copiedHeader, setCopiedHeader] = useState(false);
  const [copiedPayload, setCopiedPayload] = useState(false);

  // Encoder states
  const [activeTab, setActiveTab] = useState<'decoder' | 'encoder'>('encoder');
  const [encoderHeader, setEncoderHeader] = useState('{\n  "alg": "HS256",\n  "typ": "JWT"\n}');
  const [encoderPayload, setEncoderPayload] = useState('{\n  "sub": "1234567890",\n  "name": "John Doe",\n  "iat": 1516239022\n}');
  const [encoderSecret, setEncoderSecret] = useState('your-256-bit-secret');
  const [encodedToken, setEncodedToken] = useState('');
  const [copiedToken, setCopiedToken] = useState(false);

  const base64UrlEncode = (str: string): string => {
    const base64 = btoa(str);
    return base64.replace(/\+/g, '-').replace(/\//g, '_').replace(/=/g, '');
  };

  const base64UrlDecode = (str: string): string => {
    const padding = '='.repeat((4 - (str.length % 4)) % 4);
    const base64 = str.replace(/-/g, '+').replace(/_/g, '/') + padding;
    
    try {
      return atob(base64);
    } catch (error) {
      throw new Error('Invalid base64url encoding');
    }
  };

  const hmacSha256 = async (message: string, secret: string): Promise<string> => {
    const encoder = new TextEncoder();
    const data = encoder.encode(message);
    const key = encoder.encode(secret);
    
    const cryptoKey = await crypto.subtle.importKey(
      'raw',
      key,
      { name: 'HMAC', hash: 'SHA-256' },
      false,
      ['sign']
    );
    
    const signature = await crypto.subtle.sign('HMAC', cryptoKey, data);
    const signatureArray = new Uint8Array(signature);
    const signatureString = String.fromCharCode.apply(null, Array.from(signatureArray));
    return base64UrlEncode(signatureString);
  };

  const encodeJWT = async () => {
    try {
      const header = JSON.parse(encoderHeader);
      const payload = JSON.parse(encoderPayload);
      
      const headerEncoded = base64UrlEncode(JSON.stringify(header));
      const payloadEncoded = base64UrlEncode(JSON.stringify(payload));
      const message = `${headerEncoded}.${payloadEncoded}`;
      
      let signature = '';
      if (header.alg === 'HS256') {
        signature = await hmacSha256(message, encoderSecret);
      } else {
        // For other algorithms, just create a placeholder signature
        signature = 'signature-not-generated';
      }
      
      const token = `${message}.${signature}`;
      setEncodedToken(token);
      toast.success('JWT token generated successfully!');
      
    } catch (error) {
      console.error('Encoding error:', error);
      setEncodedToken('Error: Invalid JSON in header or payload');
      toast.error('Failed to generate JWT: Invalid JSON in header or payload');
    }
  };

  const decodeJWT = (token: string): DecodedJWT => {
    try {
      const parts = token.split('.');
      
      if (parts.length !== 3) {
        throw new Error('Invalid JWT format. JWT must have 3 parts separated by dots.');
      }

      const [headerB64, payloadB64, signature] = parts;

      const headerJson = base64UrlDecode(headerB64);
      const header = JSON.parse(headerJson);

      const payloadJson = base64UrlDecode(payloadB64);
      const payload = JSON.parse(payloadJson);

      return {
        header,
        payload,
        signature,
        isValid: true
      };
    } catch (error) {
      return {
        header: {},
        payload: {},
        signature: '',
        isValid: false,
        error: (error as Error).message
      };
    }
  };

  const handleDecoderInputChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const value = e.target.value.trim();
    setDecoderInput(value);
    
    if (value) {
      const result = decodeJWT(value);
      setDecoded(result);
      
      if (!result.isValid) {
        toast.error(result.error || 'Invalid JWT format');
      } else {
        toast.success('JWT decoded successfully!');
      }
    } else {
      setDecoded(null);
    }
  };

  const formatTimestamp = (timestamp: number): string => {
    try {
      return new Date(timestamp * 1000).toLocaleString();
    } catch {
      return 'Invalid timestamp';
    }
  };

  const copyToClipboard = async (text: string, type: 'header' | 'payload' | 'token') => {
    try {
      await navigator.clipboard.writeText(text);
      if (type === 'header') {
        setCopiedHeader(true);
        setTimeout(() => setCopiedHeader(false), 2000);
      } else if (type === 'payload') {
        setCopiedPayload(true);
        setTimeout(() => setCopiedPayload(false), 2000);
      } else if (type === 'token') {
        setCopiedToken(true);
        setTimeout(() => setCopiedToken(false), 2000);
      }
      toast.success(`${type.charAt(0).toUpperCase() + type.slice(1)} copied to clipboard!`);
    } catch (error) {
      toast.error('Failed to copy to clipboard');
    }
  };

  const downloadDecoded = () => {
    if (!decoded || !decoded.isValid) {
      toast.error('No valid JWT to download');
      return;
    }

    const content = JSON.stringify({
      header: decoded.header,
      payload: decoded.payload,
      signature: decoded.signature
    }, null, 2);

    const blob = new Blob([content], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'jwt-decoded.json';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    toast.success('JWT decoded data downloaded!');
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        const content = event.target?.result as string;
        setDecoderInput(content.trim());
        const result = decodeJWT(content.trim());
        setDecoded(result);
        toast.success('File uploaded successfully!');
      };
      reader.readAsText(file);
    }
  };

  const addCurrentTimestamp = () => {
    const now = Math.floor(Date.now() / 1000);
    try {
      const payload = JSON.parse(encoderPayload);
      payload.iat = now;
      payload.exp = now + 3600; // 1 hour expiry
      setEncoderPayload(JSON.stringify(payload, null, 2));
      toast.success('Timestamps added to payload!');
    } catch (error) {
      console.error('Error adding timestamp:', error);
      toast.error('Failed to add timestamps: Invalid JSON in payload');
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50/50 to-red-100/50 dark:from-orange-950/20 dark:to-red-950/20 py-8 sm:py-12 px-4 sm:px-6 lg:px-8">
      <div className="container mx-auto max-w-6xl">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold mb-4">
            JWT Encoder Decoder Online
          </h1>
          <p className="text-base sm:text-lg text-muted-foreground max-w-3xl mx-auto">
            Create and decode JSON Web Tokens (JWT) with ease. Perfect for debugging authentication tokens and API development.
          </p>
        </div>

        {/* Tab Navigation */}
        <div className="flex justify-center mb-8">
          <div className="bg-card rounded-xl shadow-lg border p-2">
            <div className="flex space-x-2">
              <button
                onClick={() => setActiveTab('encoder')}
                className={`px-6 py-3 rounded-lg font-medium transition-colors ${
                  activeTab === 'encoder'
                    ? 'bg-orange-500 text-white'
                    : 'text-orange-500 hover:bg-orange-50 dark:hover:bg-orange-950/30'
                }`}
              >
                JWT Encoder
              </button>
              <button
                onClick={() => setActiveTab('decoder')}
                className={`px-6 py-3 rounded-lg font-medium transition-colors ${
                  activeTab === 'decoder'
                    ? 'bg-orange-500 text-white'
                    : 'text-orange-500 hover:bg-orange-50 dark:hover:bg-orange-950/30'
                }`}
              >
                JWT Decoder
              </button>
            </div>
          </div>
        </div>

        {/* Decoder Tab */}
        {activeTab === 'decoder' && (
          <div className="bg-card rounded-xl shadow-lg border p-6 sm:p-8">
            {/* Input Section */}
            <div className="mb-8">
              <div className="flex items-center justify-between mb-4">
                <label className="text-base sm:text-lg font-semibold">
                  JWT Token
                </label>
                <div className="flex items-center space-x-2">
                  <label className="cursor-pointer bg-orange-100 dark:bg-orange-900/30 text-orange-600 dark:text-orange-400 px-3 py-2 rounded-lg text-sm hover:bg-orange-200 dark:hover:bg-orange-900/50 transition-colors">
                    <Upload className="inline h-4 w-4 mr-1 sm:mr-2" />
                    <span className="hidden sm:inline">Upload File</span>
                    <input
                      type="file"
                      className="hidden"
                      onChange={handleFileUpload}
                      accept=".txt,.jwt"
                    />
                  </label>
                </div>
              </div>
              <textarea
                value={decoderInput}
                onChange={handleDecoderInputChange}
                placeholder="Paste your JWT token here (e.g., eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...)"
                className="w-full h-32 p-4 border rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent resize-none bg-background font-mono text-sm"
              />
              <p className="text-sm text-muted-foreground mt-2">
                Characters: {decoderInput.length}
              </p>
            </div>

            {/* Decoded Output */}
            {decoded && (
              <div className="space-y-6">
                {decoded.isValid ? (
                  <>
                    {/* Header */}
                    <div>
                      <div className="flex items-center justify-between mb-4">
                        <h3 className="text-lg font-semibold text-red-600 dark:text-red-400">
                          Header
                        </h3>
                        <button
                          onClick={() => copyToClipboard(JSON.stringify(decoded.header, null, 2), 'header')}
                          className="bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 px-3 py-2 rounded-lg text-sm hover:bg-blue-200 dark:hover:bg-blue-900/50 transition-colors"
                        >
                          {copiedHeader ? (
                            <>
                              <CheckCircle className="inline h-4 w-4 mr-1" />
                              Copied!
                            </>
                          ) : (
                            <>
                              <Copy className="inline h-4 w-4 mr-1" />
                              Copy
                            </>
                          )}
                        </button>
                      </div>
                      <pre className="bg-muted/50 p-4 rounded-lg overflow-x-auto text-sm font-mono">
                        {JSON.stringify(decoded.header, null, 2)}
                      </pre>
                    </div>

                    {/* Payload */}
                    <div>
                      <div className="flex items-center justify-between mb-4">
                        <h3 className="text-lg font-semibold text-orange-600 dark:text-orange-400">
                          Payload
                        </h3>
                        <button
                          onClick={() => copyToClipboard(JSON.stringify(decoded.payload, null, 2), 'payload')}
                          className="bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 px-3 py-2 rounded-lg text-sm hover:bg-blue-200 dark:hover:bg-blue-900/50 transition-colors"
                        >
                          {copiedPayload ? (
                            <>
                              <CheckCircle className="inline h-4 w-4 mr-1" />
                              Copied!
                            </>
                          ) : (
                            <>
                              <Copy className="inline h-4 w-4 mr-1" />
                              Copy
                            </>
                          )}
                        </button>
                      </div>
                      <pre className="bg-muted/50 p-4 rounded-lg overflow-x-auto text-sm font-mono">
                        {JSON.stringify(decoded.payload, null, 2)}
                      </pre>
                      
                      {/* Common Claims */}
                      {(decoded.payload.exp || decoded.payload.iat || decoded.payload.nbf) && (
                        <div className="mt-4 p-4 bg-blue-50 dark:bg-blue-950/30 rounded-lg">
                          <h4 className="font-semibold mb-2 text-blue-800 dark:text-blue-200">Token Information</h4>
                          <div className="space-y-1 text-sm">
                            {decoded.payload.iat && (
                              <div>
                                <span className="font-medium">Issued At:</span> {formatTimestamp(decoded.payload.iat)}
                              </div>
                            )}
                            {decoded.payload.exp && (
                              <div>
                                <span className="font-medium">Expires At:</span> {formatTimestamp(decoded.payload.exp)}
                                {decoded.payload.exp * 1000 < Date.now() && (
                                  <span className="ml-2 text-red-600 dark:text-red-400 font-medium">(Expired)</span>
                                )}
                              </div>
                            )}
                            {decoded.payload.nbf && (
                              <div>
                                <span className="font-medium">Not Before:</span> {formatTimestamp(decoded.payload.nbf)}
                              </div>
                            )}
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Signature */}
                    <div>
                      <div className="flex items-center justify-between mb-4">
                        <h3 className="text-lg font-semibold text-purple-600 dark:text-purple-400">
                          Signature
                        </h3>
                        <button
                          onClick={() => setShowSignature(!showSignature)}
                          className="bg-purple-100 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400 px-3 py-2 rounded-lg text-sm hover:bg-purple-200 dark:hover:bg-purple-900/50 transition-colors"
                        >
                          {showSignature ? (
                            <>
                              <EyeOff className="inline h-4 w-4 mr-1" />
                              Hide
                            </>
                          ) : (
                            <>
                              <Eye className="inline h-4 w-4 mr-1" />
                              Show
                            </>
                          )}
                        </button>
                      </div>
                      <div className="bg-muted/50 p-4 rounded-lg">
                        <code className="text-sm font-mono break-all">
                          {showSignature ? decoded.signature : '•'.repeat(20)}
                        </code>
                      </div>
                      <p className="text-xs text-muted-foreground mt-2">
                        Signature verification requires the secret key and is not performed by this tool.
                      </p>
                    </div>

                    {/* Download Button */}
                    <div className="text-center">
                      <button
                        onClick={downloadDecoded}
                        className="bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400 px-6 py-3 rounded-lg font-medium hover:bg-green-200 dark:hover:bg-green-900/50 transition-colors"
                      >
                        <Download className="inline h-4 w-4 mr-2" />
                        Download Decoded JWT
                      </button>
                    </div>
                  </>
                ) : (
                  <div className="bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-800 rounded-lg p-4">
                    <h3 className="text-lg font-semibold text-red-800 dark:text-red-200 mb-2">
                      Invalid JWT Token
                    </h3>
                    <p className="text-red-700 dark:text-red-300">
                      {decoded.error}
                    </p>
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {/* Encoder Tab */}
        {activeTab === 'encoder' && (
          <div className="bg-card rounded-xl shadow-lg border p-6 sm:p-8">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              {/* Left Column - Input */}
              <div className="space-y-6">
                {/* Header */}
                <div>
                  <label className="text-base font-semibold text-red-600 dark:text-red-400 block mb-3">
                    Header
                  </label>
                  <textarea
                    value={encoderHeader}
                    onChange={(e) => setEncoderHeader(e.target.value)}
                    className="w-full h-32 p-4 border rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent resize-none bg-background font-mono text-sm"
                    placeholder="JWT Header JSON"
                  />
                </div>

                {/* Payload */}
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <label className="text-base font-semibold text-orange-600 dark:text-orange-400">
                      Payload
                    </label>
                    <button
                      onClick={addCurrentTimestamp}
                      className="bg-orange-100 dark:bg-orange-900/30 text-orange-600 dark:text-orange-400 px-3 py-1 rounded text-sm hover:bg-orange-200 dark:hover:bg-orange-900/50 transition-colors"
                    >
                      <Plus className="inline h-3 w-3 mr-1" />
                      Add Timestamps
                    </button>
                  </div>
                  <textarea
                    value={encoderPayload}
                    onChange={(e) => setEncoderPayload(e.target.value)}
                    className="w-full h-40 p-4 border rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent resize-none bg-background font-mono text-sm"
                    placeholder="JWT Payload JSON"
                  />
                </div>

                {/* Secret */}
                <div>
                  <label className="text-base font-semibold text-purple-600 dark:text-purple-400 block mb-3">
                    Secret Key (for HMAC algorithms)
                  </label>
                  <input
                    type="text"
                    value={encoderSecret}
                    onChange={(e) => setEncoderSecret(e.target.value)}
                    className="w-full p-4 border rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent bg-background font-mono text-sm"
                    placeholder="Enter your secret key"
                  />
                  <p className="text-xs text-muted-foreground mt-2">
                    Only used for HS256 algorithm. Other algorithms will show placeholder signature.
                  </p>
                </div>

                {/* Encode Button */}
                <button
                  onClick={encodeJWT}
                  className="w-full bg-green-500 hover:bg-green-600 text-white font-medium py-3 px-6 rounded-lg transition-colors"
                >
                  Generate JWT Token
                </button>
              </div>

              {/* Right Column - Output */}
              <div className="space-y-6">
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <label className="text-base font-semibold text-green-600 dark:text-green-400">
                      Generated JWT Token
                    </label>
                    {encodedToken && (
                      <button
                        onClick={() => copyToClipboard(encodedToken, 'token')}
                        className="bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 px-3 py-2 rounded-lg text-sm hover:bg-blue-200 dark:hover:bg-blue-900/50 transition-colors"
                      >
                        {copiedToken ? (
                          <>
                            <CheckCircle className="inline h-4 w-4 mr-1" />
                            Copied!
                          </>
                        ) : (
                          <>
                            <Copy className="inline h-4 w-4 mr-1" />
                            Copy Token
                          </>
                        )}
                      </button>
                    )}
                  </div>
                  <div className="bg-muted/50 p-4 rounded-lg min-h-32">
                    {encodedToken ? (
                      <code className="text-sm font-mono break-all text-green-700 dark:text-green-300">
                        {encodedToken}
                      </code>
                    ) : (
                      <p className="text-muted-foreground text-sm">
                        Generated JWT token will appear here...
                      </p>
                    )}
                  </div>
                </div>

                {/* Quick Test */}
                {encodedToken && !encodedToken.startsWith('Error:') && (
                  <div>
                    <h4 className="text-base font-semibold mb-3">Quick Test</h4>
                    <button
                      onClick={() => {
                        setActiveTab('decoder');
                        setDecoderInput(encodedToken);
                        setDecoded(decodeJWT(encodedToken));
                      }}
                      className="w-full bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 py-3 px-6 rounded-lg hover:bg-blue-200 dark:hover:bg-blue-900/50 transition-colors"
                    >
                      Test in Decoder
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Information Section */}
        <div className="mt-8 sm:mt-12 bg-card rounded-xl shadow-lg border p-6 sm:p-8">
          <h2 className="text-xl sm:text-2xl font-bold mb-6">
            About JWT Tokens
          </h2>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 lg:gap-8">
            <div>
              <h3 className="text-base sm:text-lg font-semibold mb-3">What is JWT?</h3>
              <p className="text-muted-foreground mb-4 text-sm sm:text-base">
                JSON Web Token (JWT) is a compact, URL-safe means of representing claims between two parties. 
                It consists of three parts: header, payload, and signature, separated by dots.
              </p>
              <h3 className="text-base sm:text-lg font-semibold mb-3">Common Claims</h3>
              <ul className="text-muted-foreground space-y-1 text-sm sm:text-base">
                <li>• <code>iss</code> - Issuer</li>
                <li>• <code>sub</code> - Subject</li>
                <li>• <code>aud</code> - Audience</li>
                <li>• <code>exp</code> - Expiration Time</li>
                <li>• <code>iat</code> - Issued At</li>
                <li>• <code>nbf</code> - Not Before</li>
              </ul>
            </div>
            <div>
              <h3 className="text-base sm:text-lg font-semibold mb-3">Security Notes</h3>
              <p className="text-muted-foreground mb-4 text-sm sm:text-base">
                This tool generates tokens for development and testing purposes. Never use this tool with production 
                secrets or sensitive information. Always use secure, randomly generated secrets in production.
              </p>
              <h3 className="text-base sm:text-lg font-semibold mb-3">Use Cases</h3>
              <ul className="text-muted-foreground space-y-1 text-sm sm:text-base">
                <li>• Creating test tokens for development</li>
                <li>• Debugging authentication issues</li>
                <li>• Understanding token structure</li>
                <li>• API development and testing</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
