/* ================================================================
   TWITCH CHAT WEB APP - Main Application Controller
   ================================================================ */

const App = (function() {
  // DOM Elements
  const loginScreen = document.getElementById('login-screen');
  const channelScreen = document.getElementById('channel-screen');
  const streamScreen = document.getElementById('stream-screen');

  const loginBtn = document.getElementById('login-btn');
  const anonymousBtn = document.getElementById('anonymous-btn');

  const channelInput = document.getElementById('channel-input');
  const channelGoBtn = document.getElementById('channel-go-btn');
  const liveChannels = document.getElementById('live-channels');
  const followedChannels = document.getElementById('followed-channels');
  const recentChannels = document.getElementById('recent-channels');
  const followedSection = document.getElementById('followed-section');
  const followedOfflineSection = document.getElementById('followed-offline-section');
  const userMenuBtn = document.getElementById('user-menu-btn');

  const twitchEmbed = document.getElementById('twitch-embed');
  const videoOffline = document.getElementById('video-offline');
  const offlineAvatar = document.getElementById('offline-avatar');
  const offlineChannel = document.getElementById('offline-channel');
  const backBtn = document.getElementById('back-btn');
  const settingsBtnVideo = document.getElementById('settings-btn-video');

  const chatMessages = document.getElementById('chat-messages');
  const chatInput = document.getElementById('chat-input');
  const chatSendBtn = document.getElementById('chat-send-btn');
  const chatInputArea = document.getElementById('chat-input-area');
  const loginPrompt = document.getElementById('login-prompt');
  const chatLoginBtn = document.getElementById('chat-login-btn');

  const emotePickerBtn = document.getElementById('emote-picker-btn');
  const emotePicker = document.getElementById('emote-picker');
  const emotePickerClose = document.getElementById('emote-picker-close');
  const emoteSearch = document.getElementById('emote-search');
  const emoteGrid = document.getElementById('emote-grid');
  const emoteTabs = document.querySelectorAll('.emote-tab');
  const emoteAutocomplete = document.getElementById('emote-autocomplete');

  // Text effects elements
  const textEffectsBtn = document.getElementById('text-effects-btn');
  const textEffectsPicker = document.getElementById('text-effects-picker');
  const textEffectsClose = document.getElementById('text-effects-close');
  const textEffectsGrid = document.getElementById('text-effects-grid');
  const textEffectsPreview = document.getElementById('text-effects-preview');

  const userMenu = document.getElementById('user-menu');
  const userInfo = document.getElementById('user-info');
  const logoutBtn = document.getElementById('logout-btn');
  const menuCloseBtn = document.getElementById('menu-close-btn');

  // Help modal elements
  const helpBtn = document.getElementById('help-btn');
  const helpModal = document.getElementById('help-modal');
  const helpCloseBtn = document.getElementById('help-close-btn');

  // Settings elements
  const hlsToggle = document.getElementById('hls-toggle');
  const autocompleteToggle = document.getElementById('autocomplete-toggle');
  const themeSelect = document.getElementById('theme-select');
  const sleepTimerSelect = document.getElementById('sleep-timer-select');
  const sleepTimerDisplay = document.getElementById('sleep-timer-display');

  // Picture-in-Picture button
  const pipBtn = document.getElementById('pip-btn');

  // Sleep timer quick-access button
  const sleepTimerBtn = document.getElementById('sleep-timer-btn');
  const sleepTimerBadge = document.getElementById('sleep-timer-badge');

  // Open in Twitch button
  const openTwitchBtn = document.getElementById('open-twitch-btn');

  // Refresh page button (in settings menu)
  const refreshBtn = document.getElementById('refresh-page-btn');

  // Landscape chat toggle buttons
  const chatToggleOpen = document.getElementById('chat-toggle-open');
  const chatToggleClosed = document.getElementById('chat-toggle-closed');

  // Stream info bar elements
  const streamInfoBar = document.getElementById('stream-info-bar');
  const streamTitleEl = document.getElementById('stream-title');
  const streamGameEl = document.getElementById('stream-game');
  const streamViewersEl = document.getElementById('stream-viewers');
  const streamInfoSelect = document.getElementById('stream-info-select');

  // HLS video element
  const hlsVideo = document.getElementById('hls-video');

  // State
  let currentChannel = null;
  let twitchPlayer = null;
  let currentEmoteProvider = 'all';
  let usingHLSPlayer = false;
  let currentTextEffect = null; // null = normal text, or effect id string

  // Autocomplete state
  let autocompleteMatches = [];
  let autocompleteSelectedIndex = 0;
  let autocompleteWordStart = 0;
  let autocompleteDebounceTimer = null;
  let autocompleteEnabled = true;
  let autocompleteMode = null; // 'emote' or 'mention'
  let keyboardHandlingEnabled = true;
  let mentionAutocompleteEnabled = true;

  // Chat users tracking (for @ mentions) - Map of lowercase username -> display name
  const chatUsers = new Map();

  // App config
  const APP_VERSION = '1.0.38';

  // Settings keys
  const RECENT_KEY = 'twitch-recent-channels';
  const AUTOCOMPLETE_KEY = 'twitch-autocomplete-enabled';
  const THEME_KEY = 'twitch-theme';
  const FONT_SIZE_KEY = 'twitch-font-size';
  const MENTION_SOUNDS_KEY = 'twitch-mention-sounds';
  const STREAM_INFO_KEY = 'twitch-stream-info';
  const HIDE_BOTS_KEY = 'twitch-hide-bots';
  const HIDE_COMMANDS_KEY = 'twitch-hide-commands';
  const HIDE_ANNOUNCEMENTS_KEY = 'twitch-hide-announcements';
  const FADE_HISTORY_KEY = 'twitch-fade-history';
  const BLOCKED_USERS_KEY = 'twitch-blocked-users';
  const ACTIVE_CHANNEL_KEY = 'twitch-active-channel';
  const KEYBOARD_HANDLING_KEY = 'twitch-keyboard-handling';
  const MENTION_AUTOCOMPLETE_KEY = 'twitch-mention-autocomplete-enabled';
  const MAX_RECENT = 10;

  // Device detection (module scope for keyboard handling)
  const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent);
  const isAndroid = /Android/.test(navigator.userAgent);

  // Navigation states for browser history management
  const NAV_STATE = {
    LOGIN: 'login',
    CHANNEL: 'channel',
    STREAM: 'stream'
  };

  // Known bots list
  const KNOWN_BOTS = ['nightbot', 'streamelements', 'streamlabs', 'moobot', 'fossabot', 'soundalerts', 'streamstickers'];

  // Mention notification sounds
  const mentionSound = new Audio('assets/sounds/mention.mp3');
  const hugSound = new Audio('assets/sounds/hug.mp3');
  mentionSound.volume = 0.5;
  hugSound.volume = 0.5;

  // Easter egg sound
  const easterEggSound = new Audio('assets/sounds/139-item-catch.mp3');
  easterEggSound.volume = 0.7;

  // Chat scroll state
  let chatPaused = false;
  let mentionSoundsEnabled = true;

  // Sleep timer state
  let sleepTimerId = null;
  let sleepTimerEndTime = null;
  let sleepTimerIntervalId = null;
  const SLEEP_TIMER_OPTIONS = [0, 15, 30, 45, 60, 90]; // Minutes
  let currentSleepTimerValue = 0;

  // Stream info state
  let streamInfoMode = 'tap'; // 'off', 'tap', 'always'
  let streamInfoIntervalId = null;
  const STREAM_INFO_POLL_INTERVAL = 60000; // 60 seconds

  // Chat filter state
  let hideBotsEnabled = false;
  let hideCommandsEnabled = false;
  let hideAnnouncementsEnabled = false;
  let fadeHistoryEnabled = true; // Default to true (faded)
  let blockedUsers = [];

  // Autocomplete debounce delay
  const AUTOCOMPLETE_DELAY = 600;

  // Wake Lock state (prevents screen sleep during playback)
  let wakeLock = null;

  /**
   * Request Wake Lock to prevent screen from sleeping during playback
   */
  async function requestWakeLock() {
    if ('wakeLock' in navigator && !wakeLock) {
      try {
        wakeLock = await navigator.wakeLock.request('screen');
        wakeLock.addEventListener('release', () => {
          DebugLogger.info('App', 'Wake Lock released');
          wakeLock = null;
        });
        DebugLogger.info('App', 'Wake Lock acquired');
      } catch (e) {
        DebugLogger.warn('App', 'Wake Lock failed', { error: e.message });
      }
    }
  }

  /**
   * Release Wake Lock when playback stops
   */
  function releaseWakeLock() {
    if (wakeLock) {
      wakeLock.release();
      wakeLock = null;
    }
  }

  /**
   * Initialize the app
   */
  function init() {
    DebugLogger.info('App', 'Initializing app', { version: APP_VERSION });

    // Check for OAuth callback
    if (window.location.hash.includes('access_token')) {
      DebugLogger.info('App', 'OAuth callback detected');
      handleOAuthCallback();
      return;
    }

    // Load settings
    loadSettings();

    // Set version in UI
    const versionEl = document.getElementById('app-version');
    if (versionEl) versionEl.textContent = `v${APP_VERSION}`;

    // Set up event listeners
    setupEventListeners();

    // Show appropriate screen
    if (TwitchAPI.isLoggedIn()) {
      // Refresh user data to ensure display name is stored properly
      TwitchAPI.getUser().then(() => {
        // Check if we should auto-rejoin a channel (e.g., after refresh)
        const activeChannel = localStorage.getItem(ACTIVE_CHANNEL_KEY);
        if (activeChannel) {
          // Clear it so we don't auto-join again on next normal load
          localStorage.removeItem(ACTIVE_CHANNEL_KEY);
          joinChannel(activeChannel);
        } else {
          showChannelScreen();
        }
      });
    } else {
      // Check for active channel even when not logged in (anonymous mode)
      const activeChannel = localStorage.getItem(ACTIVE_CHANNEL_KEY);
      if (activeChannel) {
        localStorage.removeItem(ACTIVE_CHANNEL_KEY);
        joinChannel(activeChannel);
      } else {
        showLoginScreen();
      }
    }
  }

  /**
   * Load settings from localStorage
   */
  function loadSettings() {
    // Load autocomplete setting
    const savedAutocomplete = localStorage.getItem(AUTOCOMPLETE_KEY);
    autocompleteEnabled = savedAutocomplete !== 'false'; // Default to true

    // Update toggle UI
    if (autocompleteToggle) {
      autocompleteToggle.classList.toggle('active', autocompleteEnabled);
    }

    // Load HLS player setting
    if (hlsToggle) {
      hlsToggle.classList.toggle('active', HLSPlayer.isEnabled());
    }

    // Show iOS PWA notice if running as installed app on iOS
    const isIOSPWA = isIOS && (window.navigator.standalone === true || window.matchMedia('(display-mode: standalone)').matches);
    const iosPwaNotice = document.getElementById('ios-pwa-notice');
    if (iosPwaNotice && isIOSPWA) {
      iosPwaNotice.style.display = 'block';
    }

    // Load keyboard handling setting
    const savedKeyboardHandling = localStorage.getItem(KEYBOARD_HANDLING_KEY);
    keyboardHandlingEnabled = savedKeyboardHandling !== 'false'; // Default to true
    const keyboardHandlingToggle = document.getElementById('keyboard-handling-toggle');
    if (keyboardHandlingToggle) {
      keyboardHandlingToggle.classList.toggle('active', keyboardHandlingEnabled);
    }

    // Load mention autocomplete setting
    const savedMentionAutocomplete = localStorage.getItem(MENTION_AUTOCOMPLETE_KEY);
    mentionAutocompleteEnabled = savedMentionAutocomplete !== 'false'; // Default to true
    const mentionAutocompleteToggle = document.getElementById('mention-autocomplete-toggle');
    if (mentionAutocompleteToggle) {
      mentionAutocompleteToggle.classList.toggle('active', mentionAutocompleteEnabled);
    }

    // Load theme setting
    const savedTheme = localStorage.getItem(THEME_KEY) || 'auto';
    applyTheme(savedTheme);
    if (themeSelect) {
      themeSelect.value = savedTheme;
    }

    // Load font size setting
    const savedFontSize = localStorage.getItem(FONT_SIZE_KEY) || 'medium';
    applyFontSize(savedFontSize);
    const fontSizeSelect = document.getElementById('font-size-select');
    if (fontSizeSelect) {
      fontSizeSelect.value = savedFontSize;
    }

    // Load mention sounds setting
    const savedMentionSounds = localStorage.getItem(MENTION_SOUNDS_KEY);
    mentionSoundsEnabled = savedMentionSounds !== 'false'; // Default to true
    const mentionSoundsToggle = document.getElementById('mention-sounds-toggle');
    if (mentionSoundsToggle) {
      mentionSoundsToggle.classList.toggle('active', mentionSoundsEnabled);
    }

    // Load stream info setting
    const savedStreamInfo = localStorage.getItem(STREAM_INFO_KEY);
    streamInfoMode = savedStreamInfo || 'tap'; // Default to 'tap'
    if (streamInfoSelect) {
      streamInfoSelect.value = streamInfoMode;
    }

    // Load chat filter settings
    const savedHideBots = localStorage.getItem(HIDE_BOTS_KEY);
    hideBotsEnabled = savedHideBots === 'true';
    const hideBotsToggle = document.getElementById('hide-bots-toggle');
    if (hideBotsToggle) {
      hideBotsToggle.classList.toggle('active', hideBotsEnabled);
    }

    const savedHideCommands = localStorage.getItem(HIDE_COMMANDS_KEY);
    hideCommandsEnabled = savedHideCommands === 'true';
    const hideCommandsToggle = document.getElementById('hide-commands-toggle');
    if (hideCommandsToggle) {
      hideCommandsToggle.classList.toggle('active', hideCommandsEnabled);
    }

    const savedHideAnnouncements = localStorage.getItem(HIDE_ANNOUNCEMENTS_KEY);
    hideAnnouncementsEnabled = savedHideAnnouncements === 'true';
    const hideAnnouncementsToggle = document.getElementById('hide-announcements-toggle');
    if (hideAnnouncementsToggle) {
      hideAnnouncementsToggle.classList.toggle('active', hideAnnouncementsEnabled);
    }

    const savedFadeHistory = localStorage.getItem(FADE_HISTORY_KEY);
    fadeHistoryEnabled = savedFadeHistory !== 'false'; // Default to true
    const fadeHistoryToggle = document.getElementById('fade-history-toggle');
    if (fadeHistoryToggle) {
      fadeHistoryToggle.classList.toggle('active', fadeHistoryEnabled);
    }
    applyFadeHistorySetting();

    const savedBlockedUsers = localStorage.getItem(BLOCKED_USERS_KEY);
    blockedUsers = savedBlockedUsers ? savedBlockedUsers.split(',').map(u => u.trim().toLowerCase()).filter(u => u) : [];
    const blockedUsersInput = document.getElementById('blocked-users-input');
    if (blockedUsersInput && blockedUsers.length > 0) {
      blockedUsersInput.value = blockedUsers.join(', ');
    }

    // Load debug mode setting
    const debugToggle = document.getElementById('debug-toggle');
    const debugControls = document.getElementById('debug-controls');
    if (debugToggle) {
      const debugEnabled = DebugLogger.isEnabled();
      debugToggle.classList.toggle('active', debugEnabled);
      if (debugControls) {
        debugControls.style.display = debugEnabled ? 'block' : 'none';
      }
      updateDebugInfo();
    }
  }

  /**
   * Update debug log info display
   */
  function updateDebugInfo() {
    const logCountEl = document.getElementById('debug-log-count');
    const logSizeEl = document.getElementById('debug-log-size');

    if (logCountEl) {
      logCountEl.textContent = `${DebugLogger.getLogCount()} entries`;
    }
    if (logSizeEl) {
      const sizeKB = (DebugLogger.getStorageSize() / 1024).toFixed(1);
      logSizeEl.textContent = `${sizeKB} KB`;
    }
  }

  /**
   * Handle OAuth callback
   */
  function handleOAuthCallback() {
    try {
      const hash = window.location.hash.substring(1);
      const params = new URLSearchParams(hash);
      const token = params.get('access_token');

      if (token) {
        TwitchAPI.setAccessToken(token);

        // Clean URL
        window.history.replaceState({}, document.title, window.location.pathname);

        // Get user info
        TwitchAPI.getUser().then(user => {
          if (user) {
            console.log('Logged in as:', user.display_name);
          }
          showChannelScreen();
        });
      } else {
        showLoginScreen();
      }
    } catch (e) {
      console.error('OAuth callback error:', e);
      showLoginScreen();
    }
  }

  /**
   * Set up event listeners
   */
  function setupEventListeners() {
    // Login screen
    loginBtn?.addEventListener('click', () => {
      DebugLogger.logInteraction('App', 'Login button clicked', { method: 'twitch-oauth' });
      window.location.href = TwitchAPI.getAuthUrl();
    });

    anonymousBtn?.addEventListener('click', () => {
      DebugLogger.logInteraction('App', 'Anonymous login clicked', {});
      showChannelScreen();
    });

    // Browser back button handling
    window.addEventListener('popstate', (e) => {
      const state = e.state;
      DebugLogger.info('Navigation', 'Browser back pressed', {
        state,
        currentChannel
      });

      if (!state || state.screen === NAV_STATE.LOGIN) {
        // At base state (login) - prevent exit from app
        if (currentChannel) {
          // Clean up current channel if active
          leaveChannelInternal();
        }

        if (TwitchAPI.isLoggedIn()) {
          // Logged in - go to channel screen, push new state to prevent exit
          history.pushState({ screen: NAV_STATE.CHANNEL }, '', '');
          showChannelScreenInternal();
        } else {
          // Not logged in - show login, no state push (already at base)
          showLoginScreenInternal();
        }
      } else if (state.screen === NAV_STATE.CHANNEL) {
        // Going back from stream to channel
        if (currentChannel) {
          leaveChannelInternal();
        }
        showChannelScreenInternal();
      }
      // NAV_STATE.STREAM case doesn't happen on popstate (that would be forward)
    });

    // Channel screen
    channelGoBtn?.addEventListener('click', () => {
      const channel = parseChannel(channelInput.value);
      if (channel) {
        DebugLogger.logInteraction('App', 'Join channel clicked', { channel });
        joinChannel(channel);
      }
    });

    channelInput?.addEventListener('keydown', (e) => {
      if (e.isComposing || e.keyCode === 229) return;
      if (e.key === 'Enter') {
        const channel = parseChannel(channelInput.value);
        if (channel) {
          joinChannel(channel);
        }
      }
    });

    userMenuBtn?.addEventListener('click', () => {
      DebugLogger.logInteraction('App', 'Settings menu opened', { source: 'channel-screen' });
      showUserMenu();
    });
    settingsBtnVideo?.addEventListener('click', () => {
      DebugLogger.logInteraction('App', 'Settings menu opened', { source: 'video-screen' });
      showUserMenu();
    });

    // Stream screen
    backBtn?.addEventListener('click', () => {
      DebugLogger.logInteraction('App', 'Back button clicked', { channel: currentChannel });
      leaveChannel();
    });

    chatSendBtn?.addEventListener('click', sendChat);

    chatInput?.addEventListener('input', handleAutocomplete);
    chatInput?.addEventListener('input', updateTextEffectsPreview);

    chatInput?.addEventListener('keydown', (e) => {
      // Ignore Enter while composing with an IME (e.g. Japanese keyboards)
      if (e.isComposing || e.keyCode === 229) return;

      if (e.key === 'Enter') {
        // Enter selects only if user explicitly navigated to a suggestion;
        // otherwise it sends the message (keydown is more reliable than the
        // deprecated keypress event on mobile keyboards)
        if (autocompleteMatches.length && autocompleteSelectedIndex >= 0) {
          e.preventDefault();
          selectAutocompleteEmote(autocompleteSelectedIndex);
        } else {
          e.preventDefault();
          closeAutocomplete();
          sendChat();
        }
        return;
      }

      if (!autocompleteMatches.length) return;

      if (e.key === 'Tab') {
        e.preventDefault();
        // Tab selects first item if nothing selected (for keyboard navigation)
        const indexToSelect = autocompleteSelectedIndex >= 0 ? autocompleteSelectedIndex : 0;
        selectAutocompleteEmote(indexToSelect);
      } else if (e.key === 'ArrowRight') {
        e.preventDefault();
        autocompleteSelectedIndex = Math.min(autocompleteSelectedIndex + 1, autocompleteMatches.length - 1);
        renderAutocomplete();
      } else if (e.key === 'ArrowLeft') {
        e.preventDefault();
        autocompleteSelectedIndex = Math.max(autocompleteSelectedIndex - 1, 0);
        renderAutocomplete();
      } else if (e.key === 'Escape') {
        closeAutocomplete();
      }
    });

    chatLoginBtn?.addEventListener('click', () => {
      window.location.href = TwitchAPI.getAuthUrl();
    });

    // Emote picker
    emotePickerBtn?.addEventListener('click', () => {
      DebugLogger.logInteraction('App', 'Emote picker toggled', {});
      toggleEmotePicker();
    });
    emotePickerClose?.addEventListener('click', () => {
      DebugLogger.logInteraction('App', 'Emote picker closed', {});
      closeEmotePicker();
    });

    // Emote search - only shows local/channel-loaded emotes (no API search)
    emoteSearch?.addEventListener('input', () => {
      const search = emoteSearch.value;
      renderEmotes(currentEmoteProvider, search);
    });

    emoteTabs.forEach(tab => {
      tab.addEventListener('click', () => {
        emoteTabs.forEach(t => t.classList.remove('active'));
        tab.classList.add('active');
        currentEmoteProvider = tab.dataset.provider;
        renderEmotes(currentEmoteProvider, emoteSearch.value);
      });
    });

    // Text effects picker
    textEffectsBtn?.addEventListener('click', () => {
      DebugLogger.logInteraction('App', 'Text effects picker toggled', {});
      toggleTextEffectsPicker();
    });
    textEffectsClose?.addEventListener('click', () => {
      DebugLogger.logInteraction('App', 'Text effects picker closed', {});
      closeTextEffectsPicker();
    });

    // User menu
    logoutBtn?.addEventListener('click', () => {
      DebugLogger.logInteraction('App', 'Logout clicked', {});
      TwitchAPI.logout();
      TwitchIRC.disconnect();
      hideUserMenu();
      showLoginScreen();
    });

    menuCloseBtn?.addEventListener('click', () => {
      DebugLogger.logInteraction('App', 'Settings menu closed', {});
      hideUserMenu();
    });

    // Help modal
    helpBtn?.addEventListener('click', () => {
      DebugLogger.logInteraction('App', 'Help modal opened', {});
      showHelpModal();
    });
    helpCloseBtn?.addEventListener('click', () => {
      DebugLogger.logInteraction('App', 'Help modal closed', {});
      hideHelpModal();
    });
    helpModal?.addEventListener('click', (e) => {
      if (e.target === helpModal) {
        DebugLogger.logInteraction('App', 'Help modal closed', { method: 'backdrop-click' });
        hideHelpModal();
      }
    });

    // Settings - HLS Player toggle
    hlsToggle?.addEventListener('click', () => {
      const newState = !HLSPlayer.isEnabled();
      DebugLogger.logInteraction('Settings', 'HLS Player toggle', { enabled: newState });
      HLSPlayer.setEnabled(newState);
      hlsToggle.classList.toggle('active', newState);

      // If currently watching a channel, reload with new player setting
      if (currentChannel && streamScreen.style.display !== 'none') {
        const channelToReload = currentChannel;
        // Small delay to let UI update
        setTimeout(() => {
          joinChannel(channelToReload);
        }, 100);
      }
    });

    // Settings - Autocomplete toggle
    autocompleteToggle?.addEventListener('click', () => {
      autocompleteEnabled = !autocompleteEnabled;
      DebugLogger.logInteraction('Settings', 'Emote Autocomplete toggle', { enabled: autocompleteEnabled });
      autocompleteToggle.classList.toggle('active', autocompleteEnabled);
      localStorage.setItem(AUTOCOMPLETE_KEY, autocompleteEnabled.toString());

      // Close autocomplete if disabled
      if (!autocompleteEnabled) {
        closeAutocomplete();
      }
    });

    // Settings - Mention Autocomplete toggle
    const mentionAutocompleteToggle = document.getElementById('mention-autocomplete-toggle');
    mentionAutocompleteToggle?.addEventListener('click', () => {
      mentionAutocompleteEnabled = !mentionAutocompleteEnabled;
      DebugLogger.logInteraction('Settings', 'Mention Autocomplete toggle', { enabled: mentionAutocompleteEnabled });
      mentionAutocompleteToggle.classList.toggle('active', mentionAutocompleteEnabled);
      localStorage.setItem(MENTION_AUTOCOMPLETE_KEY, mentionAutocompleteEnabled.toString());

      // Close autocomplete if disabled and currently showing mentions
      if (!mentionAutocompleteEnabled && autocompleteMode === 'mention') {
        closeAutocomplete();
      }
    });

    // Settings - Keyboard Handling toggle
    const keyboardHandlingToggle = document.getElementById('keyboard-handling-toggle');
    keyboardHandlingToggle?.addEventListener('click', () => {
      keyboardHandlingEnabled = !keyboardHandlingEnabled;
      DebugLogger.logInteraction('Settings', 'Keyboard Handling toggle', { enabled: keyboardHandlingEnabled });
      keyboardHandlingToggle.classList.toggle('active', keyboardHandlingEnabled);
      localStorage.setItem(KEYBOARD_HANDLING_KEY, keyboardHandlingEnabled.toString());

      // If disabled while keyboard is open, reset to default behavior
      if (!keyboardHandlingEnabled) {
        document.body.classList.remove('keyboard-visible');
        const streamScreenEl = document.getElementById('stream-screen');
        if (streamScreenEl) {
          streamScreenEl.style.removeProperty('height');
        }
      }
    });

    // Settings - Ad-Free Auth Token section
    const adfreeToggleHeader = document.getElementById('adfree-toggle-header');
    const adfreeContent = document.getElementById('adfree-content');
    const adfreeStatus = document.getElementById('adfree-status');
    const gqlAuthTokenInput = document.getElementById('gql-auth-token-input');
    const gqlAuthTokenSave = document.getElementById('gql-auth-token-save');
    const gqlAuthTokenClear = document.getElementById('gql-auth-token-clear');
    const adfreeHelpLink = document.getElementById('adfree-help-link');

    // Update ad-free status display
    function updateAdfreeStatus() {
      if (adfreeStatus && HLSPlayer.hasGqlAuthToken) {
        const hasToken = HLSPlayer.hasGqlAuthToken();
        const dot = adfreeStatus.querySelector('.status-dot');
        const text = adfreeStatus.querySelector('span:last-child');
        if (dot && text) {
          dot.classList.toggle('status-dot-active', hasToken);
          dot.classList.toggle('status-dot-inactive', !hasToken);
          text.textContent = hasToken ? 'Token configured' : 'Not configured';
        }
      }
    }

    // Initialize ad-free status on load
    updateAdfreeStatus();

    // Toggle collapsible section
    adfreeToggleHeader?.addEventListener('click', () => {
      const isExpanded = adfreeContent.style.display !== 'none';
      adfreeContent.style.display = isExpanded ? 'none' : 'block';
      const chevron = adfreeToggleHeader.querySelector('.settings-chevron');
      if (chevron) {
        chevron.style.transform = isExpanded ? '' : 'rotate(180deg)';
      }
    });

    // Save token
    gqlAuthTokenSave?.addEventListener('click', () => {
      const token = gqlAuthTokenInput.value.trim();
      if (token) {
        HLSPlayer.setGqlAuthToken(token);
        gqlAuthTokenInput.value = '';
        updateAdfreeStatus();

        // If currently using HLS player, reload to use new token
        if (currentChannel && HLSPlayer.isEnabled() && streamScreen.style.display !== 'none') {
          setTimeout(() => joinChannel(currentChannel), 100);
        }
      }
    });

    // Clear token
    gqlAuthTokenClear?.addEventListener('click', () => {
      HLSPlayer.setGqlAuthToken(null);
      gqlAuthTokenInput.value = '';
      updateAdfreeStatus();
    });

    // Help link - scroll to ad-free section in help modal
    adfreeHelpLink?.addEventListener('click', (e) => {
      e.preventDefault();
      hideUserMenu();
      showHelpModal();
      // Scroll to ad-free section after modal opens
      setTimeout(() => {
        const helpContent = document.querySelector('.help-content');
        const adfreeHelp = document.getElementById('adfree-help-section');
        if (helpContent && adfreeHelp) {
          adfreeHelp.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
      }, 100);
    });

    userMenu?.addEventListener('click', (e) => {
      if (e.target === userMenu) {
        hideUserMenu();
      }
    });

    // Settings - Theme selector
    themeSelect?.addEventListener('change', () => {
      const theme = themeSelect.value;
      DebugLogger.logInteraction('Settings', 'Theme changed', { theme });
      localStorage.setItem(THEME_KEY, theme);
      applyTheme(theme);
    });

    // Listen for system theme changes (for auto mode)
    window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', () => {
      const savedTheme = localStorage.getItem(THEME_KEY) || 'auto';
      if (savedTheme === 'auto') {
        applyTheme('auto');
      }
    });

    // Settings - Sleep Timer (dropdown in settings)
    sleepTimerSelect?.addEventListener('change', () => {
      const minutes = parseInt(sleepTimerSelect.value, 10);
      DebugLogger.logInteraction('Settings', 'Sleep timer changed', { minutes });
      setSleepTimer(minutes);
    });

    // Sleep Timer quick-access button (cycles through options)
    sleepTimerBtn?.addEventListener('click', () => {
      DebugLogger.logInteraction('App', 'Sleep timer cycled', {});
      cycleSleepTimer();
    });

    // Open in Twitch button
    openTwitchBtn?.addEventListener('click', openInTwitchApp);
    refreshBtn?.addEventListener('click', () => {
      // Save current channel so we return to it after reload
      if (currentChannel) {
        localStorage.setItem(ACTIVE_CHANNEL_KEY, currentChannel);
      }
      window.location.reload();
    });

    // Chat toggle handlers
    // chatToggleOpen (minimize button in landscape chat bar) - hides chat
    chatToggleOpen?.addEventListener('click', () => {
      DebugLogger.logInteraction('App', 'Chat hidden', {});
      document.body.classList.add('chat-hidden');
    });
    // chatToggleClosed (button on video lower-right) - toggles chat visibility
    chatToggleClosed?.addEventListener('click', () => {
      const wasHidden = document.body.classList.contains('chat-hidden');
      DebugLogger.logInteraction('App', 'Chat visibility toggled', { visible: wasHidden });
      document.body.classList.toggle('chat-hidden');
    });

    // Settings - Stream Info selector
    streamInfoSelect?.addEventListener('change', () => {
      streamInfoMode = streamInfoSelect.value;
      DebugLogger.logInteraction('Settings', 'Stream Info mode changed', { mode: streamInfoMode });
      localStorage.setItem(STREAM_INFO_KEY, streamInfoMode);
      applyStreamInfoMode();
    });

    // Settings - Hide Bots toggle
    const hideBotsToggle = document.getElementById('hide-bots-toggle');
    hideBotsToggle?.addEventListener('click', () => {
      hideBotsEnabled = !hideBotsEnabled;
      DebugLogger.logInteraction('Settings', 'Hide Bots toggle', { enabled: hideBotsEnabled });
      localStorage.setItem(HIDE_BOTS_KEY, hideBotsEnabled.toString());
      hideBotsToggle.classList.toggle('active', hideBotsEnabled);
    });

    // Settings - Hide Commands toggle
    const hideCommandsToggle = document.getElementById('hide-commands-toggle');
    hideCommandsToggle?.addEventListener('click', () => {
      hideCommandsEnabled = !hideCommandsEnabled;
      DebugLogger.logInteraction('Settings', 'Hide Commands toggle', { enabled: hideCommandsEnabled });
      localStorage.setItem(HIDE_COMMANDS_KEY, hideCommandsEnabled.toString());
      hideCommandsToggle.classList.toggle('active', hideCommandsEnabled);
    });

    // Settings - Hide Announcements toggle
    const hideAnnouncementsToggle = document.getElementById('hide-announcements-toggle');
    hideAnnouncementsToggle?.addEventListener('click', () => {
      hideAnnouncementsEnabled = !hideAnnouncementsEnabled;
      DebugLogger.logInteraction('Settings', 'Hide Announcements toggle', { enabled: hideAnnouncementsEnabled });
      localStorage.setItem(HIDE_ANNOUNCEMENTS_KEY, hideAnnouncementsEnabled.toString());
      hideAnnouncementsToggle.classList.toggle('active', hideAnnouncementsEnabled);
    });

    // Settings - Fade Chat History toggle
    const fadeHistoryToggle = document.getElementById('fade-history-toggle');
    fadeHistoryToggle?.addEventListener('click', () => {
      fadeHistoryEnabled = !fadeHistoryEnabled;
      DebugLogger.logInteraction('Settings', 'Fade Chat History toggle', { enabled: fadeHistoryEnabled });
      localStorage.setItem(FADE_HISTORY_KEY, fadeHistoryEnabled.toString());
      fadeHistoryToggle.classList.toggle('active', fadeHistoryEnabled);
      applyFadeHistorySetting();
    });

    // Settings - Blocked Users input
    const blockedUsersInput = document.getElementById('blocked-users-input');
    blockedUsersInput?.addEventListener('change', () => {
      const value = blockedUsersInput.value;
      blockedUsers = value.split(',').map(u => u.trim().toLowerCase()).filter(u => u);
      localStorage.setItem(BLOCKED_USERS_KEY, blockedUsers.join(','));
    });

    // Settings - Debug Mode toggle
    const debugToggle = document.getElementById('debug-toggle');
    const debugControls = document.getElementById('debug-controls');
    debugToggle?.addEventListener('click', () => {
      const isEnabled = DebugLogger.isEnabled();
      if (isEnabled) {
        DebugLogger.disable();
        debugToggle.classList.remove('active');
        if (debugControls) debugControls.style.display = 'none';
      } else {
        DebugLogger.enable();
        debugToggle.classList.add('active');
        if (debugControls) debugControls.style.display = 'block';
        DebugLogger.info('App', 'Debug mode enabled via settings');
      }
      updateDebugInfo();
    });

    // Debug - Copy logs button
    const debugCopyBtn = document.getElementById('debug-copy-btn');
    debugCopyBtn?.addEventListener('click', async () => {
      const result = await DebugLogger.copyToClipboard();
      if (result.success) {
        debugCopyBtn.textContent = 'Copied!';
        debugCopyBtn.classList.add('copy-success');
        setTimeout(() => {
          debugCopyBtn.textContent = 'Copy Logs';
          debugCopyBtn.classList.remove('copy-success');
        }, 2000);
      } else {
        debugCopyBtn.textContent = 'Failed';
        setTimeout(() => {
          debugCopyBtn.textContent = 'Copy Logs';
        }, 2000);
      }
    });

    // Debug - Clear logs button
    const debugClearBtn = document.getElementById('debug-clear-btn');
    debugClearBtn?.addEventListener('click', () => {
      DebugLogger.clear();
      updateDebugInfo();
      DebugLogger.info('App', 'Logs cleared by user');
    });

    // Settings - Font Size selector
    const fontSizeSelect = document.getElementById('font-size-select');
    fontSizeSelect?.addEventListener('change', () => {
      const size = fontSizeSelect.value;
      DebugLogger.logInteraction('Settings', 'Font size changed', { size });
      localStorage.setItem(FONT_SIZE_KEY, size);
      applyFontSize(size);
    });

    // Settings - Mention Sounds toggle
    const mentionSoundsToggle = document.getElementById('mention-sounds-toggle');
    mentionSoundsToggle?.addEventListener('click', () => {
      mentionSoundsEnabled = !mentionSoundsEnabled;
      DebugLogger.logInteraction('Settings', 'Mention Sounds toggle', { enabled: mentionSoundsEnabled });
      localStorage.setItem(MENTION_SOUNDS_KEY, mentionSoundsEnabled.toString());
      mentionSoundsToggle.classList.toggle('active', mentionSoundsEnabled);
    });

    // Picture-in-Picture button
    pipBtn?.addEventListener('click', () => {
      DebugLogger.logInteraction('App', 'PiP button clicked', {});
      togglePictureInPicture();
    });

    // PiP keyboard shortcut
    document.addEventListener('keydown', (e) => {
      // Only trigger if not typing in an input
      if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') return;
      if (e.key === 'p' || e.key === 'P') {
        // Only toggle PiP when on stream screen
        if (streamScreen.style.display !== 'none') {
          togglePictureInPicture();
        }
      }
    });

    // Listen for PiP state changes
    hlsVideo?.addEventListener('enterpictureinpicture', () => {
      pipBtn?.classList.add('active');
    });
    hlsVideo?.addEventListener('leavepictureinpicture', () => {
      pipBtn?.classList.remove('active');
    });

    // Handle visibility change for background audio and PiP
    document.addEventListener('visibilitychange', async () => {
      if (document.hidden) {
        // App going to background
        if (usingHLSPlayer && hlsVideo && !hlsVideo.paused) {
          // Update Media Session state for lock screen controls
          MediaSessionManager.updatePlaybackState('playing');

          // Try PiP for video visibility on Android
          if (document.pictureInPictureEnabled && !document.pictureInPictureElement) {
            hlsVideo.requestPictureInPicture().catch(() => {
              // Silently fail - PiP may not be available in all contexts
            });
          }
        }
      } else {
        // App returning to foreground
        if (usingHLSPlayer && hlsVideo) {
          // Re-acquire Wake Lock if video is playing
          if (!hlsVideo.paused) {
            await requestWakeLock();
          }
          // Sync Media Session state
          MediaSessionManager.updatePlaybackState(hlsVideo.paused ? 'paused' : 'playing');
        }
      }
    });

    // Video controls show/hide on tap (mobile)
    const videoSection = document.getElementById('video-section');
    let controlsTimeout = null;

    function showVideoControls() {
      videoSection?.classList.add('controls-visible');
      clearTimeout(controlsTimeout);
      controlsTimeout = setTimeout(() => {
        videoSection?.classList.remove('controls-visible');
      }, 3000);
    }

    videoSection?.addEventListener('click', (e) => {
      // Don't trigger if clicking on a button
      if (e.target.closest('button')) return;
      showVideoControls();
    });

    // Set up IRC callbacks
    TwitchIRC.setCallbacks({
      onMessage: handleChatMessage,
      onSystem: handleSystemMessage,
      onConnected: handleConnected,
      onDisconnected: handleDisconnected
    });

    // Set up keyboard detection for mobile
    setupKeyboardDetection();

    // Set up chat scroll handler for pause/resume
    setupChatScrollHandler();

    // Set up scroll lock to prevent unwanted touch scrolling
    setupScrollLock();

    // Set up easter egg
    setupEasterEgg();
  }

  /**
   * Set up keyboard handling for mobile
   * Uses Visual Viewport API to detect keyboard and adjust layout
   * Directly sets pixel heights since Safari doesn't update dvh when keyboard opens
   */
  function setupKeyboardDetection() {
    try {
      const streamScreen = document.getElementById('stream-screen');

      // Use module-scope isIOS and isAndroid for device detection
      const hasVisualViewport = !!window.visualViewport;

      // Log device info for debugging
      console.log('Keyboard detection: iOS=' + isIOS + ', Android=' + isAndroid + ', hasVisualViewport=' + hasVisualViewport);

      // Warn if Visual Viewport API is not available (older browsers)
      if (!hasVisualViewport) {
        console.warn('Visual Viewport API not available. Smart keyboard layout may not work optimally on this browser.');
      }

      // Track keyboard state - trust focus events over viewport calculations
      let isInputFocused = false;
      let initialHeight = window.innerHeight;

    function applyKeyboardHeight(height) {
      if (!streamScreen) return;
      // Use setProperty with priority to ensure CSS doesn't override
      streamScreen.style.setProperty('height', `${height}px`, 'important');

      // Publish the keyboard overlap as a CSS variable so fixed-position
      // elements (emote picker, CSS fallback rules) can lift above the
      // keyboard. On Android (resizes-content) the layout viewport already
      // shrinks, so this resolves to ~0; on iOS it equals keyboard height.
      const vv = window.visualViewport;
      const overlap = vv ? Math.max(0, window.innerHeight - vv.height - vv.offsetTop) : 0;
      document.documentElement.style.setProperty('--keyboard-height', `${Math.round(overlap)}px`);
    }

    function resetHeight() {
      if (!streamScreen) return;
      streamScreen.style.removeProperty('height');
      document.documentElement.style.setProperty('--keyboard-height', '0px');
    }

    function openKeyboard() {
      // Skip keyboard handling if disabled
      if (!keyboardHandlingEnabled) return;

      document.body.classList.add('keyboard-visible');

      // Apply current viewport height if available
      if (window.visualViewport) {
        applyKeyboardHeight(window.visualViewport.height);
      }
    }

    function closeKeyboard() {
      document.body.classList.remove('keyboard-visible');
      resetHeight();

      // Reposition autocomplete if open (it needs to move down with the chat input)
      if (emoteAutocomplete?.classList.contains('open')) {
        // Wait for layout to settle after height reset
        requestAnimationFrame(() => {
          const chatInputAreaEl = document.querySelector('.chat-input-area');
          if (chatInputAreaEl) {
            const rect = chatInputAreaEl.getBoundingClientRect();
            emoteAutocomplete.style.bottom = (window.innerHeight - rect.top) + 'px';
          }
        });
      }
    }

    // Focus/blur listeners - these are the source of truth for keyboard state.
    // Use focusin/focusout on the stream screen so EVERY text input there
    // (chat input AND emote picker search) triggers keyboard layout handling.
    function isTextInput(el) {
      return !!el && el.tagName === 'INPUT' && (el.type === 'text' || el.type === 'search');
    }

    if (streamScreen) {
      streamScreen.addEventListener('focusin', (e) => {
        if (!isTextInput(e.target)) return;
        isInputFocused = true;
        // Store initial height before keyboard opens
        if (window.visualViewport) {
          initialHeight = window.visualViewport.height;
        }
        // Keep the layout pinned to the top - iOS pans the page when focusing
        window.scrollTo(0, 0);
        // Android needs longer delay for keyboard animation
        const delay = isAndroid ? 150 : 50;
        setTimeout(openKeyboard, delay);
      });

      streamScreen.addEventListener('focusout', (e) => {
        if (!isTextInput(e.target)) return;
        isInputFocused = false;
        // Delay to handle tapping send button without closing keyboard prematurely
        // Android needs longer delay due to slower focus transfer
        const delay = isAndroid ? 350 : 200;
        setTimeout(() => {
          // Only close if still not focused on an input
          if (!document.activeElement?.matches('input, textarea')) {
            closeKeyboard();
          }
        }, delay);
      });
    }

    // Visual Viewport API for dynamic resizing
    if (window.visualViewport && streamScreen) {
      initialHeight = window.visualViewport.height;

      // On PWA first launch, viewport may not be stable yet - recapture after settle
      requestAnimationFrame(() => {
        setTimeout(() => {
          if (!isInputFocused && window.visualViewport) {
            initialHeight = window.visualViewport.height;
          }
        }, 100);
      });

      // Debounce timer for Android resize events
      let resizeDebounceTimer = null;

      function handleViewportResizeCore() {
        // Skip if keyboard handling is disabled
        if (!keyboardHandlingEnabled) return;

        const vv = window.visualViewport;

        // Update initial height only when keyboard is definitely closed
        // (viewport grows AND input is not focused)
        if (vv.height > initialHeight && !isInputFocused) {
          initialHeight = vv.height;
        }

        // If input is focused, always apply the viewport height
        // Don't rely on keyboard height calculation - trust the focus state
        if (isInputFocused) {
          // Use requestAnimationFrame to ensure layout updates before paint
          requestAnimationFrame(() => {
            applyKeyboardHeight(vv.height);
          });

          // Scroll chat to bottom after resize settles
          setTimeout(() => {
            if (chatMessages) {
              chatMessages.scrollTop = chatMessages.scrollHeight;
            }
          }, 50);
        }
        // If input lost focus but we still have a reduced height,
        // wait for blur handler to reset (don't reset here to avoid race conditions)
      }

      function handleViewportResize() {
        // Android fires rapid resize events during keyboard animation
        // Debounce to prevent layout thrashing
        if (isAndroid) {
          if (resizeDebounceTimer) {
            clearTimeout(resizeDebounceTimer);
          }
          resizeDebounceTimer = setTimeout(handleViewportResizeCore, 50);
        } else {
          // iOS and other platforms: apply immediately
          handleViewportResizeCore();
        }
      }

      window.visualViewport.addEventListener('resize', handleViewportResize);

      // For iOS Safari, prevent page from scrolling when keyboard pushes viewport
      if (isIOS) {
        window.visualViewport.addEventListener('scroll', () => {
          if (keyboardHandlingEnabled && window.visualViewport.offsetTop > 0) {
            window.scrollTo(0, 0);
          }
        });
      }
    }

    // Handle orientation changes - force blur to reset everything cleanly
    // iOS keyboard behavior during rotation is unreliable, so we dismiss it entirely
    function handleOrientationChange() {
      // Force blur any focused input to dismiss keyboard
      // This is the most reliable way to handle rotation - let user re-tap to open keyboard
      if (document.activeElement?.matches('input, textarea')) {
        document.activeElement.blur();
      }

      // Clear any stale keyboard state
      isInputFocused = false;
      document.body.classList.remove('keyboard-visible');

      // Close autocomplete since keyboard is dismissing
      if (emoteAutocomplete) {
        emoteAutocomplete.classList.remove('open');
        emoteAutocomplete.style.removeProperty('bottom');
        emoteAutocomplete.style.removeProperty('left');
        emoteAutocomplete.style.removeProperty('right');
        emoteAutocomplete.style.removeProperty('width');
      }

      // Reset height immediately
      resetHeight();

      // Wait for orientation change to complete, then recapture initial height
      // But only if user hasn't already tapped back into the input
      setTimeout(() => {
        // Reset chat-hidden state when rotating back to portrait (always, regardless of focus)
        const isPortrait = window.innerHeight > window.innerWidth;
        if (isPortrait) {
          document.body.classList.remove('chat-hidden');
        }

        // Guard: if user has focused input during this delay, don't overwrite their state
        if (isInputFocused) return;

        if (window.visualViewport) {
          initialHeight = window.visualViewport.height;
        } else {
          initialHeight = window.innerHeight;
        }
        // Final cleanup - ensure no stale state
        resetHeight();
      }, 300);
    }

    // window.orientationchange is deprecated and unreliable on some Android
    // browsers - register both APIs (the handler is idempotent if both fire)
    window.addEventListener('orientationchange', handleOrientationChange);
    if (screen.orientation && typeof screen.orientation.addEventListener === 'function') {
      screen.orientation.addEventListener('change', handleOrientationChange);
    }
    } catch (error) {
      // Graceful degradation - if keyboard detection fails, let browser handle natively
      console.error('Keyboard detection setup failed:', error);
      console.warn('Smart keyboard layout disabled. Using default browser behavior.');
    }
  }

  /**
   * Set up scroll lock to prevent touch scrolling on non-scrollable areas
   * This completely prevents the touch gesture from starting, avoiding the snap-back glitch
   */
  function setupScrollLock() {
    const streamScreenEl = document.getElementById('stream-screen');
    const videoSection = document.querySelector('.video-section');
    const chatMessagesEl = document.getElementById('chat-messages');
    const emoteAutocompleteEl = document.getElementById('emote-autocomplete');
    const emotePickerEl = document.getElementById('emote-picker');

    // Helper to check if an element can actually scroll
    function canScroll(el) {
      if (!el) return false;
      return el.scrollHeight > el.clientHeight;
    }

    // Helper to check if touch is in a scrollable area
    function isInScrollableArea(target) {
      // Chat messages - always allow scrolling (even with few messages, for scroll tracking)
      if (chatMessagesEl?.contains(target)) {
        return true;
      }
      // Emote autocomplete - only if it has enough content to scroll
      if (emoteAutocompleteEl?.contains(target) && canScroll(emoteAutocompleteEl)) {
        return true;
      }
      // Emote picker - always scrollable when open
      if (emotePickerEl?.contains(target)) {
        return true;
      }
      return false;
    }

    // Prevent touchmove on stream screen, but allow scrollable areas
    if (streamScreenEl) {
      streamScreenEl.addEventListener('touchmove', (e) => {
        if (!isInScrollableArea(e.target)) {
          e.preventDefault();
        }
      }, { passive: false });
    }

    // Always prevent touchmove on video section
    if (videoSection) {
      videoSection.addEventListener('touchmove', (e) => {
        e.preventDefault();
      }, { passive: false });
    }
  }

  /**
   * Show login screen (internal - no history push)
   */
  function showLoginScreenInternal() {
    loginScreen.style.display = 'flex';
    channelScreen.style.display = 'none';
    streamScreen.style.display = 'none';
  }

  /**
   * Show login screen with history management
   */
  function showLoginScreen() {
    showLoginScreenInternal();
    // Replace state for login (base state - nothing to go back to)
    history.replaceState({ screen: NAV_STATE.LOGIN }, '', '');
    DebugLogger.info('Navigation', 'Screen transition', { to: 'login' });
  }

  /**
   * Show channel selection screen (internal - no history push)
   */
  function showChannelScreenInternal() {
    loginScreen.style.display = 'none';
    channelScreen.style.display = 'flex';
    streamScreen.style.display = 'none';
    loadChannelLists();
  }

  /**
   * Show channel selection screen with history management
   */
  function showChannelScreen() {
    showChannelScreenInternal();
    // Push state only if not already on channel screen (prevents duplicate entries)
    if (history.state?.screen !== NAV_STATE.CHANNEL) {
      history.pushState({ screen: NAV_STATE.CHANNEL }, '', '');
    }
    DebugLogger.info('Navigation', 'Screen transition', { to: 'channel' });
  }

  /**
   * Show stream screen (internal - no history push)
   */
  function showStreamScreenInternal() {
    loginScreen.style.display = 'none';
    channelScreen.style.display = 'none';
    streamScreen.style.display = 'flex';

    // Show/hide chat input based on login status
    if (TwitchAPI.isLoggedIn()) {
      chatInputArea.style.display = 'flex';
      loginPrompt.style.display = 'none';
    } else {
      chatInputArea.style.display = 'none';
      loginPrompt.style.display = 'flex';
    }
  }

  /**
   * Show stream screen with history management
   */
  function showStreamScreen() {
    showStreamScreenInternal();
    // Push state only if not already on stream screen
    if (history.state?.screen !== NAV_STATE.STREAM) {
      history.pushState({ screen: NAV_STATE.STREAM }, '', '');
    }
    DebugLogger.info('Navigation', 'Screen transition', { to: 'stream', channel: currentChannel });
  }

  /**
   * Load channel lists (followed, recent)
   */
  async function loadChannelLists() {
    // Load recent channels
    const recent = getRecentChannels();
    renderChannelList(recentChannels, recent, false);

    // Load followed channels if logged in
    if (TwitchAPI.isLoggedIn()) {
      followedSection.style.display = 'block';
      followedOfflineSection.style.display = 'block';

      liveChannels.innerHTML = '<div class="loading">Loading...</div>';

      const channels = await TwitchAPI.getFollowedChannelsWithLiveStatus();

      if (channels.length === 1 && channels[0]._error) {
        liveChannels.innerHTML = `<div class="error">${channels[0].message}</div>`;
        followedChannels.innerHTML = '';
        return;
      }

      const live = channels.filter(c => c.isLive);
      const offline = channels.filter(c => !c.isLive).slice(0, 15);

      if (live.length > 0) {
        renderChannelList(liveChannels, live, true);
      } else {
        liveChannels.innerHTML = '<div class="empty">No live channels</div>';
      }

      renderChannelList(followedChannels, offline, false);
    } else {
      followedSection.style.display = 'none';
      followedOfflineSection.style.display = 'none';
    }
  }

  /**
   * Render a channel list
   */
  function renderChannelList(container, channels, showLiveInfo) {
    container.innerHTML = '';

    if (!channels || channels.length === 0) {
      container.innerHTML = '<div class="empty">No channels</div>';
      return;
    }

    channels.forEach(channel => {
      const name = typeof channel === 'string' ? channel : channel.login;
      const displayName = typeof channel === 'string' ? channel : (channel.displayName || channel.login);
      const isLive = channel.isLive || false;

      const div = document.createElement('div');
      div.className = 'channel-item' + (isLive ? ' live' : '');
      div.innerHTML = `
        <div class="channel-avatar">${escapeHtml(displayName.charAt(0).toUpperCase())}</div>
        <div class="channel-info">
          <div class="channel-name">${escapeHtml(displayName)}</div>
          ${showLiveInfo && channel.gameName ? `<div class="channel-game">${escapeHtml(channel.gameName)}</div>` : ''}
        </div>
        ${showLiveInfo && isLive ? `
          <div class="channel-viewers">
            <span class="live-dot"></span>
            ${formatViewerCount(channel.viewerCount)}
          </div>
        ` : ''}
      `;

      div.addEventListener('click', () => joinChannel(name));
      container.appendChild(div);
    });
  }

  /**
   * Join a channel
   */
  async function joinChannel(channelName) {
    currentChannel = channelName.toLowerCase();
    DebugLogger.info('App', 'Joining channel', { channel: currentChannel });

    // Add to recent
    addRecentChannel(currentChannel);

    // Clear chat
    chatMessages.innerHTML = '';

    // Show stream screen
    showStreamScreen();

    // Update offline display
    offlineAvatar.textContent = currentChannel.charAt(0).toUpperCase();
    offlineChannel.textContent = currentChannel;

    // Load emotes for this channel
    EmoteLoader.loadEmotes(currentChannel);

    // Start stream info polling
    startStreamInfoPolling();

    // Decide which video player to use
    // Use HLS player if worker URL is configured
    if (HLSPlayer.isAvailable()) {
      await loadHLSPlayer(currentChannel);
    } else {
      loadTwitchEmbed(currentChannel);
    }

    // Connect to IRC
    const options = {};
    if (TwitchAPI.isLoggedIn()) {
      options.oauthToken = TwitchAPI.getAccessToken();
      options.username = TwitchAPI.getUsername();
    }

    TwitchIRC.connect(currentChannel, options);
  }

  /**
   * Internal channel cleanup (no screen transition or history push)
   * Used by popstate handler
   */
  function leaveChannelInternal() {
    DebugLogger.info('App', 'Leaving channel (internal)', { channel: currentChannel });
    TwitchIRC.disconnect();

    // Stop HLS player if active
    if (usingHLSPlayer) {
      HLSPlayer.stop();
      hlsVideo.classList.remove('active');
      usingHLSPlayer = false;
    }

    // Remove Twitch embed
    if (twitchPlayer) {
      twitchEmbed.innerHTML = '';
      twitchPlayer = null;
    }

    // Clear chat users for next channel
    chatUsers.clear();

    // Stop stream info polling
    stopStreamInfoPolling();

    // Clear sleep timer
    clearSleepTimer();
    if (sleepTimerSelect) {
      sleepTimerSelect.value = '0';
    }

    // Exit PiP if active
    if (document.pictureInPictureElement) {
      document.exitPictureInPicture().catch(() => {});
    }

    // Clear Media Session and release Wake Lock
    MediaSessionManager.clear();
    releaseWakeLock();

    currentChannel = null;
  }

  /**
   * Leave the current channel
   */
  function leaveChannel() {
    leaveChannelInternal();
    showChannelScreen();
  }

  /**
   * Load HLS player for direct stream playback
   */
  async function loadHLSPlayer(channel) {
    // Hide Twitch embed, show HLS video
    twitchEmbed.style.display = 'none';
    hlsVideo.classList.add('active');
    videoOffline.style.display = 'none';

    try {
      await HLSPlayer.play(channel, hlsVideo);
      usingHLSPlayer = true;
      console.log('HLS player started for', channel);

      // Initialize background audio support (Media Session API)
      try {
        const streamInfo = await TwitchAPI.getStreamInfo(channel);
        MediaSessionManager.init(hlsVideo, channel, streamInfo);
      } catch (e) {
        // Init with basic info if stream info fetch fails
        MediaSessionManager.init(hlsVideo, channel, null);
      }

      // Request Wake Lock to prevent screen sleep during playback
      await requestWakeLock();
    } catch (e) {
      console.error('HLS player failed:', e);
      // Fall back to Twitch embed
      hlsVideo.classList.remove('active');
      twitchEmbed.style.display = 'block';
      loadTwitchEmbed(channel);

      // Show error if stream is offline
      if (e.message.includes('offline')) {
        videoOffline.style.display = 'flex';
      }
    }
  }

  /**
   * Load Twitch embed player
   */
  function loadTwitchEmbed(channel) {
    twitchEmbed.innerHTML = '';
    twitchEmbed.style.display = 'block';
    hlsVideo.classList.remove('active');
    videoOffline.style.display = 'none';
    usingHLSPlayer = false;

    // Get the parent domain for embed
    const hostname = window.location.hostname || 'localhost';

    // Create embed script if not loaded
    if (!window.Twitch) {
      const script = document.createElement('script');
      script.src = 'https://embed.twitch.tv/embed/v1.js';
      script.onload = () => createEmbed(channel, hostname);
      document.head.appendChild(script);
    } else {
      createEmbed(channel, hostname);
    }
  }

  /**
   * Create Twitch embed
   */
  function createEmbed(channel, hostname) {
    try {
      twitchPlayer = new Twitch.Embed('twitch-embed', {
        width: '100%',
        height: '100%',
        channel: channel,
        parent: [hostname, 'localhost'],
        layout: 'video',
        muted: true,
        autoplay: true
      });

      twitchPlayer.addEventListener(Twitch.Embed.VIDEO_READY, () => {
        console.log('Video ready');
        videoOffline.style.display = 'none';
      });

      twitchPlayer.addEventListener(Twitch.Embed.OFFLINE, () => {
        console.log('Stream offline');
        videoOffline.style.display = 'flex';
      });
    } catch (e) {
      console.error('Failed to create Twitch embed:', e);
      videoOffline.style.display = 'flex';
    }
  }

  /**
   * Handle chat message
   */
  function handleChatMessage(msg) {
    // Track username for @ mention autocomplete (Map: lowercase -> displayName)
    if (msg.username && msg.type !== 'notice') {
      const displayName = msg.displayName || msg.username;
      chatUsers.set(msg.username.toLowerCase(), displayName);
      console.log('ChatUsers: Added', msg.username.toLowerCase(), '->', displayName, 'Total:', chatUsers.size);
    }

    // Filter announcements (subs, raids, gifts, etc.)
    if (hideAnnouncementsEnabled && msg.type === 'notice') {
      return;
    }

    // Apply chat filters (skip system notices and own messages)
    if (msg.type !== 'notice' && !msg.isSelf) {
      const usernameLower = (msg.username || '').toLowerCase();

      // Filter blocked users
      if (blockedUsers.includes(usernameLower)) {
        return;
      }

      // Filter known bots
      if (hideBotsEnabled && KNOWN_BOTS.includes(usernameLower)) {
        return;
      }

      // Filter command messages (starting with !)
      if (hideCommandsEnabled && msg.message && msg.message.startsWith('!')) {
        return;
      }
    }

    const div = document.createElement('div');

    const classes = ['chat-msg'];
    if (msg.type === 'notice') classes.push('chat-notice');
    if (msg.isSelf) classes.push('self');
    if (msg.isMention) classes.push('mention');
    if (msg.isHistorical) classes.push('historical');
    div.className = classes.join(' ');

    // Play mention sound (only for new messages, not historical or self)
    if (msg.isMention && !msg.isHistorical && !msg.isSelf) {
      playMentionSound(msg.message);
    }

    // Store username as data attribute for reply functionality
    if (msg.username) {
      div.dataset.username = msg.username;
      div.dataset.displayName = msg.displayName || msg.username;
    }

    if (msg.type === 'notice') {
      div.innerHTML = `
        <span class="chat-text">${escapeHtml(msg.systemMessage)}</span>
        ${msg.message ? `<br><span class="chat-text">${escapeHtml(msg.message)}</span>` : ''}
      `;
    } else {
      const time = msg.timestamp.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' }).replace(/\s?(AM|PM)/i, '');
      const colon = msg.isAction ? '' : ':';
      const color = escapeHtml(msg.color || '');
      const badgesHtml = (msg.badges || [])
        .map(b => `<img class="chat-badge" src="${escapeHtml(b.url)}" alt="${escapeHtml(b.name)}" title="${escapeHtml(b.name)}">`)
        .join('');

      // No extra whitespace - name immediately followed by colon
      div.innerHTML = `<span class="chat-time">${time}</span> ${badgesHtml}<span class="chat-name" style="color: ${color}">${escapeHtml(msg.displayName)}</span>${colon} <span class="chat-text"${msg.isAction ? ` style="color: ${color}"` : ''}>${msg.messageHtml || escapeHtml(msg.message)}</span>`;

      // Add click handler ONLY on the username for reply-to functionality
      const nameSpan = div.querySelector('.chat-name');
      if (nameSpan) {
        nameSpan.style.cursor = 'pointer';
        nameSpan.addEventListener('click', (e) => {
          e.stopPropagation(); // Prevent event bubbling
          handleMessageClick(msg.username, msg.displayName);
        });
      }
    }

    chatMessages.appendChild(div);

    // Only auto-scroll if chat is not paused (user hasn't scrolled up)
    if (!chatPaused) {
      chatMessages.scrollTop = chatMessages.scrollHeight;
    }

    // Limit messages
    while (chatMessages.children.length > 150) {
      chatMessages.removeChild(chatMessages.firstChild);
    }
  }

  /**
   * Handle click on chat message for reply
   */
  function handleMessageClick(username, displayName) {
    if (!username || !TwitchAPI.isLoggedIn()) return;

    // Don't allow mentioning yourself
    const currentUser = TwitchAPI.getUsername();
    if (currentUser && username.toLowerCase() === currentUser.toLowerCase()) return;

    // Insert @mention at cursor or beginning
    const input = chatInput;
    const mention = `@${displayName || username} `;

    // If input is empty, just add the mention
    if (!input.value.trim()) {
      input.value = mention;
    } else {
      // Add mention at cursor position
      const start = input.selectionStart;
      const before = input.value.substring(0, start);
      const after = input.value.substring(start);

      // Add space before if needed
      const needsSpaceBefore = before.length > 0 && !before.endsWith(' ');
      input.value = before + (needsSpaceBefore ? ' ' : '') + mention + after;
    }

    input.focus();
    input.setSelectionRange(input.value.length, input.value.length);
  }

  /**
   * Handle system message
   */
  function handleSystemMessage(text) {
    const div = document.createElement('div');
    div.className = 'chat-system';
    div.textContent = text;
    chatMessages.appendChild(div);

    // Don't yank the scroll position if the user has scrolled up
    if (!chatPaused) {
      chatMessages.scrollTop = chatMessages.scrollHeight;
    }

    while (chatMessages.children.length > 150) {
      chatMessages.removeChild(chatMessages.firstChild);
    }
  }

  /**
   * Handle connected
   */
  function handleConnected(channel) {
    console.log('Connected to chat:', channel);
    DebugLogger.info('App', 'Connected to chat', { channel });
  }

  /**
   * Handle disconnected
   */
  function handleDisconnected() {
    console.log('Disconnected from chat');
    DebugLogger.info('App', 'Disconnected from chat');
  }

  /**
   * Send chat message
   */
  function sendChat() {
    let text = chatInput.value.trim();
    if (!text) return;

    // Apply text effect if one is selected
    if (currentTextEffect && typeof TextEffects !== 'undefined') {
      text = TextEffects.applyEffect(text, currentTextEffect);
    }

    if (TwitchIRC.sendMessage(text)) {
      chatInput.value = '';
      closeAutocomplete();
      updateTextEffectsPreview(); // Clear preview after sending

      // On Android, refocus input to keep keyboard open after send
      if (isAndroid && keyboardHandlingEnabled) {
        setTimeout(() => chatInput.focus(), 50);
      }
    }
  }

  /**
   * Toggle emote picker
   */
  function toggleEmotePicker() {
    if (emotePicker.classList.contains('open')) {
      closeEmotePicker();
    } else {
      openEmotePicker();
    }
  }

  /**
   * Open emote picker
   */
  function openEmotePicker() {
    // Close text effects picker if open
    closeTextEffectsPicker();

    emotePicker.classList.add('open');

    // In landscape mode, constrain emote picker to chat section only (right 40%)
    const isLandscape = window.innerHeight < window.innerWidth && window.innerHeight < 500;
    if (isLandscape) {
      emotePicker.style.left = '60%';
      emotePicker.style.right = '0';
      emotePicker.style.width = '40%';
    } else {
      // Portrait - use CSS defaults (full width from bottom)
      emotePicker.style.removeProperty('left');
      emotePicker.style.removeProperty('right');
      emotePicker.style.removeProperty('width');
    }

    emoteSearch.value = '';
    renderEmotes(currentEmoteProvider, '');
  }

  /**
   * Close emote picker
   */
  function closeEmotePicker() {
    emotePicker.classList.remove('open');
    // Reset search when closing
    emoteSearch.value = '';
    renderEmotes(currentEmoteProvider, '');
  }

  /**
   * Render emotes in picker
   * Only shows local/channel-loaded emotes to ensure all results will render in chat
   */
  function renderEmotes(provider, search) {
    emoteGrid.innerHTML = '';

    // Only show emotes loaded for current channel (no API search)
    // This ensures all emotes shown are actually compatible with the channel
    const localEmotes = EmoteLoader.searchEmotesLocal(search, provider);
    const entries = Object.entries(localEmotes).slice(0, 200);

    if (entries.length > 0) {
      renderEmoteEntries(entries);
    } else {
      emoteGrid.innerHTML = '<div class="empty">No emotes found</div>';
    }
  }

  /**
   * Render emote entries into the grid
   */
  function renderEmoteEntries(entries) {
    emoteGrid.innerHTML = '';
    for (const [code, data] of entries) {
      const div = document.createElement('div');
      div.className = 'emote-item';
      div.title = `${code} (${data.provider})`;
      div.innerHTML = `<img src="${escapeHtml(data.url)}" alt="${escapeHtml(code)}" loading="lazy">`;
      div.addEventListener('click', () => insertEmote(code));
      emoteGrid.appendChild(div);
    }
  }

  /**
   * Insert emote into chat input
   */
  function insertEmote(code) {
    const input = chatInput;
    const start = input.selectionStart;
    const end = input.selectionEnd;
    const text = input.value;

    const before = text.substring(0, start);
    const after = text.substring(end);

    const needsSpaceBefore = before.length > 0 && !before.endsWith(' ');
    const needsSpaceAfter = after.length > 0 && !after.startsWith(' ');

    input.value = before + (needsSpaceBefore ? ' ' : '') + code + (needsSpaceAfter ? ' ' : '') + after;

    const newPos = start + code.length + (needsSpaceBefore ? 1 : 0) + (needsSpaceAfter ? 1 : 0);
    input.setSelectionRange(newPos, newPos);
    input.focus();

    // Close the emote picker after selecting
    closeEmotePicker();
  }

  /**
   * Toggle text effects picker
   */
  function toggleTextEffectsPicker() {
    if (textEffectsPicker?.classList.contains('open')) {
      closeTextEffectsPicker();
    } else {
      openTextEffectsPicker();
    }
  }

  /**
   * Open text effects picker
   */
  function openTextEffectsPicker() {
    if (!textEffectsPicker) return;

    // Close emote picker if open
    closeEmotePicker();

    textEffectsPicker.classList.add('open');

    // In landscape mode, constrain picker to chat section only (right 40%)
    const isLandscape = window.innerHeight < window.innerWidth && window.innerHeight < 500;
    if (isLandscape) {
      textEffectsPicker.style.left = '60%';
      textEffectsPicker.style.right = '0';
      textEffectsPicker.style.width = '40%';
    } else {
      textEffectsPicker.style.removeProperty('left');
      textEffectsPicker.style.removeProperty('right');
      textEffectsPicker.style.removeProperty('width');
    }

    renderTextEffects();
  }

  /**
   * Close text effects picker
   */
  function closeTextEffectsPicker() {
    textEffectsPicker?.classList.remove('open');
  }

  /**
   * Render text effect options in the picker
   */
  function renderTextEffects() {
    if (!textEffectsGrid || typeof TextEffects === 'undefined') return;

    textEffectsGrid.innerHTML = '';
    const effects = TextEffects.getEffects();

    // Add "None" option to clear effect
    const noneDiv = document.createElement('div');
    noneDiv.className = 'text-effect-option' + (currentTextEffect === null ? ' selected' : '');
    noneDiv.innerHTML = `
      <span class="text-effect-name">Normal</span>
      <span class="text-effect-preview">No effect applied</span>
    `;
    noneDiv.addEventListener('click', () => selectTextEffect(null));
    textEffectsGrid.appendChild(noneDiv);

    // Add each effect option
    for (const effect of effects) {
      const div = document.createElement('div');
      div.className = 'text-effect-option' + (currentTextEffect === effect.id ? ' selected' : '');
      div.innerHTML = `
        <span class="text-effect-name">${effect.name}</span>
        <span class="text-effect-preview">${effect.preview}</span>
      `;
      div.addEventListener('click', () => selectTextEffect(effect.id));
      textEffectsGrid.appendChild(div);
    }
  }

  /**
   * Select a text effect
   */
  function selectTextEffect(effectId) {
    currentTextEffect = effectId;

    // Update button state
    textEffectsBtn?.classList.toggle('active', effectId !== null);

    // Re-render to show selection
    renderTextEffects();

    // Update preview with current input
    updateTextEffectsPreview();

    // Close picker after selection
    closeTextEffectsPicker();

    DebugLogger.logInteraction('App', 'Text effect selected', { effect: effectId });
  }

  /**
   * Update the text effects preview based on current input and selected effect
   */
  function updateTextEffectsPreview() {
    if (!textEffectsPreview) return;

    const text = chatInput?.value?.trim() || '';

    // Only show preview if there's text AND an effect is selected
    if (text && currentTextEffect && typeof TextEffects !== 'undefined') {
      const transformed = TextEffects.applyEffect(text, currentTextEffect);
      textEffectsPreview.textContent = transformed;
      textEffectsPreview.classList.add('visible');
    } else {
      textEffectsPreview.textContent = '';
      textEffectsPreview.classList.remove('visible');
    }
  }

  /**
   * Handle autocomplete as user types (with debounce)
   */
  function handleAutocomplete() {
    // Clear any pending debounce
    if (autocompleteDebounceTimer) {
      clearTimeout(autocompleteDebounceTimer);
      autocompleteDebounceTimer = null;
    }

    // Check if autocomplete is enabled
    if (!autocompleteEnabled) {
      console.log('Autocomplete: Disabled');
      closeAutocomplete();
      return;
    }

    const text = chatInput.value;
    const cursorPos = chatInput.selectionStart;

    // Find the current word being typed
    let wordStart = cursorPos;
    while (wordStart > 0 && text[wordStart - 1] !== ' ') {
      wordStart--;
    }

    const currentWord = text.substring(wordStart, cursorPos);
    console.log('Autocomplete: currentWord =', JSON.stringify(currentWord));

    // Check if this is a @ mention
    if (currentWord.startsWith('@')) {
      // Skip if mention autocomplete is disabled
      if (!mentionAutocompleteEnabled) {
        closeAutocomplete();
        return;
      }

      autocompleteMode = 'mention';
      const searchTerm = currentWord.substring(1); // Remove @

      // Allow @ alone to show all recent chatters (like Twitch does)
      // No debounce for mentions - instant search
      performMentionSearch(searchTerm, wordStart);
      return;
    }

    // Regular emote autocomplete
    autocompleteMode = 'emote';

    // Need at least 2 chars to trigger emote autocomplete
    if (currentWord.length < 2) {
      closeAutocomplete();
      return;
    }

    // Debounce the autocomplete search
    autocompleteDebounceTimer = setTimeout(() => {
      performAutocompleteSearch(currentWord, wordStart);
    }, AUTOCOMPLETE_DELAY);
  }

  /**
   * Perform the actual autocomplete search (after debounce)
   * Only searches locally cached emotes to ensure all results will render correctly
   */
  function performAutocompleteSearch(currentWord, wordStart) {
    // Only search emotes loaded for this channel - no API search
    // This ensures all autocomplete results will actually render in chat
    const localEmotes = EmoteLoader.searchEmotesLocal(currentWord, 'all');
    const matches = Object.entries(localEmotes).slice(0, 50);

    if (matches.length === 0) {
      closeAutocomplete();
      return;
    }

    autocompleteMatches = matches;
    autocompleteSelectedIndex = -1; // No pre-selection on touch devices
    autocompleteWordStart = wordStart;
    renderAutocomplete();
  }

  /**
   * Perform mention autocomplete search
   */
  function performMentionSearch(searchTerm, wordStart) {
    const searchLower = searchTerm.toLowerCase();

    console.log('MentionSearch: Searching for', searchLower, 'in', chatUsers.size, 'users');

    // Search through chat users (Map: lowercase -> displayName)
    const matches = Array.from(chatUsers.entries())
      .filter(([lowercaseName]) => lowercaseName.startsWith(searchLower))
      .sort((a, b) => a[1].localeCompare(b[1])) // Sort by display name
      .slice(0, 20)
      .map(([, displayName]) => [displayName, { type: 'mention' }]);

    console.log('MentionSearch: Found', matches.length, 'matches');

    if (matches.length === 0) {
      closeAutocomplete();
      return;
    }

    autocompleteMatches = matches;
    autocompleteSelectedIndex = -1; // No pre-selection on touch devices
    autocompleteWordStart = wordStart;
    renderAutocomplete();
  }

  /**
   * Get display name for provider
   */
  function getProviderLabel(provider) {
    const labels = {
      'ffz': 'FFZ',
      '7tv': '7TV',
      'bttv': 'BTTV',
      'twitch': 'Twitch',
      'twitch-sub': 'Sub'
    };
    return labels[provider] || provider.toUpperCase();
  }

  /**
   * Render autocomplete suggestions
   */
  function renderAutocomplete() {
    if (!emoteAutocomplete) return;

    emoteAutocomplete.innerHTML = '';
    emoteAutocomplete.classList.add('open');

    // Position autocomplete above the chat input area (since it's position: fixed)
    const chatInputArea = document.querySelector('.chat-input-area');
    if (chatInputArea) {
      const rect = chatInputArea.getBoundingClientRect();
      emoteAutocomplete.style.bottom = (window.innerHeight - rect.top) + 'px';

      // In landscape mode, constrain autocomplete to chat section only (right 40%)
      const isLandscape = window.innerHeight < window.innerWidth && window.innerHeight < 500;
      if (isLandscape) {
        emoteAutocomplete.style.left = '60%';
        emoteAutocomplete.style.right = '0';
        emoteAutocomplete.style.width = '40%';
      } else {
        // Portrait - full width
        emoteAutocomplete.style.left = '0';
        emoteAutocomplete.style.right = '0';
        emoteAutocomplete.style.width = 'auto';
      }
    }

    autocompleteMatches.forEach(([code, data], index) => {
      const item = document.createElement('div');
      item.className = 'emote-autocomplete-item' + (index === autocompleteSelectedIndex ? ' selected' : '');

      if (autocompleteMode === 'mention') {
        // Render mention item (username only, no image)
        item.innerHTML = `
          <span class="mention-icon">@</span>
          <span class="emote-name">${escapeHtml(code)}</span>
        `;
      } else {
        // Render emote item with image
        item.innerHTML = `
          <img src="${escapeHtml(data.url)}" alt="${escapeHtml(code)}" loading="lazy">
          <span class="emote-name">${escapeHtml(code)}</span>
          <span class="emote-provider">${getProviderLabel(data.provider)}</span>
        `;
      }

      item.addEventListener('click', () => selectAutocompleteEmote(index));
      emoteAutocomplete.appendChild(item);
    });

    // Scroll selected item into view
    const selectedItem = emoteAutocomplete.children[autocompleteSelectedIndex];
    if (selectedItem) {
      selectedItem.scrollIntoView({ block: 'nearest' });
    }
  }

  /**
   * Select an emote or mention from autocomplete
   */
  function selectAutocompleteEmote(index) {
    if (index < 0 || index >= autocompleteMatches.length) return;

    const [code] = autocompleteMatches[index];
    const text = chatInput.value;
    const cursorPos = chatInput.selectionStart;

    // Replace the current word with the emote or mention
    const before = text.substring(0, autocompleteWordStart);
    const after = text.substring(cursorPos);

    // For mentions, add @ prefix; for emotes, just the code
    const insertText = autocompleteMode === 'mention' ? `@${code}` : code;

    const needsSpaceAfter = after.length > 0 && !after.startsWith(' ');
    chatInput.value = before + insertText + (needsSpaceAfter ? ' ' : ' ') + after.trimStart();

    const newPos = before.length + insertText.length + 1;
    chatInput.setSelectionRange(newPos, newPos);
    chatInput.focus();

    closeAutocomplete();
  }

  /**
   * Close autocomplete
   */
  function closeAutocomplete() {
    // Clear any pending debounce timer
    if (autocompleteDebounceTimer) {
      clearTimeout(autocompleteDebounceTimer);
      autocompleteDebounceTimer = null;
    }

    autocompleteMatches = [];
    autocompleteSelectedIndex = 0;
    autocompleteMode = null;
    if (emoteAutocomplete) {
      emoteAutocomplete.classList.remove('open');
      emoteAutocomplete.innerHTML = '';
    }
  }

  /**
   * Show user menu
   */
  function showUserMenu() {
    const username = TwitchAPI.getUsername();
    userInfo.textContent = username ? `Logged in as ${username}` : 'Not logged in';
    userMenu.style.display = 'flex';
  }

  /**
   * Hide user menu
   */
  function hideUserMenu() {
    userMenu.style.display = 'none';
  }

  /**
   * Show help modal
   */
  function showHelpModal() {
    if (helpModal) {
      helpModal.style.display = 'flex';
    }
  }

  /**
   * Hide help modal
   */
  function hideHelpModal() {
    if (helpModal) {
      helpModal.style.display = 'none';
    }
  }

  /**
   * Parse channel from input
   */
  function parseChannel(input) {
    if (!input) return '';
    input = input.trim();
    const urlMatch = input.match(/(?:https?:\/\/)?(?:www\.)?twitch\.tv\/([a-zA-Z0-9_]+)/i);
    if (urlMatch) return urlMatch[1].toLowerCase();
    return input.replace(/^@/, '').toLowerCase();
  }

  /**
   * Get recent channels
   */
  function getRecentChannels() {
    try {
      return JSON.parse(localStorage.getItem(RECENT_KEY) || '[]');
    } catch {
      return [];
    }
  }

  /**
   * Add a channel to recent
   */
  function addRecentChannel(channel) {
    let recent = getRecentChannels();
    recent = recent.filter(c => c.toLowerCase() !== channel.toLowerCase());
    recent.unshift(channel);
    if (recent.length > MAX_RECENT) {
      recent = recent.slice(0, MAX_RECENT);
    }
    localStorage.setItem(RECENT_KEY, JSON.stringify(recent));
  }

  /**
   * Format viewer count
   */
  function formatViewerCount(count) {
    if (count >= 1000) {
      return (count / 1000).toFixed(1) + 'K';
    }
    return count.toString();
  }

  /**
   * Escape HTML (string-based - safe for text nodes and attribute values)
   */
  function escapeHtml(text) {
    return String(text)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');
  }

  /**
   * Apply theme based on selection
   */
  function applyTheme(theme) {
    if (theme === 'auto') {
      // Use system preference
      const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
      if (prefersDark) {
        document.documentElement.removeAttribute('data-theme'); // Default is already dark
      } else {
        document.documentElement.setAttribute('data-theme', 'light');
      }
    } else if (theme === 'default') {
      document.documentElement.removeAttribute('data-theme');
    } else {
      document.documentElement.setAttribute('data-theme', theme);
    }
  }

  /**
   * Apply font size to chat messages
   */
  function applyFontSize(size) {
    const chatSection = document.getElementById('chat-messages');
    if (!chatSection) return;

    // Remove existing font size classes
    chatSection.classList.remove('font-small', 'font-medium', 'font-large');

    // Add new font size class
    if (size && size !== 'medium') {
      chatSection.classList.add(`font-${size}`);
    }
  }

  /**
   * Apply fade history setting to chat messages container
   */
  function applyFadeHistorySetting() {
    const chatSection = document.getElementById('chat-messages');
    if (!chatSection) return;

    chatSection.classList.toggle('no-fade-history', !fadeHistoryEnabled);
  }

  /**
   * Play mention notification sound
   */
  function playMentionSound(message) {
    if (!mentionSoundsEnabled) return;

    // Check if it's a hug mention
    const lowerMessage = message.toLowerCase();
    const isHug = lowerMessage.includes('hug') ||
                  lowerMessage.includes('<3') ||
                  lowerMessage.includes(':hug:');

    try {
      if (isHug) {
        hugSound.currentTime = 0;
        hugSound.play().catch(() => {});
      } else {
        mentionSound.currentTime = 0;
        mentionSound.play().catch(() => {});
      }
    } catch (e) {
      // Silently fail - audio may not be allowed
    }
  }

  /**
   * Handle chat scroll for pause functionality
   */
  function setupChatScrollHandler() {
    const jumpToBottomBtn = document.getElementById('jump-to-bottom');
    if (!chatMessages || !jumpToBottomBtn) return;

    chatMessages.addEventListener('scroll', () => {
      const isAtBottom = chatMessages.scrollHeight - chatMessages.scrollTop - chatMessages.clientHeight < 100;

      if (isAtBottom) {
        chatPaused = false;
        jumpToBottomBtn.classList.remove('visible');
      } else {
        chatPaused = true;
        jumpToBottomBtn.classList.add('visible');
      }
    });

    jumpToBottomBtn.addEventListener('click', () => {
      chatMessages.scrollTop = chatMessages.scrollHeight;
      chatPaused = false;
      jumpToBottomBtn.classList.remove('visible');
    });
  }

  /**
   * Toggle Picture-in-Picture mode
   */
  async function togglePictureInPicture() {
    // Check if PiP is supported
    if (!document.pictureInPictureEnabled) {
      handleSystemMessage('Picture-in-Picture is not supported in this browser');
      return;
    }

    try {
      if (document.pictureInPictureElement) {
        // Exit PiP
        await document.exitPictureInPicture();
      } else if (usingHLSPlayer && hlsVideo) {
        // Enter PiP with HLS video - check if video is ready
        if (hlsVideo.readyState < 2) {
          handleSystemMessage('Video not ready for Picture-in-Picture. Please wait for video to load.');
          return;
        }
        await hlsVideo.requestPictureInPicture();
      } else {
        // Try to get the video element from Twitch embed iframe
        const iframe = twitchEmbed.querySelector('iframe');
        if (iframe) {
          handleSystemMessage('PiP requires Native Video Player. Enable it in settings.');
        } else {
          handleSystemMessage('No video available for Picture-in-Picture');
        }
      }
    } catch (e) {
      console.error('PiP error:', e);
      // Check if running as PWA on iOS - PiP doesn't work in standalone mode
      const isStandalone = window.navigator.standalone || window.matchMedia('(display-mode: standalone)').matches;
      const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent);
      if (isStandalone && isIOS) {
        handleSystemMessage('Picture-in-Picture is not available in Home Screen apps on iOS. Open in Safari to use PiP.');
      } else {
        handleSystemMessage('Could not toggle Picture-in-Picture');
      }
    }
  }

  /**
   * Open current channel in Twitch app (or web fallback)
   */
  function openInTwitchApp() {
    if (!currentChannel) return;

    const webUrl = `https://twitch.tv/${currentChannel}`;

    // Confirm before leaving the app
    if (confirm(`Open ${currentChannel} in Twitch?`)) {
      window.open(webUrl, '_blank');
    }
  }

  /**
   * Apply stream info visibility mode
   */
  function applyStreamInfoMode() {
    if (!streamInfoBar) return;

    // Remove all visibility classes
    streamInfoBar.classList.remove('always-visible', 'tap-visible');

    // Apply appropriate class based on mode
    if (streamInfoMode === 'always') {
      streamInfoBar.classList.add('always-visible');
    } else if (streamInfoMode === 'tap') {
      streamInfoBar.classList.add('tap-visible');
    }
    // 'off' mode has no class - bar stays hidden
  }

  /**
   * Fetch and display stream info
   */
  async function fetchStreamInfo() {
    if (!currentChannel) return;

    try {
      const streamInfo = await TwitchAPI.getStreamInfo(currentChannel);

      if (streamInfo && streamInfo.isLive) {
        updateStreamInfoBar(streamInfo.title, streamInfo.gameName, streamInfo.viewerCount);
      } else if (streamInfo) {
        updateStreamInfoBar('Offline', '', 0);
      } else {
        // null = no data (e.g. anonymous user) - don't falsely claim "Offline"
        updateStreamInfoBar('Stream info unavailable (login required)', '', 0);
      }
    } catch (e) {
      console.warn('Failed to fetch stream info:', e);
      updateStreamInfoBar('Stream info unavailable', '', 0);
    }
  }

  /**
   * Update stream info bar content
   */
  function updateStreamInfoBar(title, game, viewers) {
    if (streamTitleEl) {
      streamTitleEl.textContent = title || 'Untitled Stream';
    }
    if (streamGameEl) {
      streamGameEl.textContent = game || '';
      streamGameEl.style.display = game ? 'inline' : 'none';
    }
    if (streamViewersEl) {
      if (viewers > 0) {
        streamViewersEl.textContent = `${formatViewerCount(viewers)} viewers`;
        streamViewersEl.style.display = 'inline';
      } else {
        streamViewersEl.style.display = 'none';
      }
    }
  }

  /**
   * Start stream info polling
   */
  function startStreamInfoPolling() {
    // Apply visibility mode
    applyStreamInfoMode();

    // Fetch immediately
    fetchStreamInfo();

    // Set up polling interval
    if (streamInfoIntervalId) {
      clearInterval(streamInfoIntervalId);
    }
    streamInfoIntervalId = setInterval(fetchStreamInfo, STREAM_INFO_POLL_INTERVAL);
  }

  /**
   * Stop stream info polling
   */
  function stopStreamInfoPolling() {
    if (streamInfoIntervalId) {
      clearInterval(streamInfoIntervalId);
      streamInfoIntervalId = null;
    }

    // Reset bar content
    if (streamTitleEl) streamTitleEl.textContent = 'Loading...';
    if (streamGameEl) streamGameEl.textContent = '';
    if (streamViewersEl) streamViewersEl.textContent = '';

    // Hide bar
    if (streamInfoBar) {
      streamInfoBar.classList.remove('always-visible', 'tap-visible');
    }
  }

  /**
   * Cycle through sleep timer options (for quick-access button)
   */
  function cycleSleepTimer() {
    // Find current index
    const currentIndex = SLEEP_TIMER_OPTIONS.indexOf(currentSleepTimerValue);
    // Move to next option (wrap around)
    const nextIndex = (currentIndex + 1) % SLEEP_TIMER_OPTIONS.length;
    const nextValue = SLEEP_TIMER_OPTIONS[nextIndex];

    // Update state and set timer
    currentSleepTimerValue = nextValue;
    setSleepTimer(nextValue);

    // Sync dropdown in settings
    if (sleepTimerSelect) {
      sleepTimerSelect.value = nextValue.toString();
    }
  }

  /**
   * Set sleep timer
   */
  function setSleepTimer(minutes) {
    // Clear existing timer
    clearSleepTimer();

    // Update current value
    currentSleepTimerValue = minutes;

    // Update button state
    if (sleepTimerBtn) {
      sleepTimerBtn.classList.toggle('active', minutes > 0);
    }

    if (minutes <= 0) {
      return;
    }

    const endTime = Date.now() + minutes * 60 * 1000;
    sleepTimerEndTime = endTime;

    // Set the main timer to pause video
    sleepTimerId = setTimeout(() => {
      pauseVideo();
      clearSleepTimer();
      // Show notification
      handleSystemMessage(`Sleep timer: Stream paused after ${minutes} minutes`);
    }, minutes * 60 * 1000);

    // Update display every second
    updateSleepTimerDisplay();
    sleepTimerIntervalId = setInterval(updateSleepTimerDisplay, 1000);
  }

  /**
   * Clear sleep timer
   */
  function clearSleepTimer() {
    if (sleepTimerId) {
      clearTimeout(sleepTimerId);
      sleepTimerId = null;
    }
    if (sleepTimerIntervalId) {
      clearInterval(sleepTimerIntervalId);
      sleepTimerIntervalId = null;
    }
    sleepTimerEndTime = null;
    currentSleepTimerValue = 0;

    // Reset settings display
    if (sleepTimerDisplay) {
      sleepTimerDisplay.style.display = 'none';
      sleepTimerDisplay.textContent = '';
    }

    // Reset quick-access button
    if (sleepTimerBtn) {
      sleepTimerBtn.classList.remove('active');
    }
    if (sleepTimerBadge) {
      sleepTimerBadge.textContent = '';
    }
  }

  /**
   * Update sleep timer display
   */
  function updateSleepTimerDisplay() {
    if (!sleepTimerEndTime) return;

    const remaining = sleepTimerEndTime - Date.now();
    if (remaining <= 0) {
      clearSleepTimer();
      return;
    }

    const minutes = Math.floor(remaining / 60000);
    const seconds = Math.floor((remaining % 60000) / 1000);
    const timeStr = `${minutes}:${seconds.toString().padStart(2, '0')}`;

    // Update settings modal display
    if (sleepTimerDisplay) {
      sleepTimerDisplay.textContent = `Sleep in ${timeStr}`;
      sleepTimerDisplay.style.display = 'block';
    }

    // Update quick-access button badge
    if (sleepTimerBadge) {
      sleepTimerBadge.textContent = timeStr;
    }
  }

  /**
   * Pause the video (for sleep timer)
   */
  function pauseVideo() {
    if (usingHLSPlayer && hlsVideo) {
      hlsVideo.pause();
    } else if (twitchPlayer) {
      try {
        twitchPlayer.pause();
      } catch (e) {
        console.warn('Could not pause Twitch player:', e);
      }
    }
  }

  /**
   * Setup easter egg on B.I.T.C.H. title (double-click/tap)
   */
  function setupEasterEgg() {
    const appTitle = document.querySelector('#channel-screen .app-title h1');
    if (!appTitle) return;

    let easterEggActive = false;

    function triggerEasterEgg() {
      if (easterEggActive) return;
      easterEggActive = true;

      // Play sound
      easterEggSound.currentTime = 0;
      easterEggSound.play().catch(() => {});

      // Create the leo overlay
      const overlay = document.createElement('div');
      overlay.className = 'leo-easter-egg';
      overlay.innerHTML = '<img src="assets/icons/leo laughing.png" alt="Leo Laughing">';
      document.body.appendChild(overlay);

      // Trigger animation
      requestAnimationFrame(() => {
        overlay.classList.add('active');
      });

      // Remove after animation
      setTimeout(() => {
        overlay.classList.remove('active');
        overlay.classList.add('exit');
        setTimeout(() => {
          overlay.remove();
          easterEggActive = false;
        }, 300);
      }, 2000);
    }

    // Double-click for desktop
    appTitle.addEventListener('dblclick', (e) => {
      e.preventDefault();
      triggerEasterEgg();
    });

    // Double-tap for mobile - use touchstart for better detection
    let tapCount = 0;
    let tapTimer = null;

    appTitle.addEventListener('touchstart', (e) => {
      tapCount++;

      if (tapCount === 1) {
        // First tap - start timer
        tapTimer = setTimeout(() => {
          tapCount = 0;
        }, 400);
      } else if (tapCount === 2) {
        // Second tap within 400ms - trigger easter egg
        clearTimeout(tapTimer);
        tapCount = 0;
        e.preventDefault();
        triggerEasterEgg();
      }
    }, { passive: false });
  }

  // Initialize when DOM is ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

  /**
   * Get app version (for debug logger)
   */
  function getVersion() {
    return APP_VERSION;
  }

  // Public API
  return {
    joinChannel,
    leaveChannel,
    getVersion
  };
})();

// Export for global access
window.App = App;
