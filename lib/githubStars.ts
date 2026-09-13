// Shared GitHub star cache across pages

let inMemoryStars: number | null = null;
const STORAGE_KEY = 'livenotes_github_stars';

export const getCachedStars = (): number | null => {
    if (inMemoryStars !== null) {
        return inMemoryStars;
    }

    if (typeof window !== 'undefined') {
        try {
            const stored = localStorage.getItem(STORAGE_KEY);
            if (stored) {
                const parsed = parseInt(stored, 10);
                if (!isNaN(parsed)) {
                    inMemoryStars = parsed;
                    return parsed;
                }
            }
        } catch (e) {
            // Ignore localStorage errors in private/restricted environments
        }
    }

    return null;
};

export const setStoredStars = (stars: number): void => {
    inMemoryStars = stars;
    if (typeof window !== 'undefined') {
        try {
            localStorage.setItem(STORAGE_KEY, stars.toString());
        } catch (e) {
            // Ignore localStorage errors
        }
    }
};

/**
 * Executes the GitHub API call to fetch live star count.
 * This should ONLY be executed on the root `/` page when visited or refreshed.
 */
export const fetchAndStoreStars = async (): Promise<number | null> => {
    try {
        const res = await fetch("https://api.github.com/repos/BikramMondal5/LiveNotes", {
            headers: {
                Accept: "application/vnd.github.v3+json",
            },
        });

        if (res.ok) {
            const data = await res.json();
            if (typeof data.stargazers_count === "number") {
                setStoredStars(data.stargazers_count);
                return data.stargazers_count;
            }
        }
    } catch (err) {
        console.error("Failed to fetch GitHub stars:", err);
    }

    return getCachedStars();
};

