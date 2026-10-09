const movieId = new URLSearchParams(window.location.search).get("id");
let currentUser = null;

async function loadMovie() {
    if (!movieId) {
        document.getElementById("movieTitle").textContent = "No movie selected";
        document.getElementById("reviewList").innerHTML = '<p class="muted">Pick a movie from the <a href="moviefeed.html">movie list</a>.</p>';
        document.getElementById("reviewFormSection").hidden = true;
        return false;
    }

    try {
        const response = await fetch(`/api/movies/${encodeURIComponent(movieId)}`);
        if (!response.ok) {
            document.getElementById("movieTitle").textContent = "Movie not found";
            document.getElementById("reviewList").innerHTML = '<p class="muted">This movie may have been removed. Return to the <a href="moviefeed.html">movie list</a>.</p>';
            document.getElementById("reviewFormSection").hidden = true;
            return false;
        }
        const movie = await response.json();
        document.title = `${movie.title} - Movie Review`;
        document.getElementById("movieTitle").textContent = movie.title;
        document.getElementById("movieGenre").textContent = movie.genre;
        document.getElementById("movieDate").textContent = movie.release_date;
        document.getElementById("movieRating").textContent = formatRating(movie.avg_rating);
        document.getElementById("movieCount").textContent = `${movie.review_count} review${movie.review_count === 1 ? "" : "s"}`;
        document.getElementById("movieDescription").textContent = movie.description;
        return true;
    } catch (error) {
        document.getElementById("movieTitle").textContent = "Unable to load movie";
        return false;
    }
}

async function loadReviews() {
    const list = document.getElementById("reviewList");
    try {
        const response = await fetch(`/api/movies/${encodeURIComponent(movieId)}/posts`);
        if (!response.ok) {
            list.innerHTML = '<p class="muted">Unable to load reviews.</p>';
            return;
        }
        const posts = await response.json();
        if (!posts.length) {
            list.innerHTML = '<p class="muted">No reviews yet. Be the first to post one.</p>';
            return;
        }
        list.innerHTML = posts.map(post => renderReviewHtml(post, currentUser, { showMovie: false })).join("");
        bindDeleteReviews(list, async () => { await loadMovie(); await loadReviews(); });
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
                    movie_id: movieId,
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
            await loadMovie();
            await loadReviews();
        } catch (error) {
            message.textContent = "Unable to connect to the server.";
        }
    });
}

async function init() {
    currentUser = await initNav();
    const found = await loadMovie();
    if (!found) return;
    if (currentUser) bindPostForm();
    await loadReviews();
}

init();
