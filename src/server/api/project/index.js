import express from "express";
import { promises as fs } from "fs";
import path from "path";
import slug from "limax";
import open from "open";
import imageThumbnail from "image-thumbnail";

const router = express.Router({ mergeParams: true });

router.use("/:id/page", require("./page").default);

// GET /list

router.get("/list", (req, res) => {
	return res.json({
		status: 0,
		data: req.db.get("projects").orderBy("lastModified", "desc").value(),
	});
});

// POST /new

router.post("/new", (req, res) => {
	let id = slug(req.body.name || "");
	if (!id.length) return res.json({ status: -1, error: "Can't make id out of name" });

	if (req.db.get("projects").find({ id }).value())
		return res.json({ status: -1, error: "A project with same ID already exists" });

	return fs.mkdir(path.join(__dirname, "../", "pages/" + id), { recursive: true }).then(
		() => {
			req.db
				.get("projects")
				.push({ id, name: req.body.name, pages: [], lastModified: new Date().getTime() })
				.write();

			return res.json({ status: 0 });
		},
		() => res.json({ status: -1, error: "Creating directory failed" })
	);
});

// GET /:id

router.get("/:id", (req, res) => {
	let project = req.db.get("projects").find({ id: req.params.id }).value();

	if (!project) res.json({ status: -1, error: "Project not found" });

	return res.json({
		status: 0,
		data: project,
	});
});

// POST /:id/openDir

router.post("/:id/openDir", (req, res) => {
	let project = req.db.get("projects").find({ id: req.params.id }).value();

	if (!project) res.json({ status: -1, error: "Project not found" });

	return open(path.join(__dirname, "../", "pages/" + project.id)).then(() => res.json({ status: 0 }));
});

// POST /:id/rescan

router.post("/:id/rescan", (req, res) => {
	let project = req.db.get("projects").find({ id: req.params.id }).value();

	if (!project) res.json({ status: -1, error: "Project not found" });

	return fs.readdir(path.join(__dirname, "../", "pages/" + project.id)).then((pages) => {
		let newPagesArr = pages
			.filter((p) => p.endsWith(".jpg") || p.endsWith(".png"))
			.map((p) => ({
				...(project.pages.filter((oP) => oP.id === p)[0] || {} || {}),
				id: p,
			}));

		req.db.get("projects").find({ id: req.params.id }).set("pages", newPagesArr).write();

		return res.json({ status: 0 });
	});
});

// POST /:id/rename

router.post("/:id/rename", (req, res) => res.json({ status: -1, error: "Endpoint TODO" })); // TODO

// POST /:id/delete

router.post("/:id/delete", (req, res) => res.json({ status: -1, error: "Endpoint TODO" })); // TODO

export default router;
