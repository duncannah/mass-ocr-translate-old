import React from "react";

import Header from "../../../components/Header";

import API from "../../../utils/api";

import "./index.scss";

class PageProjectMain extends React.Component {
	constructor(props) {
		super(props);

		this.state = {};
	}

	componentDidMount = () => {};

	render() {
		return (
			<div className="PageProjectMain container">
				<Header {...this.props} sub={"editing " + ((this.props.state.projectInfo || {}).name || "")} />
				<div className="actions">
					<button onClick={this.props._refresh}>Refresh</button>{" "}
					<button onClick={this.props._rescan}>Rescan for changes</button>{" "}
					<button onClick={this.props._openDir}>Open pages folder</button>
				</div>
				<div className="pages">
					{!this.props.state.projectInfo || !this.props.state.projectInfo.pages.length
						? "No pages in this project"
						: this.props.state.projectInfo.pages.map((p) => (
								<div className="page" key={p.id} onClick={() => this.props._openPage(p)}>
									<div className="page-preview">
										<img
											src={
												(typeof window !== "undefined" ? window : process).env.PUBLIC_PATH +
												"api/project/" +
												this.props.state.projectInfo.id +
												"/page/" +
												p.id +
												"/thumb"
											}
											loading="lazy"
										/>
										{p.areas
											? Object.entries(p.areas).map((a) => (
													<div
														className="page-area"
														style={{
															left: a[1].x * 100 + "%",
															top: a[1].y * 100 + "%",
															width: a[1].w * 100 + "%",
															height: a[1].h * 100 + "%",
														}}></div>
											  ))
											: null}
									</div>
									{p.id}
								</div>
						  ))}
				</div>
			</div>
		);
	}
}

export default PageProjectMain;
