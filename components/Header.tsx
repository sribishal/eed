'use client';

import Link from 'next/link';
import { useState, useEffect, useCallback, useRef } from 'react';
import { Menu, X, Shield, Search, Grid3X3, Hash, Key, Lock, Clock, Link2, ArrowRight, Zap, Flame, Star, Heart, Share2, Copy, RotateCcw, Check } from 'lucide-react';
import { ThemeToggle } from '@/components/theme-toggle';

// Tool categories with icons for better visual hierarchy
const TOOL_CATEGORIES = [
  {
    name: 'Encoding & Decoding',
    icon: Grid3X3,
    color: 'text-blue-500',
    tools: [
      { name: 'Base64 Encoder Decoder', href: '/base64-encoder-decoder-online' },
      { name: 'Binary Encoder Decoder', href: '/binary-encoder-decoder-online' },
      { name: 'Hex Encoder Decoder', href: '/hex-encoder-decoder-online' },
      { name: 'HTML Encoder Decoder', href: '/html-encoder-decoder-online' },
      { name: 'Unicode Encoder Decoder', href: '/unicode-encoder-decoder-online' },
      { name: 'Base58 Encoder Decoder', href: '/base58-encoder-decoder-online' }
    ]
  },
  {
    name: 'URL Tools',
    icon: Link2,
    color: 'text-green-500',
    tools: [
      { name: 'URL Encoder Decoder', href: '/url-encoder-decoder-online' }
    ]
  },
  {
    name: 'Hashing',
    icon: Hash,
    color: 'text-purple-500',
    tools: [
      { name: 'MD5 Generator', href: '/md5-generator-online' },
      { name: 'SHA1 Hash Generator', href: '/sha1-hash-generator-online' },
      { name: 'SHA256 Hash Generator', href: '/sha256-hash-generator-online' },
      { name: 'SHA512 Hash Generator', href: '/sha512-hash-generator-online' },
      { name: 'CRC32 Calculator', href: '/crc32-calculator-online' },
      { name: 'HMAC Generator', href: '/hmac-generator-online' },
      { name: 'PBKDF2 Generator', href: '/pbkdf2-generator-online' }
    ]
  },
  {
    name: 'Encryption & Decryption',
    icon: Lock,
    color: 'text-red-500',
    tools: [
      { name: 'AES Encrypt Decrypt', href: '/aes-encrypt-decrypt-online' },
      { name: 'XOR Encrypt Decrypt', href: '/xor-encrypt-decrypt-online' },
      { name: 'ChaCha20 Encrypt Decrypt', href: '/chacha20-encrypt-decrypt-online' },
      { name: 'Blowfish Encrypt Decrypt', href: '/blowfish-encrypt-decrypt-online' },
      { name: 'Caesar Cipher', href: '/caesar-cipher-encoder-decoder-online' },
      { name: 'Playfair Cipher', href: '/playfair-cipher-encrypt-decrypt-online' },
      { name: 'Rail Fence Cipher', href: '/rail-fence-cipher-online' },
      { name: 'ROT Cipher', href: '/rot-cipher-encoder-decoder-online' },
      { name: 'Vigenère Cipher', href: '/vigenere-cipher-encrypt-decrypt-online' },
      { name: 'Morse Code Translator', href: '/morse-code-translator-online' }
    ]
  },
  {
    name: 'Key Generation',
    icon: Key,
    color: 'text-yellow-500',
    tools: [
      { name: 'RSA Key Generator', href: '/rsa-encrypt-decrypt-online' },
      { name: 'SSH Key Generator', href: '/ssh-key-generator-online' },
      { name: 'UUID GUID Generator', href: '/uuid-guid-generator-online' },
      { name: 'Password Generator', href: '/password-generator-online' }
    ]
  },
  {
    name: 'Token & Time Tools',
    icon: Clock,
    color: 'text-indigo-500',
    tools: [
      { name: 'JWT Encoder Decoder', href: '/jwt-encoder-decoder-online' },
      { name: 'Epoch Timestamp Converter', href: '/epoch-timestamp-converter-online' }
    ]
  }
] as const;

// Popular tools to show when search is focused (for desktop)
const POPULAR_TOOLS = [
  { name: 'Base64 Encoder Decoder', href: '/base64-encoder-decoder-online' },
  { name: 'MD5 Generator', href: '/md5-generator-online' },
  { name: 'SHA256 Hash Generator', href: '/sha256-hash-generator-online' },
  { name: 'AES Encrypt Decrypt', href: '/aes-encrypt-decrypt-online' },
  { name: 'Password Generator', href: '/password-generator-online' },
  { name: 'JWT Encoder Decoder', href: '/jwt-encoder-decoder-online' },
  { name: 'URL Encoder Decoder', href: '/url-encoder-decoder-online' },
  { name: 'Epoch Timestamp Converter', href: '/epoch-timestamp-converter-online' },
];

export default function Header() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [isSearchFocused, setIsSearchFocused] = useState(false);
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [showResults, setShowResults] = useState(false);
  const [showPopular, setShowPopular] = useState(false);
  const [showShareMenu, setShowShareMenu] = useState(false);
  const [copySuccess, setCopySuccess] = useState(false);
  
  // Refs
  const searchInputRef = useRef<HTMLInputElement>(null);
  const searchContainerRef = useRef<HTMLDivElement>(null);
  const resultsRef = useRef<HTMLDivElement>(null);
  const shareMenuRef = useRef<HTMLDivElement>(null);

  // Search functionality (only for desktop)
  const performSearch = useCallback((term: string) => {
    if (!term.trim()) {
      setSearchResults([]);
      setShowResults(false);
      setShowPopular(isSearchFocused);
      return;
    }

    setShowPopular(false);
    
    const results: any[] = [];
    TOOL_CATEGORIES.forEach(category => {
      const matchingTools = category.tools.filter(tool =>
        tool.name.toLowerCase().includes(term.toLowerCase())
      );
      
      if (matchingTools.length > 0) {
        results.push({
          category: category.name,
          icon: category.icon,
          color: category.color,
          tools: matchingTools.slice(0, 4)
        });
      }
    });

    setSearchResults(results);
    setShowResults(true);
  }, [isSearchFocused]);

  const handleSearchChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setSearchTerm(value);
    performSearch(value);
  }, [performSearch]);

  const clearSearch = useCallback(() => {
    setSearchTerm('');
    setSearchResults([]);
    setShowResults(false);
    setShowPopular(isSearchFocused);
    searchInputRef.current?.focus();
  }, [isSearchFocused]);

  const handleSearchFocus = useCallback(() => {
    setIsSearchFocused(true);
    setShowPopular(true);
    
    if (searchTerm) {
      setShowResults(true);
    }
  }, [searchTerm]);

  const handleSearchBlur = useCallback((e: React.FocusEvent) => {
    // Check if the blur is happening because we're clicking inside the results
    if (resultsRef.current && resultsRef.current.contains(e.relatedTarget as Node)) {
      return;
    }
    
    setIsSearchFocused(false);
    setTimeout(() => {
      setShowResults(false);
      setShowPopular(false);
    }, 150);
  }, []);

  const closeMobileMenu = useCallback(() => {
    setIsMenuOpen(false);
  }, []);

  const toggleMobileMenu = useCallback(() => {
    setIsMenuOpen(prev => !prev);
  }, []);

  // Share functionality
  const toggleShareMenu = useCallback(() => {
    setShowShareMenu(prev => !prev);
  }, []);

  const handleShare = useCallback(async (platform: string) => {
    const currentUrl = window.location.href;
    const title = document.title || 'EasyEncoderDecoder - Free Online Encoding & Decoding Tools';
    const text = 'Check out this amazing collection of free online encoding, decoding, encryption and hashing tools!';

    switch (platform) {
      case 'native':
        if (navigator.share) {
          try {
            await navigator.share({
              title: title,
              text: text,
              url: currentUrl,
            });
          } catch (error) {
            // If native share fails, fall back to copy
            handleShare('copy');
          }
        } else {
          handleShare('copy');
        }
        break;
      
      case 'copy':
        try {
          await navigator.clipboard.writeText(currentUrl);
          setCopySuccess(true);
          setTimeout(() => setCopySuccess(false), 2000);
        } catch (error) {
          // Fallback for older browsers
          const textArea = document.createElement('textarea');
          textArea.value = currentUrl;
          document.body.appendChild(textArea);
          textArea.select();
          document.execCommand('copy');
          document.body.removeChild(textArea);
          setCopySuccess(true);
          setTimeout(() => setCopySuccess(false), 2000);
        }
        break;
      
      case 'twitter':
        window.open(
          `https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}&url=${encodeURIComponent(currentUrl)}`,
          '_blank',
          'width=550,height=420'
        );
        break;
      
      case 'facebook':
        window.open(
          `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(currentUrl)}`,
          '_blank',
          'width=550,height=420'
        );
        break;
      
      case 'linkedin':
        window.open(
          `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(currentUrl)}`,
          '_blank',
          'width=550,height=420'
        );
        break;
      
      case 'whatsapp':
        window.open(
          `https://wa.me/?text=${encodeURIComponent(`${text} ${currentUrl}`)}`,
          '_blank'
        );
        break;
      
      case 'telegram':
        window.open(
          `https://t.me/share/url?url=${encodeURIComponent(currentUrl)}&text=${encodeURIComponent(text)}`,
          '_blank'
        );
        break;
      
      case 'reddit':
        window.open(
          `https://reddit.com/submit?url=${encodeURIComponent(currentUrl)}&title=${encodeURIComponent(title)}`,
          '_blank'
        );
        break;
    }
    
    setShowShareMenu(false);
  }, []);

  // Handle clicks outside search
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (searchContainerRef.current && !searchContainerRef.current.contains(event.target as Node)) {
        setShowResults(false);
        setShowPopular(false);
        setIsSearchFocused(false);
      }
      // Handle share menu clicks outside
      if (shareMenuRef.current && !shareMenuRef.current.contains(event.target as Node)) {
        setShowShareMenu(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Handle escape key
  useEffect(() => {
    const handleEscapeKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        if (showResults || isSearchFocused || showPopular) {
          setShowResults(false);
          setShowPopular(false);
          setIsSearchFocused(false);
          searchInputRef.current?.blur();
        }
        if (isMenuOpen) {
          closeMobileMenu();
        }
        if (showShareMenu) {
          setShowShareMenu(false);
        }
      }
    };

    document.addEventListener('keydown', handleEscapeKey);
    return () => document.removeEventListener('keydown', handleEscapeKey);
  }, [showResults, isSearchFocused, isMenuOpen, closeMobileMenu, showPopular, showShareMenu]);

  // Body scroll prevention for mobile menu
  useEffect(() => {
    if (isMenuOpen) {
      const originalOverflow = document.body.style.overflow;
      document.body.style.overflow = 'hidden';
      return () => {
        document.body.style.overflow = originalOverflow;
      };
    }
  }, [isMenuOpen]);

  return (
    <>
      <header className="sticky top-0 z-50 w-full border-b border-white/10 bg-white/5 backdrop-blur-3xl supports-[backdrop-filter]:bg-white/5 shadow-lg shadow-black/5">
        <nav className="container mx-auto px-4 sm:px-6 lg:px-8" role="navigation" aria-label="Main navigation">
          <div className="flex items-center justify-between h-16 lg:h-20">
            
            {/* Logo - Made visible on mobile */}
            <Link href="/" className="flex items-center space-x-3 group" aria-label="EasyEncoderDecoder Home">
              <div className="relative">
                <div className="absolute inset-0 bg-blue-500/30 rounded-xl opacity-0 group-hover:opacity-100 transition-all duration-700 scale-125"></div>
                <div className="relative bg-gradient-to-br from-violet-900 to-violet-600 p-2 rounded-xl shadow-lg shadow-violet-900/20 border border-white/20">
                  <Shield className="h-5 w-5 text-white drop-shadow-md" aria-hidden="true" />
                </div>
              </div>
              {/* Show website name on mobile too */}
              <div className="block">
                <span className="text-lg sm:text-xl font-bold text-black dark:text-white tracking-tight">
  EasyEncoderDecoder
</span>
                <div className="text-xs text-black/60 dark:text-white/60 -mt-1 font-medium hidden sm:block">Secure & Simple</div>
              </div>
            </Link>

            {/* Center Search Bar - Desktop Only */}
            <div className="hidden lg:flex flex-1 max-w-2xl mx-8 relative" ref={searchContainerRef}>
              <div className={`relative w-full transition-all duration-500 ${isSearchFocused ? 'transform scale-105' : ''}`}>
                <div className="absolute inset-0 bg-gradient-to-r from-blue-400/20 via-blue-500/20 to-blue-600/20 rounded-2xl blur-xl opacity-0 group-focus-within:opacity-100 transition-all duration-700"></div>
                <div className={`relative flex items-center bg-white/30 backdrop-blur-xl border-2 border-white/40 rounded-2xl transition-all duration-500 shadow-lg ${isSearchFocused ? 'border-blue-400/60 bg-white/40 shadow-xl shadow-blue-500/20' : 'shadow-black/10'}`}>
                  <div className="absolute inset-0 bg-gradient-to-r from-white/10 to-white/20 rounded-2xl"></div>
                  <Search className={`relative ml-4 h-5 w-5 transition-colors duration-300 ${isSearchFocused ? 'text-blue-600' : 'text-black/70 dark:text-white/70'}`} />
                  <input
                    ref={searchInputRef}
                    type="text"
                    placeholder="Search tools... (AES, Base64, Hash, etc.)"
                    value={searchTerm}
                    onChange={handleSearchChange}
                    onFocus={handleSearchFocus}
                    onBlur={handleSearchBlur}
                    className="relative flex-1 bg-transparent px-4 py-3.5 text-sm focus:outline-none placeholder:text-black/60 dark:placeholder:text-white/60 text-black dark:text-white font-medium"
                  />
                  {searchTerm && (
                    <button
                      onClick={clearSearch}
                      className="relative mr-2 p-2 rounded-xl hover:bg-white/20 backdrop-blur-sm transition-all duration-300"
                      aria-label="Clear search"
                    >
                      <X className="h-4 w-4 text-black/60 dark:text-white/60" />
                    </button>
                  )}
                  <div className="relative mr-4 px-3 py-2 bg-blue-600 backdrop-blur-sm text-white text-xs rounded-xl font-semibold flex items-center space-x-1.5 shadow-md border border-blue-500/30">
                    <Zap className="h-3 w-3" />
                    <span>Search</span>
                  </div>
                </div>

                {/* Search Results Dropdown */}
                {showResults && searchResults.length > 0 && (
                  <div
                    ref={resultsRef}
                    className="absolute top-full left-0 right-0 mt-3 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-2xl shadow-2xl shadow-black/20 overflow-hidden animate-in fade-in-0 slide-in-from-top-2 duration-300 max-h-96 overflow-y-auto"
                  >
                    <div className="p-5">
                      <div className="text-xs text-gray-600 dark:text-gray-400 mb-4 flex items-center space-x-1.5 font-medium bg-gray-100 dark:bg-gray-800 px-3 py-2 rounded-xl">
                        <Search className="h-3 w-3" />
                        <span>Found {searchResults.reduce((acc, cat) => acc + cat.tools.length, 0)} tools</span>
                      </div>
                      
                      <div className="space-y-4">
                        {searchResults.map((category) => {
                          const IconComponent = category.icon;
                          return (
                            <div key={category.category} className="bg-gray-50 dark:bg-gray-800 rounded-xl p-4 border border-gray-200 dark:border-gray-700">
                              <div className="flex items-center space-x-2 mb-3">
                                <div className="p-1.5 rounded-lg bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600">
                                  <IconComponent className={`h-4 w-4 ${category.color}`} />
                                </div>
                                <span className="text-sm font-bold text-gray-900 dark:text-white">{category.category}</span>
                              </div>
                              <div className="grid grid-cols-2 gap-2">
                                {category.tools.map((tool: any) => (
                                  <Link
                                    key={tool.name}
                                    href={tool.href}
                                    className="flex items-center justify-between p-3 rounded-xl hover:bg-white dark:hover:bg-gray-700 transition-all duration-200 group border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-800"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      setShowResults(false);
                                      setShowPopular(false);
                                      setIsSearchFocused(false);
                                    }}
                                  >
                                    <span className="text-sm text-gray-800 dark:text-gray-200 group-hover:text-gray-900 dark:group-hover:text-white font-medium">
                                      {tool.name}
                                    </span>
                                    <ArrowRight className="h-3 w-3 text-gray-500 dark:text-gray-400 opacity-0 group-hover:opacity-100 transition-all" />
                                  </Link>
                                ))}
                              </div>
                            </div>
                          );
                        })}
                      </div>

                      <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
                        <Link
                          href="/tools"
                          className="flex items-center justify-center w-full py-3 px-4 text-sm font-semibold text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 transition-colors rounded-xl hover:bg-blue-50 dark:hover:bg-blue-900/30 border border-blue-200 dark:border-blue-700 bg-blue-50 dark:bg-blue-900/20"
                          onClick={(e) => {
                            e.stopPropagation();
                            setShowResults(false);
                            setShowPopular(false);
                            setIsSearchFocused(false);
                          }}
                        >
                          View All Tools
                          <ArrowRight className="ml-2 h-4 w-4" />
                        </Link>
                      </div>
                    </div>
                  </div>
                )}

                {/* Popular Tools Section */}
                {showPopular && !searchTerm && (
                  <div className="absolute top-full left-0 right-0 mt-3 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-2xl shadow-2xl shadow-black/20 overflow-hidden animate-in fade-in-0 slide-in-from-top-2 duration-300">
                    <div className="p-5">
                      <div className="flex items-center space-x-2 mb-4 bg-orange-50 dark:bg-orange-900/30 px-3 py-2 rounded-xl border border-orange-200 dark:border-orange-700">
                        <Flame className="h-5 w-5 text-orange-500" />
                        <span className="text-sm font-bold text-orange-800 dark:text-orange-200">Popular Tools</span>
                      </div>
                      
                      <div className="grid grid-cols-2 gap-3">
                        {POPULAR_TOOLS.map((tool) => (
                          <Link
                            key={tool.name}
                            href={tool.href}
                            className="flex items-center justify-between p-3 rounded-xl hover:bg-gray-50 dark:hover:bg-gray-700 transition-all duration-200 group border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-800 shadow-sm"
                            onClick={(e) => {
                              e.stopPropagation();
                              setShowResults(false);
                              setShowPopular(false);
                              setIsSearchFocused(false);
                            }}
                          >
                            <span className="text-sm text-gray-800 dark:text-gray-200 group-hover:text-gray-900 dark:group-hover:text-white font-medium">
                              {tool.name}
                            </span>
                            <ArrowRight className="h-3 w-3 text-gray-500 dark:text-gray-400 opacity-0 group-hover:opacity-100 transition-all" />
                          </Link>
                        ))}
                      </div>
                      
                      <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
                        <Link
                          href="/tools"
                          className="flex items-center justify-center w-full py-3 px-4 text-sm font-semibold text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 transition-colors rounded-xl hover:bg-blue-50 dark:hover:bg-blue-900/30 border border-blue-200 dark:border-blue-700 bg-blue-50 dark:bg-blue-900/20"
                          onClick={() => {
                            setShowResults(false);
                            setShowPopular(false);
                            setIsSearchFocused(false);
                          }}
                        >
                          View All Tools
                          <ArrowRight className="ml-2 h-4 w-4" />
                        </Link>
                      </div>
                    </div>
                  </div>
                )}

                {showResults && searchResults.length === 0 && searchTerm && (
                  <div className="absolute top-full left-0 right-0 mt-3 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-2xl shadow-2xl shadow-black/20 overflow-hidden animate-in fade-in-0 slide-in-from-top-2 duration-300">
                    <div className="p-8 text-center">
                      <div className="p-3 rounded-full bg-gray-100 dark:bg-gray-800 w-fit mx-auto mb-3">
                        <Search className="h-8 w-8 text-gray-400 dark:text-gray-500" />
                      </div>
                      <p className="text-gray-700 dark:text-gray-300 font-medium">No tools found matching "{searchTerm}"</p>
                      <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">Try searching for "encrypt", "hash", "encode", etc.</p>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Desktop Navigation Links */}
            <div className="hidden lg:flex items-center space-x-3">
              <Link
                href="/tools"
                className="flex items-center space-x-2 text-black/70 dark:text-white/70 hover:text-black dark:hover:text-white px-4 py-2 text-sm font-semibold transition-all duration-300 hover:scale-105 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:ring-offset-2 rounded-2xl relative group bg-white/5 backdrop-blur-sm border border-white/10"
              >
                <Grid3X3 className="h-4 w-4" />
                <span>Tools</span>
              </Link>

              {/* Share Button */}
              <div className="relative" ref={shareMenuRef}>
                <button
                  onClick={toggleShareMenu}
                  className="flex items-center space-x-2 text-purple-600 hover:text-purple-700 dark:text-purple-400 dark:hover:text-purple-300 px-3 py-2 text-sm font-semibold transition-all duration-300 hover:scale-105 focus:outline-none focus:ring-2 focus:ring-purple-500/50 focus:ring-offset-2 rounded-2xl relative group bg-purple-50/80 dark:bg-purple-900/20 backdrop-blur-sm border border-purple-200/50 dark:border-purple-700/50"
                  aria-label="Share this page"
                >
                  <Share2 className="h-4 w-4" />
                  <span className="hidden xl:inline">Share</span>
                </button>

                {/* Share Dropdown Menu */}
                {showShareMenu && (
                  <div className="absolute top-full right-0 mt-3 w-64 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-2xl shadow-2xl shadow-black/20 overflow-hidden animate-in fade-in-0 slide-in-from-top-2 duration-300 z-50">
                    <div className="p-4">
                      <div className="flex items-center space-x-2 mb-4 bg-purple-50 dark:bg-purple-900/30 px-3 py-2 rounded-xl border border-purple-200 dark:border-purple-700">
                        <Share2 className="h-4 w-4 text-purple-500" />
                        <span className="text-sm font-bold text-purple-800 dark:text-purple-200">Share This Page</span>
                      </div>
                      
                      <div className="space-y-2">
                        {/* Native Share (if supported) */}
                        <button
                          onClick={() => handleShare('native')}
                          className="w-full flex items-center space-x-3 p-3 rounded-xl hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors text-left border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800"
                        >
                          <Share2 className="h-5 w-5 text-blue-500" />
                          <span className="text-sm font-medium text-gray-900 dark:text-white">Share Menu</span>
                        </button>

                        {/* Copy Link */}
                        <button
                          onClick={() => handleShare('copy')}
                          className="w-full flex items-center space-x-3 p-3 rounded-xl hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors text-left border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800"
                        >
                          {copySuccess ? (
                            <Check className="h-5 w-5 text-green-500" />
                          ) : (
                            <Copy className="h-5 w-5 text-gray-500" />
                          )}
                          <span className="text-sm font-medium text-gray-900 dark:text-white">
                            {copySuccess ? 'Link Copied!' : 'Copy Link'}
                          </span>
                        </button>

                        {/* Social Media Options */}
                        <button
                          onClick={() => handleShare('twitter')}
                          className="w-full flex items-center space-x-3 p-3 rounded-xl hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-colors text-left border border-blue-200 dark:border-blue-700 bg-blue-50 dark:bg-blue-900/10"
                        >
                          <div className="h-5 w-5 bg-blue-500 rounded text-white flex items-center justify-center text-xs font-bold">𝕏</div>
                          <span className="text-sm font-medium text-blue-800 dark:text-blue-200">Share on X (Twitter)</span>
                        </button>

                        <button
                          onClick={() => handleShare('facebook')}
                          className="w-full flex items-center space-x-3 p-3 rounded-xl hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-colors text-left border border-blue-200 dark:border-blue-700 bg-blue-50 dark:bg-blue-900/10"
                        >
                          <div className="h-5 w-5 bg-blue-600 rounded text-white flex items-center justify-center text-xs font-bold">f</div>
                          <span className="text-sm font-medium text-blue-800 dark:text-blue-200">Share on Facebook</span>
                        </button>

                        <button
                          onClick={() => handleShare('linkedin')}
                          className="w-full flex items-center space-x-3 p-3 rounded-xl hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-colors text-left border border-blue-200 dark:border-blue-700 bg-blue-50 dark:bg-blue-900/10"
                        >
                          <div className="h-5 w-5 bg-blue-700 rounded text-white flex items-center justify-center text-xs font-bold">in</div>
                          <span className="text-sm font-medium text-blue-800 dark:text-blue-200">Share on LinkedIn</span>
                        </button>

                        <button
                          onClick={() => handleShare('whatsapp')}
                          className="w-full flex items-center space-x-3 p-3 rounded-xl hover:bg-green-50 dark:hover:bg-green-900/20 transition-colors text-left border border-green-200 dark:border-green-700 bg-green-50 dark:bg-green-900/10"
                        >
                          <div className="h-5 w-5 bg-green-500 rounded text-white flex items-center justify-center text-xs font-bold">📱</div>
                          <span className="text-sm font-medium text-green-800 dark:text-green-200">Share on WhatsApp</span>
                        </button>

                        <button
                          onClick={() => handleShare('telegram')}
                          className="w-full flex items-center space-x-3 p-3 rounded-xl hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-colors text-left border border-blue-200 dark:border-blue-700 bg-blue-50 dark:bg-blue-900/10"
                        >
                          <div className="h-5 w-5 bg-blue-500 rounded text-white flex items-center justify-center text-xs font-bold">✈️</div>
                          <span className="text-sm font-medium text-blue-800 dark:text-blue-200">Share on Telegram</span>
                        </button>

                        <button
                          onClick={() => handleShare('reddit')}
                          className="w-full flex items-center space-x-3 p-3 rounded-xl hover:bg-orange-50 dark:hover:bg-orange-900/20 transition-colors text-left border border-orange-200 dark:border-orange-700 bg-orange-50 dark:bg-orange-900/10"
                        >
                          <div className="h-5 w-5 bg-orange-500 rounded text-white flex items-center justify-center text-xs font-bold">r</div>
                          <span className="text-sm font-medium text-orange-800 dark:text-orange-200">Share on Reddit</span>
                        </button>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Trustpilot Button */}
              <a
                href="https://www.trustpilot.com/review/easyencoderdecoder.com"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center space-x-2 text-green-600 hover:text-green-700 dark:text-green-400 dark:hover:text-green-300 px-3 py-2 text-sm font-semibold transition-all duration-300 hover:scale-105 focus:outline-none focus:ring-2 focus:ring-green-500/50 focus:ring-offset-2 rounded-2xl relative group bg-green-50/80 dark:bg-green-900/20 backdrop-blur-sm border border-green-200/50 dark:border-green-700/50"
              >
                <Star className="h-4 w-4" />
                <span className="hidden xl:inline">Rate Us</span>
              </a>

              {/* Donate Button */}
              <a
                href="https://paypal.me/easyencoderdecoder"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center space-x-2 text-pink-600 hover:text-pink-700 dark:text-pink-400 dark:hover:text-pink-300 px-3 py-2 text-sm font-semibold transition-all duration-300 hover:scale-105 focus:outline-none focus:ring-2 focus:ring-pink-500/50 focus:ring-offset-2 rounded-2xl relative group bg-pink-50/80 dark:bg-pink-900/20 backdrop-blur-sm border border-pink-200/50 dark:border-pink-700/50"
              >
                <Heart className="h-4 w-4" />
                <span className="hidden xl:inline">Donate</span>
              </a>
              
              <ThemeToggle />
            </div>

            {/* Mobile: Simplified - Only Theme Toggle and Menu Button */}
            <div className="flex items-center space-x-3 lg:hidden">
              <ThemeToggle />
              
              <button
                onClick={toggleMobileMenu}
                className="text-black/80 dark:text-white/80 hover:text-black dark:hover:text-white transition-all duration-300 p-3 rounded-2xl hover:bg-white/10 backdrop-blur-sm focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:ring-offset-2 border border-white/10"
                aria-label={isMenuOpen ? "Close menu" : "Open menu"}
                aria-expanded={isMenuOpen}
                aria-controls="mobile-menu"
              >
                <div className="relative">
                  {isMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
                </div>
              </button>
            </div>
          </div>
        </nav>
      </header>

      {/* Mobile Menu Overlay - With ALL Tools */}
      {isMenuOpen && (
        <div className="fixed inset-0 z-50 lg:hidden" id="mobile-menu">
          <div 
            className="fixed inset-0 bg-black/50 backdrop-blur-xl animate-in fade-in-0 duration-300"
            onClick={closeMobileMenu}
            aria-hidden="true"
          />
          
          <div className="fixed top-0 right-0 h-full w-full max-w-sm bg-white/95 dark:bg-gray-900/95 backdrop-blur-3xl shadow-2xl animate-in slide-in-from-right-0 duration-300 overflow-y-auto border-l border-gray-200 dark:border-gray-700">
            <div className="flex flex-col h-full">
              <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700 sticky top-0 bg-white/95 dark:bg-gray-900/95 backdrop-blur-sm z-10">
                <h2 className="text-lg font-bold text-gray-900 dark:text-white">All Tools</h2>
                <button
                  onClick={closeMobileMenu}
                  className="p-2 rounded-2xl hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors border border-gray-200 dark:border-gray-700"
                  aria-label="Close menu"
                >
                  <X className="h-5 w-5 text-gray-700 dark:text-gray-300" />
                </button>
              </div>

              <div className="flex-1 p-4 space-y-6">
                {/* Quick Links */}
                <div className="space-y-3">
                  <Link
                    href="/"
                    className="flex items-center text-gray-800 dark:text-gray-200 hover:text-gray-900 dark:hover:text-white text-base font-semibold transition-colors p-4 rounded-2xl hover:bg-gray-100 dark:hover:bg-gray-800 border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800"
                    onClick={closeMobileMenu}
                  >
                    Home
                  </Link>

                  <Link
                    href="/tools"
                    className="flex items-center space-x-2 text-gray-800 dark:text-gray-200 hover:text-gray-900 dark:hover:text-white text-base font-semibold transition-colors p-4 rounded-2xl hover:bg-gray-100 dark:hover:bg-gray-800 border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 shadow-sm"
                    onClick={closeMobileMenu}
                  >
                    <Grid3X3 className="h-5 w-5" />
                    <span>All Tools Page</span>
                  </Link>

                  {/* Action Buttons */}
                  <a
                    href="https://www.trustpilot.com/review/easyencoderdecoder.com"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center space-x-2 text-green-600 dark:text-green-400 hover:text-green-700 dark:hover:text-green-300 text-base font-semibold transition-colors p-4 rounded-2xl hover:bg-green-50 dark:hover:bg-green-900/20 border border-green-200 dark:border-green-700 bg-green-50 dark:bg-green-900/10"
                    onClick={closeMobileMenu}
                  >
                    <Star className="h-5 w-5" />
                    <span>Rate Us on Trustpilot</span>
                  </a>

                  <a
                    href="https://paypal.me/easyencoderdecoder"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center space-x-2 text-pink-600 dark:text-pink-400 hover:text-pink-700 dark:hover:text-pink-300 text-base font-semibold transition-colors p-4 rounded-2xl hover:bg-pink-50 dark:hover:bg-pink-900/20 border border-pink-200 dark:border-pink-700 bg-pink-50 dark:bg-pink-900/10"
                    onClick={closeMobileMenu}
                  >
                    <Heart className="h-5 w-5" />
                    <span>Support Us</span>
                  </a>

                  {/* Mobile Share Button */}
                  <button
                    onClick={() => handleShare('native')}
                    className="flex items-center space-x-2 text-purple-600 dark:text-purple-400 hover:text-purple-700 dark:hover:text-purple-300 text-base font-semibold transition-colors p-4 rounded-2xl hover:bg-purple-50 dark:hover:bg-purple-900/20 border border-purple-200 dark:border-purple-700 bg-purple-50 dark:bg-purple-900/10 w-full text-left"
                  >
                    <Share2 className="h-5 w-5" />
                    <span>Share This Page</span>
                  </button>
                </div>

                {/* All Tool Categories with ALL tools */}
                <div className="space-y-4">
                  <h3 className="text-sm font-bold text-gray-600 dark:text-gray-400 uppercase tracking-wider">
                    All Tools by Category
                  </h3>
                  
                  {TOOL_CATEGORIES.map((category) => {
                    const IconComponent = category.icon;
                    return (
                      <div key={category.name} className="bg-gray-50 dark:bg-gray-800 rounded-2xl p-4 border border-gray-200 dark:border-gray-700">
                        <div className="flex items-center space-x-3 mb-4">
                          <div className="p-2 rounded-xl bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600">
                            <IconComponent className={`h-5 w-5 ${category.color}`} />
                          </div>
                          <span className="font-bold text-gray-900 dark:text-white text-base">{category.name}</span>
                        </div>
                        
                        <div className="space-y-2">
                          {category.tools.map((tool) => (
                            <Link
                              key={tool.name}
                              href={tool.href}
                              className="block py-3 px-4 text-sm text-gray-700 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white hover:bg-white dark:hover:bg-gray-700 rounded-xl transition-all duration-200 font-medium border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-800 shadow-sm group"
                              onClick={closeMobileMenu}
                            >
                              <div className="flex items-center justify-between">
                                <span>{tool.name}</span>
                                <ArrowRight className="h-4 w-4 text-gray-400 opacity-0 group-hover:opacity-100 transition-all" />
                              </div>
                            </Link>
                          ))}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
              
              <div className="p-4 border-t border-gray-200 dark:border-gray-700 bg-white/95 dark:bg-gray-900/95 backdrop-blur-sm">
                <Link
                  href="/tools"
                  className="flex items-center justify-center w-full py-4 text-sm font-semibold text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 transition-colors rounded-2xl hover:bg-blue-50 dark:hover:bg-blue-900/20 border border-blue-200 dark:border-blue-700 bg-blue-50 dark:bg-blue-900/10"
                  onClick={closeMobileMenu}
                >
                  View Tools Page
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
