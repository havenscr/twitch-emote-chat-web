/* ================================================================
   TWITCH API MODULE
   OAuth authentication and Helix API calls
   Extracted from Widget Wall Desktop
   ================================================================ */

const TwitchAPI = (function() {
  // Twitch Application Client ID
  const CLIENT_ID = '2i647lb57i37r5moz5ttlkihgxqdz9';

  // Derive the redirect URI from wherever the app is deployed (e.g.
  // https://havenscr.github.io/twitch-emote-chat-web/auth-callback.html).
  // The same URL must be registered in the Twitch app's OAuth Redirect URLs.
  const REDIRECT_URI = window.location.origin
    + window.location.pathname.replace(/[^/]*$/, '')
    + 'auth-callback.html';

  // OAuth scopes needed for full functionality
  const SCOPES = 'user:read:email user:read:follows user:read:emotes chat:read chat:edit';

  /**
   * Get the OAuth authorization URL
   */
  function getAuthUrl() {
    const params = new URLSearchParams({
      client_id: CLIENT_ID,
      redirect_uri: REDIRECT_URI,
      response_type: 'token',
      scope: SCOPES
    });
    return `https://id.twitch.tv/oauth2/authorize?${params.toString()}`;
  }

  /**
   * Get stored access token
   */
  function getAccessToken() {
    return localStorage.getItem('twitch-access-token');
  }

  /**
   * Store access token from OAuth callback
   */
  function setAccessToken(token) {
    localStorage.setItem('twitch-access-token', token);
    localStorage.setItem('twitch-logged-in', 'true');
  }

  /**
   * Clear stored credentials
   */
  function logout() {
    localStorage.removeItem('twitch-access-token');
    localStorage.removeItem('twitch-logged-in');
    localStorage.removeItem('twitch-username');
    localStorage.removeItem('twitch-user-id');
    localStorage.removeItem('twitch-display-name');
  }

  /**
   * Check if user is logged in
   */
  function isLoggedIn() {
    return localStorage.getItem('twitch-logged-in') === 'true' && !!getAccessToken();
  }

  /**
   * Get the authenticated user's info
   */
  async function getUser() {
    const token = getAccessToken();
    if (!token) return null;

    const apiLog = DebugLogger.logApiCall('TwitchAPI', '/helix/users');
    try {
      const response = await fetch('https://api.twitch.tv/helix/users', {
        headers: {
          'Client-ID': CLIENT_ID,
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.status === 401) {
        DebugLogger.warn('TwitchAPI', 'Token expired, logging out');
        logout();
        apiLog.error({ status: 401 });
        return null;
      }

      if (!response.ok) {
        apiLog.error({ status: response.status });
        return null;
      }

      const data = await response.json();
      if (data.data && data.data.length > 0) {
        const user = data.data[0];
        localStorage.setItem('twitch-username', user.login);
        localStorage.setItem('twitch-user-id', user.id);
        localStorage.setItem('twitch-display-name', user.display_name);
        apiLog.success({ username: user.login });
        return user;
      }
      apiLog.success({ noUser: true });
      return null;
    } catch (e) {
      console.warn('TwitchAPI: Failed to get user:', e);
      apiLog.error(e);
      return null;
    }
  }

  /**
   * Get stored username (from previous login)
   */
  function getUsername() {
    return localStorage.getItem('twitch-username');
  }

  /**
   * Get stored user ID
   */
  function getUserId() {
    return localStorage.getItem('twitch-user-id');
  }

  /**
   * Get stored display name (properly capitalized)
   */
  function getDisplayName() {
    return localStorage.getItem('twitch-display-name');
  }

  /**
   * Fetch channels the user follows
   */
  async function getFollowedChannels() {
    const token = getAccessToken();
    if (!token) return [];

    // ALWAYS fetch fresh user to ensure ID matches current token
    // This prevents showing wrong channels if user switched accounts
    const storedUserId = getUserId();
    const user = await getUser();
    if (!user) return [];
    const userId = user.id;

    // Log if there was a user ID mismatch (indicates stale data was present)
    if (storedUserId && storedUserId !== userId) {
      DebugLogger.warn('TwitchAPI', 'User ID mismatch detected - using fresh ID', {
        storedUserId,
        freshUserId: userId
      });
    }

    DebugLogger.info('TwitchAPI', 'Fetching followed channels', {
      userId,
      username: user.login
    });

    const apiLog = DebugLogger.logApiCall('TwitchAPI', '/helix/channels/followed');
    try {
      const response = await fetch(
        `https://api.twitch.tv/helix/channels/followed?user_id=${userId}&first=100`,
        {
          headers: {
            'Client-ID': CLIENT_ID,
            'Authorization': `Bearer ${token}`
          }
        }
      );

      if (response.status === 401) {
        apiLog.error({ status: 401 });
        return [{ _error: 'auth', message: 'Please re-login' }];
      }

      if (response.status === 400) {
        apiLog.error({ status: 400, reason: 'scope' });
        return [{ _error: 'scope', message: 'Re-login required for followed channels' }];
      }

      if (!response.ok) {
        apiLog.error({ status: response.status });
        return [];
      }

      const data = await response.json();
      if (data.data) {
        apiLog.success({ count: data.data.length });

        // Log first few channels for debugging
        DebugLogger.info('TwitchAPI', 'Followed channels result', {
          userId,
          count: data.data.length,
          channels: data.data.slice(0, 10).map(c => c.broadcaster_login)
        });

        return data.data.map(channel => ({
          login: channel.broadcaster_login,
          displayName: channel.broadcaster_name
        }));
      }
      apiLog.success({ count: 0 });
      return [];
    } catch (e) {
      console.warn('TwitchAPI: Failed to fetch followed channels:', e);
      apiLog.error(e);
      return [];
    }
  }

  /**
   * Fetch live streams for a list of channel logins
   */
  async function getLiveStreams(channelLogins) {
    if (!channelLogins || channelLogins.length === 0) return [];

    const token = getAccessToken();
    if (!token) return [];

    try {
      const allLive = [];

      // API allows max 100 user_login params per request
      for (let i = 0; i < channelLogins.length; i += 100) {
        const chunk = channelLogins.slice(i, i + 100);
        const params = chunk.map(login => `user_login=${encodeURIComponent(login)}`).join('&');

        const response = await fetch(
          `https://api.twitch.tv/helix/streams?${params}`,
          {
            headers: {
              'Client-ID': CLIENT_ID,
              'Authorization': `Bearer ${token}`
            }
          }
        );

        if (!response.ok) continue;

        const data = await response.json();
        if (data.data) {
          allLive.push(...data.data.map(stream => ({
            login: stream.user_login,
            displayName: stream.user_name,
            gameName: stream.game_name,
            viewerCount: stream.viewer_count,
            title: stream.title,
            thumbnailUrl: stream.thumbnail_url
          })));
        }
      }

      return allLive;
    } catch (e) {
      console.warn('TwitchAPI: Failed to fetch live streams:', e);
      return [];
    }
  }

  /**
   * Get followed channels with live status
   */
  async function getFollowedChannelsWithLiveStatus() {
    const followed = await getFollowedChannels();

    if (followed.length === 0) return [];
    if (followed.length === 1 && followed[0]._error) return followed;

    const logins = followed.map(c => c.login);
    const liveStreams = await getLiveStreams(logins);
    const liveMap = new Map(liveStreams.map(s => [s.login.toLowerCase(), s]));

    return followed.map(channel => {
      const liveInfo = liveMap.get(channel.login.toLowerCase());
      return {
        ...channel,
        isLive: !!liveInfo,
        gameName: liveInfo?.gameName || '',
        viewerCount: liveInfo?.viewerCount || 0,
        title: liveInfo?.title || ''
      };
    });
  }

  /**
   * Fetch user's subscribed/follower emotes
   */
  async function getUserEmotes() {
    const token = getAccessToken();
    if (!token) return {};

    let userId = getUserId();
    if (!userId) {
      const user = await getUser();
      if (!user) return {};
      userId = user.id;
    }

    try {
      const emotes = {};
      let cursor = null;

      do {
        const url = cursor
          ? `https://api.twitch.tv/helix/chat/emotes/user?user_id=${userId}&after=${cursor}`
          : `https://api.twitch.tv/helix/chat/emotes/user?user_id=${userId}`;

        const response = await fetch(url, {
          headers: {
            'Client-ID': CLIENT_ID,
            'Authorization': `Bearer ${token}`
          }
        });

        if (response.status === 401) return emotes;
        if (!response.ok) return emotes;

        const data = await response.json();

        if (data.data) {
          for (const emote of data.data) {
            const url = emote.images?.url_1x ||
              `https://static-cdn.jtvnw.net/emoticons/v2/${emote.id}/default/dark/1.0`;
            emotes[emote.name] = {
              url: url,
              provider: 'twitch-sub',
              emoteType: emote.emote_type,
              ownerId: emote.owner_id
            };
          }
        }

        cursor = data.pagination?.cursor;
      } while (cursor);

      return emotes;
    } catch (e) {
      console.warn('TwitchAPI: Failed to fetch user emotes:', e);
      return {};
    }
  }

  /**
   * Look up a user by login name
   */
  async function getUserByLogin(login) {
    const token = getAccessToken();
    if (!token) return null;

    try {
      const response = await fetch(
        `https://api.twitch.tv/helix/users?login=${encodeURIComponent(login)}`,
        {
          headers: {
            'Client-ID': CLIENT_ID,
            'Authorization': `Bearer ${token}`
          }
        }
      );

      if (!response.ok) return null;

      const data = await response.json();
      return data.data?.[0] || null;
    } catch (e) {
      console.warn('TwitchAPI: Failed to look up user:', e);
      return null;
    }
  }

  /**
   * Map a Helix badge response to { setId: { versionId: imageUrl } }
   */
  function mapBadgeSets(data) {
    const sets = {};
    for (const set of data.data || []) {
      sets[set.set_id] = {};
      for (const version of set.versions || []) {
        sets[set.set_id][version.id] = version.image_url_2x || version.image_url_1x;
      }
    }
    return sets;
  }

  /**
   * Fetch global chat badges (Helix)
   */
  async function getGlobalChatBadges() {
    const token = getAccessToken();
    if (!token) return {};

    try {
      const response = await fetch('https://api.twitch.tv/helix/chat/badges/global', {
        headers: {
          'Client-ID': CLIENT_ID,
          'Authorization': `Bearer ${token}`
        }
      });

      if (!response.ok) return {};
      return mapBadgeSets(await response.json());
    } catch (e) {
      console.warn('TwitchAPI: Failed to fetch global badges:', e);
      return {};
    }
  }

  /**
   * Fetch channel chat badges (Helix)
   */
  async function getChannelChatBadges(broadcasterId) {
    const token = getAccessToken();
    if (!token || !broadcasterId) return {};

    try {
      const response = await fetch(
        `https://api.twitch.tv/helix/chat/badges?broadcaster_id=${encodeURIComponent(broadcasterId)}`,
        {
          headers: {
            'Client-ID': CLIENT_ID,
            'Authorization': `Bearer ${token}`
          }
        }
      );

      if (!response.ok) return {};
      return mapBadgeSets(await response.json());
    } catch (e) {
      console.warn('TwitchAPI: Failed to fetch channel badges:', e);
      return {};
    }
  }

  /**
   * Get stream info for a channel
   */
  async function getStreamInfo(channelLogin) {
    const token = getAccessToken();
    if (!token) return null;

    try {
      const response = await fetch(
        `https://api.twitch.tv/helix/streams?user_login=${channelLogin}`,
        {
          headers: {
            'Client-ID': CLIENT_ID,
            'Authorization': `Bearer ${token}`
          }
        }
      );

      if (!response.ok) return null;

      const data = await response.json();
      if (data.data && data.data.length > 0) {
        const stream = data.data[0];
        return {
          isLive: true,
          title: stream.title,
          gameName: stream.game_name,
          viewerCount: stream.viewer_count,
          thumbnailUrl: stream.thumbnail_url?.replace('{width}', '320').replace('{height}', '180')
        };
      }
      return { isLive: false };
    } catch (e) {
      console.warn('TwitchAPI: Failed to get stream info:', e);
      return null;
    }
  }

  // Public API
  return {
    CLIENT_ID,
    getAuthUrl,
    getAccessToken,
    setAccessToken,
    logout,
    isLoggedIn,
    getUser,
    getUsername,
    getUserId,
    getDisplayName,
    getFollowedChannels,
    getLiveStreams,
    getFollowedChannelsWithLiveStatus,
    getUserEmotes,
    getUserByLogin,
    getGlobalChatBadges,
    getChannelChatBadges,
    getStreamInfo
  };
})();

// Export for global access
window.TwitchAPI = TwitchAPI;
