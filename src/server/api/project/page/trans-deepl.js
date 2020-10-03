// https://git.kaki87.net/KaKi87/deepl-scraper
// Edited to better suit my needs & using new version of puppeteer to fix conflicts

const homepage = "https://www.deepl.com/translator";

let browser;

const getBrowser = async () => {
	if (browser) return browser;
	browser = await require("puppeteer").launch();
	browser.on("disconnected", () => (browser = null));
	return browser;
};

const getNewPage = async () => await (await getBrowser()).newPage();

const translate = async (sentence, sourceLanguage = "auto") => {
	if (!/^(auto|[a-z]{2})$/.test(sourceLanguage)) throw new Error("INVALID_SOURCE_LANGUAGE");

	const sourceLangSelect = ".lmt__language_select--source button",
		targetLangSelect = ".lmt__language_select--target button",
		sourceLangMenu = ".lmt__language_select--source .lmt__language_select__menu",
		targetLangMenu = ".lmt__language_select--target .lmt__language_select__menu",
		sourceLangButton = `.lmt__language_select--source button[dl-test=translator-lang-option-${sourceLanguage}]`,
		originalSentenceField = ".lmt__source_textarea",
		targetSentenceField = ".lmt__target_textarea"; /*,
			 targetSentencesContainer = '.lmt__translations_as_text'*/

	const page = await getNewPage();

	await page.goto(homepage);
	await page.click(sourceLangSelect);
	await page.waitForSelector(sourceLangMenu, { visible: true });
	try {
		await page.click(sourceLangButton);
	} catch (_) {
		throw new Error("UNSUPPORTED_SOURCE_LANGUAGE");
	}
	await page.waitForSelector(sourceLangMenu, { hidden: true });

	await page.click(targetLangSelect);
	await page.waitForSelector(targetLangMenu, { visible: true });
	try {
		await page
			.click(`.lmt__language_select--target button[dl-test=translator-lang-option-en-US]`)
			.catch(() => page.click(`.lmt__language_select--target button[dl-test=translator-lang-option-en-EN]`))
			.catch(() => page.click(`.lmt__language_select--target button[dl-test=translator-lang-option-en]`));
	} catch (_) {
		throw new Error("UNSUPPORTED_TARGET_LANGUAGE");
	}
	await page.waitForSelector(targetLangMenu, { hidden: true });

	await page.type(originalSentenceField, sentence);

	let sentences = [];
	let _res = {};
	page.on("requestfinished", (request) =>
		request
			.response()
			.json()
			.then((res) => {
				if (!res["result"]) return;
				sentences.push(
					...res["result"]["translations"][0]["beams"].map((item) => ({
						value: item["postprocessed_sentence"],
						confidence: item["totalLogProb"],
					}))
				);
				_res = {
					source: {
						lang: res["result"]["source_lang"].toLowerCase(),
						...(sourceLanguage === "auto"
							? {
									confident: !!res["result"]["source_lang_is_confident"],
							  }
							: {}),
						sentence,
					},
					target: {
						lang: res["result"]["target_lang"].toLowerCase(),
						sentences: sentences.sort((a, b) => a.confidence - b.confidence).map((item) => item.value),
					},
				};
			})
			.catch(() => {})
	);
	await page.waitForSelector(".lmt--active_translation_request");
	await page.waitForSelector(".lmt--active_translation_request", { hidden: true });
	_res.target.translation = await page.$eval(targetSentenceField, (el) => el.value);
	page.close().catch(() => {});
	return _res;
};
const quit = async () => {
	if (browser) await browser.close();
};

export default (text) => {
	return translate(text, "ja")
		.then((res) => {
			return res.target.translation;
		})
		.catch((err) => {
			console.error(err);
			return "[ERROR]";
		});
};
