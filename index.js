
const express = require("express");
const bodyParser = require("body-parser");
const pool = require("./db");

const app = express();
const PORT = process.env.PORT || 3000;

app.set("view engine", "ejs");
app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static("public"));

app.get("/", (req, res) => {
    res.render("index", { posts: [] });
});

app.get("/get-posts", async (req, res) => {
    try {
        const result = await pool.query("SELECT * FROM posts ORDER BY id DESC");
        res.json(result.rows);
    } catch (err) {
        console.error(err);
        res.status(500).send("Database error.");
    }
});

app.get("/new", (req, res) => {
    res.render("new");
});

app.post("/add", async (req, res) => {
    const { title, content } = req.body;
    try {
        await pool.query(
            "INSERT INTO posts (title, content) VALUES ($1, $2)",
            [title || "", content || ""]
        );
        res.redirect("/");
    } catch (err) {
        console.error(err);
        res.status(500).send("Error saving post.");
    }
});

app.get("/edit/:id", async (req, res) => {
    try {
        const result = await pool.query("SELECT * FROM posts WHERE id = $1", [req.params.id]);
        if (result.rows.length === 0) {
            return res.status(404).send("Post not found.");
        }
        res.render("edit", { post: result.rows[0] });
    } catch (err) {
        console.error(err);
        res.status(500).send("Error fetching post.");
    }
});

app.post("/update/:id", async (req, res) => {
    const { title, content } = req.body;
    try {
        await pool.query(
            "UPDATE posts SET title = $1, content = $2 WHERE id = $3",
            [title || "", content || "", req.params.id]
        );
        res.redirect("/");
    } catch (err) {
        console.error(err);
        res.status(500).send("Error updating post.");
    }
});

app.post("/delete/:id", async (req, res) => {
    try {
        await pool.query("DELETE FROM posts WHERE id = $1", [req.params.id]);
        res.redirect("/");
    } catch (err) {
        console.error(err);
        res.status(500).send("Error deleting post.");
    }
});

if (require.main === module) {
    app.listen(PORT, () => console.log(`Server running on http://localhost:${PORT}`));
}

module.exports = app;
