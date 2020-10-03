import React from "react";

import "./index.scss";

class Header extends React.Component {
	render() {
		return (
			<div className="header" onClick={() => this.props.history.push("/")}>
				mass-ocr-translate
				<div className="sub">{this.props.sub || ""}</div>
			</div>
		);
	}
}

export default Header;
