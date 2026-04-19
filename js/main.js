const trackIdInput = document.getElementById('track-id');
const trackListContainer = document.getElementById('track-list');
const backButton = document.getElementById('back-button');
let currentIndex = -1;
let trackList = [];
let audio = document.querySelector('#audio-player');
let hls = null;
let firstTime = true;
let lastSaveTime = 0;
let pendingSeekTime = null;

const commonAudioFormats = ['.mp3', '.ogg', '.wav', '.aac', '.m4a', '.flac'];
const STORAGE_KEY = 'hostmytrack_state';
const SAVE_INTERVAL = 5000;

let baseURL = '';
let jsonUrl = '';
let websiteName = '';

const audioPlayer = new Plyr(audio, {
    controls: ['play', 'progress', 'current-time', 'duration', 'mute', 'volume'],
    keyboard: { focused: true, global: true },
});

// ###############
// HLS Playback
// ###############

function playHLS(audioPlayer, hlsPlaylistUrl) {
    if (Hls.isSupported()) {
        playWithHlsJs(hlsPlaylistUrl, audioPlayer);
    } else if (audio.canPlayType('application/vnd.apple.mpegurl')) {
        handleNativeHLS(hlsPlaylistUrl, audioPlayer);
    } else {
        console.error('HLS is not supported in this browser.');
    }
}

function handleNativeHLS(hlsPlaylistUrl, audioPlayer) {
    console.log('Native HLS support');
    audio.src = hlsPlaylistUrl;
    audioPlayer.once('canplay', () => {
        play(audioPlayer);
    });
}

function playWithHlsJs(hlsPlaylistUrl, audioPlayer) {
    console.log('HLS.js fallback');
    if (hls) {
        hls.destroy();
    }
    hls = new Hls();
    hls.loadSource(hlsPlaylistUrl);
    hls.attachMedia(audio);
    hls.on(Hls.Events.MANIFEST_PARSED, () => {
        play(audioPlayer);
    });
    hls.on(Hls.Events.ERROR, (_event, data) => {
        console.error('HLS error:', data.type, data.details);
        if (data.fatal) {
            switch (data.type) {
                case Hls.ErrorTypes.NETWORK_ERROR:
                    console.error('Fatal network error, trying to recover...');
                    hls.startLoad();
                    break;
                case Hls.ErrorTypes.MEDIA_ERROR:
                    console.error('Fatal media error, trying to recover...');
                    hls.recoverMediaError();
                    break;
                default:
                    console.error('Fatal unrecoverable error, destroying HLS.');
                    hls.destroy();
                    break;
            }
        }
    });
}

function play(audioPlayer) {
    if (!firstTime) {
        audioPlayer.play().catch(() => {
            setTimeout(() => audioPlayer.play(), 500);
        });
    } else {
        firstTime = false;
    }
}

// ###############
// Media Session
// ###############

function updateMediaSession(trackName) {
    if (!('mediaSession' in navigator)) return;
    navigator.mediaSession.metadata = new MediaMetadata({
        title: trackName,
        artist: websiteName,
    });
    navigator.mediaSession.setActionHandler('play', () => audioPlayer.play());
    navigator.mediaSession.setActionHandler('pause', () => audioPlayer.pause());
    navigator.mediaSession.setActionHandler('nexttrack', () => {
        if (currentIndex < trackList.length - 1) {
            loadTrackByIndex(currentIndex + 1);
        }
    });
    navigator.mediaSession.setActionHandler('previoustrack', () => {
        if (currentIndex > 0) {
            loadTrackByIndex(currentIndex - 1);
        }
    });
}

// ###############
// Playback State
// ###############

function savePlaybackState() {
    if (currentIndex < 0 || !trackList[currentIndex]) return;
    const state = {
        track: trackList[currentIndex].name,
        time: audio.currentTime || 0,
    };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
}

function loadPlaybackState() {
    try {
        const raw = localStorage.getItem(STORAGE_KEY);
        if (!raw) return null;
        return JSON.parse(raw);
    } catch {
        return null;
    }
}

function clearPlaybackState() {
    localStorage.removeItem(STORAGE_KEY);
}

function restoreOrLoad() {
    const state = loadPlaybackState();
    const params = new URLSearchParams(window.location.search);
    const trackId = params.get('track');

    if (trackId) {
        const index = trackList.findIndex((t) => t.name === trackId);
        if (index !== -1) {
            if (state && state.track === trackId) {
                pendingSeekTime = state.time;
            }
            loadTrackByIndex(index);
            return;
        }
    }

    if (state) {
        const index = trackList.findIndex((t) => t.name === state.track);
        if (index !== -1) {
            pendingSeekTime = state.time;
            loadTrackByIndex(index);
            return;
        }
    }

    loadTrackByIndex(0);
}

// ###############
// Track Navigation
// ###############

function loadTrackByIndex(index) {
    if (index < 0 || index >= trackList.length) return;
    const trackItem = trackListContainer.children[index];
    if (!trackItem) return;
    trackItem.dispatchEvent(new Event('click', { bubbles: true }));
    trackItem.scrollIntoView({ behavior: 'smooth' });
}

// ###############
// URL
// ###############

function setURL(trackId) {
    history.pushState({ trackId }, '', `?track=${trackId}`);
    trackIdInput.value = trackId;
}

// ###############
// Init
// ###############

fetch('config.json')
    .then((response) => response.json())
    .then((config) => {
        websiteName = config.websiteName;
        baseURL = config.baseURL || '';
        jsonUrl = config.jsonURL || '';

        if (baseURL && !baseURL.endsWith('/')) {
            baseURL = baseURL + '/';
        }

        document.title = websiteName;
        const pageTitle = document.getElementById('page-title');
        pageTitle.textContent = websiteName;
        fetchShareJson();
    })
    .catch((error) => console.error('Error loading configuration:', error));

function fetchShareJson() {
    fetch(jsonUrl)
        .then((response) => response.json())
        .then((data) => {
            trackList = [...data].reverse().filter((track) => {
                const fileExtension = track.name.toLowerCase().match(/\.\w+$/);
                return fileExtension && commonAudioFormats.includes(fileExtension[0]);
            });

            createTrackListUI();
        })
        .then(() => {
            restoreOrLoad();
        })
        .catch((error) => console.error(error));
}

function createTrackListUI() {
    trackListContainer.innerHTML = '';
    trackList.forEach((track, index) => {
        const trackItem = document.createElement('div');
        trackItem.classList.add('track-item');

        const durationInSeconds = track.duration;
        const formattedDuration = formatDuration(durationInSeconds);
        const mtime = formatMtime(track.mtime);

        const trackNameNoExtension = track.name.replace(/\.(mkv|mp3|ogg|aac)$/i, '');
        const trackName = trackNameNoExtension.replace(/_/g, ' ');

        trackItem.innerHTML = `
            <span class="track-name">${trackName}</span>
            <span class="mtime">${mtime}</span>
            <span class="duration">${formattedDuration}</span>
        `;

        trackItem.addEventListener('click', () => {
            savePlaybackState();
            currentIndex = index;
            const hlsPlaylistUrl = baseURL + trackNameNoExtension + '/playlist.m3u8';

            document.querySelectorAll('.track-item').forEach((item) => {
                item.classList.remove('playing');
            });

            if (audioPlayer) {
                audioPlayer.pause();
                if (hls) {
                    hls.stopLoad();
                    hls.detachMedia();
                }
            }

            trackItem.classList.add('playing');
            playHLS(audioPlayer, hlsPlaylistUrl);
            updateMediaSession(trackName);
            document.title = `${trackName} - ${websiteName}`;
            setURL(track.name);
        });
        trackListContainer.appendChild(trackItem);
    });
}

// ###############
// Auto-advance
// ###############

audioPlayer.on('ended', () => {
    if (currentIndex >= 0) {
        clearPlaybackState();
    }
    const nextIndex = currentIndex + 1;
    if (nextIndex < trackList.length) {
        loadTrackByIndex(nextIndex);
    }
});

// ###############
// Seek on play
// ###############

audio.addEventListener('playing', () => {
    if (pendingSeekTime !== null) {
        const seek = pendingSeekTime;
        pendingSeekTime = null;
        audio.currentTime = seek;
    }
});

// ###############
// Periodic state save
// ###############

audioPlayer.on('timeupdate', () => {
    const now = Date.now();
    if (now - lastSaveTime >= SAVE_INTERVAL) {
        lastSaveTime = now;
        savePlaybackState();
    }
});

window.addEventListener('beforeunload', () => {
    savePlaybackState();
});

// ###############
// Back button
// ###############

backButton.addEventListener('click', () => {
    const currentURL = window.location.href;
    const parts = currentURL.split('/');
    parts.pop();
    const newURL = parts.join('/') + '/';
    window.location.href = newURL;
});

// ###############
// Formatters
// ###############

function formatDuration(seconds) {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const remainingSeconds = seconds % 60;
    return `${hours}:${minutes < 10 ? '0' : ''}${minutes}:${remainingSeconds < 10 ? '0' : ''}${remainingSeconds}`;
}

function formatMtime(mtime) {
    const date = new Date(mtime);
    const year = date.getFullYear();
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    const day = date.getDate().toString().padStart(2, '0');
    return `${year}-${month}-${day}`;
}
