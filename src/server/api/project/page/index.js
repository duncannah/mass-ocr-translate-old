import express from "express";
import path from "path";
import imageThumbnail from "image-thumbnail";
import sharp from "sharp";

import gOCR from "./ocr-google";

import transGoogle from "./trans-google";
import transDeepl from "./trans-deepl";
import transYandex from "./trans-yandex";
import transBing from "./trans-bing";

const router = express.Router({ mergeParams: true });

const googleOCR = new gOCR(Date.now().toString(16), "ja");
googleOCR.init().catch((err) => console.error(err));

// GET /:page

router.get("/:page", (req, res) => {
	return req.query.threshold
		? sharp(
				path.join(
					__dirname,
					"../",
					"pages/" + req.params.id.replace("/", ""),
					"/" + req.params.page.replace("/", "")
				)
		  )
				.threshold(parseInt(req.query.threshold, 10))
				.toBuffer()
				.then((buf) => res.set("Content-Type", "image/jpeg").send(buf))
				.catch((err) => {
					console.log(err);
					return res.status(404).send().end();
				})
		: res.sendFile(
				path.join(
					__dirname,
					"../",
					"pages/" + req.params.id.replace("/", ""),
					"/" + req.params.page.replace("/", "")
				),
				{},
				(err) => (err ? res.status(404).send().end() : res.end())
		  );
});

// GET /:page/thumb

router.get("/:page/thumb", (req, res) => {
	return imageThumbnail(
		path.join(__dirname, "../", "pages/" + req.params.id.replace("/", ""), "/" + req.params.page.replace("/", "")),
		{ width: 200, jpegOptions: { force: true, quality: 50 } }
	)
		.then((thumbnail) => res.set("Content-Type", "image/jpeg").send(thumbnail))
		.catch((err) => {
			console.log(err);
			return res.status(404).send().end();
		});
});

// POST /:page/save

router.post("/:page/save", (req, res) => {
	req.db
		.get("projects")
		.find({ id: req.params.id })
		.get("pages")
		.find({ id: req.params.page })
		.assign(req.body.pageInfo)
		.write();

	return res.json({ status: 0 });
});

// GET /:page/ocr/:service

router.get("/:page/ocr/:service", (req, res, next) => {
	if (req.params.service === "google") {
		const image = sharp(
			path.join(
				__dirname,
				"../",
				"pages/" + req.params.id.replace("/", ""),
				"/" + req.params.page.replace("/", "")
			)
		);

		image
			.metadata()
			.then((meta) => {
				return image.extract({
					left: Math.round(meta.width * parseFloat(req.query.x, 10)),
					top: Math.round(meta.height * parseFloat(req.query.y, 10)),
					width: Math.round(meta.width * parseFloat(req.query.w, 10)),
					height: Math.round(meta.height * parseFloat(req.query.h, 10)),
				});
			})

			.then((img) => (req.query.threshold ? img.threshold(parseInt(req.query.threshold, 10)) : img))

			.then((data) => googleOCR.OCRImage(data))

			.then((value) =>
				res.json({
					status: 0,
					data: value.replace(/ /g, "\n"),
				})
			)
			.catch((err) => {
				console.error(err);
				next(err);
			});
	} else return;
});

// POST /:page/translate/:service

router.post("/:page/translate/:service", (req, res, next) => {
	let services = {
		google: transGoogle,
		deepl: transDeepl,
		yandex: transYandex,
		bing: transBing,
	};

	return req.params.service in services
		? services[req.params.service](req.body.text).then((result) =>
				res.json({
					status: 0,
					data: result,
				})
		  )
		: res.json({
				status: -1,
				error: "Unknown service",
		  });
});

export default router;
