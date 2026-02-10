# Twitch Chat PWA - User Guide

A mobile-friendly Twitch chat app with FFZ, 7TV, and BTTV emotes that the official app doesn't support.

**App URL:** https://analyticendeavors.github.io/website_content/pages/twitch-emote-chat-web/

---

## Installing the App

### iPhone / iPad (iOS)

1. Open **Safari** (must be Safari, not Chrome)
2. Go to the app URL above
3. Tap the **Share button** (square with arrow pointing up)
4. Scroll down and tap **"Add to Home Screen"**
5. Tap **"Add"** in the top right
6. The app icon will appear on your home screen

### Android

1. Open **Chrome**
2. Go to the app URL above
3. Tap the **three dots menu** (top right)
4. Tap **"Add to Home Screen"** or **"Install App"**
5. Tap **"Add"**
6. The app icon will appear on your home screen

---

## Logging In

1. Open the app
2. Tap **"Login with Twitch"**
3. You'll be redirected to Twitch - log in with your account
4. Authorize the app when prompted
5. You'll be redirected back to the app, now logged in

**Or:** Tap "Continue without login" to watch chat without sending messages

---

## Using the App

### Selecting a Channel

- **Type a channel name** in the search box and tap "Go"
- **Or** tap a channel from your **Followed** list (if logged in)
- **Or** tap a **Recent** channel you've visited before

### Chat Features

- **View chat** with all FFZ, 7TV, BTTV, and Twitch emotes rendered
- **Send messages** by typing in the input box and tapping "Send"
- **Tap a message** to quickly reply with @mention
- **Type @** to see a list of recent chatters to mention

### Emote Picker

1. Tap the **smiley face button** next to the chat input
2. Browse emotes by category tabs: All, Twitch, FFZ, 7TV, BTTV
3. Use the **search bar** to find specific emotes
4. Tap an emote to insert it into your message

### Emote Autocomplete

- Start typing an emote name (at least 2 characters)
- A dropdown will show matching emotes
- Tap one to insert it, or use arrow keys + Enter on desktop

---

## Video Controls

### Standard Twitch Embed (Default)

- Video plays automatically when you join a channel
- Use Twitch's built-in controls for volume, quality, fullscreen

### HLS Player Mode (iOS PWA)

When "Ad-Free Video" is enabled:
- Tap video to show/hide controls
- **Play/Pause** button
- **Volume** slider
- **Fullscreen** button
- If video pauses unexpectedly, tap play to resume

---

## Settings

Tap the **gear icon** on the channel selection screen to access settings:

### Ad-Free Video Toggle

- **OFF (Default):** Uses standard Twitch embed - most reliable
- **ON:** Uses direct HLS video player

**When to use Ad-Free mode:**
- You're using the iOS PWA (installed from Safari)
- You have Twitch Turbo or are subscribed to the channel
- The standard embed shows ads or doesn't load

**Note:** Ad-free only works if you have Twitch Turbo or channel subscription. Regular users will still see ads either way. This toggle mainly helps iOS PWA users where the standard embed doesn't work well.

### Emote Autocomplete Toggle

- **ON (Default):** Shows emote suggestions as you type
- **OFF:** Disables autocomplete if you find it distracting

---

## Tips

1. **Keyboard on mobile:** When you tap to type, the video shrinks to stay visible
2. **Landscape mode:** Rotate your phone for a side-by-side video + chat layout
3. **Offline channels:** You can still view chat for offline channels
4. **Emote search:** In the emote picker, search works across all providers

---

## Troubleshooting

### Video not loading
- Try toggling "Ad-Free Video" in settings
- Check if the streamer is actually live
- Refresh the app

### Chat not connecting
- Check your internet connection
- Try leaving and rejoining the channel
- Make sure you're logged in to send messages

### Emotes not showing
- Emotes load when you join a channel - wait a few seconds
- Some channels don't have FFZ/7TV/BTTV emotes set up

### App not installing
- **iOS:** Make sure you're using Safari, not Chrome
- **Android:** Make sure you're using Chrome
- Try refreshing the page before adding to home screen

---

## Privacy

- Your Twitch login is handled directly by Twitch (OAuth)
- The app only stores your login token locally on your device
- No data is sent to any server except Twitch's official APIs
- You can logout anytime from the settings menu

---

<div id="adfree-help-section"></div>

## Ad-Free Video Playback (Turbo/Subscribers)

If you have **Twitch Turbo** or a **channel subscription**, you can enable ad-free video playback in the Native Video Player by providing your browser auth token.

### Why is this needed?

When the app runs as an installed PWA (from your home screen), it doesn't share your browser's Twitch login. Even if you're logged into Twitch in Safari/Chrome, the app runs in isolation. To get ad-free playback, you need to provide a special authentication token from your browser.

### Requirements

- **Twitch Turbo subscription** OR an **active channel subscription**
- Access to a **desktop/laptop computer** (one-time setup)
- **Native Video Player** must be enabled in Settings

### How to Get Your Auth Token

You'll need to do this on a desktop computer, then paste the token into the app on your phone.

**Step 1: On your computer**

1. Open **Chrome**, **Firefox**, or **Edge**
2. Go to **twitch.tv** and make sure you're logged in with your Turbo account
3. Press **F12** to open Developer Tools (or right-click and select "Inspect")
4. Click the **"Network"** tab at the top of the developer tools panel

**Step 2: Find the auth token**

5. In the filter/search box in the Network tab, type: `gql.twitch.tv`
6. Press **F5** to refresh the Twitch page (you need this to capture requests)
7. You'll see several requests appear in the list
8. Click on **any one of them**
9. Look in the right panel for **"Request Headers"**
10. Find the line that says `Authorization: OAuth xxxxxxxxxxxxxxxxx`
11. **Copy ONLY the part after "OAuth "** - just the long string of letters/numbers

**Step 3: Paste into the app**

12. On your phone, open the app and go to **Settings** (gear icon)
13. Tap **"Ad-Free Video (Turbo/Sub)"** to expand that section
14. **Paste** your token into the input field
15. Tap **"Save"**

The status should change to "Token configured" with a green dot.

### Important Notes

- **Token expiration:** The token typically lasts 2-4 weeks. If ads start appearing again, you'll need to get a fresh token.
- **Native Player only:** This only works with the Native Video Player enabled. The standard Twitch embed uses its own authentication.
- **Android users:** Before going through these steps, try just logging into Twitch in Chrome on your Android phone, then using the app. Chrome on Android sometimes shares login cookies with installed PWAs automatically.
- **Privacy:** Your token is only stored locally on your device and is only sent to Twitch's servers (via our proxy for CORS reasons). We never see or store your token.

### If It's Not Working

1. Make sure **Native Video Player** is turned ON in Settings
2. Double-check you copied the token correctly (no extra spaces, no "OAuth " prefix)
3. Try getting a fresh token - old tokens may have expired
4. Make sure you're logged into the correct Twitch account (the one with Turbo)
