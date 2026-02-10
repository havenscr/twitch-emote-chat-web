/* ================================================================
   MEDIA SESSION MODULE
   Provides background audio support via Media Session API
   Enables lock screen controls and metadata display
   ================================================================ */

const MediaSessionManager = (function() {
  let videoElement = null;
  let currentChannel = null;

  /**
   * Check if Media Session API is supported
   */
  function isSupported() {
    return 'mediaSession' in navigator;
  }

  /**
   * Set media metadata (channel, stream title, thumbnail)
   */
  function setMetadata(channel, streamInfo) {
    if (!isSupported()) return;

    const channelLower = channel.toLowerCase();
    const title = streamInfo?.title || `${channel} - Live on Twitch`;
    const game = streamInfo?.game_name || streamInfo?.game || 'Twitch Stream';

    try {
      navigator.mediaSession.metadata = new MediaMetadata({
        title: title,
        artist: channel,
        album: game,
        artwork: [
          {
            src: `https://static-cdn.jtvnw.net/previews-ttv/live_user_${channelLower}-96x96.jpg`,
            sizes: '96x96',
            type: 'image/jpeg'
          },
          {
            src: `https://static-cdn.jtvnw.net/previews-ttv/live_user_${channelLower}-256x256.jpg`,
            sizes: '256x256',
            type: 'image/jpeg'
          },
          {
            src: `https://static-cdn.jtvnw.net/previews-ttv/live_user_${channelLower}-512x512.jpg`,
            sizes: '512x512',
            type: 'image/jpeg'
          }
        ]
      });
      console.log('MediaSession: Metadata set for', channel);
    } catch (e) {
      console.warn('MediaSession: Failed to set metadata', e);
    }
  }

  /**
   * Set up action handlers for media controls
   */
  function setActionHandlers(video) {
    if (!isSupported() || !video) return;

    try {
      // Play action
      navigator.mediaSession.setActionHandler('play', () => {
        video.play().catch(() => {});
        updatePlaybackState('playing');
      });

      // Pause action
      navigator.mediaSession.setActionHandler('pause', () => {
        video.pause();
        updatePlaybackState('paused');
      });

      // Stop action
      navigator.mediaSession.setActionHandler('stop', () => {
        video.pause();
        updatePlaybackState('none');
      });

      // Disable seek handlers (not applicable for live streams)
      navigator.mediaSession.setActionHandler('seekbackward', null);
      navigator.mediaSession.setActionHandler('seekforward', null);
      navigator.mediaSession.setActionHandler('seekto', null);
      navigator.mediaSession.setActionHandler('previoustrack', null);
      navigator.mediaSession.setActionHandler('nexttrack', null);

      console.log('MediaSession: Action handlers registered');
    } catch (e) {
      console.warn('MediaSession: Failed to set action handlers', e);
    }
  }

  /**
   * Update playback state
   * @param {string} state - 'playing', 'paused', or 'none'
   */
  function updatePlaybackState(state) {
    if (!isSupported()) return;

    try {
      navigator.mediaSession.playbackState = state;
    } catch (e) {
      // Silently fail - some browsers don't support playbackState
    }
  }

  /**
   * Initialize Media Session for a video element
   */
  function init(video, channel, streamInfo) {
    if (!isSupported()) {
      console.log('MediaSession: Not supported in this browser');
      return;
    }

    videoElement = video;
    currentChannel = channel;

    setMetadata(channel, streamInfo);
    setActionHandlers(video);
    updatePlaybackState(video.paused ? 'paused' : 'playing');

    // Listen for video state changes
    video.addEventListener('play', () => updatePlaybackState('playing'));
    video.addEventListener('pause', () => updatePlaybackState('paused'));
    video.addEventListener('ended', () => updatePlaybackState('none'));

    console.log('MediaSession: Initialized for', channel);
  }

  /**
   * Update metadata when stream info changes
   */
  function updateMetadata(streamInfo) {
    if (currentChannel) {
      setMetadata(currentChannel, streamInfo);
    }
  }

  /**
   * Clear Media Session (when leaving channel)
   */
  function clear() {
    if (!isSupported()) return;

    try {
      navigator.mediaSession.metadata = null;
      navigator.mediaSession.playbackState = 'none';

      // Remove action handlers
      navigator.mediaSession.setActionHandler('play', null);
      navigator.mediaSession.setActionHandler('pause', null);
      navigator.mediaSession.setActionHandler('stop', null);
    } catch (e) {
      // Silently fail
    }

    videoElement = null;
    currentChannel = null;
    console.log('MediaSession: Cleared');
  }

  return {
    isSupported,
    init,
    setMetadata,
    updateMetadata,
    updatePlaybackState,
    clear
  };
})();
