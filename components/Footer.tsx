import Link from 'next/link';
import { Shield, Lock, Key, Hash, Code2, Zap, ArrowRight } from 'lucide-react';

export default function Footer() {
  const toolsByCategory = {
    'Encryption': {
      icon: Lock,
      tools: [
        { name: 'AES Encrypt Decrypt', href: '/aes-encrypt-decrypt-online' },
        { name: 'Blowfish Encrypt Decrypt', href: '/blowfish-encrypt-decrypt-online' },
        { name: 'Caesar Cipher', href: '/caesar-cipher-encoder-decoder-online' },
        { name: 'ChaCha20 Encrypt Decrypt', href: '/chacha20-encrypt-decrypt-online' },
        { name: 'Playfair Cipher', href: '/playfair-cipher-encrypt-decrypt-online' },
        { name: 'Rail Fence Cipher', href: '/rail-fence-cipher-online' },
        { name: 'ROT Cipher', href: '/rot-cipher-encoder-decoder-online' },
        { name: 'Vigenère Cipher', href: '/vigenere-cipher-encrypt-decrypt-online' },
        { name: 'XOR Encrypt Decrypt', href: '/xor-encrypt-decrypt-online' }
      ]
    },
    'Encoding': {
      icon: Code2,
      tools: [
        { name: 'Base58 Encoder Decoder', href: '/base58-encoder-decoder-online' },
        { name: 'Base64 Encoder Decoder', href: '/base64-encoder-decoder-online' },
        { name: 'Binary Encoder Decoder', href: '/binary-encoder-decoder-online' },
        { name: 'Hex Encoder Decoder', href: '/hex-encoder-decoder-online' },
        { name: 'HTML Encoder Decoder', href: '/html-encoder-decoder-online' },
        { name: 'Morse Code Translator', href: '/morse-code-translator-online' },
        { name: 'Unicode Encoder Decoder', href: '/unicode-encoder-decoder-online' },
        { name: 'URL Encoder Decoder', href: '/url-encoder-decoder-online' }
      ]
    },
    'Hashing': {
      icon: Hash,
      tools: [
        { name: 'CRC32 Calculator', href: '/crc32-calculator-online' },
        { name: 'HMAC Generator', href: '/hmac-generator-online' },
        { name: 'MD5 Generator', href: '/md5-generator-online' },
        { name: 'PBKDF2 Generator', href: '/pbkdf2-generator-online' },
        { name: 'SHA-1 Hash Generator', href: '/sha1-hash-generator-online' },
        { name: 'SHA-256 Hash Generator', href: '/sha256-hash-generator-online' },
        { name: 'SHA-512 Hash Generator', href: '/sha512-hash-generator-online' }
      ]
    },
    'Key Generation': {
      icon: Key,
      tools: [
        { name: 'RSA Key Generator', href: '/rsa-encrypt-decrypt-online' },
        { name: 'SSH Key Generator', href: '/ssh-key-generator-online' }
      ]
    },
    'Generators': {
      icon: Zap,
      tools: [
        { name: 'Password Generator', href: '/password-generator-online' },
        { name: 'UUID GUID Generator', href: '/uuid-guid-generator-online' }
      ]
    },
    'Token Tools': {
      icon: Shield,
      tools: [
        { name: 'JWT Encoder Decoder', href: '/jwt-encoder-decoder-online' }
      ]
    },
    'Converters': {
      icon: ArrowRight,
      tools: [
        { name: 'Epoch Timestamp Converter', href: '/epoch-timestamp-converter-online' }
      ]
    }
  };

  const companyLinks = [
    { name: 'About', href: '/about' },
    { name: 'Privacy Policy', href: '/privacy' },
    { name: 'Terms of Service', href: '/terms' },
    { name: 'Contact', href: '/contact' },
  ];

  return (
    <footer className="relative border-t bg-gradient-to-br from-slate-50 via-blue-50/50 to-indigo-50/30 dark:from-slate-900 dark:via-slate-800/50 dark:to-indigo-950/30">
      {/* Background Pattern */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,rgba(59,130,246,0.03),transparent_50%)] dark:bg-[radial-gradient(circle_at_50%_50%,rgba(99,102,241,0.05),transparent_50%)]"></div>
      
      <div className="relative container mx-auto px-4 sm:px-6 lg:px-8">
        {/* Main Footer Content */}
        <div className="py-16">
          <div className="grid grid-cols-1 xl:grid-cols-5 gap-12">
            {/* Brand Section */}
            <div className="xl:col-span-2">
              <Link href="/" className="inline-flex items-center space-x-3 mb-6 group">
                <div className="p-2 rounded-xl bg-gradient-to-br from-violet-600 to-indigo-900 shadow-lg group-hover:shadow-xl transition-all duration-300">
                  <Shield className="h-8 w-8 text-white" />
                </div>
                <div>
                  <span className="text-2xl font-bold bg-gradient-to-r from-gray-900 to-gray-700 dark:from-white dark:to-gray-200 bg-clip-text text-transparent">
                    EasyEncoderDecoder
                  </span>
                  <div className="text-xs text-muted-foreground font-medium tracking-wider uppercase">
                    Secure & Simple
                  </div>
                </div>
              </Link>
              
              <p className="text-muted-foreground text-lg leading-relaxed mb-8 max-w-md">
                Professional online cryptographic toolkit providing secure, fast, and reliable tools for encoding, decoding, and encryption needs.
              </p>

              {/* Key Features */}
              <div className="grid grid-cols-2 gap-4 mb-8">
                <div className="flex items-center space-x-2">
                  <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                  <span className="text-sm text-muted-foreground">Client-side Processing</span>
                </div>
                <div className="flex items-center space-x-2">
                  <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                  <span className="text-sm text-muted-foreground">Zero Data Storage</span>
                </div>
                <div className="flex items-center space-x-2">
                  <div className="w-2 h-2 bg-purple-500 rounded-full"></div>
                  <span className="text-sm text-muted-foreground">Open Source</span>
                </div>
                <div className="flex items-center space-x-2">
                  <div className="w-2 h-2 bg-orange-500 rounded-full"></div>
                  <span className="text-sm text-muted-foreground">Always Free</span>
                </div>
              </div>

              {/* Company Links */}
              <div className="space-y-3">
                {companyLinks.map((link) => (
                  <Link
                    key={link.name}
                    href={link.href}
                    className="block text-muted-foreground hover:text-foreground transition-colors text-sm font-medium hover:translate-x-1 transform transition-transform duration-200"
                  >
                    {link.name}
                  </Link>
                ))}
              </div>
            </div>

            {/* Tools Grid */}
            <div className="xl:col-span-3">
              <div className="flex items-center space-x-2 mb-8">
                <h3 className="text-2xl font-bold text-foreground">Our Tools</h3>
                <div className="h-0.5 flex-1 bg-gradient-to-r from-blue-500/20 to-transparent"></div>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-2 2xl:grid-cols-3 gap-8">
                {Object.entries(toolsByCategory).map(([category, { icon: Icon, tools }]) => (
                  <div key={category} className="group">
                    <div className="flex items-center space-x-2 mb-4">
                      <div className="p-1.5 rounded-lg bg-gradient-to-br from-slate-100 to-slate-200 dark:from-slate-800 dark:to-slate-700 group-hover:from-blue-100 group-hover:to-indigo-100 dark:group-hover:from-blue-900/20 dark:group-hover:to-indigo-900/20 transition-all duration-300">
                        <Icon className="h-4 w-4 text-muted-foreground group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors" />
                      </div>
                      <h4 className="font-semibold text-foreground text-sm uppercase tracking-wider">
                        {category}
                      </h4>
                    </div>
                    
                    <ul className="space-y-2">
                      {tools.map((tool) => (
                        <li key={tool.name}>
                          <Link
                            href={tool.href}
                            className="text-sm text-muted-foreground hover:text-foreground transition-all duration-200 block py-1 hover:translate-x-1 transform relative group/link"
                          >
                            <span className="relative">
                              {tool.name}
                              <span className="absolute -bottom-0.5 left-0 w-0 h-0.5 bg-gradient-to-r from-blue-500 to-indigo-500 group-hover/link:w-full transition-all duration-300"></span>
                            </span>
                          </Link>
                        </li>
                      ))}
                    </ul>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="border-t border-slate-200/60 dark:border-slate-700/60 py-8">
          <div className="flex flex-col md:flex-row justify-between items-center space-y-4 md:space-y-0">
            <div className="flex flex-col md:flex-row items-center space-y-2 md:space-y-0 md:space-x-6">
              <p className="text-sm text-muted-foreground">
                © 2025 EasyEncoderDecoder. All rights reserved.
              </p>
              <div className="hidden md:block w-1 h-1 bg-muted-foreground/30 rounded-full"></div>
              <p className="text-sm text-muted-foreground text-center md:text-left">
                Built with security and performance in mind
              </p>
            </div>
            
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2">
                <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
                <span className="text-xs text-muted-foreground font-medium">All systems operational</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}
