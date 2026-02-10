/* ================================================================
   EMOTE LOADER MODULE
   Fetches emotes from FFZ, 7TV, BTTV, and Twitch
   Extracted from Widget Wall Desktop
   ================================================================ */

const EmoteLoader = (function() {
  // Cache for loaded emotes
  let cachedEmotes = {};
  let currentChannel = null;
  let isLoaded = false;

  /**
   * Resolve Twitch username to user ID using IVR API
   * 7TV API often requires user ID instead of username
   */
  async function getTwitchUserId(channelName) {
    try {
      const res = await fetch(`https://api.ivr.fi/v2/twitch/user?login=${channelName}`);
      if (res.ok) {
        const data = await res.json();
        if (data && data.length > 0 && data[0].id) {
          return data[0].id;
        }
      }
    } catch (e) {
      console.warn('EmoteLoader: IVR API lookup failed:', e);
    }
    return null;
  }

  /**
   * Fetch FFZ global and channel emotes
   */
  async function fetchFFZEmotes(channelName) {
    const emotes = {};

    // Global emotes
    try {
      const globalRes = await fetch('https://api.frankerfacez.com/v1/set/global');
      if (globalRes.ok) {
        const data = await globalRes.json();
        for (const setId of data.default_sets || []) {
          const set = data.sets[setId];
          if (set?.emoticons) {
            for (const emote of set.emoticons) {
              const url = emote.urls['1'] || emote.urls['2'] || Object.values(emote.urls)[0];
              if (url) {
                emotes[emote.name] = { url: url.startsWith('//') ? 'https:' + url : url, provider: 'ffz' };
              }
            }
          }
        }
      }
    } catch (e) {
      console.warn('EmoteLoader: FFZ global emotes failed:', e);
    }

    // Channel emotes
    try {
      const channelRes = await fetch(`https://api.frankerfacez.com/v1/room/${channelName}`);
      if (channelRes.ok) {
        const data = await channelRes.json();
        for (const setId in data.sets || {}) {
          const set = data.sets[setId];
          if (set?.emoticons) {
            for (const emote of set.emoticons) {
              const url = emote.urls['1'] || emote.urls['2'] || Object.values(emote.urls)[0];
              if (url) {
                emotes[emote.name] = { url: url.startsWith('//') ? 'https:' + url : url, provider: 'ffz' };
              }
            }
          }
        }
      }
    } catch (e) {
      console.warn('EmoteLoader: FFZ channel emotes failed:', e);
    }

    return emotes;
  }

  /**
   * Fetch 7TV global and channel emotes
   */
  async function fetch7TVEmotes(channelName) {
    const emotes = {};

    // Global emotes
    try {
      const globalRes = await fetch('https://7tv.io/v3/emote-sets/global');
      if (globalRes.ok) {
        const data = await globalRes.json();
        for (const emote of data.emotes || []) {
          const files = emote.data?.host?.files || [];
          const isAnimated = emote.data?.animated;
          // Prefer WebP over AVIF for iOS Safari compatibility
          const file = files.find(f => f.name === '1x.webp') || files.find(f => f.name === '1x.avif') || files[0];
          if (file && emote.data?.host?.url) {
            emotes[emote.name] = { url: `https:${emote.data.host.url}/${file.name}`, provider: '7tv', animated: isAnimated };
          }
        }
      }
    } catch (e) {
      console.warn('EmoteLoader: 7TV global emotes failed:', e);
    }

    // Channel emotes
    try {
      let userRes = await fetch(`https://7tv.io/v3/users/twitch/${channelName}`);

      if (!userRes.ok) {
        const twitchUserId = await getTwitchUserId(channelName);
        if (twitchUserId) {
          userRes = await fetch(`https://7tv.io/v3/users/twitch/${twitchUserId}`);
        }
      }

      if (userRes.ok) {
        const userData = await userRes.json();
        const emoteSet = userData.emote_set;
        if (emoteSet?.emotes) {
          for (const emote of emoteSet.emotes) {
            const files = emote.data?.host?.files || [];
            const isAnimated = emote.data?.animated;
            // Prefer WebP over AVIF for iOS Safari compatibility
            const file = files.find(f => f.name === '1x.webp') || files.find(f => f.name === '1x.avif') || files[0];
            if (file && emote.data?.host?.url) {
              emotes[emote.name] = { url: `https:${emote.data.host.url}/${file.name}`, provider: '7tv', animated: isAnimated };
            }
          }
        }
      }
    } catch (e) {
      console.warn('EmoteLoader: 7TV channel emotes failed:', e);
    }

    return emotes;
  }

  /**
   * Fetch BTTV global and channel emotes
   */
  async function fetchBTTVEmotes(channelName) {
    const emotes = {};

    // Global emotes
    try {
      const globalRes = await fetch('https://api.betterttv.net/3/cached/emotes/global');
      if (globalRes.ok) {
        const data = await globalRes.json();
        for (const emote of data) {
          emotes[emote.code] = { url: `https://cdn.betterttv.net/emote/${emote.id}/1x`, provider: 'bttv' };
        }
      }
    } catch (e) {
      console.warn('EmoteLoader: BTTV global emotes failed:', e);
    }

    // Channel emotes
    try {
      const channelRes = await fetch(`https://api.betterttv.net/3/cached/users/twitch/${channelName}`);
      if (channelRes.ok) {
        const data = await channelRes.json();
        for (const emote of data.channelEmotes || []) {
          emotes[emote.code] = { url: `https://cdn.betterttv.net/emote/${emote.id}/1x`, provider: 'bttv' };
        }
        for (const emote of data.sharedEmotes || []) {
          emotes[emote.code] = { url: `https://cdn.betterttv.net/emote/${emote.id}/1x`, provider: 'bttv' };
        }
      }
    } catch (e) {
      console.warn('EmoteLoader: BTTV channel emotes failed:', e);
    }

    return emotes;
  }

  /**
   * Fetch Twitch global emotes
   */
  async function fetchTwitchGlobalEmotes() {
    const emotes = {};
    try {
      const res = await fetch('https://emotes.adamcy.pl/v1/global/emotes/twitch');
      if (res.ok) {
        const data = await res.json();
        for (const emote of data) {
          if (emote.code && emote.urls?.length > 0) {
            const url = emote.urls.find(u => u.size === '1x')?.url || emote.urls[0]?.url;
            if (url) {
              emotes[emote.code] = { url, provider: 'twitch' };
            }
          }
        }
      }
    } catch (e) {
      console.warn('EmoteLoader: Twitch global emotes failed:', e);
    }
    return emotes;
  }

  /**
   * Fetch Twitch channel subscriber emotes
   */
  async function fetchTwitchChannelEmotes(channelName) {
    const emotes = {};
    try {
      const res = await fetch(`https://emotes.adamcy.pl/v1/channel/${channelName}/emotes/twitch`);
      if (res.ok) {
        const data = await res.json();
        for (const emote of data) {
          if (emote.code && emote.urls?.length > 0) {
            const url = emote.urls.find(u => u.size === '1x')?.url || emote.urls[0]?.url;
            if (url) {
              emotes[emote.code] = { url, provider: 'twitch' };
            }
          }
        }
      }
    } catch (e) {
      console.warn('EmoteLoader: Twitch channel emotes failed:', e);
    }
    return emotes;
  }

  /**
   * Load all emotes for a channel
   */
  async function loadEmotes(channelName) {
    if (currentChannel === channelName && isLoaded) {
      DebugLogger.log('EmoteLoader', 'Using cached emotes', { channel: channelName, count: Object.keys(cachedEmotes).length });
      return cachedEmotes;
    }

    console.log('EmoteLoader: Loading emotes for', channelName);
    DebugLogger.info('EmoteLoader', 'Loading emotes', { channel: channelName });
    currentChannel = channelName;
    isLoaded = false;

    const [twitchGlobal, ffz, sevenTV, bttv, twitchChannel, userEmotes] = await Promise.all([
      fetchTwitchGlobalEmotes(),
      fetchFFZEmotes(channelName),
      fetch7TVEmotes(channelName),
      fetchBTTVEmotes(channelName),
      fetchTwitchChannelEmotes(channelName),
      TwitchAPI.isLoggedIn() ? TwitchAPI.getUserEmotes() : Promise.resolve({})
    ]);

    // Merge all emotes (later sources override earlier for duplicates)
    cachedEmotes = {
      ...twitchGlobal,
      ...twitchChannel,
      ...ffz,
      ...bttv,
      ...sevenTV,
      ...userEmotes
    };

    isLoaded = true;

    const counts = {
      twitchGlobal: Object.keys(twitchGlobal).length,
      twitchChannel: Object.keys(twitchChannel).length,
      ffz: Object.keys(ffz).length,
      sevenTV: Object.keys(sevenTV).length,
      bttv: Object.keys(bttv).length,
      userEmotes: Object.keys(userEmotes).length,
      total: Object.keys(cachedEmotes).length
    };

    console.log(`EmoteLoader: Loaded ${counts.total} emotes (Twitch: ${counts.twitchGlobal + counts.twitchChannel}, FFZ: ${counts.ffz}, 7TV: ${counts.sevenTV}, BTTV: ${counts.bttv}, User: ${counts.userEmotes})`);
    DebugLogger.info('EmoteLoader', 'Emotes loaded', counts);

    return cachedEmotes;
  }

  /**
   * Get all loaded emotes
   */
  function getEmotes() {
    return cachedEmotes;
  }

  /**
   * Get emotes filtered by provider
   * For 'all', returns emotes interleaved by provider to ensure variety within display limits
   */
  function getEmotesByProvider(provider) {
    if (provider === 'all') {
      // Group emotes by provider for interleaved display
      const byProvider = {
        'twitch': [],
        'twitch-sub': [],
        'ffz': [],
        'bttv': [],
        '7tv': []
      };

      for (const [code, data] of Object.entries(cachedEmotes)) {
        const p = data.provider;
        if (byProvider[p]) {
          byProvider[p].push([code, data]);
        } else if (p && p.startsWith('twitch')) {
          byProvider['twitch'].push([code, data]);
        }
      }

      // Interleave emotes from all providers for balanced display
      const interleaved = {};
      const providers = Object.keys(byProvider).filter(p => byProvider[p].length > 0);
      let added = true;
      let index = 0;

      while (added) {
        added = false;
        for (const p of providers) {
          if (index < byProvider[p].length) {
            const [code, data] = byProvider[p][index];
            interleaved[code] = data;
            added = true;
          }
        }
        index++;
      }

      return interleaved;
    }

    const filtered = {};
    for (const [code, data] of Object.entries(cachedEmotes)) {
      if (data.provider === provider || (provider === 'twitch' && data.provider.startsWith('twitch'))) {
        filtered[code] = data;
      }
    }
    return filtered;
  }

  /**
   * Collapse consecutive duplicate characters for fuzzy matching
   * "peepo" -> "pepo", "pepe" -> "pepe", "KEKW" -> "KEKW"
   */
  function collapseChars(str) {
    return str.replace(/(.)\1+/g, '$1');
  }

  /**
   * Fuzzy match - checks if emote matches search term
   * Returns score: 4 = prefix, 3 = contains, 2 = collapsed contains, 1 = collapsed prefix match
   */
  function fuzzyMatch(query, target) {
    if (!query) return 4;
    const queryLower = query.toLowerCase();
    const targetLower = target.toLowerCase();

    // Exact prefix match gets highest priority
    if (targetLower.startsWith(queryLower)) return 4;

    // Direct substring match
    if (targetLower.includes(queryLower)) return 3;

    // Collapsed form match (peepo -> pepo, so "pep" from "pepe" matches)
    const targetCollapsed = collapseChars(targetLower);
    const queryCollapsed = collapseChars(queryLower);
    if (targetCollapsed.includes(queryCollapsed)) return 2;

    // Prefix match on collapsed form (first 3+ chars)
    if (queryCollapsed.length >= 3) {
      const prefix = queryCollapsed.substring(0, 3);
      if (targetCollapsed.includes(prefix)) return 1;
    }

    return 0;
  }

  /**
   * Search emotes by name with fuzzy matching (local cache only, synchronous)
   */
  function searchEmotesLocal(query, provider = 'all') {
    const emotes = getEmotesByProvider(provider);
    if (!query) return emotes;

    const matches = [];

    for (const [code, data] of Object.entries(emotes)) {
      const score = fuzzyMatch(query, code);
      if (score > 0) {
        matches.push({ code, data, score });
      }
    }

    // Sort by score (highest first), then alphabetically
    matches.sort((a, b) => {
      if (b.score !== a.score) return b.score - a.score;
      return a.code.localeCompare(b.code);
    });

    const results = {};
    for (const match of matches) {
      results[match.code] = match.data;
    }

    return results;
  }

  /**
   * Search emotes - only returns emotes actually available on the channel
   * (Does NOT search global APIs to avoid showing unavailable emotes)
   */
  async function searchEmotes(query, provider = 'all') {
    // Only search local cache - these are emotes actually loaded for the channel
    // Global API search was removed because it showed emotes not available on the channel
    return searchEmotesLocal(query, provider);
  }

  /**
   * Check if emotes are loaded
   */
  function isEmotesLoaded() {
    return isLoaded;
  }

  /**
   * Clear cached emotes
   */
  function clearCache() {
    DebugLogger.log('EmoteLoader', 'Clearing emote cache', { previousChannel: currentChannel });
    cachedEmotes = {};
    currentChannel = null;
    isLoaded = false;
  }

  // Public API
  return {
    loadEmotes,
    getEmotes,
    getEmotesByProvider,
    searchEmotes,         // Returns only channel-available emotes
    searchEmotesLocal,    // Sync version - local cache only
    isEmotesLoaded,
    clearCache
  };
})();

// Export for global access
window.EmoteLoader = EmoteLoader;
