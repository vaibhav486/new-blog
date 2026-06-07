const fs = require("fs");
const path = require("path");
const { spawn } = require("child_process");
const { chromium } = require("playwright");

const projectDir = __dirname;
const outputDir = path.join(projectDir, "docs", "screenshots");
const baseUrl = "http://127.0.0.1:3000";
const demoTitle = "README Feature Demo";
const editedTitle = "README Feature Demo - Updated";

const delay = (milliseconds) =>
    new Promise((resolve) => setTimeout(resolve, milliseconds));

async function waitForServer() {
    for (let attempt = 0; attempt < 30; attempt += 1) {
        try {
            const response = await fetch(baseUrl);
            if (response.ok) return;
        } catch {
            // The server may still be starting.
        }
        await delay(250);
    }
    throw new Error("The application did not start in time.");
}

async function screenshot(page, name) {
    await page.screenshot({
        path: path.join(outputDir, name),
        fullPage: true,
    });
}

async function showPosts(page) {
    await page.getByRole("button", { name: "Show My Posts" }).click();
    await page.locator("#postsContainer li").first().waitFor();
}

async function run() {
    fs.mkdirSync(outputDir, { recursive: true });

    const server = spawn(process.execPath, ["index.js"], {
        cwd: projectDir,
        stdio: "ignore",
        windowsHide: true,
    });

    let browser;
    try {
        await waitForServer();
        browser = await chromium.launch({
            executablePath:
                "C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe",
            headless: true,
        });

        const page = await browser.newPage({
            viewport: { width: 1440, height: 1000 },
        });

        await page.goto(baseUrl);
        await screenshot(page, "01-home-page.png");

        await showPosts(page);
        await screenshot(page, "02-view-posts.png");

        await page.getByRole("link", { name: "Create New Post" }).click();
        await page.locator('input[name="title"]').fill(demoTitle);
        await page
            .locator('textarea[name="content"]')
            .fill("This post demonstrates the create feature.");
        await screenshot(page, "03-create-post.png");
        await page.getByRole("button", { name: "Submit" }).click();

        await showPosts(page);
        const createdPost = page.locator("li", { hasText: demoTitle });
        await createdPost.waitFor();
        await screenshot(page, "04-post-created.png");

        await createdPost.getByRole("link", { name: "Edit post" }).click();
        await page.getByLabel("Title:").fill(editedTitle);
        await page
            .getByLabel("Content:")
            .fill("The demo post was successfully updated.");
        await screenshot(page, "05-edit-post.png");
        await page.getByRole("button", { name: "Update" }).click();

        await showPosts(page);
        const updatedPost = page.locator("li", { hasText: editedTitle });
        await updatedPost.waitFor();
        await screenshot(page, "06-post-updated.png");

        await updatedPost.getByRole("button", { name: "Delete" }).click();
        await showPosts(page);
        await page.locator("li", { hasText: editedTitle }).waitFor({
            state: "detached",
        });
        await screenshot(page, "07-post-deleted.png");
    } finally {
        if (browser) await browser.close();
        server.kill();
    }
}

run().catch((error) => {
    console.error(error);
    process.exitCode = 1;
});
