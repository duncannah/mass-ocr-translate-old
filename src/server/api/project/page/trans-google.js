import translate from "@vitalets/google-translate-api";

export default (text) => {
	return translate(text, { from: "ja", to: "en" })
		.then((res) => res.text)
		.catch((err) => {
			console.error(err);
			return "[ERROR]";
		});
};
