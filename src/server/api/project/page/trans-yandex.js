import got from "got";

let token = "13d36408.5f74affc.8e5db17c.74722d74657874-0-0";

const getToken = () =>
	got("https://translate.yandex.com/?lang=ja-en", {
		headers: {
			accept:
				"text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8,application/signed-exchange;v=b3;q=0.9",
			"accept-language": "en-US,en;q=0.9",
			"cache-control": "no-cache",
			pragma: "no-cache",
			"sec-ch-ua": '"Google Chrome";v="87", "\\"Not;A\\\\Brand";v="99", "Chromium";v="87"',
			"sec-ch-ua-mobile": "?0",
			"sec-fetch-dest": "document",
			"sec-fetch-mode": "navigate",
			"sec-fetch-site": "none",
			"upgrade-insecure-requests": "1",
		},
	}).then((resp) => {
		let match = resp.body.match(/SID: '([a-f0-9\.]*?)',/);

		return match ? match[1] : Promise.reject(resp.body);
	});

export default async (text) => {
	if (!token)
		token = await getToken().catch((err) => {
			console.error(err);
			return null;
		});

	if (!token) return "[ERROR: no token]";

	return got
		.post(
			"https://translate.yandex.net/api/v1/tr.json/translate?id=" +
				token +
				"&srv=tr-text&lang=ja-en&reason=paste&format=text",
			{
				body: "text=" + encodeURIComponent(text) + "&options=4",
				responseType: "json",
				headers: {
					accept: "*/*",
					"accept-language": "en-US,en;q=0.9,en-GB;q=0.8,tr;q=0.7",
					"cache-control": "no-cache",
					"content-type": "application/x-www-form-urlencoded",
					"user-agent":
						"Mozilla/5.0 (Macintosh; Intel Mac OS X 10_14_5) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/87.0.4277.0 Safari/537.36",
				},
			}
		)
		.then((resp) => {
			return resp.body.text.join("\n");
		})
		.catch((err) => {
			console.error(err);
			return "[ERROR]";
		});
};
