'use client';

import React, { useState, useMemo } from 'react';
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
  const [activeFilter, setActiveFilter] = useState('All');

  const allTools = [
    // Encoding & Decoding
    {
      name: 'Base64 Encoder/Decoder',
      description: 'Convert text to/from Base64 format',
      href: '/base64-encoder-decoder-online',
      icon: <FileCode className="text-blue-500 dark:text-blue-400" />,
      color: 'bg-blue-50 hover:bg-blue-100 dark:bg-blue-900/20 dark:hover:bg-blue-900/30 border-blue-200 dark:border-blue-800',
      category: 'Encoding & Decoding',
      keywords: 'base64 encoder decoder converter text encoding'
    },
    {
      name: 'Base58 Encoder/Decoder',
      description: 'Encode/decode Base58 format',
      href: '/base58-encoder-decoder-online',
      icon: <FileCode className="text-sky-500 dark:text-sky-400" />,
      color: 'bg-sky-50 hover:bg-sky-100 dark:bg-sky-900/20 dark:hover:bg-sky-900/30 border-sky-200 dark:border-sky-800',
      category: 'Encoding & Decoding',
      keywords: 'base58 encoder decoder bitcoin cryptocurrency'
    },
    {
      name: 'Binary Encoder/Decoder',
      description: 'Convert text to binary and back',
      href: '/binary-encoder-decoder-online',
      icon: <Binary className="text-indigo-500 dark:text-indigo-400" />,
      color: 'bg-indigo-50 hover:bg-indigo-100 dark:bg-indigo-900/20 dark:hover:bg-indigo-900/30 border-indigo-200 dark:border-indigo-800',
      category: 'Encoding & Decoding',
      keywords: 'binary converter text to binary encoder decoder'
    },
    {
      name: 'Hex Encoder/Decoder',
      description: 'Convert text to hex and back',
      href: '/hex-encoder-decoder-online',
      icon: <Hexagon className="text-purple-500 dark:text-purple-400" />,
      color: 'bg-purple-50 hover:bg-purple-100 dark:bg-purple-900/20 dark:hover:bg-purple-900/30 border-purple-200 dark:border-purple-800',
      category: 'Encoding & Decoding',
      keywords: 'hex converter hexadecimal encoder decoder text'
    },
    {
      name: 'URL Encoder/Decoder',
      description: 'Encode/decode URL-encoded text',
      href: '/url-encoder-decoder-online',
      icon: <Link className="text-cyan-500 dark:text-cyan-400" />,
      color: 'bg-cyan-50 hover:bg-cyan-100 dark:bg-cyan-900/20 dark:hover:bg-cyan-900/30 border-cyan-200 dark:border-cyan-800',
      category: 'Encoding & Decoding',
      keywords: 'url encoder decoder percent encoding web development'
    },
    {
      name: 'HTML Encoder/Decoder',
      description: 'Encode/decode HTML entities',
      href: '/html-encoder-decoder-online',
      icon: <Code className="text-orange-500 dark:text-orange-400" />,
      color: 'bg-orange-50 hover:bg-orange-100 dark:bg-orange-900/20 dark:hover:bg-orange-900/30 border-orange-200 dark:border-orange-800',
      category: 'Encoding & Decoding',
      keywords: 'html encoder decoder entities web development xss prevention'
    },
    {
      name: 'Unicode Encoder/Decoder',
      description: 'Encode/decode Unicode text',
      href: '/unicode-encoder-decoder-online',
      icon: <Globe className="text-emerald-500 dark:text-emerald-400" />,
      color: 'bg-emerald-50 hover:bg-emerald-100 dark:bg-emerald-900/20 dark:hover:bg-emerald-900/30 border-emerald-200 dark:border-emerald-800',
      category: 'Encoding & Decoding',
      keywords: 'unicode converter utf-8 text encoding international'
    },
    // Hash & Verification
    {
      name: 'SHA-256 Generator',
      description: 'Generate SHA-256 hash',
      href: '/sha256-hash-generator-online',
      icon: <Fingerprint className="text-green-500 dark:text-green-400" />,
      color: 'bg-green-50 hover:bg-green-100 dark:bg-green-900/20 dark:hover:bg-green-900/30 border-green-200 dark:border-green-800',
      category: 'Hash & Verification',
      badge: 'Popular',
      keywords: 'sha256 hash generator cryptographic blockchain bitcoin'
    },
    {
      name: 'MD5 Generator',
      description: 'Generate MD5 hash',
      href: '/md5-generator-online',
      icon: <Hash className="text-emerald-500 dark:text-emerald-400" />,
      color: 'bg-emerald-50 hover:bg-emerald-100 dark:bg-emerald-900/20 dark:hover:bg-emerald-900/30 border-emerald-200 dark:border-emerald-800',
      category: 'Hash & Verification',
      keywords: 'md5 hash generator checksum verification legacy'
    },
    {
      name: 'SHA-512 Generator',
      description: 'Generate SHA-512 hash',
      href: '/sha512-hash-generator-online',
      icon: <Fingerprint className="text-teal-500 dark:text-teal-400" />,
      color: 'bg-teal-50 hover:bg-teal-100 dark:bg-teal-900/20 dark:hover:bg-teal-900/30 border-teal-200 dark:border-teal-800',
      category: 'Hash & Verification',
      keywords: 'sha512 hash generator secure cryptographic'
    },
    {
      name: 'SHA-1 Generator',
      description: 'Generate SHA-1 hash',
      href: '/sha1-hash-generator-online',
      icon: <Hash className="text-emerald-600 dark:text-emerald-500" />,
      color: 'bg-emerald-50 hover:bg-emerald-100 dark:bg-emerald-900/20 dark:hover:bg-emerald-900/30 border-emerald-200 dark:border-emerald-800',
      category: 'Hash & Verification',
      keywords: 'sha1 hash generator legacy cryptographic'
    },
    {
      name: 'HMAC Generator',
      description: 'Generate HMAC codes',
      href: '/hmac-generator-online',
      icon: <Key className="text-lime-500 dark:text-lime-400" />,
      color: 'bg-lime-50 hover:bg-lime-100 dark:bg-lime-900/20 dark:hover:bg-lime-900/30 border-lime-200 dark:border-lime-800',
      category: 'Hash & Verification',
      badge: 'New',
      keywords: 'hmac generator authentication mac message authentication'
    },
    {
      name: 'CRC32 Calculator',
      description: 'Calculate CRC32 checksum',
      href: '/crc32-calculator-online',
      icon: <Cpu className="text-green-600 dark:text-green-500" />,
      color: 'bg-green-50 hover:bg-green-100 dark:bg-green-900/20 dark:hover:bg-green-900/30 border-green-200 dark:border-green-800',
      category: 'Hash & Verification',
      keywords: 'crc32 checksum calculator data integrity verification'
    },
    {
      name: 'PBKDF2 Generator',
      description: 'Password-based key derivation',
      href: '/pbkdf2-generator-online',
      icon: <KeySquare className="text-amber-500 dark:text-amber-400" />,
      color: 'bg-amber-50 hover:bg-amber-100 dark:bg-amber-900/20 dark:hover:bg-amber-900/30 border-amber-200 dark:border-amber-800',
      category: 'Hash & Verification',
      keywords: 'pbkdf2 password key derivation function security'
    },
    // Encryption & Security
    {
      name: 'AES Encrypt/Decrypt',
      description: 'AES encryption & decryption',
      href: '/aes-encrypt-decrypt-online',
      icon: <Shield className="text-violet-500 dark:text-violet-400" />,
      color: 'bg-violet-50 hover:bg-violet-100 dark:bg-violet-900/20 dark:hover:bg-violet-900/30 border-violet-200 dark:border-violet-800',
      category: 'Encryption & Security',
      badge: 'Pro',
      keywords: 'aes encryption decryption advanced encryption standard security'
    },
    {
      name: 'ChaCha20 Encrypt/Decrypt',
      description: 'ChaCha20 stream cipher',
      href: '/chacha20-encrypt-decrypt-online',
      icon: <Shuffle className="text-indigo-600 dark:text-indigo-500" />,
      color: 'bg-indigo-50 hover:bg-indigo-100 dark:bg-indigo-900/20 dark:hover:bg-indigo-900/30 border-indigo-200 dark:border-indigo-800',
      category: 'Encryption & Security',
      badge: 'New',
      keywords: 'chacha20 stream cipher modern encryption'
    },
    {
      name: 'Blowfish Encrypt/Decrypt',
      description: 'Symmetric block cipher',
      href: '/blowfish-encrypt-decrypt-online',
      icon: <Fish className="text-violet-500 dark:text-violet-400" />,
      color: 'bg-violet-50 hover:bg-violet-100 dark:bg-violet-900/20 dark:hover:bg-violet-900/30 border-violet-200 dark:border-violet-800',
      category: 'Encryption & Security',
      keywords: 'blowfish cipher symmetric encryption block cipher'
    },
    {
      name: 'XOR Encrypt/Decrypt',
      description: 'XOR cipher encryption/decryption',
      href: '/xor-encrypt-decrypt-online',
      icon: <X className="text-rose-500 dark:text-rose-400" />,
      color: 'bg-rose-50 hover:bg-rose-100 dark:bg-rose-900/20 dark:hover:bg-rose-900/30 border-rose-200 dark:border-rose-800',
      category: 'Encryption & Security',
      keywords: 'xor encryption decryption cipher simple educational'
    },
    {
      name: 'RSA Encrypt/Decrypt',
      description: 'RSA public key cryptography',
      href: '/rsa-encrypt-decrypt-online',
      icon: <KeySquare className="text-purple-600 dark:text-purple-500" />,
      color: 'bg-purple-50 hover:bg-purple-100 dark:bg-purple-900/20 dark:hover:bg-purple-900/30 border-purple-200 dark:border-purple-800',
      category: 'Encryption & Security',
      keywords: 'rsa encryption decryption public key cryptography'
    },
    // Classical Ciphers
    {
      name: 'Caesar Cipher',
      description: 'Classical shift cipher',
      href: '/caesar-cipher-encoder-decoder-online',
      icon: <ScrollText className="text-amber-500 dark:text-amber-400" />,
      color: 'bg-amber-50 hover:bg-amber-100 dark:bg-amber-900/20 dark:hover:bg-amber-900/30 border-amber-200 dark:border-amber-800',
      category: 'Classical Ciphers',
      keywords: 'caesar cipher shift cipher classical cryptography'
    },
    {
      name: 'ROT Cipher',
      description: 'ROT13, ROT47 variants',
      href: '/rot-cipher-encoder-decoder-online',
      icon: <RotateCw className="text-fuchsia-500 dark:text-fuchsia-400" />,
      color: 'bg-fuchsia-50 hover:bg-fuchsia-100 dark:bg-fuchsia-900/20 dark:hover:bg-fuchsia-900/30 border-fuchsia-200 dark:border-fuchsia-800',
      category: 'Classical Ciphers',
      keywords: 'rot13 rot47 cipher rotation text encoding'
    },
    {
      name: 'Vigenère Cipher',
      description: 'Polyalphabetic substitution',
      href: '/vigenere-cipher-encrypt-decrypt-online',
      icon: <Grid3x3 className="text-blue-600 dark:text-blue-500" />,
      color: 'bg-blue-50 hover:bg-blue-100 dark:bg-blue-900/20 dark:hover:bg-blue-900/30 border-blue-200 dark:border-blue-800',
      category: 'Classical Ciphers',
      keywords: 'vigenere cipher polyalphabetic substitution classical'
    },
    {
      name: 'Playfair Cipher',
      description: '5x5 grid substitution cipher',
      href: '/playfair-cipher-encrypt-decrypt-online',
      icon: <Square className="text-green-600 dark:text-green-500" />,
      color: 'bg-green-50 hover:bg-green-100 dark:bg-green-900/20 dark:hover:bg-green-900/30 border-green-200 dark:border-green-800',
      category: 'Classical Ciphers',
      keywords: 'playfair cipher grid substitution classical cryptography'
    },
    {
      name: 'Rail Fence Cipher',
      description: 'Zigzag transposition cipher',
      href: '/rail-fence-cipher-online',
      icon: <Fence className="text-purple-600 dark:text-purple-500" />,
      color: 'bg-purple-50 hover:bg-purple-100 dark:bg-purple-900/20 dark:hover:bg-purple-900/30 border-purple-200 dark:border-purple-800',
      category: 'Classical Ciphers',
      keywords: 'rail fence cipher zigzag transposition classical'
    },
    // Generators & Utilities
    {
      name: 'Password Generator',
      description: 'Generate secure passwords',
      href: '/password-generator-online',
      icon: <Key className="text-blue-600 dark:text-blue-500" />,
      color: 'bg-blue-50 hover:bg-blue-100 dark:bg-blue-900/20 dark:hover:bg-blue-900/30 border-blue-200 dark:border-blue-800',
      category: 'Generators & Utilities',
      badge: 'Popular',
      keywords: 'password generator secure random strong passwords'
    },
    {
      name: 'UUID GUID Generator',
      description: 'Generate unique identifiers',
      href: '/uuid-guid-generator-online',
      icon: <Fingerprint className="text-indigo-600 dark:text-indigo-500" />,
      color: 'bg-indigo-50 hover:bg-indigo-100 dark:bg-indigo-900/20 dark:hover:bg-indigo-900/30 border-indigo-200 dark:border-indigo-800',
      category: 'Generators & Utilities',
      keywords: 'uuid GUID generator unique identifier guid development'
    },
    {
      name: 'SSH Key Generator',
      description: 'Generate SSH key pairs',
      href: '/ssh-key-generator-online',
      icon: <Terminal className="text-slate-600 dark:text-slate-400" />,
      color: 'bg-slate-50 hover:bg-slate-100 dark:bg-slate-900/20 dark:hover:bg-slate-900/30 border-slate-200 dark:border-slate-800',
      category: 'Generators & Utilities',
      keywords: 'ssh key generator secure shell authentication linux'
    },
    {
      name: 'JWT Encoder/Decoder',
      description: 'Encode/decode JSON Web Tokens',
      href: '/jwt-encoder-decoder-online',
      icon: <Braces className="text-green-600 dark:text-green-500" />,
      color: 'bg-green-50 hover:bg-green-100 dark:bg-green-900/20 dark:hover:bg-green-900/30 border-green-200 dark:border-green-800',
      category: 'Generators & Utilities',
      keywords: 'jwt encoder decoder json web token authentication api'
    },
    {
      name: 'Timestamp Converter',
      description: 'Convert Unix timestamps',
      href: '/epoch-timestamp-converter-online',
      icon: <Calendar className="text-orange-600 dark:text-orange-500" />,
      color: 'bg-orange-50 hover:bg-orange-100 dark:bg-orange-900/20 dark:hover:bg-orange-900/30 border-orange-200 dark:border-orange-800',
      category: 'Generators & Utilities',
      keywords: 'timestamp converter unix epoch time date conversion'
    },
    {
      name: 'Morse Code Translator',
      description: 'Translate to/from Morse code',
      href: '/morse-code-translator-online',
      icon: <Wifi className="text-cyan-600 dark:text-cyan-500" />,
      color: 'bg-cyan-50 hover:bg-cyan-100 dark:bg-cyan-900/20 dark:hover:bg-cyan-900/30 border-cyan-200 dark:border-cyan-800',
      category: 'Generators & Utilities',
      keywords: 'morse code translator dots dashes communication'
    },
  ];

  const filterOptions = [
    'All',
    'Encoding & Decoding',
    'Hash & Verification', 
    'Encryption & Security',
    'Classical Ciphers',
    'Generators & Utilities'
  ];

  const filteredTools = useMemo(() => {
    let filtered = allTools;
    
    // Filter by category
    if (activeFilter !== 'All') {
      filtered = filtered.filter(tool => tool.category === activeFilter);
    }
    
    return filtered;
  }, [activeFilter]);

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
      {/* Hero Section */}
      <header className="bg-white dark:bg-gray-950 border-b border-gray-200 dark:border-gray-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 sm:py-20">
          <div className="text-center">
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-gray-900 dark:text-white mb-6">
              Every tool you need to work with <br />
              <span className="bg-gradient-to-r from-violet-600 to-purple-900 bg-clip-text text-transparent">
                Cryptography in one place
              </span>
            </h1>
            
            <p className="text-lg sm:text-xl text-gray-600 dark:text-gray-300 max-w-4xl mx-auto mb-12 leading-relaxed">
              Every tool you need for cryptography, at your fingertips. All are <strong>100% FREE</strong> and easy to use! 
              Encode, decode, encrypt, decrypt, hash and generate with just a few clicks.
            </p>
          </div>
        </div>
      </header>

      {/* Filters Section */}
      <section className="bg-white dark:bg-gray-950">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {/* Filter Buttons */}
          <div className="flex flex-wrap gap-3 justify-center">
            {filterOptions.map((filter) => (
              <button
                key={filter}
                onClick={() => setActiveFilter(filter)}
                className={`px-6 py-3 rounded-xl font-medium transition-all duration-300 ${
                  activeFilter === filter
                    ? 'bg-violet-600 text-white shadow-lg'
                    : 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700'
                }`}
              >
                {filter}
                {filter === 'All' && (
                  <span className="ml-2 text-xs bg-violet-100 dark:bg-violet-900 text-violet-800 dark:text-violet-300 px-2 py-1 rounded-full">
                    {allTools.length}
                  </span>
                )}
              </button>
            ))}
          </div>
        </div>
      </section>

      {/* Tools Grid */}
      <main className="py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {filteredTools.length === 0 ? (
            <div className="text-center py-20">
              <div className="text-gray-400 dark:text-gray-600 mb-4">
                <Lock className="h-16 w-16 mx-auto mb-4 opacity-50" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
                No tools found
              </h3>
              <p className="text-gray-600 dark:text-gray-400">
                Try selecting a different category to find what you're looking for.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-4 sm:gap-6">
                {filteredTools.map((tool, index) => (
                  <article
                    key={`${tool.name}-${index}`}
                    className={`group relative ${tool.color} rounded-2xl border-2 p-4 sm:p-6 cursor-pointer transition-all duration-300 hover:shadow-xl hover:scale-105 block no-underline`}
                  >
                    <a href={tool.href} className="block" aria-label={`${tool.name} - ${tool.description}`}>
                      {/* Badge */}
                      {tool.badge && (
                        <div className={`absolute -top-2 -right-2 px-3 py-1 rounded-full text-xs font-bold border shadow-sm ${getBadgeStyles(tool.badge)}`}>
                          {tool.badge}
                        </div>
                      )}
                      
                      {/* Icon */}
                      <div className="flex justify-center mb-3 sm:mb-4">
                        <div className="p-3 sm:p-4 rounded-2xl bg-white dark:bg-gray-900 shadow-md group-hover:shadow-lg transition-all duration-300">
                          <div className="w-6 h-6 sm:w-8 sm:h-8">
                            {React.cloneElement(tool.icon, { 
                              className: 'w-full h-full ' + tool.icon.props.className.split(' ').slice(2).join(' '),
                              'aria-hidden': 'true'
                            })}
                          </div>
                        </div>
                      </div>
                      
                      {/* Content */}
                      <div className="text-center">
                        <h3 className="font-bold text-gray-900 dark:text-white mb-2 text-sm sm:text-base group-hover:text-opacity-80 transition-all duration-300">
                          {tool.name}
                        </h3>
                        <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-400 leading-tight">
                          {tool.description}
                        </p>
                      </div>
                    </a>
                  </article>
                ))}
              </div>
          )}
        </div>
      </main>

      {/* Why Choose Section */}
      <section className="py-16 bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-950">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 dark:text-white mb-6">
              Why Choose EasyEncoderDecoder?
            </h2>
            <p className="text-lg text-gray-600 dark:text-gray-300 max-w-3xl mx-auto">
              Professional-grade cryptographic tools designed for security professionals, developers, and anyone who values data privacy
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            <div className="text-center p-8 bg-white dark:bg-gray-900 rounded-3xl shadow-lg hover:shadow-xl transition-all duration-300 hover:-translate-y-1">
              <div className="inline-flex items-center justify-center w-16 h-16 bg-green-100 dark:bg-green-900/20 rounded-2xl mb-6">
                <Shield className="h-8 w-8 text-green-600 dark:text-green-400" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-4">100% Secure</h3>
              <p className="text-gray-600 dark:text-gray-400 leading-relaxed">All cryptographic operations are performed locally in your browser. Your data never leaves your device, ensuring complete privacy and security.</p>
            </div>
            
            <div className="text-center p-8 bg-white dark:bg-gray-900 rounded-3xl shadow-lg hover:shadow-xl transition-all duration-300 hover:-translate-y-1">
              <div className="inline-flex items-center justify-center w-16 h-16 bg-blue-100 dark:bg-blue-900/20 rounded-2xl mb-6">
                <Zap className="h-8 w-8 text-blue-600 dark:text-blue-400" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-4">Lightning Fast</h3>
              <p className="text-gray-600 dark:text-gray-400 leading-relaxed">Instant processing with no waiting times, upload delays, or server communication. Get results immediately for all your cryptographic needs.</p>
            </div>
            
            <div className="text-center p-8 bg-white dark:bg-gray-900 rounded-3xl shadow-lg hover:shadow-xl transition-all duration-300 hover:-translate-y-1">
              <div className="inline-flex items-center justify-center w-16 h-16 bg-violet-100 dark:bg-violet-900/20 rounded-2xl mb-6">
                <Star className="h-8 w-8 text-violet-600 dark:text-violet-400" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-4">Always Free</h3>
              <p className="text-gray-600 dark:text-gray-400 leading-relaxed">Complete access to all {allTools.length} tools with no hidden costs, subscriptions, or limitations. Professional-grade tools available to everyone.</p>
            </div>
            
            <div className="text-center p-8 bg-white dark:bg-gray-900 rounded-3xl shadow-lg hover:shadow-xl transition-all duration-300 hover:-translate-y-1">
              <div className="inline-flex items-center justify-center w-16 h-16 bg-orange-100 dark:bg-orange-900/20 rounded-2xl mb-6">
                <Users className="h-8 w-8 text-orange-600 dark:text-orange-400" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-4">Developer Friendly</h3>
              <p className="text-gray-600 dark:text-gray-400 leading-relaxed">Built by developers for developers. Clean interface, reliable results, and tools designed for both beginners and security experts.</p>
            </div>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-16 bg-gradient-to-br from-violet-50 to-purple-50 dark:from-violet-900/10 dark:to-purple-900/10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 dark:text-white mb-4">
              Trusted by Security Professionals
            </h2>
            <p className="text-lg text-gray-600 dark:text-gray-300">
              Join thousands of developers and security experts who trust EasyEncoderDecoder
            </p>
          </div>
          
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            <div className="text-center">
              <div className="text-4xl font-bold text-violet-600 dark:text-violet-400 mb-2">{allTools.length}</div>
              <div className="text-gray-600 dark:text-gray-400 font-medium">Crypto Tools</div>
            </div>
            <div className="text-center">
              <div className="text-4xl font-bold text-blue-500 dark:text-blue-400 mb-2">100%</div>
              <div className="text-gray-600 dark:text-gray-400 font-medium">Client-Side</div>
            </div>
            <div className="text-center">
              <div className="text-4xl font-bold text-green-500 dark:text-green-400 mb-2">0</div>
              <div className="text-gray-600 dark:text-gray-400 font-medium">Data Stored</div>
            </div>
            <div className="text-center">
              <div className="text-4xl font-bold text-purple-500 dark:text-purple-400 mb-2">Free</div>
              <div className="text-gray-600 dark:text-gray-400 font-medium">Always</div>
            </div>
          </div>
        </div>
      </section>

      {/* FAQ Section */}
      <section className="py-16 bg-white dark:bg-gray-950">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-4">
              Frequently Asked Questions
            </h2>
            <p className="text-gray-600 dark:text-gray-300">
              Everything you need to know about EasyEncoderDecoder
            </p>
          </div>
          
          <div className="space-y-8">
            <div className="bg-gray-50 dark:bg-gray-900 rounded-2xl p-6">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">
                Are my data and files secure when using EasyEncoderDecoder?
              </h3>
              <p className="text-gray-600 dark:text-gray-400">
                Yes, absolutely. All cryptographic operations are performed entirely in your browser using JavaScript. Your data never leaves your device, is never uploaded to our servers, and is never stored anywhere. This ensures complete privacy and security.
              </p>
            </div>
            
            <div className="bg-gray-50 dark:bg-gray-900 rounded-2xl p-6">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">
                Do I need to install any software to use these tools?
              </h3>
              <p className="text-gray-600 dark:text-gray-400">
                No installation required. EasyEncoderDecoder works entirely in your web browser. Simply visit our website and start using any of our {allTools.length} cryptography tools immediately. Compatible with all modern browsers.
              </p>
            </div>
            
            <div className="bg-gray-50 dark:bg-gray-900 rounded-2xl p-6">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">
                Is EasyEncoderDecoder really free? Are there any hidden costs?
              </h3>
              <p className="text-gray-600 dark:text-gray-400">
                EasyEncoderDecoder is completely free with no hidden costs, subscriptions, or premium tiers. All {allTools.length} tools are available to everyone without any limitations. We believe in making cryptography tools accessible to all.
              </p>
            </div>
            
            <div className="bg-gray-50 dark:bg-gray-900 rounded-2xl p-6">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">
                Which encryption algorithms do you support?
              </h3>
              <p className="text-gray-600 dark:text-gray-400">
                We support modern algorithms like AES, ChaCha20, and Blowfish, hash functions including SHA-256, SHA-512, MD5, and HMAC, plus classical ciphers like Caesar, Vigenère, and Playfair for educational purposes.
              </p>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
