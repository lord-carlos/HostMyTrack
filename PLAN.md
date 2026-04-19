# HostMyTrack - Plan

## Project Overview
Small static website for playing long music tracks via HLS. Uses hls.js and plyr.js.

## Completed

- [x] Initial working site with hand-downloaded vendor JS

### Bug Fixes (main.js)
- [x] **HLS instance leak**: Call `hls.destroy()` before creating a new Hls instance on track switch
- [x] **Native HLS canplay listener stacking**: Use `audioPlayer.once()` instead of `.on()`
- [x] **`data.reverse()` mutation**: Use `[...data].reverse()` to avoid mutating the fetch response
- [x] **Add `Hls.Events.ERROR` handler**: Network/media error recovery and logging

### Media Session API
- [x] Set `navigator.mediaSession.metadata` when a track starts playing (title, artist)
- [x] Register `play`/`pause` action handlers for lock screen controls
- [x] Update dynamic page title with current track name (helps OS task switcher)

### Package Management
- [x] Initialize `package.json` via bun
- [x] Install `hls.js` and `plyr` via `bun add`
- [x] Add `postinstall` copy script to move dist files to `js/vendor/`
- [x] Update `index.html` to reference `js/vendor/` paths
- [x] Remove old hand-downloaded `js/plyr.js`, `js/plyr.css`, `js/hls.js`
- [x] Add `js/vendor/` and `bun.lockb` to `.gitignore`

## TODO

(none currently planned)

### Not Planned
- ~~AudioContext keepalive workaround~~ — too hacky
- ~~Wake Lock API~~ — keeps screen on, counterproductive for background listening
- ~~firstTime guard removal~~ — intentional, browsers block autoplay
