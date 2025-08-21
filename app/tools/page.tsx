import React from 'react';
import { 
  ArrowRight, Shield, Hash, Key, Code, Lock, Zap, 
  Calendar, Wifi, Cpu, FileKey, Fingerprint, FileCode, 
  Link, Binary, Hexagon, FileText, Languages,
  Fish, X, ScrollText, Square, Fence, RotateCw, Book,
  KeySquare, Terminal, LockKeyhole, FileLock, Star,
  Globe, Shuffle, Grid3x3, FileDown, Braces, Network,
  ChevronRight, Users, Award, Clock, Sparkles
} from 'lucide-react';

export default function CryptoToolkit() {
  const toolCategories = [
    {
      category: 'Encoding & Decoding',
      description: 'Convert text between different encoding formats safely and securely',
      tools: [
        {
          name: 'Base64 Encoder/Decoder',
          description: 'Convert text to/from Base64 format',
          href: '/base64-encoder-decoder-online',
          icon: <FileCode className="text-blue-500 dark:text-blue-400" />,
          color: 'bg-blue-50 hover:bg-blue-100 dark:bg-blue-900/20 dark:hover:bg-blue-900/30 border-blue-200 dark:border-blue-800',
          iconBg: 'bg-blue-500',
          keywords: 'base64 encoder decoder converter text encoding'
        },
        {
          name: 'Base58 Encoder/Decoder',
          description: 'Encode/decode Base58 format',
          href: '/base58-encoder-decoder-online',
          icon: <FileCode className="text-sky-500 dark:text-sky-400" />,
          color: 'bg-sky-50 hover:bg-sky-100 dark:bg-sky-900/20 dark:hover:bg-sky-900/30 border-sky-200 dark:border-sky-800',
          iconBg: 'bg-sky-500',
          keywords: 'base58 encoder decoder bitcoin cryptocurrency'
        },
        {
          name: 'Binary Encoder/Decoder',
          description: 'Convert text to binary and back',
          href: '/binary-encoder-decoder-online',
          icon: <Binary className="text-indigo-500 dark:text-indigo-400" />,
          color: 'bg-indigo-50 hover:bg-indigo-100 dark:bg-indigo-900/20 dark:hover:bg-indigo-900/30 border-indigo-200 dark:border-indigo-800',
          iconBg: 'bg-indigo-500',
          keywords: 'binary converter text to binary encoder decoder'
        },
        {
          name: 'Hex Encoder/Decoder',
          description: 'Convert text to hex and back',
          href: '/hex-encoder-decoder-online',
          icon: <Hexagon className="text-purple-500 dark:text-purple-400" />,
          color: 'bg-purple-50 hover:bg-purple-100 dark:bg-purple-900/20 dark:hover:bg-purple-900/30 border-purple-200 dark:border-purple-800',
          iconBg: 'bg-purple-500',
          keywords: 'hex converter hexadecimal encoder decoder text'
        },
        {
          name: 'URL Encoder/Decoder',
          description: 'Encode/decode URL-encoded text',
          href: '/url-encoder-decoder-online',
          icon: <Link className="text-cyan-500 dark:text-cyan-400" />,
          color: 'bg-cyan-50 hover:bg-cyan-100 dark:bg-cyan-900/20 dark:hover:bg-cyan-900/30 border-cyan-200 dark:border-cyan-800',
          iconBg: 'bg-cyan-500',
          keywords: 'url encoder decoder percent encoding web development'
        },
        {
          name: 'HTML Encoder/Decoder',
          description: 'Encode/decode HTML entities',
          href: '/html-encoder-decoder-online',
          icon: <Code className="text-orange-500 dark:text-orange-400" />,
          color: 'bg-orange-50 hover:bg-orange-100 dark:bg-orange-900/20 dark:hover:bg-orange-900/30 border-orange-200 dark:border-orange-800',
          iconBg: 'bg-orange-500',
          keywords: 'html encoder decoder entities web development xss prevention'
        },
        {
          name: 'Unicode Encoder/Decoder',
          description: 'Encode/decode Unicode text',
          href: '/unicode-encoder-decoder-online',
          icon: <Globe className="text-emerald-500 dark:text-emerald-400" />,
          color: 'bg-emerald-50 hover:bg-emerald-100 dark:bg-emerald-900/20 dark:hover:bg-emerald-900/30 border-emerald-200 dark:border-emerald-800',
          iconBg: 'bg-emerald-500',
          keywords: 'unicode converter utf-8 text encoding international'
        },
      ],
    },
    {
      category: 'Hash & Verification',
      description: 'Generate cryptographic hashes and verify data integrity with industry-standard algorithms',
      tools: [
        {
          name: 'SHA-256 Generator',
          description: 'Generate SHA-256 hash',
          href: '/sha256-hash-generator-online',
          icon: <Fingerprint className="text-green-500 dark:text-green-400" />,
          color: 'bg-green-50 hover:bg-green-100 dark:bg-green-900/20 dark:hover:bg-green-900/30 border-green-200 dark:border-green-800',
          iconBg: 'bg-green-500',
          badge: 'Popular',
          keywords: 'sha256 hash generator cryptographic blockchain bitcoin'
        },
        {
          name: 'MD5 Generator',
          description: 'Generate MD5 hash',
          href: '/md5-generator-online',
          icon: <Hash className="text-emerald-500 dark:text-emerald-400" />,
          color: 'bg-emerald-50 hover:bg-emerald-100 dark:bg-emerald-900/20 dark:hover:bg-emerald-900/30 border-emerald-200 dark:border-emerald-800',
          iconBg: 'bg-emerald-500',
          keywords: 'md5 hash generator checksum verification legacy'
        },
        {
          name: 'SHA-512 Generator',
          description: 'Generate SHA-512 hash',
          href: '/sha512-hash-generator-online',
          icon: <Fingerprint className="text-teal-500 dark:text-teal-400" />,
          color: 'bg-teal-50 hover:bg-teal-100 dark:bg-teal-900/20 dark:hover:bg-teal-900/30 border-teal-200 dark:border-teal-800',
          iconBg: 'bg-teal-500',
          keywords: 'sha512 hash generator secure cryptographic'
        },
        {
          name: 'SHA-1 Generator',
          description: 'Generate SHA-1 hash',
          href: '/sha1-hash-generator-online',
          icon: <Hash className="text-emerald-600 dark:text-emerald-500" />,
          color: 'bg-emerald-50 hover:bg-emerald-100 dark:bg-emerald-900/20 dark:hover:bg-emerald-900/30 border-emerald-200 dark:border-emerald-800',
          iconBg: 'bg-emerald-600',
          keywords: 'sha1 hash generator legacy cryptographic'
        },
        {
          name: 'HMAC Generator',
          description: 'Generate HMAC codes',
          href: '/hmac-generator-online',
          icon: <Key className="text-lime-500 dark:text-lime-400" />,
          color: 'bg-lime-50 hover:bg-lime-100 dark:bg-lime-900/20 dark:hover:bg-lime-900/30 border-lime-200 dark:border-lime-800',
          iconBg: 'bg-lime-500',
          badge: 'New',
          keywords: 'hmac generator authentication mac message authentication'
        },
        {
          name: 'CRC32 Calculator',
          description: 'Calculate CRC32 checksum',
          href: '/crc32-calculator-online',
          icon: <Cpu className="text-green-600 dark:text-green-500" />,
          color: 'bg-green-50 hover:bg-green-100 dark:bg-green-900/20 dark:hover:bg-green-900/30 border-green-200 dark:border-green-800',
          iconBg: 'bg-green-600',
          keywords: 'crc32 checksum calculator data integrity verification'
        },
        {
          name: 'PBKDF2 Generator',
          description: 'Password-based key derivation',
          href: '/pbkdf2-generator-online',
          icon: <KeySquare className="text-amber-500 dark:text-amber-400" />,
          color: 'bg-amber-50 hover:bg-amber-100 dark:bg-amber-900/20 dark:hover:bg-amber-900/30 border-amber-200 dark:border-amber-800',
          iconBg: 'bg-amber-500',
          keywords: 'pbkdf2 password key derivation function security'
        },
      ],
    },
    {
      category: 'Encryption & Security',
      description: 'Modern encryption algorithms and security tools for protecting sensitive data',
      tools: [
        {
          name: 'AES Encrypt/Decrypt',
          description: 'AES encryption & decryption',
          href: '/aes-encrypt-decrypt-online',
          icon: <Shield className="text-red-500 dark:text-red-400" />,
          color: 'bg-red-50 hover:bg-red-100 dark:bg-red-900/20 dark:hover:bg-red-900/30 border-red-200 dark:border-red-800',
          iconBg: 'bg-red-500',
          badge: 'Pro',
          keywords: 'aes encryption decryption advanced encryption standard security'
        },
        {
          name: 'ChaCha20 Encrypt/Decrypt',
          description: 'ChaCha20 stream cipher',
          href: '/chacha20-encrypt-decrypt-online',
          icon: <Shuffle className="text-indigo-600 dark:text-indigo-500" />,
          color: 'bg-indigo-50 hover:bg-indigo-100 dark:bg-indigo-900/20 dark:hover:bg-indigo-900/30 border-indigo-200 dark:border-indigo-800',
          iconBg: 'bg-indigo-600',
          badge: 'New',
          keywords: 'chacha20 stream cipher modern encryption'
        },
        {
          name: 'Blowfish Encrypt/Decrypt',
          description: 'Symmetric block cipher',
          href: '/blowfish-encrypt-decrypt-online',
          icon: <Fish className="text-violet-500 dark:text-violet-400" />,
          color: 'bg-violet-50 hover:bg-violet-100 dark:bg-violet-900/20 dark:hover:bg-violet-900/30 border-violet-200 dark:border-violet-800',
          iconBg: 'bg-violet-500',
          keywords: 'blowfish cipher symmetric encryption block cipher'
        },
        {
          name: 'XOR Encrypt/Decrypt',
          description: 'XOR cipher encryption/decryption',
          href: '/xor-encrypt-decrypt-online',
          icon: <X className="text-rose-500 dark:text-rose-400" />,
          color: 'bg-rose-50 hover:bg-rose-100 dark:bg-rose-900/20 dark:hover:bg-rose-900/30 border-rose-200 dark:border-rose-800',
          iconBg: 'bg-rose-500',
          keywords: 'xor encryption decryption cipher simple educational'
        },
        {
          name: 'RSA Encrypt/Decrypt',
          description: 'RSA public key cryptography',
          href: '/rsa-encrypt-decrypt-online',
          icon: <KeySquare className="text-purple-600 dark:text-purple-500" />,
          color: 'bg-purple-50 hover:bg-purple-100 dark:bg-purple-900/20 dark:hover:bg-purple-900/30 border-purple-200 dark:border-purple-800',
          iconBg: 'bg-purple-600',
          keywords: 'rsa encryption decryption public key cryptography'
        },
      ],
    },
    {
      category: 'Classical Ciphers',
      description: 'Historical and educational ciphers for learning cryptography fundamentals',
      tools: [
        {
          name: 'Caesar Cipher',
          description: 'Classical shift cipher',
          href: '/caesar-cipher-encoder-decoder-online',
          icon: <ScrollText className="text-amber-500 dark:text-amber-400" />,
          color: 'bg-amber-50 hover:bg-amber-100 dark:bg-amber-900/20 dark:hover:bg-amber-900/30 border-amber-200 dark:border-amber-800',
          iconBg: 'bg-amber-500',
          keywords: 'caesar cipher shift cipher classical cryptography'
        },
        {
          name: 'ROT Cipher',
          description: 'ROT13, ROT47 variants',
          href: '/rot-cipher-encoder-decoder-online',
          icon: <RotateCw className="text-fuchsia-500 dark:text-fuchsia-400" />,
          color: 'bg-fuchsia-50 hover:bg-fuchsia-100 dark:bg-fuchsia-900/20 dark:hover:bg-fuchsia-900/30 border-fuchsia-200 dark:border-fuchsia-800',
          iconBg: 'bg-fuchsia-500',
          keywords: 'rot13 rot47 cipher rotation text encoding'
        },
        {
          name: 'Vigenère Cipher',
          description: 'Polyalphabetic substitution',
          href: '/vigenere-cipher-encrypt-decrypt-online',
          icon: <Grid3x3 className="text-blue-600 dark:text-blue-500" />,
          color: 'bg-blue-50 hover:bg-blue-100 dark:bg-blue-900/20 dark:hover:bg-blue-900/30 border-blue-200 dark:border-blue-800',
          iconBg: 'bg-blue-600',
          keywords: 'vigenere cipher polyalphabetic substitution classical'
        },
        {
          name: 'Playfair Cipher',
          description: '5x5 grid substitution cipher',
          href: '/playfair-cipher-encrypt-decrypt-online',
          icon: <Square className="text-green-600 dark:text-green-500" />,
          color: 'bg-green-50 hover:bg-green-100 dark:bg-green-900/20 dark:hover:bg-green-900/30 border-green-200 dark:border-green-800',
          iconBg: 'bg-green-600',
          keywords: 'playfair cipher grid substitution classical cryptography'
        },
        {
          name: 'Rail Fence Cipher',
          description: 'Zigzag transposition cipher',
          href: '/rail-fence-cipher-online',
          icon: <Fence className="text-purple-600 dark:text-purple-500" />,
          color: 'bg-purple-50 hover:bg-purple-100 dark:bg-purple-900/20 dark:hover:bg-purple-900/30 border-purple-200 dark:border-purple-800',
          iconBg: 'bg-purple-600',
          keywords: 'rail fence cipher zigzag transposition classical'
        },
      ],
    },
    {
      category: 'Generators & Utilities',
      description: 'Essential generators and utilities for development and security operations',
      tools: [
        {
          name: 'Password Generator',
          description: 'Generate secure passwords',
          href: '/password-generator-online',
          icon: <Key className="text-blue-600 dark:text-blue-500" />,
          color: 'bg-blue-50 hover:bg-blue-100 dark:bg-blue-900/20 dark:hover:bg-blue-900/30 border-blue-200 dark:border-blue-800',
          iconBg: 'bg-blue-600',
          badge: 'Popular',
          keywords: 'password generator secure random strong passwords'
        },
        {
          name: 'UUID GUID Generator',
          description: 'Generate unique identifiers',
          href: '/uuid-guid-generator-online',
          icon: <Fingerprint className="text-indigo-600 dark:text-indigo-500" />,
          color: 'bg-indigo-50 hover:bg-indigo-100 dark:bg-indigo-900/20 dark:hover:bg-indigo-900/30 border-indigo-200 dark:border-indigo-800',
          iconBg: 'bg-indigo-600',
          keywords: 'uuid GUID generator unique identifier guid development'
        },
        {
          name: 'SSH Key Generator',
          description: 'Generate SSH key pairs',
          href: '/ssh-key-generator-online',
          icon: <Terminal className="text-slate-600 dark:text-slate-400" />,
          color: 'bg-slate-50 hover:bg-slate-100 dark:bg-slate-900/20 dark:hover:bg-slate-900/30 border-slate-200 dark:border-slate-800',
          iconBg: 'bg-slate-600',
          keywords: 'ssh key generator secure shell authentication linux'
        },
        {
          name: 'JWT Encoder/Decoder',
          description: 'Encode/decode JSON Web Tokens',
          href: '/jwt-encoder-decoder-online',
          icon: <Braces className="text-green-600 dark:text-green-500" />,
          color: 'bg-green-50 hover:bg-green-100 dark:bg-green-900/20 dark:hover:bg-green-900/30 border-green-200 dark:border-green-800',
          iconBg: 'bg-green-600',
          keywords: 'jwt encoder decoder json web token authentication api'
        },
        {
          name: 'Timestamp Converter',
          description: 'Convert Unix timestamps',
          href: '/epoch-timestamp-converter-online',
          icon: <Calendar className="text-orange-600 dark:text-orange-500" />,
          color: 'bg-orange-50 hover:bg-orange-100 dark:bg-orange-900/20 dark:hover:bg-orange-900/30 border-orange-200 dark:border-orange-800',
          iconBg: 'bg-orange-600',
          keywords: 'timestamp converter unix epoch time date conversion'
        },
        {
          name: 'Morse Code Translator',
          description: 'Translate to/from Morse code',
          href: '/morse-code-translator-online',
          icon: <Wifi className="text-cyan-600 dark:text-cyan-500" />,
          color: 'bg-cyan-50 hover:bg-cyan-100 dark:bg-cyan-900/20 dark:hover:bg-cyan-900/30 border-cyan-200 dark:border-cyan-800',
          iconBg: 'bg-cyan-600',
          keywords: 'morse code translator dots dashes communication'
        },
      ],
    },
  ];

  const getBadgeStyles = (badge: string) => {
    switch (badge) {
      case 'Popular': return 'bg-yellow-100 text-yellow-800 border-yellow-200 dark:bg-yellow-900/20 dark:text-yellow-300 dark:border-yellow-800';
      case 'New': return 'bg-green-100 text-green-800 border-green-200 dark:bg-green-900/20 dark:text-green-300 dark:border-green-800';
      case 'Pro': return 'bg-purple-100 text-purple-800 border-purple-200 dark:bg-purple-900/20 dark:text-purple-300 dark:border-purple-800';
      default: return 'bg-gray-100 text-gray-800 border-gray-200 dark:bg-gray-800/50 dark:text-gray-300 dark:border-gray-700';
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950">
      {/* Header */}
      <div className="bg-white dark:bg-gray-950 border-b border-gray-200 dark:border-gray-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="text-center">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-red-500 dark:bg-red-600 rounded-2xl mb-6">
              <Lock className="h-8 w-8 text-white" />
            </div>
            <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-4">
              All Tools in One Place
            </h1>
            <p className="text-lg text-gray-600 dark:text-gray-300 max-w-2xl mx-auto">
              Every crypto tool you need in one place. All tools work locally in your browser for maximum security and privacy.
            </p>
            
            {/* Quick Stats */}
            <div className="flex items-center justify-center space-x-8 mt-8 text-sm text-gray-500 dark:text-gray-400">
              <div className="flex items-center">
                <div className="w-2 h-2 bg-green-500 dark:bg-green-400 rounded-full mr-2"></div>
                100% Secure
              </div>
              <div className="flex items-center">
                <div className="w-2 h-2 bg-blue-500 dark:bg-blue-400 rounded-full mr-2"></div>
                Client-side Only
              </div>
              <div className="flex items-center">
                <div className="w-2 h-2 bg-purple-500 dark:bg-purple-400 rounded-full mr-2"></div>
                Always Free
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Tools Grid */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {toolCategories.map((category) => (
          <div key={category.category} className="mb-16">
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-8 text-center">
              {category.category}
            </h2>
            
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-4 sm:gap-6">
              {category.tools.map((tool) => (
                <a
                  key={tool.name}
                  href={tool.href}
                  className={`group relative ${tool.color} rounded-2xl border-2 p-4 sm:p-6 cursor-pointer transition-all duration-300 hover:shadow-lg hover:scale-105 block no-underline`}
                >
                  {/* Badge */}
                  {tool.badge && (
                    <div className={`absolute -top-2 -right-2 px-2 py-1 rounded-full text-xs font-semibold border ${getBadgeStyles(tool.badge)}`}>
                      {tool.badge}
                    </div>
                  )}
                  
                  {/* Icon */}
                  <div className="flex justify-center mb-3 sm:mb-4">
                    <div className="p-2 sm:p-3 rounded-xl bg-white dark:bg-gray-900 shadow-sm">
                      <div className="w-6 h-6 sm:w-8 sm:h-8">
                        {React.cloneElement(tool.icon, { 
                          className: 'w-full h-full ' + tool.icon.props.className.split(' ').slice(2).join(' ')
                        })}
                      </div>
                    </div>
                  </div>
                  
                  {/* Content */}
                  <div className="text-center">
                    <h3 className="font-semibold text-gray-900 dark:text-white mb-1 sm:mb-2 text-xs sm:text-sm">
                      {tool.name}
                    </h3>
                    <p className="text-xs text-gray-600 dark:text-gray-400 leading-tight">
                      {tool.description}
                    </p>
                  </div>
                </a>
              ))}
            </div>
          </div>
        ))}
      </div>

      {/* Footer Features */}
      <div className="bg-white dark:bg-gray-950 border-t border-gray-200 dark:border-gray-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-4">
              Why Choose CryptoToolkit?
            </h2>
            <p className="text-gray-600 dark:text-gray-300 max-w-2xl mx-auto">
              Professional-grade cryptographic tools that prioritize your security and privacy
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            <div className="text-center">
              <div className="inline-flex items-center justify-center w-12 h-12 bg-green-100 dark:bg-green-900/20 rounded-xl mb-4">
                <Shield className="h-6 w-6 text-green-600 dark:text-green-400" />
              </div>
              <h3 className="font-semibold text-gray-900 dark:text-white mb-2">100% Secure</h3>
              <p className="text-sm text-gray-600 dark:text-gray-400">All processing happens in your browser. No data is sent to our servers.</p>
            </div>
            
            <div className="text-center">
              <div className="inline-flex items-center justify-center w-12 h-12 bg-blue-100 dark:bg-blue-900/20 rounded-xl mb-4">
                <Zap className="h-6 w-6 text-blue-600 dark:text-blue-400" />
              </div>
              <h3 className="font-semibold text-gray-900 dark:text-white mb-2">Lightning Fast</h3>
              <p className="text-sm text-gray-600 dark:text-gray-400">Instant processing with no waiting times or upload delays.</p>
            </div>
            
            <div className="text-center">
              <div className="inline-flex items-center justify-center w-12 h-12 bg-purple-100 dark:bg-purple-900/20 rounded-xl mb-4">
                <Star className="h-6 w-6 text-purple-600 dark:text-purple-400" />
              </div>
              <h3 className="font-semibold text-gray-900 dark:text-white mb-2">Always Free</h3>
              <p className="text-sm text-gray-600 dark:text-gray-400">Complete access to all tools with no hidden costs or limitations.</p>
            </div>
            
            <div className="text-center">
              <div className="inline-flex items-center justify-center w-12 h-12 bg-orange-100 dark:bg-orange-900/20 rounded-xl mb-4">
                <Lock className="h-6 w-6 text-orange-600 dark:text-orange-400" />
              </div>
              <h3 className="font-semibold text-gray-900 dark:text-white mb-2">Privacy First</h3>
              <p className="text-sm text-gray-600 dark:text-gray-400">No tracking, no cookies, no data collection. Your privacy is guaranteed.</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
