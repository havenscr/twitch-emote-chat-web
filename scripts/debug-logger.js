/* ================================================================
   DEBUG LOGGER MODULE
   Collects debug information for mobile troubleshooting
   Stores logs in localStorage with size limits and rotation
   ================================================================ */

const DebugLogger = (function() {
  const VERSION = '1.0.0';
  const STORAGE_KEY = 'twitch-debug-logs';
  const ENABLED_KEY = 'twitch-debug-enabled';
  const MAX_ENTRIES = 500;
  const MAX_STORAGE_SIZE = 512 * 1024; // 512KB limit

  let isEnabled = false;
  let sessionId = null;
  let logs = [];

  /**
   * Initialize the logger
   */
  function init() {
    isEnabled = localStorage.getItem(ENABLED_KEY) === 'true';
    sessionId = generateSessionId();

    if (isEnabled) {
      loadLogs();
      logSystemInfo();
    }
  }

  /**
   * Generate a unique session ID
   */
  function generateSessionId() {
    return Date.now().toString(36) + Math.random().toString(36).substr(2, 5);
  }

  /**
   * Get current timestamp in ISO format
   */
  function getTimestamp() {
    return new Date().toISOString();
  }

  /**
   * Load existing logs from localStorage
   */
  function loadLogs() {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        logs = JSON.parse(stored);
        if (!Array.isArray(logs)) {
          logs = [];
        }
      }
    } catch (e) {
      logs = [];
    }
  }

  /**
   * Save logs to localStorage with size management
   */
  function saveLogs() {
    if (!isEnabled) return;

    try {
      // Trim to max entries
      while (logs.length > MAX_ENTRIES) {
        logs.shift();
      }

      let logString = JSON.stringify(logs);

      // Trim oldest entries if over size limit
      while (logString.length > MAX_STORAGE_SIZE && logs.length > 10) {
        logs.shift();
        logString = JSON.stringify(logs);
      }

      localStorage.setItem(STORAGE_KEY, logString);
    } catch (e) {
      // Storage quota exceeded - clear half the logs
      logs = logs.slice(Math.floor(logs.length / 2));
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(logs));
      } catch (e2) {
        // Give up on storage
      }
    }
  }

  /**
   * Add a log entry
   */
  function addEntry(level, module, message, data = null) {
    if (!isEnabled) return;

    const entry = {
      t: getTimestamp(),
      s: sessionId,
      l: level,
      m: module,
      msg: message
    };

    if (data !== null && data !== undefined) {
      try {
        // Sanitize sensitive data
        const sanitized = sanitizeData(data);
        entry.d = sanitized;
      } catch (e) {
        entry.d = '[Serialization Error]';
      }
    }

    logs.push(entry);
    saveLogs();

    // Also output to console in debug mode
    const consoleMsg = `[${module}] ${message}`;
    switch (level) {
      case 'error':
        console.error(consoleMsg, data || '');
        break;
      case 'warn':
        console.warn(consoleMsg, data || '');
        break;
      case 'info':
        console.info(consoleMsg, data || '');
        break;
      default:
        console.log(consoleMsg, data || '');
    }
  }

  /**
   * Sanitize data to remove sensitive information
   */
  function sanitizeData(data) {
    if (typeof data === 'string') {
      // Redact OAuth tokens
      return data.replace(/oauth:[a-z0-9]+/gi, 'oauth:[REDACTED]')
                 .replace(/Bearer [a-zA-Z0-9._-]+/gi, 'Bearer [REDACTED]');
    }

    if (typeof data !== 'object' || data === null) {
      return data;
    }

    if (Array.isArray(data)) {
      return data.map(item => sanitizeData(item));
    }

    const sanitized = {};
    const sensitiveKeys = ['token', 'access_token', 'authorization', 'password', 'secret'];

    for (const key in data) {
      if (Object.prototype.hasOwnProperty.call(data, key)) {
        const lowerKey = key.toLowerCase();
        if (sensitiveKeys.some(sk => lowerKey.includes(sk))) {
          sanitized[key] = '[REDACTED]';
        } else {
          sanitized[key] = sanitizeData(data[key]);
        }
      }
    }

    return sanitized;
  }

  /**
   * Log system/device information at session start
   */
  function logSystemInfo() {
    const info = {
      userAgent: navigator.userAgent,
      platform: navigator.platform,
      language: navigator.language,
      screenWidth: window.screen.width,
      screenHeight: window.screen.height,
      devicePixelRatio: window.devicePixelRatio,
      viewportWidth: window.innerWidth,
      viewportHeight: window.innerHeight,
      online: navigator.onLine,
      cookiesEnabled: navigator.cookieEnabled,
      localStorage: !!window.localStorage,
      sessionStorage: !!window.sessionStorage,
      touchSupport: 'ontouchstart' in window,
      standalone: window.navigator.standalone || window.matchMedia('(display-mode: standalone)').matches,
      timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
      timezoneOffset: new Date().getTimezoneOffset()
    };

    addEntry('info', 'System', 'Session started', info);
  }

  /**
   * Public logging methods
   */
  function log(module, message, data) {
    addEntry('log', module, message, data);
  }

  function info(module, message, data) {
    addEntry('info', module, message, data);
  }

  function warn(module, message, data) {
    addEntry('warn', module, message, data);
  }

  function error(module, message, data) {
    addEntry('error', module, message, data);
  }

  /**
   * Log API calls with timing
   */
  function logApiCall(module, endpoint, method = 'GET') {
    const startTime = performance.now();
    const callId = Math.random().toString(36).substr(2, 8);

    addEntry('info', module, `API Call Start: ${method} ${endpoint}`, { callId });

    return {
      success: (data) => {
        const duration = Math.round(performance.now() - startTime);
        addEntry('info', module, `API Call Success: ${method} ${endpoint}`, {
          callId,
          duration: `${duration}ms`,
          dataKeys: data ? Object.keys(data) : null
        });
      },
      error: (err) => {
        const duration = Math.round(performance.now() - startTime);
        addEntry('error', module, `API Call Failed: ${method} ${endpoint}`, {
          callId,
          duration: `${duration}ms`,
          error: err?.message || String(err)
        });
      }
    };
  }

  /**
   * Log WebSocket events
   */
  function logWebSocket(module, event, data) {
    addEntry('info', module, `WebSocket: ${event}`, data);
  }

  /**
   * Log user interactions
   */
  function logInteraction(module, action, details) {
    addEntry('info', module, `User: ${action}`, details);
  }

  /**
   * Enable debug logging
   */
  function enable() {
    isEnabled = true;
    localStorage.setItem(ENABLED_KEY, 'true');
    sessionId = generateSessionId();
    loadLogs();
    logSystemInfo();
    addEntry('info', 'DebugLogger', 'Debug logging enabled');
  }

  /**
   * Disable debug logging
   */
  function disable() {
    addEntry('info', 'DebugLogger', 'Debug logging disabled');
    isEnabled = false;
    localStorage.setItem(ENABLED_KEY, 'false');
  }

  /**
   * Check if logging is enabled
   */
  function getEnabled() {
    return isEnabled;
  }

  /**
   * Clear all logs
   */
  function clear() {
    logs = [];
    localStorage.removeItem(STORAGE_KEY);
    if (isEnabled) {
      logSystemInfo();
    }
  }

  /**
   * Get formatted log output for copying
   */
  function getFormattedLogs() {
    const appVersion = window.App?.getVersion?.() || 'unknown';
    const header = [
      '='.repeat(60),
      'B.I.T.C.H. DEBUG LOG',
      '='.repeat(60),
      `Generated: ${getTimestamp()}`,
      `App Version: ${appVersion}`,
      `Logger Version: ${VERSION}`,
      `Total Entries: ${logs.length}`,
      `Current Session: ${sessionId}`,
      '='.repeat(60),
      ''
    ].join('\n');

    const formattedEntries = logs.map(entry => {
      const level = (entry.l || 'log').toUpperCase().padEnd(5);
      const module = (entry.m || 'Unknown').padEnd(12);
      let line = `[${entry.t}] ${level} [${module}] ${entry.msg}`;

      if (entry.d) {
        try {
          const dataStr = JSON.stringify(entry.d, null, 2);
          if (dataStr !== '{}' && dataStr !== 'null') {
            line += '\n    Data: ' + dataStr.split('\n').join('\n    ');
          }
        } catch (e) {
          line += '\n    Data: [Cannot serialize]';
        }
      }

      return line;
    }).join('\n\n');

    return header + formattedEntries;
  }

  /**
   * Copy logs to clipboard
   */
  async function copyToClipboard() {
    const logText = getFormattedLogs();

    try {
      await navigator.clipboard.writeText(logText);
      return { success: true, message: 'Logs copied to clipboard' };
    } catch (e) {
      // Fallback for older browsers or permission denied
      try {
        const textarea = document.createElement('textarea');
        textarea.value = logText;
        textarea.style.position = 'fixed';
        textarea.style.left = '-9999px';
        document.body.appendChild(textarea);
        textarea.select();
        document.execCommand('copy');
        document.body.removeChild(textarea);
        return { success: true, message: 'Logs copied to clipboard' };
      } catch (e2) {
        return { success: false, message: 'Failed to copy logs' };
      }
    }
  }

  /**
   * Get log count
   */
  function getLogCount() {
    return logs.length;
  }

  /**
   * Get estimated storage size
   */
  function getStorageSize() {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      return stored ? stored.length : 0;
    } catch (e) {
      return 0;
    }
  }

  // Initialize on load
  init();

  // Public API
  return {
    VERSION,
    log,
    info,
    warn,
    error,
    logApiCall,
    logWebSocket,
    logInteraction,
    enable,
    disable,
    isEnabled: getEnabled,
    clear,
    getFormattedLogs,
    copyToClipboard,
    getLogCount,
    getStorageSize
  };
})();

// Export for global access
window.DebugLogger = DebugLogger;
