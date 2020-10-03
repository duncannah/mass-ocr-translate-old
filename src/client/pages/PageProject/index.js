import React from "react";
import { Route, Switch } from "react-router-dom";

import PageProjectMain from "./PageProjectMain";
import PageProjectPage from "./PageProjectPage";

import API from "../../utils/api";

import "./index.scss";

class PageProject extends React.Component {
	constructor(props) {
		super(props);

		this.state = {
			projectInfo: false,
		};
	}

	_refresh = () => {
		API("/project/" + this.props.match.params.projectId, {}, this.props).then(
			(projectInfo) => this.setState({ projectInfo }),
			(reason) => this.props._notify("Couldn't load project", new Error(reason))
		);
	};

	_openDir = () => {
		API("/project/" + this.props.match.params.projectId + "/openDir", { method: "POST" }, this.props).then(
			() => {},
			(reason) => this.props._notify("Couldn't open directory", new Error(reason))
		);
	};

	_rescan = () => {
		API("/project/" + this.props.match.params.projectId + "/rescan", { method: "POST" }, this.props).then(
			() => this._refresh(),
			(reason) => this.props._notify("Couldn't rescan", new Error(reason))
		);
	};

	_openPage = (p) => {
		this.props.history.push("/project/" + this.state.projectInfo.id + "/" + p.id);
	};

	componentDidMount = () => {
		this._refresh();
	};

	render() {
		let { state, _refresh, _openDir, _rescan, _openPage } = this;
		let { _waiting, _noLongerWaiting } = this.props;
		let childProps = { state, _waiting, _noLongerWaiting, _refresh, _openDir, _rescan, _openPage };

		return (
			<Switch>
				<Route
					exact
					path="/project/:projectId"
					render={(props) => <PageProjectMain {...props} {...childProps} />}
				/>
				<Route
					path="/project/:projectId/:page"
					render={(props) => <PageProjectPage key={props.match.params.page} {...props} {...childProps} />}
				/>
			</Switch>
		);
	}
}

export default PageProject;
