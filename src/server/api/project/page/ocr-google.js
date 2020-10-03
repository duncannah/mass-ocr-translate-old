import stream from "stream";
import fs from "fs";
import { promises as fsp } from "fs";
import path from "path";
import readline from "readline";

import { google } from "googleapis";

const TOKEN_PATH = path.join(__dirname, "../", ".auth", "google-token.json");

class gOCR {
	constructor(fileHash, lang) {
		this.fileHash = fileHash;
		this.auth = null;
		this.drive = null;
		this.tmpFolderId = null;
		this.ocrLang = lang;
	}

	init = async () => {
		await fsp
			.access(path.join(__dirname, "../", ".auth", "google-credentials.json"))
			.catch(() =>
				Promise.reject("google-credentials.json not found! Please check the README for instructions.")
			);

		const creds = await fsp
			.readFile(path.join(__dirname, "../", ".auth", "google-credentials.json"))
			.then((data) => JSON.parse(data));
		const { client_secret, client_id, redirect_uris } = creds.installed;

		const oAuth2Client = new google.auth.OAuth2(client_id, client_secret, redirect_uris[0]);

		this.auth = await new Promise((resolve) => {
			fsp.readFile(TOKEN_PATH)
				.then((token) => {
					oAuth2Client.setCredentials(JSON.parse(token));
					resolve(oAuth2Client);
				})
				.catch(async () => {
					await this._getAccessToken(oAuth2Client, resolve);
				});
		});
		this.drive = google.drive({ version: "v3", auth: this.auth });

		// check if file exists
		let list = await this.drive.files.list({
			q:
				"name = 'ocr_tmp." +
				this.fileHash +
				"' and mimeType = 'application/vnd.google-apps.folder' and trashed = false",
			fields: "files",
		});

		let file;

		if (list.data.files.length) {
			// folder already exists
			this.tmpFolderId = list.data.files[0].id;
		} else
			this.tmpFolderId = (
				await this.drive.files.create({
					resource: {
						name: "ocr_tmp." + this.fileHash,
						mimeType: "application/vnd.google-apps.folder",
					},
					fields: "id",
				})
			).data.id;

		return;
	};

	OCRImage = async (file) => {
		// Upload image
		let imageFile;

		imageFile = (
			await this.drive.files.create({
				resource: {
					name: Date.now().toString(16) + ".jpg",
					mimeType: "application/vnd.google-apps.document",
					parents: [this.tmpFolderId],
				},
				media: {
					mimeType: "image/jpeg",
					body: typeof file === "string" ? fs.createReadStream(file) : file,
				},
				ocrLanguage: this.ocrLang,
				fields: "id",
			})
		).data.id;

		let string = await new Promise((resolve) => {
			this.drive.files.export(
				{
					fileId: imageFile,
					mimeType: "text/plain",
				},
				(err, resp) => {
					if (err) console.log(err);

					resolve(resp.data);
				}
			);
		});

		//console.log(string);

		return string.substr(21);
	};

	_getAccessToken = async (oAuth2Client, cb) => {
		const authUrl = oAuth2Client.generateAuthUrl({
			access_type: "offline",
			scope: ["https://www.googleapis.com/auth/drive"],
		});
		console.log("I need access to GDrive to be able to do OCR. Authorize me by visiting this url:", authUrl);
		const rl = readline.createInterface({
			input: process.stdin,
			output: process.stdout,
		});
		rl.question("Enter the code from that page here: ", (code) => {
			rl.close();
			oAuth2Client.getToken(code, (err, token) => {
				if (err) return console.error("Error retrieving access token", err);
				oAuth2Client.setCredentials(token);
				// Store the token to disk for later program executions
				fs.writeFile(TOKEN_PATH, JSON.stringify(token), (err) => {
					if (err) return console.error(err);
					console.log("Token stored to", TOKEN_PATH);
				});
				cb(oAuth2Client);
			});
		});
	};
}

export default gOCR;
