import { db, ref, push } from './firebase-config.js';

// Make the function accessible globally so you can call it from the browser console
window.seedDatabase = async function () {
    console.log("Starting data seeding...");

    try {
        // Seed Blog Post
        const blogRef = ref(db, 'blog-posts');
        await push(blogRef, {
            title: "Hello Internet!",
            // Use HTML to embed the image and format the text.
            // The class "blog-image" can be used for CSS styling.
            content: `
                <p>Hello Internet! This is my first blog post.</p>
                <img src="https://firebasestorage.googleapis.com/v0/b/key-github-w.firebasestorage.app/o/poor_dog.jpeg?alt=media&token=f3d23408-e3d2-4949-8197-1532f421810b" alt="A poor dog" class="blog-image">
                <p>Look at this dog!</p>
            `,
            date: new Date().toISOString().split('T')[0]
        });
        console.log("Blog post seeded with image.");

        // Seed Diary Entry
        const diaryRef = ref(db, 'diary');
        await push(diaryRef, {
            title: "My First Entry",
            content: "Dear diary Haiii",
            date: "NOV 29, 2025"
        });
        console.log("Diary entry seeded.");

        console.log("Seeding complete! Refresh the page.");
        alert("Seeding complete! Refresh the page.");
    } catch (error) {
        console.error("Seeding failed:", error);
        alert("Seeding failed. Check console for errors.");
    }
};

console.log("seed-data.js loaded. Run seedDatabase() in the console to populate data.");