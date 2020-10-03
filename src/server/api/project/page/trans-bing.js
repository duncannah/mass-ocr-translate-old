import { BingTranslator } from "@horat1us/bing-translator";

const translator = new BingTranslator({ source: "ja", target: "en" });

export default (text) => {
	return translator
		.evaluate(text)
		.then((translated) => translated)
		.catch((err) => {
			console.error(err);
			return "[ERROR]";
		});
};
