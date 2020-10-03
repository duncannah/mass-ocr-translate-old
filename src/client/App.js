import React from "react";
import { Route, Switch } from "react-router-dom";

import PageHome from "./pages/PageHome";
import PageProject from "./pages/PageProject";

import Notifications from "./components/Notifications";

import "./App.scss";

class App extends React.Component {
	constructor(props) {
		super(props);

		this.state = {
			notifications: {},
			waiting: 0,
		};
	}

	_dismissNotif = (i) => {
		let newObj = {};
		Object.keys(this.state.notifications).forEach((index) => {
			if (index !== i) newObj[index] = this.state.notifications[index];
		});

		this.setState((prevState) => ({ notifications: newObj }));
	};

	_notify = (msg, err) => {
		this.setState((prevState) => ({
			notifications: { ...prevState.notifications, [new Date().getTime()]: { msg, err } },
		}));
	};

	_waiting = () => {
		this.setState((prevState) => ({ waiting: prevState.waiting + 1 }));
	};

	_noLongerWaiting = () => {
		this.setState((prevState) => ({ waiting: prevState.waiting - 1 }));
	};

	render() {
		let { _dismissNotif, _notify, _waiting, _noLongerWaiting } = this;
		let childProps = { _dismissNotif, _notify, _waiting, _noLongerWaiting };

		return (
			<div className={this.state.waiting ? "waiting" : ""}>
				<Switch>
					<Route exact path="/" render={(props) => <PageHome {...props} {...childProps} />} />
					<Route path="/project/:projectId" render={(props) => <PageProject {...props} {...childProps} />} />
				</Switch>
				<Notifications notifications={this.state.notifications} {...childProps} />
			</div>
		);
	}
}

export default App;
