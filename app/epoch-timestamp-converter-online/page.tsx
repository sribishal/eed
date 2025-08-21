'use client';

import { useState, useEffect } from 'react';
import { Copy, CheckCircle, ArrowRight, Clock } from 'lucide-react';
import { toast } from 'sonner';

export default function EpochTimeConverter() {
  const [epochInput, setEpochInput] = useState<string>('');
  const [humanDate, setHumanDate] = useState<string>('');
  const [humanDateUTC, setHumanDateUTC] = useState<string>('');

  const [dateInput, setDateInput] = useState<string>('');
  const [timeInput, setTimeInput] = useState<string>('');
  const [convertedEpoch, setConvertedEpoch] = useState<string>('');

  const [copiedTimestamp, setCopiedTimestamp] = useState(false);
  const [copiedDate, setCopiedDate] = useState(false);

  // --- Conversion Logic ---

  // Convert Epoch to Human-Readable Date
  const convertFromEpoch = (epoch: string) => {
    if (!epoch.trim() || !/^\d+$/.test(epoch)) {
      setHumanDate('');
      setHumanDateUTC('');
      return;
    }
    
    // Determine if it's seconds, milliseconds, or microseconds
    let timestamp = Number(epoch);
    if (epoch.length > 10 && epoch.length <= 13) { // Milliseconds
        timestamp = Math.floor(timestamp);
    } else if (epoch.length > 13) { // Microseconds, convert to ms
        timestamp = Math.floor(timestamp / 1000);
    } else { // Seconds, convert to ms
        timestamp = timestamp * 1000;
    }

    if (isNaN(timestamp) || timestamp < 0) {
        toast.error("Invalid timestamp entered.");
        return;
    }
    
    try {
        const date = new Date(timestamp);
        setHumanDate(date.toLocaleString());
        setHumanDateUTC(date.toUTCString());
    } catch(e) {
        toast.error("Could not parse the timestamp.");
    }
  };

  // Convert Human-Readable Date to Epoch
  const convertToEpoch = () => {
    if (!dateInput || !timeInput) {
      setConvertedEpoch('');
      return;
    }
    try {
      const dateTimeString = `${dateInput}T${timeInput}`;
      const date = new Date(dateTimeString);
      if (isNaN(date.getTime())) {
        toast.error('Invalid date or time format.');
        setConvertedEpoch('');
      } else {
        const epochSeconds = Math.floor(date.getTime() / 1000);
        setConvertedEpoch(epochSeconds.toString());
      }
    } catch (error) {
      toast.error('Could not convert date/time.');
      setConvertedEpoch('');
    }
  };

  // --- Handlers ---

  useEffect(() => {
    convertToEpoch();
  }, [dateInput, timeInput]);

  const handleEpochInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setEpochInput(value);
    convertFromEpoch(value);
  };

  const handleSetCurrentTime = () => {
    const now = new Date();
    // Pad single digit month/day with a leading zero
    const month = (now.getMonth() + 1).toString().padStart(2, '0');
    const day = now.getDate().toString().padStart(2, '0');
    const hours = now.getHours().toString().padStart(2, '0');
    const minutes = now.getMinutes().toString().padStart(2, '0');

    setDateInput(`${now.getFullYear()}-${month}-${day}`);
    setTimeInput(`${hours}:${minutes}`);
    toast.success("Current time has been set.");
  };

  const copyToClipboard = async (text: string, type: 'timestamp' | 'date') => {
    if (!text) return;
    try {
      await navigator.clipboard.writeText(text);
      toast.success('Copied to clipboard!');
      if (type === 'timestamp') {
        setCopiedTimestamp(true);
        setTimeout(() => setCopiedTimestamp(false), 2000);
      } else {
        setCopiedDate(true);
        setTimeout(() => setCopiedDate(false), 2000);
      }
    } catch (error) {
      console.error('Failed to copy to clipboard:', error);
      toast.error('Failed to copy to clipboard');
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50/50 to-purple-100/50 dark:from-indigo-950/20 dark:to-purple-950/20 py-8 sm:py-12 px-4 sm:px-6 lg:px-8">
      <div className="container mx-auto max-w-6xl">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold mb-4">
            Epoch & Unix Time Converter Online
          </h1>
          <p className="text-base sm:text-lg text-muted-foreground max-w-3xl mx-auto">
            Convert between Unix timestamps and human-readable dates. Handle seconds, milliseconds, and more with ease.
          </p>
        </div>

        {/* Tool Interface */}
        <div className="bg-card rounded-xl shadow-lg border p-6 sm:p-8">
          <div className="grid grid-cols-1 xl:grid-cols-2 gap-8 lg:gap-12">
            
            {/* Epoch to Human-Readable */}
            <div className="space-y-6">
              <h2 className="text-xl sm:text-2xl font-semibold text-center">Timestamp to Date</h2>
              <div>
                <label className="text-base font-semibold mb-2 block">Enter Epoch Timestamp</label>
                <input
                  type="text"
                  value={epochInput}
                  onChange={handleEpochInputChange}
                  placeholder="e.g., 1672531200"
                  className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent bg-background"
                />
              </div>
              <div>
                <label className="text-base font-semibold mb-2 block">Human-Readable (Your Local Time)</label>
                <div className="bg-muted/50 rounded-lg p-3 min-h-[50px] flex items-center">
                  <p className="text-sm font-mono">{humanDate || 'Result will appear here...'}</p>
                </div>
              </div>
              <div>
                <div className="flex items-center justify-between mb-2">
                    <label className="text-base font-semibold">Human-Readable (UTC)</label>
                    <button
                      onClick={() => copyToClipboard(humanDateUTC, 'date')}
                      disabled={!humanDateUTC}
                      className="bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400 px-3 py-1.5 rounded-lg text-sm hover:bg-green-200 dark:hover:bg-green-900/50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {copiedDate ? <CheckCircle className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                    </button>
                </div>
                <div className="bg-muted/50 rounded-lg p-3 min-h-[50px] flex items-center">
                  <p className="text-sm font-mono">{humanDateUTC || 'Result will appear here...'}</p>
                </div>
              </div>
            </div>

            {/* Human-Readable to Epoch */}
            <div className="space-y-6">
              <h2 className="text-xl sm:text-2xl font-semibold text-center">Date to Timestamp</h2>
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="text-base font-semibold">Enter Date and Time</label>
                  <button
                    onClick={handleSetCurrentTime}
                    className="flex items-center text-sm text-primary hover:underline"
                  >
                    <Clock className="h-4 w-4 mr-1"/>
                    Current Time
                  </button>
                </div>
                <div className="flex items-center gap-2">
                  <input
                    type="date"
                    value={dateInput}
                    onChange={(e) => setDateInput(e.target.value)}
                    className="w-full p-3 border rounded-lg bg-background"
                  />
                  <input
                    type="time"
                    value={timeInput}
                    onChange={(e) => setTimeInput(e.target.value)}
                    className="w-full p-3 border rounded-lg bg-background"
                  />
                </div>
              </div>
              <div>
                 <div className="flex items-center justify-between mb-2">
                    <label className="text-base font-semibold">Resulting Epoch Timestamp</label>
                    <button
                      onClick={() => copyToClipboard(convertedEpoch, 'timestamp')}
                      disabled={!convertedEpoch}
                      className="bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400 px-3 py-1.5 rounded-lg text-sm hover:bg-green-200 dark:hover:bg-green-900/50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {copiedTimestamp ? <CheckCircle className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                    </button>
                </div>
                <div className="bg-muted/50 rounded-lg p-3 min-h-[50px] flex items-center justify-center">
                  <p className="text-lg font-mono font-bold tracking-wider">{convertedEpoch || '0'}</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Information Section */}
        <div className="mt-8 sm:mt-12 bg-card rounded-xl shadow-lg border p-6 sm:p-8">
          <h2 className="text-xl sm:text-2xl font-bold mb-6">
            Understanding Epoch Time
          </h2>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 lg:gap-8">
            <div>
              <h3 className="text-base sm:text-lg font-semibold mb-3">What is Epoch Time?</h3>
              <p className="text-muted-foreground mb-4 text-sm sm:text-base">
                Epoch time, also known as Unix time or POSIX time, is the number of seconds that have elapsed since 
                00:00:00 Coordinated Universal Time (UTC), Thursday, 1 January 1970.
              </p>
              <h3 className="text-base sm:text-lg font-semibold mb-3">Why is it Used?</h3>
              <p className="text-muted-foreground mb-4 text-sm sm:text-base">
                It's a simple, standardized way for computer systems to handle time. Since it's just a number, it's easy to store, compare, and calculate time differences without worrying about time zones, daylight saving, or different calendar systems.
              </p>
            </div>
            <div>
              <h3 className="text-base sm:text-lg font-semibold mb-3">Seconds vs. Milliseconds</h3>
              <p className="text-muted-foreground mb-4 text-sm sm:text-base">
                While the strict definition of Unix time is in seconds, many systems (like JavaScript's `Date.now()`) use milliseconds to provide greater precision. This tool automatically detects whether your input is in seconds, milliseconds, or even microseconds.
              </p>
              <h3 className="text-base sm:text-lg font-semibold mb-3">Features</h3>
              <ul className="text-muted-foreground space-y-1 text-sm sm:text-base">
                <li>• Real-time two-way conversion</li>
                <li>• Auto-detects seconds, ms, and µs</li>
                <li>• "Set to now" functionality</li>
                <li>• Displays results in local time and UTC</li>
                <li>• Client-side for privacy and speed</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
