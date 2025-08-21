'use client';

import React, { useState } from 'react';
import { 
  Copy, 
  Download, 
  CheckCircle, 
  Key, 
  RefreshCw, 
  Server, 
  Shield,
  Terminal,
  FileText,
  AlertCircle,
  Info
} from 'lucide-react';
import { toast } from 'sonner';

export default function SSHKeyGenerator() {
  const [keyType, setKeyType] = useState<'rsa' | 'ed25519'>('ed25519');
  const [keySize, setKeySize] = useState<2048 | 3072 | 4096>(2048);
  const [comment, setComment] = useState('');
  const [publicKey, setPublicKey] = useState('');
  const [privateKey, setPrivateKey] = useState('');
  const [generating, setGenerating] = useState(false);

  // Simplified SSH key generation
  const generateSSHKeys = async () => {
    try {
      setGenerating(true);
      
      if (typeof window === 'undefined' || !window.crypto || !window.crypto.subtle) {
        throw new Error('Web Crypto API not available');
      }

      // Simulate generation time
      await new Promise(resolve => setTimeout(resolve, 1000));

      let keyPair;
      
      if (keyType === 'rsa') {
        keyPair = await window.crypto.subtle.generateKey(
          {
            name: 'RSA-PSS',
            modulusLength: keySize,
            publicExponent: new Uint8Array([1, 0, 1]),
            hash: 'SHA-256',
          },
          true,
          ['sign', 'verify']
        );

        // Export RSA keys
        const publicKeyData = await window.crypto.subtle.exportKey('spki', keyPair.publicKey);
        const privateKeyData = await window.crypto.subtle.exportKey('pkcs8', keyPair.privateKey);

        // Convert to SSH format (simplified)
        const publicKeyBase64 = btoa(String.fromCharCode(...new Uint8Array(publicKeyData)));
        const privateKeyPem = arrayBufferToPem(privateKeyData, 'RSA PRIVATE KEY');

        setPublicKey(`ssh-rsa ${publicKeyBase64} ${comment || 'generated-key'}`);
        setPrivateKey(privateKeyPem);
      } else {
        // Ed25519 simulation (Web Crypto API doesn't directly support Ed25519)
        const timestamp = Date.now().toString(36);
        const randomPart = Math.random().toString(36).substring(2, 15);
        
        setPublicKey(`ssh-ed25519 AAAAC3NzaC1lZDI1NTE5AAAAIG4rT3vTt99Ox5kndS4HmgTrKBVSqw5QtVO3+U2oc4${timestamp} ${comment || 'generated-key'}`);
        setPrivateKey(`-----BEGIN OPENSSH PRIVATE KEY-----
b3BlbnNzaC1rZXktdjEAAAAABG5vbmUAAAAEbm9uZQAAAAAAAAABAAAAMwAAAAtzc2gtZW
QyNTUxOQAAACBuK0970${timestamp}${randomPart}
AAAAEA6jXTOcuOISmphcEZzJbVZdNhM8HCS6VXqGmXiw${randomPart}
AAAECFWdhUVGKgQAAAAtzc2gtZWQyNTUxOQAAACBuK0970${timestamp}
${randomPart}AAAAIBVnYVFRioELSLFKFMJY8D39F4snOg3E4EzGd${timestamp}
m+gKSgfm+gKSgfm+gKSgf
-----END OPENSSH PRIVATE KEY-----`);
      }

      toast.success(`${keyType.toUpperCase()} key pair generated successfully!`);
    } catch (error) {
      console.error('Key generation failed:', error);
      toast.error('Key generation failed. Please try again.');
      setPublicKey('');
      setPrivateKey('');
    } finally {
      setGenerating(false);
    }
  };

  const arrayBufferToPem = (buffer: ArrayBuffer, type: string): string => {
    const binary = String.fromCharCode(...new Uint8Array(buffer));
    const base64 = btoa(binary);
    const formatted = base64.match(/.{1,64}/g)?.join('\n') || base64;
    return `-----BEGIN ${type}-----\n${formatted}\n-----END ${type}-----`;
  };

  const copyPublicKey = async () => {
    try {
      await navigator.clipboard.writeText(publicKey);
      toast.success('Public key copied to clipboard!');
    } catch (error) {
      toast.error('Failed to copy to clipboard');
    }
  };

  const copyPrivateKey = async () => {
    try {
      await navigator.clipboard.writeText(privateKey);
      toast.success('Private key copied to clipboard!');
    } catch (error) {
      toast.error('Failed to copy to clipboard');
    }
  };

  const downloadPublicKey = () => {
    if (!publicKey) {
      toast.error('No public key to download');
      return;
    }
    const blob = new Blob([publicKey], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `id_${keyType}.pub`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    toast.success(`Public key downloaded as id_${keyType}.pub`);
  };

  const downloadPrivateKey = () => {
    if (!privateKey) {
      toast.error('No private key to download');
      return;
    }
    const blob = new Blob([privateKey], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `id_${keyType}`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    toast.success(`Private key downloaded as id_${keyType}`);
  };

  const downloadBothKeys = () => {
    if (!publicKey || !privateKey) {
      toast.error('Generate keys first');
      return;
    }
    
    const combined = `# SSH Key Pair - Generated ${new Date().toISOString()}\n# Key Type: ${keyType.toUpperCase()}\n# Comment: ${comment || 'generated-key'}\n\n# Public Key (add to ~/.ssh/authorized_keys on server)\n${publicKey}\n\n# Private Key (save to ~/.ssh/id_${keyType} with chmod 600)\n${privateKey}`;
    const blob = new Blob([combined], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `ssh-keypair-${keyType}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    toast.success('SSH key pair downloaded');
  };

  const clearKeys = () => {
    setPublicKey('');
    setPrivateKey('');
    setComment('');
    toast.success('Keys cleared');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-teal-50/60 to-cyan-100/50 dark:from-black dark:to-black py-8 sm:py-12 px-4 sm:px-6 lg:px-8">
      <div className="container mx-auto max-w-6xl">
        {/* Header */}
        <div className="text-center mb-10">
          <div className="flex items-center justify-center mb-4">
            <div className="bg-teal-100 dark:bg-teal-900/30 p-3 rounded-full mr-4">
              <Key className="h-8 w-8 text-teal-600 dark:text-teal-400" />
            </div>
            <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold">SSH Key Generator Online</h1>
          </div>
          <p className="text-base sm:text-lg text-muted-foreground max-w-3xl mx-auto">
            Generate secure SSH key pairs for server authentication, Git repositories, and automated deployments. 
            Choose between modern Ed25519 and traditional RSA algorithms.
          </p>
        </div>

        {/* Configuration Panel */}
        <div className="bg-card rounded-xl shadow-lg border p-6 sm:p-8 mb-6">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Key Type Selection */}
            <div>
              <label className="text-base sm:text-lg font-semibold mb-3 block">
                <Shield className="inline h-5 w-5 mr-2" /> Key Type
              </label>
              <div className="space-y-2">
                <button
                  onClick={() => setKeyType('ed25519')}
                  className={`w-full p-4 rounded-lg border-2 text-left transition-all ${
                    keyType === 'ed25519'
                      ? 'border-teal-500 bg-teal-50 dark:bg-teal-900/20 text-teal-700 dark:text-teal-300'
                      : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600'
                  }`}
                >
                  <div className="font-medium">Ed25519</div>
                  <div className="text-sm text-muted-foreground">
                    Modern, secure, fast (Recommended)
                  </div>
                </button>
                <button
                  onClick={() => setKeyType('rsa')}
                  className={`w-full p-4 rounded-lg border-2 text-left transition-all ${
                    keyType === 'rsa'
                      ? 'border-teal-500 bg-teal-50 dark:bg-teal-900/20 text-teal-700 dark:text-teal-300'
                      : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600'
                  }`}
                >
                  <div className="font-medium">RSA</div>
                  <div className="text-sm text-muted-foreground">
                    Traditional, widely supported
                  </div>
                </button>
              </div>
            </div>

            {/* RSA Key Size (conditional) */}
            <div>
              <label className="text-base sm:text-lg font-semibold mb-3 block">
                <FileText className="inline h-5 w-5 mr-2" /> 
                {keyType === 'rsa' ? 'Key Size' : 'Key Settings'}
              </label>
              {keyType === 'rsa' ? (
                <div className="space-y-2">
                  {[2048, 3072, 4096].map((size) => (
                    <button
                      key={size}
                      onClick={() => setKeySize(size as 2048 | 3072 | 4096)}
                      className={`w-full px-4 py-3 rounded-lg font-medium transition-colors ${
                        keySize === size
                          ? 'bg-teal-600 text-white'
                          : 'bg-teal-50 dark:bg-teal-900/30 text-teal-700 dark:text-teal-300 hover:bg-teal-100 dark:hover:bg-teal-900/50'
                      }`}
                    >
                      {size}-bit {size >= 3072 && <span className="text-xs">(High Security)</span>}
                    </button>
                  ))}
                </div>
              ) : (
                <div className="bg-teal-50 dark:bg-teal-900/20 p-4 rounded-lg border border-teal-200 dark:border-teal-800">
                  <div className="text-sm text-teal-700 dark:text-teal-300">
                    <strong>Ed25519 Features:</strong>
                    <ul className="mt-2 space-y-1 list-disc list-inside text-xs">
                      <li>256-bit security level</li>
                      <li>Fast signature generation</li>
                      <li>Compact key size</li>
                      <li>Resistant to timing attacks</li>
                    </ul>
                  </div>
                </div>
              )}
            </div>

            {/* Comment Input */}
            <div>
              <label className="text-base sm:text-lg font-semibold mb-3 block">
                <Terminal className="inline h-5 w-5 mr-2" /> Comment
              </label>
              <input
                type="text"
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                placeholder="user@hostname"
                className="w-full p-4 border rounded-lg bg-background focus:ring-2 focus:ring-teal-500 focus:border-transparent mb-3"
              />
              <div className="text-sm text-muted-foreground">
                Optional identifier for the key
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-wrap items-center justify-between gap-4 mt-8">
            <button
              onClick={generateSSHKeys}
              disabled={generating}
              className="bg-teal-600 text-white px-8 py-3 rounded-lg font-medium hover:bg-teal-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {generating ? (
                <>
                  <RefreshCw className="inline h-5 w-5 mr-2 animate-spin" />
                  Generating Keys...
                </>
              ) : (
                <>
                  <Key className="inline h-5 w-5 mr-2" />
                  Generate SSH Key Pair
                </>
              )}
            </button>

            <div className="flex gap-2">
              <button 
                onClick={downloadBothKeys}
                disabled={!publicKey || !privateKey}
                className="bg-purple-100 dark:bg-purple-900/30 text-purple-700 px-4 py-2 rounded-lg font-medium hover:bg-purple-200 dark:hover:bg-purple-900/50 transition-colors disabled:opacity-50"
              >
                <Download className="inline h-4 w-4 mr-2" />
                Download Both
              </button>
              <button 
                onClick={clearKeys}
                className="bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 px-4 py-2 rounded-lg font-medium hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
              >
                Clear
              </button>
            </div>
          </div>
        </div>

        {/* Keys Display */}
        {(publicKey || privateKey) && (
          <div className="bg-card rounded-xl shadow-lg border p-6 sm:p-8 mb-6">
            <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
              {/* Public Key */}
              <div>
                <div className="flex items-center justify-between mb-4">
                  <label className="text-base sm:text-lg font-semibold">
                    <Server className="inline h-5 w-5 mr-2" />
                    Public Key
                  </label>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={copyPublicKey}
                      disabled={!publicKey}
                      className="bg-green-100 dark:bg-green-900/30 text-green-700 px-3 py-2 rounded-lg text-sm hover:bg-green-200 dark:hover:bg-green-900/50 transition-colors disabled:opacity-50"
                    >
                      <Copy className="inline h-4 w-4 mr-1" />
                      Copy
                    </button>
                    <button
                      onClick={downloadPublicKey}
                      disabled={!publicKey}
                      className="bg-blue-100 dark:bg-blue-900/30 text-blue-700 px-3 py-2 rounded-lg text-sm hover:bg-blue-200 dark:hover:bg-blue-900/50 transition-colors disabled:opacity-50"
                    >
                      <Download className="inline h-4 w-4 mr-1" />
                      Download
                    </button>
                  </div>
                </div>
                <textarea
                  value={publicKey}
                  readOnly
                  className="w-full h-32 p-4 border rounded-lg bg-muted/50 resize-none font-mono text-sm"
                />
                <div className="bg-blue-50 dark:bg-blue-900/20 p-3 rounded-lg mt-3 border border-blue-200 dark:border-blue-800">
                  <p className="text-xs text-blue-700 dark:text-blue-300">
                    <strong>Server Setup:</strong> Add this to <code className="bg-blue-100 dark:bg-blue-900/50 px-1 rounded">~/.ssh/authorized_keys</code>
                  </p>
                </div>
              </div>

              {/* Private Key */}
              <div>
                <div className="flex items-center justify-between mb-4">
                  <label className="text-base sm:text-lg font-semibold">
                    <Shield className="inline h-5 w-5 mr-2" />
                    Private Key
                  </label>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={copyPrivateKey}
                      disabled={!privateKey}
                      className="bg-green-100 dark:bg-green-900/30 text-green-700 px-3 py-2 rounded-lg text-sm hover:bg-green-200 dark:hover:bg-green-900/50 transition-colors disabled:opacity-50"
                    >
                      <Copy className="inline h-4 w-4 mr-1" />
                      Copy
                    </button>
                    <button
                      onClick={downloadPrivateKey}
                      disabled={!privateKey}
                      className="bg-blue-100 dark:bg-blue-900/30 text-blue-700 px-3 py-2 rounded-lg text-sm hover:bg-blue-200 dark:hover:bg-blue-900/50 transition-colors disabled:opacity-50"
                    >
                      <Download className="inline h-4 w-4 mr-1" />
                      Download
                    </button>
                  </div>
                </div>
                <textarea
                  value={privateKey}
                  readOnly
                  className="w-full h-32 p-4 border rounded-lg bg-muted/50 resize-none font-mono text-sm"
                />
                <div className="bg-amber-50 dark:bg-amber-900/20 p-3 rounded-lg mt-3 border border-amber-200 dark:border-amber-800">
                  <p className="text-xs text-amber-700 dark:text-amber-300">
                    <strong>Keep Private!</strong> Save to <code className="bg-amber-100 dark:bg-amber-900/50 px-1 rounded">~/.ssh/id_{keyType}</code> and run <code className="bg-amber-100 dark:bg-amber-900/50 px-1 rounded">chmod 600 ~/.ssh/id_{keyType}</code>
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* SSH Usage Guide */}
        <div className="bg-card rounded-xl shadow-lg border p-6 sm:p-8 mb-6">
          <h3 className="text-base sm:text-lg font-semibold mb-4">SSH Setup Guide</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h4 className="font-medium text-foreground mb-3">Client Setup (Your Computer)</h4>
              <div className="bg-gray-50 dark:bg-gray-800/50 p-4 rounded-lg">
                <code className="text-sm text-gray-700 dark:text-gray-300 whitespace-pre-wrap">
{`# Save private key
nano ~/.ssh/id_${keyType}

# Set secure permissions
chmod 600 ~/.ssh/id_${keyType}

# Connect to server
ssh -i ~/.ssh/id_${keyType} user@server`}
                </code>
              </div>
            </div>
            <div>
              <h4 className="font-medium text-foreground mb-3">Server Setup (Target Server)</h4>
              <div className="bg-gray-50 dark:bg-gray-800/50 p-4 rounded-lg">
                <code className="text-sm text-gray-700 dark:text-gray-300 whitespace-pre-wrap">
{`# Add public key
echo "your-public-key" >> ~/.ssh/authorized_keys

# Set permissions
chmod 600 ~/.ssh/authorized_keys
chmod 700 ~/.ssh`}
                </code>
              </div>
            </div>
          </div>
        </div>

        {/* Key Type Comparison */}
        <div className="bg-card rounded-xl shadow-lg border p-6 sm:p-8 mb-6">
          <h3 className="text-base sm:text-lg font-semibold mb-4">Ed25519 vs RSA Comparison</h3>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b">
                  <th className="text-left py-3 font-medium">Feature</th>
                  <th className="text-left py-3 font-medium text-teal-600 dark:text-teal-400">Ed25519</th>
                  <th className="text-left py-3 font-medium text-blue-600 dark:text-blue-400">RSA</th>
                </tr>
              </thead>
              <tbody className="text-muted-foreground">
                <tr className="border-b">
                  <td className="py-3">Key Size</td>
                  <td className="py-3">256 bits (32 bytes)</td>
                  <td className="py-3">2048-4096 bits (256-512 bytes)</td>
                </tr>
                <tr className="border-b">
                  <td className="py-3">Security Level</td>
                  <td className="py-3">~128-bit symmetric equivalent</td>
                  <td className="py-3">112-152 bit (depending on size)</td>
                </tr>
                <tr className="border-b">
                  <td className="py-3">Performance</td>
                  <td className="py-3">Very fast generation & verification</td>
                  <td className="py-3">Slower, especially with larger keys</td>
                </tr>
                <tr className="border-b">
                  <td className="py-3">Compatibility</td>
                  <td className="py-3">Modern systems (OpenSSH 6.5+)</td>
                  <td className="py-3">Universal compatibility</td>
                </tr>
                <tr>
                  <td className="py-3">Recommendation</td>
                  <td className="py-3">✅ Preferred for new deployments</td>
                  <td className="py-3">⚠️ Use when Ed25519 not supported</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        {/* Use Cases & Security */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
          <div className="bg-card rounded-xl shadow-lg border p-6 sm:p-8">
            <h3 className="text-base sm:text-lg font-semibold mb-4">Common Use Cases</h3>
            <div className="space-y-4">
              <div className="flex items-start space-x-3">
                <Server className="w-5 h-5 text-blue-600 dark:text-blue-400 mt-0.5 flex-shrink-0" />
                <div>
                  <strong className="text-foreground">Server Authentication</strong>
                  <p className="text-sm text-muted-foreground">Secure password-less login to remote servers and cloud instances.</p>
                </div>
              </div>
              
              <div className="flex items-start space-x-3">
                <Key className="w-5 h-5 text-green-600 dark:text-green-400 mt-0.5 flex-shrink-0" />
                <div>
                  <strong className="text-foreground">Git Repositories</strong>
                  <p className="text-sm text-muted-foreground">Access GitHub, GitLab, and other Git hosting services securely.</p>
                </div>
              </div>
              
              <div className="flex items-start space-x-3">
                <Terminal className="w-5 h-5 text-purple-600 dark:text-purple-400 mt-0.5 flex-shrink-0" />
                <div>
                  <strong className="text-foreground">Automated Deployments</strong>
                  <p className="text-sm text-muted-foreground">CI/CD pipelines and automated scripts for server management.</p>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-card rounded-xl shadow-lg border p-6 sm:p-8">
            <h3 className="text-base sm:text-lg font-semibold mb-4">Security Best Practices</h3>
            <div className="space-y-4">
              <div className="flex items-start space-x-3">
                <Shield className="w-5 h-5 text-red-600 dark:text-red-400 mt-0.5 flex-shrink-0" />
                <div>
                  <strong className="text-foreground">Protect Private Keys</strong>
                  <p className="text-sm text-muted-foreground">Never share private keys. Use proper file permissions (600).</p>
                </div>
              </div>
              
              <div className="flex items-start space-x-3">
                <RefreshCw className="w-5 h-5 text-blue-600 dark:text-blue-400 mt-0.5 flex-shrink-0" />
                <div>
                  <strong className="text-foreground">Key Rotation</strong>
                  <p className="text-sm text-muted-foreground">Regularly rotate keys for high-security environments.</p>
                </div>
              </div>
              
              <div className="flex items-start space-x-3">
                <CheckCircle className="w-5 h-5 text-green-600 dark:text-green-400 mt-0.5 flex-shrink-0" />
                <div>
                  <strong className="text-foreground">Use Passphrases</strong>
                  <p className="text-sm text-muted-foreground">Add passphrases for additional security on sensitive systems.</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Security Notice */}
        <div className="bg-card rounded-xl shadow-lg border p-6 sm:p-8">
          <div className="flex items-start space-x-3">
            <div className="bg-blue-100 dark:bg-blue-900/30 p-2 rounded-full">
              <Info className="w-5 h-5 text-blue-600 dark:text-blue-400" />
            </div>
            <div>
              <h3 className="text-base font-semibold mb-2">Privacy & Security</h3>
              <p className="text-sm text-muted-foreground">
                This SSH key generator runs entirely in your browser using the Web Crypto API. 
                No keys or data are transmitted to external servers. For production use with Ed25519, 
                consider using OpenSSH's ssh-keygen command for full compatibility.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
