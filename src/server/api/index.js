import express from "express";
import fs from "fs";
import path from "path";
import low from "lowdb";
import FileSync from "lowdb/adapters/FileSync";

const router = express.Router({ mergeParams: true });

const adapter = new FileSync(path.join(__dirname, "../", "db.json"));
const db = low(adapter);
db.defaults({ projects: [] }).write();
fs.mkdirSync(path.join(__dirname, "../", "pages"), { recursive: true });

router.use((req, res, next) => {
	req.db = db;

	next();
});

//const sites = require("./sites");
//const engines = require("./engines");

router.use("/project", require("./project").default);

router.use("*", (req, res) => {
	res.json({ status: -1, error: "Endpoint doesn't exist" });
});

export default router;
