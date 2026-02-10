/* ================================================================
   TWITCH IRC MODULE
   WebSocket IRC client for Twitch chat
   Extracted from Widget Wall Desktop
   ================================================================ */

const TwitchIRC = (function() {
  const IRC_URL = 'wss://irc-ws.chat.twitch.tv:443';
  const RECENT_MESSAGES_API = 'https://recent-messages.robotty.de/api/v2/recent-messages';
  const RECONNECT_DELAY = 3000;
  const MAX_MESSAGES = 150;
  const MAX_RECENT_MESSAGES = 50;

  // Fallback badge URLs
  const FALLBACK_BADGE_URLS = {
    broadcaster: 'https://static-cdn.jtvnw.net/badges/v1/5527c58c-fb7d-422d-b71b-f309dcb85cc1/3',
    moderator: 'https://static-cdn.jtvnw.net/badges/v1/3267646d-33f0-4b17-b3df-f923a41db1d0/3',
    vip: 'https://static-cdn.jtvnw.net/badges/v1/b817aba4-fad8-49e2-b88a-7cc744f5d4bc/3',
    partner: 'https://static-cdn.jtvnw.net/badges/v1/d12a2e27-16f6-41d0-ab77-b780518f00a3/3',
    turbo: 'https://static-cdn.jtvnw.net/badges/v1/bd444ec6-8f34-4bf9-91f4-af1e3428d80f/3',
    prime: 'https://static-cdn.jtvnw.net/badges/v1/bbbe0db0-a598-423e-86d0-f9fb98ca1933/3',
  };

  // Badge cache
  let globalBadges = {};
  let channelBadges = {};

  // Connection state
  let ws = null;
  let channel = null;
  let username = null;
  let oauthToken = null;
  let isConnected = false;
  let reconnectTimeout = null;
  let connectionId = 0;

  // Callbacks
  let onMessageCallback = null;
  let onSystemCallback = null;
  let onConnectedCallback = null;
  let onDisconnectedCallback = null;

  /**
   * Fetch global Twitch badges
   */
  async function fetchGlobalBadges() {
    if (Object.keys(globalBadges).length > 0) return;

    try {
      const res = await fetch('https://badges.twitch.tv/v1/badges/global/display');
      if (res.ok) {
        const data = await res.json();
        for (const [badgeName, badgeData] of Object.entries(data.badge_sets || {})) {
          globalBadges[badgeName] = {};
          for (const [version, versionData] of Object.entries(badgeData.versions || {})) {
            globalBadges[badgeName][version] = versionData.image_url_2x || versionData.image_url_1x;
          }
        }
      }
    } catch (e) {
      console.warn('TwitchIRC: Failed to fetch global badges:', e);
    }
  }

  /**
   * Fetch channel-specific badges
   */
  async function fetchChannelBadges(channelName) {
    channelBadges = {};

    // Get channel ID from 7TV or FFZ
    let channelId = null;

    try {
      const res = await fetch(`https://7tv.io/v3/users/twitch/${channelName}`);
      if (res.ok) {
        const data = await res.json();
        channelId = data.id;
      }
    } catch (e) {}

    if (!channelId) {
      try {
        const res = await fetch(`https://api.frankerfacez.com/v1/room/${channelName}`);
        if (res.ok) {
          const data = await res.json();
          channelId = data.room?.twitch_id;
        }
      } catch (e) {}
    }

    if (!channelId) return;

    try {
      const res = await fetch(`https://badges.twitch.tv/v1/badges/channels/${channelId}/display`);
      if (res.ok) {
        const data = await res.json();
        for (const [badgeName, badgeData] of Object.entries(data.badge_sets || {})) {
          channelBadges[badgeName] = {};
          for (const [version, versionData] of Object.entries(badgeData.versions || {})) {
            channelBadges[badgeName][version] = versionData.image_url_2x || versionData.image_url_1x;
          }
        }
      }
    } catch (e) {
      console.warn('TwitchIRC: Failed to fetch channel badges:', e);
    }
  }

  /**
   * Get badge URL
   */
  function getBadgeUrl(badgeName, version) {
    if (channelBadges[badgeName]?.[version]) {
      return channelBadges[badgeName][version];
    }
    if (globalBadges[badgeName]?.[version]) {
      return globalBadges[badgeName][version];
    }
    if (FALLBACK_BADGE_URLS[badgeName]) {
      return FALLBACK_BADGE_URLS[badgeName];
    }
    return null;
  }

  /**
   * Fetch recent messages from third-party API
   */
  async function fetchRecentMessages(channelName) {
    try {
      const response = await fetch(`${RECENT_MESSAGES_API}/${channelName}?limit=${MAX_RECENT_MESSAGES}`);
      if (!response.ok) return [];
      const data = await response.json();
      return data.messages || [];
    } catch (e) {
      console.warn('TwitchIRC: Failed to fetch recent messages:', e);
      return [];
    }
  }

  /**
   * Parse IRC message with tags
   */
  function parseIRCMessage(raw) {
    let tags = {};
    let prefix = null;
    let command = null;
    let params = [];

    let idx = 0;

    if (raw[0] === '@') {
      const spaceIdx = raw.indexOf(' ');
      const tagStr = raw.substring(1, spaceIdx);
      idx = spaceIdx + 1;

      tagStr.split(';').forEach(tag => {
        const [key, value] = tag.split('=');
        tags[key] = value || true;
      });
    }

    if (raw[idx] === ':') {
      const spaceIdx = raw.indexOf(' ', idx);
      prefix = raw.substring(idx + 1, spaceIdx);
      idx = spaceIdx + 1;
    }

    const nextSpace = raw.indexOf(' ', idx);
    if (nextSpace === -1) {
      command = raw.substring(idx);
    } else {
      command = raw.substring(idx, nextSpace);
      idx = nextSpace + 1;

      while (idx < raw.length) {
        if (raw[idx] === ':') {
          params.push(raw.substring(idx + 1));
          break;
        }
        const spaceIdx = raw.indexOf(' ', idx);
        if (spaceIdx === -1) {
          params.push(raw.substring(idx));
          break;
        }
        params.push(raw.substring(idx, spaceIdx));
        idx = spaceIdx + 1;
      }
    }

    return { tags, prefix, command, params };
  }

  /**
   * Parse badges from tags
   */
  function parseBadges(badgeStr) {
    if (!badgeStr || typeof badgeStr !== 'string') return [];

    return badgeStr.split(',').map(badge => {
      const [name, version] = badge.split('/');
      const url = getBadgeUrl(name, version);
      return { name, version, url };
    }).filter(b => b.url);
  }

  /**
   * Parse emotes from tags
   */
  function parseTwitchEmotes(emoteStr, message) {
    if (!emoteStr || typeof emoteStr !== 'string') return [];

    const emotes = [];
    emoteStr.split('/').forEach(emote => {
      const [id, positions] = emote.split(':');
      if (!positions) return;

      positions.split(',').forEach(pos => {
        const [start, end] = pos.split('-').map(Number);
        emotes.push({
          id,
          start,
          end,
          text: message.substring(start, end + 1),
          url: `https://static-cdn.jtvnw.net/emoticons/v2/${id}/default/dark/1.0`,
        });
      });
    });

    return emotes.sort((a, b) => b.start - a.start);
  }

  /**
   * Get default color for username
   */
  function getDefaultColor(name) {
    const colors = [
      '#FF0000', '#0000FF', '#00FF00', '#B22222', '#FF7F50',
      '#9ACD32', '#FF4500', '#2E8B57', '#DAA520', '#D2691E',
      '#5F9EA0', '#1E90FF', '#FF69B4', '#8A2BE2', '#00FF7F'
    ];
    let hash = 0;
    for (let i = 0; i < name.length; i++) {
      hash = name.charCodeAt(i) + ((hash << 5) - hash);
    }
    return colors[Math.abs(hash) % colors.length];
  }

  /**
   * Format message with emotes
   */
  function formatMessageWithEmotes(message, twitchEmotes) {
    const emoteMatches = [];
    const thirdPartyEmotes = EmoteLoader.getEmotes();

    // Add Twitch native emotes
    if (twitchEmotes && twitchEmotes.length > 0) {
      for (const emote of twitchEmotes) {
        emoteMatches.push({
          start: emote.start,
          end: emote.end,
          html: `<img class="chat-emote" src="${emote.url}" alt="${emote.text}" title="${emote.text}">`
        });
      }
    }

    // Find third-party emotes
    if (EmoteLoader.isEmotesLoaded() && Object.keys(thirdPartyEmotes).length > 0) {
      const emoteCodes = Object.keys(thirdPartyEmotes).sort((a, b) => b.length - a.length);

      const isWordBoundary = (char) => {
        if (!char) return true;
        return !/[a-zA-Z0-9_]/.test(char);
      };

      let pos = 0;
      while (pos < message.length) {
        let foundEmote = null;
        let repeatCount = 0;

        for (const code of emoteCodes) {
          if (message.substring(pos, pos + code.length) === code) {
            const overlaps = emoteMatches.some(m =>
              (pos >= m.start && pos <= m.end) || (pos + code.length - 1 >= m.start && pos + code.length - 1 <= m.end)
            );
            if (overlaps) continue;

            repeatCount = 1;
            let checkPos = pos + code.length;
            while (message.substring(checkPos, checkPos + code.length) === code) {
              repeatCount++;
              checkPos += code.length;
            }

            const charBefore = pos > 0 ? message[pos - 1] : null;
            const totalEmoteLength = code.length * repeatCount;
            const charAfter = message[pos + totalEmoteLength] || null;
            const atWordBoundary = isWordBoundary(charBefore) && isWordBoundary(charAfter);

            if (atWordBoundary) {
              foundEmote = code;
              break;
            }
          }
        }

        if (foundEmote) {
          const emoteData = thirdPartyEmotes[foundEmote];
          const totalLength = foundEmote.length * repeatCount;
          for (let i = 0; i < repeatCount; i++) {
            const emotePos = pos + (i * foundEmote.length);
            emoteMatches.push({
              start: emotePos,
              end: emotePos + foundEmote.length - 1,
              html: `<img class="chat-emote" src="${emoteData.url}" alt="${foundEmote}" title="${foundEmote} (${emoteData.provider})">`
            });
          }
          pos += totalLength;
        } else {
          pos++;
        }
      }
    }

    emoteMatches.sort((a, b) => a.start - b.start);

    // Build result
    let result = '';
    let lastEnd = 0;

    for (const match of emoteMatches) {
      if (match.start > lastEnd) {
        result += escapeHtml(message.substring(lastEnd, match.start));
      }
      result += match.html;
      lastEnd = match.end + 1;
    }

    if (lastEnd < message.length) {
      result += escapeHtml(message.substring(lastEnd));
    }

    if (emoteMatches.length === 0) {
      result = escapeHtml(message);
    }

    return result;
  }

  /**
   * Escape HTML
   */
  function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
  }

  /**
   * Handle chat message
   */
  function handleChatMessage(parsed, isHistorical = false) {
    const tags = parsed.tags;
    const username = parsed.prefix?.split('!')[0] || 'anonymous';
    const displayName = tags['display-name'] || username || 'Anonymous';
    const color = tags.color || getDefaultColor(displayName);
    const message = parsed.params[1] || '';
    const badges = parseBadges(tags.badges);
    const emotes = parseTwitchEmotes(tags.emotes, message);
    const timestamp = new Date(parseInt(tags['tmi-sent-ts']) || Date.now());

    // Check for @mention
    const currentUser = TwitchAPI.getUsername();
    const isMention = currentUser && new RegExp(`@?${currentUser}\\b`, 'i').test(message);

    let isAction = message.startsWith('\u0001ACTION') && message.endsWith('\u0001');
    let cleanMessage = isAction ? message.slice(8, -1) : message;

    const msgData = {
      id: tags.id || Date.now().toString(),
      type: 'chat',
      username,
      displayName,
      color,
      badges,
      message: cleanMessage,
      messageHtml: formatMessageWithEmotes(cleanMessage, emotes),
      timestamp,
      isAction,
      isMention,
      isHistorical,
      isSelf: false
    };

    if (onMessageCallback) {
      onMessageCallback(msgData);
    }
  }

  /**
   * Handle user notice (subs, raids, etc.)
   */
  function handleUserNotice(parsed) {
    const tags = parsed.tags;
    // system-msg may be missing, a string, or unexpectedly another type
    const systemMsg = tags['system-msg'];
    const systemMessageText = typeof systemMsg === 'string' ? systemMsg.replace(/\\s/g, ' ') : (systemMsg || '');

    const msgData = {
      id: tags.id || Date.now().toString(),
      type: 'notice',
      noticeType: tags['msg-id'],
      systemMessage: systemMessageText,
      displayName: tags['display-name'] || '',
      color: tags.color || '#9147ff',
      message: parsed.params[1] || '',
      timestamp: new Date(parseInt(tags['tmi-sent-ts']) || Date.now()),
    };

    if (onMessageCallback) {
      onMessageCallback(msgData);
    }
  }

  /**
   * Handle WebSocket open
   */
  function handleOpen() {
    console.log('TwitchIRC: WebSocket connected');
    DebugLogger.logWebSocket('TwitchIRC', 'Connected', { channel, authenticated: !!oauthToken });

    ws.send('CAP REQ :twitch.tv/tags twitch.tv/commands twitch.tv/membership');

    if (oauthToken) {
      ws.send(`PASS oauth:${oauthToken}`);
      ws.send(`NICK ${username}`);
    } else {
      ws.send('PASS SCHMOOPIIE');
      ws.send(`NICK ${username}`);
    }

    ws.send(`JOIN #${channel}`);
  }

  /**
   * Handle incoming messages
   */
  function handleMessage(event) {
    const lines = event.data.split('\r\n');

    for (const line of lines) {
      if (!line) continue;

      if (line.startsWith('PING')) {
        ws.send('PONG :tmi.twitch.tv');
        continue;
      }

      const parsed = parseIRCMessage(line);
      if (!parsed) continue;

      switch (parsed.command) {
        case '001':
          isConnected = true;
          console.log('TwitchIRC: Connected to', channel);
          loadChatHistory();
          break;

        case 'PRIVMSG':
          handleChatMessage(parsed);
          break;

        case 'USERNOTICE':
          handleUserNotice(parsed);
          break;

        case 'NOTICE':
          if (onSystemCallback) {
            onSystemCallback(parsed.params[1] || 'Notice from server');
          }
          break;
      }
    }
  }

  /**
   * Load chat history
   */
  async function loadChatHistory() {
    DebugLogger.info('TwitchIRC', 'Loading chat history', { channel });
    if (onSystemCallback) {
      onSystemCallback('Loading chat history...');
    }

    const recentMessages = await fetchRecentMessages(channel);

    for (const rawMessage of recentMessages) {
      const parsed = parseIRCMessage(rawMessage);
      if (!parsed) continue;

      if (parsed.command === 'PRIVMSG') {
        handleChatMessage(parsed, true);
      } else if (parsed.command === 'USERNOTICE') {
        handleUserNotice(parsed);
      }
    }

    DebugLogger.info('TwitchIRC', 'Chat history loaded', { channel, messageCount: recentMessages.length });

    if (onSystemCallback) {
      onSystemCallback(`Connected to #${channel}`);
    }

    if (onConnectedCallback) {
      onConnectedCallback(channel);
    }
  }

  /**
   * Handle WebSocket close
   */
  function handleClose(event, closedConnectionId) {
    if (closedConnectionId !== connectionId) return;

    console.log('TwitchIRC: Disconnected');
    DebugLogger.logWebSocket('TwitchIRC', 'Disconnected', {
      code: event?.code,
      reason: event?.reason || 'No reason provided',
      wasClean: event?.wasClean
    });
    isConnected = false;

    if (onDisconnectedCallback) {
      onDisconnectedCallback();
    }

    if (channel) {
      if (onSystemCallback) {
        onSystemCallback('Disconnected. Reconnecting...');
      }
      reconnectTimeout = setTimeout(() => {
        if (channel && closedConnectionId === connectionId) {
          connect(channel, { oauthToken, username });
        }
      }, RECONNECT_DELAY);
    }
  }

  /**
   * Handle WebSocket error
   */
  function handleError(error) {
    console.error('TwitchIRC: WebSocket error', error);
    DebugLogger.error('TwitchIRC', 'WebSocket error', {
      error: error?.message || String(error),
      channel,
      wasConnected: isConnected
    });
  }

  /**
   * Connect to a channel
   */
  function connect(channelName, options = {}) {
    if (reconnectTimeout) {
      clearTimeout(reconnectTimeout);
      reconnectTimeout = null;
    }

    connectionId++;
    const thisConnectionId = connectionId;

    channel = channelName.toLowerCase().replace('#', '');
    username = options.username || `justinfan${Math.floor(Math.random() * 99999)}`;
    oauthToken = options.oauthToken || null;

    if (ws) {
      ws.close();
    }

    ws = new WebSocket(IRC_URL);

    ws.onopen = handleOpen;
    ws.onmessage = handleMessage;
    ws.onclose = (event) => handleClose(event, thisConnectionId);
    ws.onerror = handleError;

    // Load emotes and badges
    EmoteLoader.loadEmotes(channel);
    fetchGlobalBadges();
    fetchChannelBadges(channel);

    console.log('TwitchIRC: Connecting to', channel);
    DebugLogger.info('TwitchIRC', 'Initiating connection', {
      channel,
      authenticated: !!oauthToken,
      connectionId: thisConnectionId
    });
  }

  /**
   * Disconnect from chat
   */
  function disconnect() {
    DebugLogger.info('TwitchIRC', 'Disconnecting', { channel, wasConnected: isConnected });
    if (reconnectTimeout) {
      clearTimeout(reconnectTimeout);
      reconnectTimeout = null;
    }
    connectionId++;
    channel = null;
    if (ws) {
      ws.close();
      ws = null;
    }
    isConnected = false;
  }

  /**
   * Send a chat message
   */
  function sendMessage(text) {
    if (!isConnected || !ws || !oauthToken) {
      console.warn('TwitchIRC: Cannot send - not authenticated');
      DebugLogger.warn('TwitchIRC', 'Send failed - not authenticated', {
        isConnected,
        hasWebSocket: !!ws,
        hasToken: !!oauthToken
      });
      return false;
    }

    DebugLogger.log('TwitchIRC', 'Sending message', { channel, length: text.length });
    ws.send(`PRIVMSG #${channel} :${text}`);

    // Render sent message locally - use proper display name from TwitchAPI
    const displayName = (typeof TwitchAPI !== 'undefined' && TwitchAPI.getDisplayName()) || username || 'You';
    const msgData = {
      id: `sent-${Date.now()}`,
      type: 'chat',
      username: username,
      displayName: displayName,
      color: '#bf94ff',
      badges: [],
      message: text,
      messageHtml: formatMessageWithEmotes(text, []),
      timestamp: new Date(),
      isAction: false,
      isSelf: true
    };

    if (onMessageCallback) {
      onMessageCallback(msgData);
    }

    return true;
  }

  /**
   * Set callbacks
   */
  function setCallbacks(callbacks) {
    onMessageCallback = callbacks.onMessage || null;
    onSystemCallback = callbacks.onSystem || null;
    onConnectedCallback = callbacks.onConnected || null;
    onDisconnectedCallback = callbacks.onDisconnected || null;
  }

  /**
   * Check if connected
   */
  function getIsConnected() {
    return isConnected;
  }

  /**
   * Get current channel
   */
  function getChannel() {
    return channel;
  }

  // Public API
  return {
    connect,
    disconnect,
    sendMessage,
    setCallbacks,
    isConnected: getIsConnected,
    getChannel
  };
})();

// Export for global access
window.TwitchIRC = TwitchIRC;
