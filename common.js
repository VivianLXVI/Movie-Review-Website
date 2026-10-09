// Shared helpers for the feed, movie list, and movie pages.

function escapeHtml(str) {
    if (str === null || str === undefined) return "";
    return String(str)
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");
}

function isAdminUser(user) {
    return !!(user && (user.is_admin || user.role === "admin"));
}

async function getCurrentUser() {
    try {
        const response = await fetch("/api/me");
        if (response.ok) return await response.json();
    } catch (error) {
        // fall through: treated as logged out
    }
    return null;
}

// Wires up the top bar (login/logout button, profile link, admin styling).
// Returns the current user, or null when logged out.
async function initNav() {
    const user = await getCurrentUser();
    const authButton = document.getElementById("authButton");
    const profileLink = document.getElementById("myProfileLink");
    const topbar = document.querySelector(".topbar");

    if (user) {
        if (authButton) {
            authButton.textContent = "Logout";
            authButton.onclick = async () => {
                await fetch("/api/logout", { method: "POST" });
                window.location.href = "login.html";
            };
        }
        if (profileLink) {
            profileLink.href = isAdminUser(user) ? "myprofileadmin.html" : "myprofileuser.html";
        }
        if (topbar && isAdminUser(user)) topbar.classList.add("adminbar");
    } else {
        if (authButton) {
            authButton.textContent = "Login";
            authButton.onclick = () => { window.location.href = "login.html"; };
        }
        if (profileLink) profileLink.hidden = true;
    }

    document.querySelectorAll("[data-admin-only]").forEach(el => { el.hidden = !isAdminUser(user); });
    document.querySelectorAll("[data-login-only]").forEach(el => { el.hidden = !user; });
    document.querySelectorAll("[data-guest-only]").forEach(el => { el.hidden = !!user; });

    return user;
}

function formatRating(value) {
    if (value === null || value === undefined) return "No ratings yet";
    return `${Number(value).toFixed(1)}/10`;
}

function renderReviewHtml(post, user, options = {}) {
    const showMovie = options.showMovie !== false;
    const canDelete = user && (isAdminUser(user) || String(user.user_id) === String(post.user_id));
    const author = post.username
        ? `<a href="userpage.html?username=${encodeURIComponent(post.username)}">${escapeHtml(post.display_name)}</a> <span>@${escapeHtml(post.username)}</span>`
        : escapeHtml(post.display_name || "Unknown User");
    const title = showMovie
        ? `<a href="moviepage.html?id=${encodeURIComponent(post.movie_id)}">${escapeHtml(post.movie_title)}</a>`
        : "Review";
    const date = post.created_at ? `<span class="review-date">${escapeHtml(post.created_at)}</span>` : "";

    return `
        <div class="review-item feed-item" data-post-id="${escapeHtml(post.id)}">
            <p class="feed-byline">${author}</p>
            <div class="review-header">
                <h3 class="review-title">${title}</h3>
                <div>
                    <strong class="review-rating">Rating: ${escapeHtml(String(post.rating))}/10</strong>
                    ${date}
                </div>
            </div>
            <p class="review-comment">${escapeHtml(post.comment)}</p>
            ${canDelete ? `<div class="review-actions"><button type="button" class="btn-danger delete-review-btn">Delete</button></div>` : ""}
        </div>`;
}

// Attaches delete handlers to every .delete-review-btn inside container.
function bindDeleteReviews(container, onDeleted) {
    container.querySelectorAll(".delete-review-btn").forEach(button => {
        button.addEventListener("click", async () => {
            const postId = button.closest(".review-item").dataset.postId;
            if (!confirm("Delete this review? This cannot be undone.")) return;
            try {
                const response = await fetch(`/api/posts/${encodeURIComponent(postId)}`, { method: "DELETE" });
                const data = await response.json();
                if (!response.ok) {
                    alert(data.error || "Failed to delete review.");
                    return;
                }
                onDeleted();
            } catch (error) {
                alert("Failed to delete review.");
            }
        });
    });
}
