let API = (endpoint, init = {}, props = { _waiting: () => {}, _noLongerWaiting: () => {} }) => {
	return new Promise((resolve, reject) => {
		/*
		if (init.method === "POST" && init.body instanceof Object) {
			let newBody = new FormData();
			Object.keys(init.body).forEach((k) => newBody.append(k, init.body[k]));
			init.body = newBody;
		}
		*/

		if (init.method === "POST" && init.body instanceof Object)
			init = {
				...init,
				body: JSON.stringify(init.body),
				headers: { ...(init.headers || {}), "Content-Type": "application/json" }
			};

		props._waiting();
		fetch(window.env.PUBLIC_PATH + "api/" + endpoint, init)
			.then((resp) => {
				resp.json().then((json) => (json.status ? reject(json.error || "") : resolve(json.data)), reject);
			}, reject)
			.finally(props._noLongerWaiting);
	});
};

export default API;
