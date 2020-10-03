import React from "react";
import classNames from "classnames";

import "./index.scss";

class Notifications extends React.Component {
	_expandNotif = (e) => {
		e.currentTarget.style.height = e.currentTarget.scrollHeight + "px";
	};

	_collapseNotif = (e) => {
		e.currentTarget.style.height = "";
	};

	render() {
		return (
			<div className="notifications">
				{Object.keys(this.props.notifications).map((i) => (
					<div
						key={i}
						className={classNames({
							notification: true,
							error: this.props.notifications[i].err
						})}
						onMouseOver={this._expandNotif}
						onMouseOut={this._collapseNotif}>
						<div className="close" onClick={() => this.props._dismissNotif(i)}>
							x
						</div>
						<span>
							{this.props.notifications[i].msg +
								(this.props.notifications[i].err
									? "; " + (this.props.notifications[i].err.message || "Unknown error") + "."
									: ".")}
						</span>
					</div>
				))}
			</div>
		);
	}
}

export default Notifications;
