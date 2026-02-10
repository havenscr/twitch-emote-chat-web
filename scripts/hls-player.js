/* ================================================================
   HLS PLAYER MODULE
   Direct HLS playback for Twitch streams using OAuth token auth
   Bypasses cookie-based embed for iOS PWA compatibility
   ================================================================ */

const HLSPlayer = (function() {
  const STORAGE_KEY = 'twitch-hls-enabled';
  const GQL_AUTH_KEY = 'twitch-gql-auth-token';
  const QUALITY_KEY = 'twitch-hls-quality';
  const WORKER_URL = 'https://bold-art-d9fe.havenscr.workers.dev';
  const DEFAULT_QUALITY = '480p30'; // Default to 480p 30fps for mobile data saving

  let currentChannel = null;
  let hlsInstance = null;
  let videoElement = null;
  let tokenRefreshTimeout = null;
  let availableQualities = [];

  /**
   * Check if HLS player is enabled
   */
  function isEnabled() {
    return localStorage.getItem(STORAGE_KEY) === 'true';
  }

  /**
   * Enable or disable HLS player
   */
  function setEnabled(enabled) {
    localStorage.setItem(STORAGE_KEY, enabled ? 'true' : 'false');
  }

  /**
   * Get stored GQL auth token for ad-free playback
   */
  function getGqlAuthToken() {
    return localStorage.getItem(GQL_AUTH_KEY);
  }

  /**
   * Set GQL auth token for ad-free playback
   */
  function setGqlAuthToken(token) {
    if (token) {
      localStorage.setItem(GQL_AUTH_KEY, token);
    } else {
      localStorage.removeItem(GQL_AUTH_KEY);
    }
  }

  /**
   * Check if GQL auth token is configured
   */
  function hasGqlAuthToken() {
    return !!localStorage.getItem(GQL_AUTH_KEY);
  }

  /**
   * Get preferred quality setting
   */
  function getPreferredQuality() {
    return localStorage.getItem(QUALITY_KEY) || DEFAULT_QUALITY;
  }

  /**
   * Set preferred quality
   */
  function setPreferredQuality(quality) {
    localStorage.setItem(QUALITY_KEY, quality);
    // Apply immediately if playing
    if (hlsInstance && availableQualities.length > 0) {
      applyQualityLevel(quality);
    }
  }

  /**
   * Get available quality levels
   */
  function getAvailableQualities() {
    return availableQualities;
  }

  /**
   * Apply quality level to HLS.js instance
   */
  function applyQualityLevel(targetQuality) {
    if (!hlsInstance || availableQualities.length === 0) return;

    // Find matching level index
    let bestMatchIndex = -1;

    for (let i = 0; i < availableQualities.length; i++) {
      const level = availableQualities[i];
      // Match by name (e.g., "480p30", "720p60", "source")
      if (level.name && level.name.toLowerCase().includes(targetQuality.toLowerCase())) {
        bestMatchIndex = i;
        break;
      }
      // Match by resolution
      if (targetQuality === '480p30' && level.height === 480) {
        bestMatchIndex = i;
        break;
      }
      if (targetQuality === '720p30' && level.height === 720 && level.frameRate <= 30) {
        bestMatchIndex = i;
        break;
      }
      if (targetQuality === '720p60' && level.height === 720 && level.frameRate > 30) {
        bestMatchIndex = i;
        break;
      }
      if (targetQuality === '1080p60' && level.height === 1080) {
        bestMatchIndex = i;
        break;
      }
    }

    if (bestMatchIndex >= 0) {
      console.log(`HLSPlayer: Setting quality to level ${bestMatchIndex} (${targetQuality})`);
      hlsInstance.currentLevel = bestMatchIndex;
    } else if (targetQuality === 'auto') {
      console.log('HLSPlayer: Setting quality to auto');
      hlsInstance.currentLevel = -1;
    } else {
      // Default to lowest quality if no match
      console.log(`HLSPlayer: No match for ${targetQuality}, using lowest quality`);
      hlsInstance.currentLevel = availableQualities.length - 1;
    }
  }

  /**
   * Get the worker URL (hardcoded)
   */
  function getWorkerUrl() {
    return WORKER_URL;
  }

  /**
   * Check if HLS player is enabled and available
   */
  function isAvailable() {
    return isEnabled();
  }

  /**
   * Check if we're in iOS PWA mode (standalone)
   */
  function isIOSPWA() {
    return window.navigator.standalone === true ||
           window.matchMedia('(display-mode: standalone)').matches;
  }

  /**
   * Check if native HLS is supported (Safari/iOS)
   */
  function supportsNativeHLS() {
    const video = document.createElement('video');
    return video.canPlayType('application/vnd.apple.mpegurl') !== '';
  }

  /**
   * Get PlaybackAccessToken from Twitch GQL via worker proxy
   *
   * NOTE: Twitch's GQL API does NOT accept third-party OAuth tokens from app OAuth flows.
   * However, it DOES accept first-party tokens extracted from browser sessions.
   * If a GQL auth token is configured (from browser dev tools), we send it for ad-free playback.
   * Otherwise, we fall back to anonymous requests which work but include ads.
   */
  async function getStreamToken(channel) {
    const workerUrl = getWorkerUrl();
    console.log('HLSPlayer: Worker URL =', workerUrl);

    if (!workerUrl) {
      throw new Error('Worker URL not configured');
    }

    // Use full GQL query instead of persisted query (more reliable)
    const query = {
      operationName: 'PlaybackAccessToken',
      query: `query PlaybackAccessToken($login: String!, $isLive: Boolean!, $vodID: ID!, $isVod: Boolean!, $playerType: String!) {
        streamPlaybackAccessToken(channelName: $login, params: {platform: "web", playerBackend: "mediaplayer", playerType: $playerType}) @include(if: $isLive) {
          value
          signature
          __typename
        }
        videoPlaybackAccessToken(id: $vodID, params: {platform: "web", playerBackend: "mediaplayer", playerType: $playerType}) @include(if: $isVod) {
          value
          signature
          __typename
        }
      }`,
      variables: {
        isLive: true,
        login: channel,
        isVod: false,
        vodID: '',
        playerType: 'site'
      }
    };

    // Build headers - include auth token if configured for ad-free playback
    const headers = {
      'Content-Type': 'application/json'
    };

    const gqlAuthToken = getGqlAuthToken();
    if (gqlAuthToken) {
      headers['Authorization'] = `OAuth ${gqlAuthToken}`;
      console.log('HLSPlayer: Using GQL auth token for ad-free playback');
    } else {
      console.log('HLSPlayer: No GQL auth token - using anonymous request (ads will play)');
    }

    const fetchUrl = `${workerUrl}/gql`;
    console.log('HLSPlayer: Fetching', fetchUrl);

    const res = await fetch(fetchUrl, {
      method: 'POST',
      headers,
      body: JSON.stringify(query)
    });

    console.log('HLSPlayer: Response status =', res.status);

    if (!res.ok) {
      const errorText = await res.text();
      console.error('HLSPlayer: Error response =', errorText);
      throw new Error(`Worker request failed: ${res.status} - ${errorText}`);
    }

    const data = await res.json();
    console.log('HLSPlayer: GQL response =', JSON.stringify(data).substring(0, 200));

    if (data.errors) {
      console.error('HLSPlayer: GQL errors =', data.errors);
      throw new Error(data.errors[0]?.message || 'GQL error');
    }

    const token = data.data?.streamPlaybackAccessToken;
    if (!token) {
      console.error('HLSPlayer: No token in response. Full response:', data);
      throw new Error('No playback token returned - stream may be offline');
    }

    console.log('HLSPlayer: Got token, signature length =', token.signature?.length);
    return token;
  }

  /**
   * Build HLS stream URL from token
   */
  function buildHLSUrl(channel, token) {
    const params = new URLSearchParams({
      player: 'twitchweb',
      p: Math.floor(Math.random() * 999999),
      type: 'any',
      allow_source: 'true',
      allow_audio_only: 'true',
      allow_spectre: 'false',
      fast_bread: 'true',
      sig: token.signature,
      token: token.value
    });

    return `https://usher.ttvnw.net/api/channel/hls/${channel}.m3u8?${params.toString()}`;
  }

  /**
   * Initialize HLS.js if needed
   */
  function initHLSjs(video, url) {
    if (typeof Hls === 'undefined') {
      console.error('HLSPlayer: HLS.js not loaded');
      return false;
    }

    if (!Hls.isSupported()) {
      console.error('HLSPlayer: HLS.js not supported in this browser');
      return false;
    }

    // Destroy existing instance
    if (hlsInstance) {
      hlsInstance.destroy();
    }

    // Reset available qualities
    availableQualities = [];

    hlsInstance = new Hls({
      enableWorker: true,
      lowLatencyMode: true,
      backBufferLength: 30
    });

    // Capture available quality levels when manifest is parsed
    hlsInstance.on(Hls.Events.MANIFEST_PARSED, (event, data) => {
      availableQualities = data.levels.map((level, index) => ({
        index,
        height: level.height,
        width: level.width,
        bitrate: level.bitrate,
        frameRate: level.frameRate || 30,
        name: level.name || `${level.height}p${level.frameRate > 30 ? '60' : '30'}`
      }));
      console.log('HLSPlayer: Available qualities:', availableQualities.map(q => q.name).join(', '));

      // Apply preferred quality
      const preferredQuality = getPreferredQuality();
      applyQualityLevel(preferredQuality);
    });

    hlsInstance.on(Hls.Events.ERROR, (event, data) => {
      console.warn('HLSPlayer: HLS.js error', data.type, data.details);
      if (data.fatal) {
        switch (data.type) {
          case Hls.ErrorTypes.NETWORK_ERROR:
            console.log('HLSPlayer: Fatal network error, attempting recovery');
            hlsInstance.startLoad();
            break;
          case Hls.ErrorTypes.MEDIA_ERROR:
            console.log('HLSPlayer: Fatal media error, attempting recovery');
            hlsInstance.recoverMediaError();
            break;
          default:
            console.error('HLSPlayer: Unrecoverable error');
            stop();
            break;
        }
      }
    });

    hlsInstance.loadSource(url);
    hlsInstance.attachMedia(video);

    return true;
  }

  /**
   * Play a stream
   */
  async function play(channel, video) {
    if (!channel || !video) {
      throw new Error('Channel and video element required');
    }

    // Stop any existing playback
    stop();

    currentChannel = channel;
    videoElement = video;

    console.log('HLSPlayer: Getting stream token for', channel);
    const token = await getStreamToken(channel);

    const hlsUrl = buildHLSUrl(channel, token);
    console.log('HLSPlayer: Starting playback');

    // Use native HLS on Safari/iOS, HLS.js elsewhere
    if (supportsNativeHLS()) {
      video.src = hlsUrl;
      video.load();
      await video.play();
    } else {
      if (!initHLSjs(video, hlsUrl)) {
        throw new Error('Failed to initialize HLS.js');
      }
      // HLS.js will auto-play when ready
      hlsInstance.on(Hls.Events.MANIFEST_PARSED, () => {
        video.play().catch(e => console.warn('HLSPlayer: Autoplay blocked', e));
      });
    }

    // Schedule token refresh (tokens expire after ~2 hours, refresh at 1.5 hours)
    scheduleTokenRefresh();

    return true;
  }

  /**
   * Schedule token refresh to maintain playback
   */
  function scheduleTokenRefresh() {
    clearTokenRefresh();

    // Refresh token every 90 minutes (tokens last ~2 hours)
    tokenRefreshTimeout = setTimeout(async () => {
      if (currentChannel && videoElement) {
        console.log('HLSPlayer: Refreshing stream token');
        try {
          const token = await getStreamToken(currentChannel);
          const hlsUrl = buildHLSUrl(currentChannel, token);

          if (supportsNativeHLS()) {
            // For native HLS, we need to reload
            const currentTime = videoElement.currentTime;
            videoElement.src = hlsUrl;
            videoElement.load();
            videoElement.currentTime = currentTime;
            videoElement.play();
          } else if (hlsInstance) {
            // HLS.js can load new source without interruption
            hlsInstance.loadSource(hlsUrl);
          }

          scheduleTokenRefresh(); // Schedule next refresh
        } catch (e) {
          console.error('HLSPlayer: Token refresh failed', e);
          // Will retry on next schedule
          scheduleTokenRefresh();
        }
      }
    }, 90 * 60 * 1000); // 90 minutes
  }

  /**
   * Clear token refresh timeout
   */
  function clearTokenRefresh() {
    if (tokenRefreshTimeout) {
      clearTimeout(tokenRefreshTimeout);
      tokenRefreshTimeout = null;
    }
  }

  /**
   * Stop playback
   */
  function stop() {
    clearTokenRefresh();

    if (hlsInstance) {
      hlsInstance.destroy();
      hlsInstance = null;
    }

    if (videoElement) {
      videoElement.pause();
      videoElement.removeAttribute('src');
      videoElement.load();
    }

    currentChannel = null;
    availableQualities = [];
  }

  /**
   * Check if currently playing
   */
  function isPlaying() {
    return !!currentChannel;
  }

  /**
   * Get current channel
   */
  function getCurrentChannel() {
    return currentChannel;
  }

  // Public API
  return {
    isEnabled,
    setEnabled,
    isAvailable,
    isIOSPWA,
    supportsNativeHLS,
    play,
    stop,
    isPlaying,
    getCurrentChannel,
    // GQL auth token functions for ad-free playback
    getGqlAuthToken,
    setGqlAuthToken,
    hasGqlAuthToken,
    // Quality settings (defaults to 480p30)
    getPreferredQuality,
    setPreferredQuality,
    getAvailableQualities
  };
})();

// Export for global access
window.HLSPlayer = HLSPlayer;
