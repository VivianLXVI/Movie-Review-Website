let currentUser = null;

async function loadMovieOptions() {
    const select = document.getElementById("movieSelect");
    if (!select) return;
    try {
        const response = await fetch("/api/movies?sort=title&order=asc");
        const movies = await response.json();
        if (!movies.length) {
            select.innerHTML = '<option value="">No movies available yet</option>';
            return;
        }
        select.innerHTML = '<option value="">Choose a movie</option>' + movies.map(m =>
            `<option value="${escapeHtml(m.id)}">${escapeHtml(m.title)}</option>`
        ).join("");
        const preselect = new URLSearchParams(window.location.search).get("movie");
        if (preselect) select.value = preselect;
    } catch (error) {
        select.innerHTML = '<option value="">Unable to load movies</option>';
    }
}

async function loadFeed() {
    const list = document.getElementById("feedList");
    try {
        const response = await fetch("/api/posts");
        if (!response.ok) {
            list.innerHTML = '<p class="muted">Unable to load reviews.</p>';
            return;
        }
        const posts = await response.json();
        if (!posts.length) {
            list.innerHTML = '<p class="muted">No reviews yet. Be the first to post one.</p>';
            return;
        }
        list.innerHTML = posts.map(post => renderReviewHtml(post, currentUser)).join("");
        bindDeleteReviews(list, loadFeed);
    } catch (error) {
        list.innerHTML = '<p class="muted">Unable to load reviews.</p>';
    }
}

function bindPostForm() {
    const form = document.getElementById("postForm");
    const message = document.getElementById("postMessage");
    form.addEventListener("submit", async event => {
        event.preventDefault();
        message.textContent = "";
        message.className = "message";
        try {
            const response = await fetch("/api/posts", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    movie_id: document.getElementById("movieSelect").value,
                    rating: Number(document.getElementById("rating").value),
                    comment: document.getElementById("comment").value
                })
            });
            const data = await response.json();
            if (!response.ok) {
                message.textContent = data.error || "Failed to post review.";
                return;
            }
            form.reset();
            message.textContent = "Review posted.";
            message.className = "message success";
            await loadFeed();
        } catch (error) {
            message.textContent = "Unable to connect to the server.";
        }
    });
}

async function init() {
    currentUser = await initNav();
    if (currentUser) {
        await loadMovieOptions();
        bindPostForm();
    }
    await loadFeed();
}

init();
