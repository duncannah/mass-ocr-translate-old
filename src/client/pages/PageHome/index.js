import React from "react";
import { Link } from "react-router-dom";

import Header from "../../components/Header";

import API from "../../utils/api";

import "./index.scss";

class _Project extends React.Component {
	render() {
		return <div className="project"></div>;
	}
}

class PageHome extends React.Component {
	constructor(props) {
		super(props);

		this.state = {
			projects: false,
		};
	}

	_createProject = () => {
		let name = prompt("Please input name of project") || "";
		if (!name.length) return;

		API("/project/new", { method: "POST", body: { name } }, this.props).then(
			() => this._listProjects(),
			(reason) => this.props._notify("Creating project failed", new Error(reason))
		);
	};

	_listProjects = () => {
		API("/project/list", {}, this.props).then(
			(projects) => this.setState(() => ({ projects })),
			(reason) => this.props._notify("Listing projects failed", new Error(reason))
		);
	};

	_editProject = (e) => {
		this.props.history.push("/project/" + e.id);
	};

	_renameProject = (e) => {
		let name = prompt("Please input name to rename project to", e.name) || "";
		if (!name.length || name === e.name) return;

		API("/project/" + e.id + "/rename", { method: "POST", body: { name } }, this.props).then(
			() => this._listProjects(),
			(reason) => this.props._notify("Renaming project failed", new Error(reason))
		);
	};

	_deleteProject = (e) => {
		let sure = confirm("Are you sure you want to delete this project?") || "";
		if (!sure) return;

		API("/project/" + e.id + "/delete", { method: "POST", body: { sure } }, this.props).then(
			() => this._listProjects(),
			(reason) => this.props._notify("Deleting project failed", new Error(reason))
		);
	};

	componentDidMount = () => {
		this._listProjects();
	};

	render() {
		return (
			<div className="PageHome container">
				<Header {...this.props} sub="home" />
				<div className="actions">
					<button onClick={this._createProject}>Create new project</button>{" "}
					<button onClick={this._listProjects}>Refresh list</button>
				</div>
				{this.state.projects === false ? (
					<div className="projects">Listing projects...</div>
				) : !this.state.projects.length ? (
					<div className="projects">No projects available</div>
				) : (
					<table className="projects">
						<thead>
							<tr>
								<th>Name</th>
								<th>Pages</th>
								<th>Last modified</th>
								<th></th>
							</tr>
						</thead>
						<tbody>
							{this.state.projects.map((e) => (
								<tr key={e.id}>
									<td>{e.name}</td>
									<td>{(e.pages || []).length || "0"}</td>
									<td>{new Date(e.lastModified).toUTCString()}</td>
									<td>
										<button onClick={() => this._editProject(e)}>Edit</button>{" "}
										<button onClick={() => this._renameProject(e)}>Rename</button>{" "}
										<button onClick={() => this._deleteProject(e)}>Delete</button>
									</td>
								</tr>
							))}
						</tbody>
					</table>
				)}
			</div>
		);
	}
}

export default PageHome;
