// Global Script - Key's World Final Polish
import { db, ref, set, push, onValue, query, limitToLast, get, storage, storageRef, getDownloadURL, listAll, getMetadata } from './firebase-config.js';
document.addEventListener('DOMContentLoaded', () => {
    try {
        console.log("DOM Loaded. Initializing...");
        createSnowfall();
        checkNavState();
        initBookLogic();
        initAudio();
        initSpotifyWidget();

        // Dynamic Inits
        initGuestbook();
        initPhotoAlbum();
        initDiary();
        initBlog();
    } catch (e) {
        console.error("CRITICAL: Global Init Error:", e);
    }
});
// --- FIREBASE GUESTBOOK LOGIC ---
function initGuestbook() {
    const guestbookList = document.getElementById('guestbook-entries');
    const miniGuestbook = document.getElementById('mini-guestbook-list');
    const form = document.getElementById('guestbook-form');
    try {
        const guestbookRef = ref(db, 'guestbook');
        onValue(query(guestbookRef, limitToLast(10)), (snapshot) => {
            try {
                const data = snapshot.val();
                const entries = data ? Object.values(data) : [];
                if (miniGuestbook) {
                    miniGuestbook.innerHTML = '';
                    if (entries.length === 0) {
                        miniGuestbook.innerHTML = '<li style="text-align: center; font-size: 10px;">No signatures yet!</li>';
                    } else {
                        entries.slice(-3).reverse().forEach(entry => {
                            const li = document.createElement('li');
                            li.className = 'mini-note';
                            li.innerHTML = `<strong>${entry.name}</strong>: ${entry.message}`;
                            miniGuestbook.appendChild(li);
                        });
                    }
                }
                if (guestbookList) {
                    guestbookList.innerHTML = '';
                    if (entries.length === 0) {
                        guestbookList.innerHTML = '<div style="color: #fff;">Be the first to sign!</div>';
                    } else {
                        entries.reverse().forEach(entry => {
                            const note = document.createElement('div');
                            note.className = 'box';
                            note.style.background = '#ffccbc';
                            note.style.color = '#000';
                            note.style.marginBottom = '10px';
                            note.style.transform = `rotate(${Math.random() * 4 - 2}deg)`;
                            note.innerHTML = `
                                <div style="font-size: 10px; font-weight: bold;">${entry.name} <span style="font-weight: normal; color: #555;">(${entry.date})</span></div>
                                <p style="margin-top: 5px; font-family: var(--font-hand); font-size: 1.2rem;">${entry.message}</p>
                            `;
                            guestbookList.appendChild(note);
                        });
                    }
                }
            } catch (err) { console.error("Guestbook Render Error:", err); }
        });
        if (form) {
            form.addEventListener('submit', (e) => {
                e.preventDefault();
                const nameInput = form.querySelector('input[name="name"]');
                const msgInput = form.querySelector('textarea[name="message"]');
                if (nameInput.value && msgInput.value) {
                    push(guestbookRef, {
                        name: nameInput.value,
                        message: msgInput.value,
                        date: new Date().toISOString().split('T')[0]
                    }).then(() => form.reset());
                }
            });
        }
    } catch (e) { console.error("Guestbook Init Error:", e); }
}
// --- FIREBASE PHOTO ALBUM LOGIC (LIGHTBOX) ---
function initPhotoAlbum() {
    const grid = document.getElementById('photo-grid');
    const lightbox = document.getElementById('lightbox');
    const lightboxImg = document.getElementById('lightbox-img');
    const closeBtn = document.getElementById('lightbox-close');
    if (!grid) return;
    try {
        const albumRef = storageRef(storage, 'photo-album/');
        listAll(albumRef).then(async (res) => {
            if (res.items.length === 0) {
                grid.innerHTML = '<div style="color: #000; grid-column: 1/-1; text-align: center;">No photos uploaded yet.</div>';
                return;
            }
            grid.innerHTML = '<div style="color: #000; text-align: center;">Loading memories...</div>'; // Loading state

            // Fetch metadata for all items to sort by date
            const itemsWithMeta = await Promise.all(res.items.map(async (itemRef) => {
                try {
                    const metadata = await getMetadata(itemRef);
                    const url = await getDownloadURL(itemRef);
                    return { ref: itemRef, metadata, url };
                } catch (e) {
                    console.error("Error fetching meta for", itemRef.name, e);
                    return null;
                }
            }));

            // Filter out failed fetches and sort by timeCreated (newest first)
            const sortedItems = itemsWithMeta
                .filter(item => item !== null)
                .sort((a, b) => new Date(b.metadata.timeCreated) - new Date(a.metadata.timeCreated));

            grid.innerHTML = ''; // Clear loading

            sortedItems.forEach(item => {
                const wrapper = document.createElement('div');
                wrapper.className = 'photo-wrapper';

                const img = document.createElement('img');
                img.src = item.url;
                img.className = 'photo-item';
                img.alt = 'Photo';
                img.addEventListener('click', () => {
                    if (lightbox && lightboxImg) {
                        lightboxImg.src = item.url;
                        lightbox.classList.add('active');
                    }
                });

                const timestamp = document.createElement('div');
                timestamp.className = 'photo-timestamp';
                const date = new Date(item.metadata.timeCreated);
                timestamp.textContent = date.toLocaleString();

                wrapper.appendChild(img);
                wrapper.appendChild(timestamp);
                grid.appendChild(wrapper);
            });

        }).catch((error) => {
            console.error("Photo List Error:", error);
            grid.innerHTML = '<div style="color: #000; grid-column: 1/-1;">Error loading photos.</div>';
        });
        // Lightbox Close Logic
        if (closeBtn) {
            closeBtn.addEventListener('click', () => lightbox.classList.remove('active'));
        }
        if (lightbox) {
            lightbox.addEventListener('click', (e) => {
                if (e.target === lightbox) lightbox.classList.remove('active');
            });
        }
    } catch (e) { console.error("Photo Album Init Error:", e); }
}
// --- FIREBASE DIARY LOGIC ---
function initDiary() {
    const diaryContainer = document.getElementById('diary-content');
    if (!diaryContainer) return;
    try {
        const diaryRef = ref(db, 'diary');
        onValue(query(diaryRef, limitToLast(1)), (snapshot) => {
            const data = snapshot.val();
            if (!data) {
                diaryContainer.innerHTML = '<p style="font-family: var(--font-hand); font-size: 1.5rem; color: #000;">(No entries yet...)</p>';
                return;
            }
            const entries = Object.values(data);
            const latest = entries[entries.length - 1];
            diaryContainer.innerHTML = `
                <div style="text-align: right; color: #d32f2f; margin-bottom: 10px;">${latest.date || 'Unknown Date'}</div>
                <p style="font-family: var(--font-hand); font-size: 1.5rem; color: #000;">${latest.content || '...'}</p>
            `;
        });
    } catch (e) { console.error("Diary Init Error:", e); }
}
// --- FIREBASE BLOG LOGIC ---
function initBlog() {
    const list = document.getElementById('blog-list');
    if (!list) return;
    try {
        const blogRef = ref(db, 'blog-posts');
        onValue(blogRef, (snapshot) => {
            const data = snapshot.val();
            const posts = data ? Object.values(data) : [];
            list.innerHTML = '';
            if (posts.length === 0) {
                list.innerHTML = '<div style="padding: 20px; text-align: center;">No blog posts found.</div>';
            } else {
                posts.forEach(post => {
                    const item = document.createElement('div');
                    item.className = 'floppy-disk';
                    item.style.marginBottom = '20px';
                    item.innerHTML = `
                        <div class="floppy-label">
                            <span>DATA: ${post.title}</span>
                            <span>[+]</span>
                        </div>
                        <div class="floppy-content">
                            <p>${post.content}</p>
                        </div>
                    `;
                    const label = item.querySelector('.floppy-label');
                    const content = item.querySelector('.floppy-content');
                    label.addEventListener('click', () => {
                        content.style.display = content.style.display === 'block' ? 'none' : 'block';
                    });
                    list.appendChild(item);
                });
            }
        });
    } catch (e) { console.error("Blog Init Error:", e); }
}
// --- EXISTING LOGIC ---

function initSpotifyWidget() {
    const widget = document.querySelector('.spotify-widget');
    if (!widget) return;

    const coverImg = widget.querySelector('.cover-art img');
    const titleEl = widget.querySelector('.track-info .track-title');
    const artistEl = widget.querySelector('.track-info .track-artist');
    const indicator = widget.querySelector('.playing-indicator .equalizer');
    const statusEl = widget.querySelector('.spotify-status');
    const modeEl = widget.querySelector('.spotify-mode');
    const lenEl = widget.querySelector('.spotify-len');
    const updatedEl = widget.querySelector('.spotify-updated');

    function formatDuration(ms) {
        if (typeof ms !== 'number') return '--:--';
        const totalSeconds = Math.floor(ms / 1000);
        const minutes = Math.floor(totalSeconds / 60);
        const seconds = totalSeconds % 60;
        return `${minutes}:${seconds.toString().padStart(2, '0')}`;
    }

    function updateUI(track, isPlaying) {
        if (track && track.album && track.album.images && track.album.images[0]) {
            coverImg.src = track.album.images[0].url;
        } else {
            coverImg.src = '';
        }

        titleEl.textContent = track ? track.name : 'No track';
        artistEl.textContent = track && track.artists
            ? track.artists.map(a => a.name).join(', ')
            : '';

        if (lenEl) {
            lenEl.textContent = ' ' + (track ? formatDuration(track.duration_ms) : '--:--');
        }

        if (!statusEl || !indicator || !modeEl) return;

        if (track) {
            if (isPlaying) {
                statusEl.textContent = '▶ NOW PLAYING';
                statusEl.classList.add('spotify-status-playing');
                statusEl.classList.remove('spotify-status-paused');
                modeEl.textContent = ' LIVE';
                indicator.style.display = 'inline-block';
            } else {
                statusEl.textContent = '■ LAST PLAYED';
                statusEl.classList.add('spotify-status-paused');
                statusEl.classList.remove('spotify-status-playing');
                modeEl.textContent = ' HISTORY';
                indicator.style.display = 'none';
            }
        } else {
            statusEl.textContent = 'NO DATA';
            statusEl.classList.remove('spotify-status-playing', 'spotify-status-paused');
            modeEl.textContent = ' OFF';
            indicator.style.display = 'none';
        }
    }

    async function refreshAndUpdate() {
        try {
            const resp = await fetch('https://key-spotify-worker.keymaster.workers.dev/now-playing', {
                cache: 'no-store'
            });

            if (!resp.ok) {
                console.error('Spotify API error', resp.status);
                updateUI(null, false);
            } else {
                const data = await resp.json();
                if (data && data.track) {
                    updateUI(data.track, data.isPlaying);
                } else {
                    updateUI(null, false);
                }
            }
        } catch (e) {
            console.error('Spotify widget error', e);
            updateUI(null, false);
        }

        if (updatedEl) {
            const now = new Date();
            updatedEl.textContent = ' ' + now.toLocaleTimeString();
        }
    }

    refreshAndUpdate();
    setInterval(refreshAndUpdate, 30000);
}



const clickSound = new Audio('assets/click.mp3');
const flipSound = new Audio('assets/pageflip.mp3');
function initAudio() {
    document.addEventListener('click', () => {
        try {
            const sound = clickSound.cloneNode();
            sound.volume = 0.3;
            sound.play().catch(e => { });
        } catch (e) { }
    });
}
function playFlipSound() {
    try {
        const sound = flipSound.cloneNode();
        sound.volume = 0.5;
        sound.play().catch(e => { });
    } catch (e) { }
}
function createSnowfall() {
    try {
        const canvas = document.createElement('canvas');
        canvas.id = 'snowfall';
        document.body.appendChild(canvas);
        const ctx = canvas.getContext('2d');
        let width = window.innerWidth;
        let height = window.innerHeight;
        canvas.width = width;
        canvas.height = height;
        const particles = [];
        for (let i = 0; i < 80; i++) particles.push({
            x: Math.random() * width,
            y: Math.random() * height,
            size: Math.random() * 3 + 1,
            speedY: Math.random() * 1 + 0.5,
            speedX: Math.random() * 0.5 - 0.25
        });
        function animate() {
            ctx.clearRect(0, 0, width, height);
            ctx.fillStyle = 'rgba(255, 255, 255, 0.8)';
            particles.forEach(p => {
                p.y += p.speedY;
                p.x += p.speedX;
                if (p.y > height) { p.y = 0; p.x = Math.random() * width; }
                ctx.fillRect(p.x, p.y, p.size, p.size);
            });
            requestAnimationFrame(animate);
        }
        animate();
    } catch (e) { }
}
function checkNavState() {
    try {
        const photoLink = document.querySelector('a[href="photo-album.html"]');
        if (!photoLink) return;
        if (localStorage.getItem('photo-album-visited') === 'true') {
            const icon = photoLink.querySelector('.notify-icon');
            if (icon) icon.style.display = 'none';
        }
        photoLink.addEventListener('click', () => localStorage.setItem('photo-album-visited', 'true'));
    } catch (e) { }
}
function initBookLogic() {
    try {
        const page0 = document.getElementById('page-0');
        const nextBtns = document.querySelectorAll('.next-btn');
        const prevBtns = document.querySelectorAll('.prev-btn');
        nextBtns.forEach(btn => btn.addEventListener('click', () => { if (page0) { page0.classList.add('flipped'); playFlipSound(); } }));
        prevBtns.forEach(btn => btn.addEventListener('click', () => { if (page0) { page0.classList.remove('flipped'); playFlipSound(); } }));
    } catch (e) { }
}
