import React from "react";
import { Rnd } from "react-rnd";

import Header from "../../../components/Header";

import API from "../../../utils/api";

import handwriting from "./handwriting.canvas";

import "./index.scss";

class PageProjectPage extends React.Component {
	constructor(props) {
		super(props);

		this.state = {
			pageInfo: false,
			selectedArea: false,
			imageLoaded: false,
			handwritingPopup: false,
			handwritingMatches: [],
			postProcessingPopup: false,
			postProcessing: {
				threshold: -1,
			},
		};

		this.pageView = React.createRef();
		this.selectedArea = React.createRef();
		this.handwritingCanvasEl = React.createRef();
		this.handwritingCanvas = null;
	}

	setStateArea = (key, value, area = null) =>
		this.setState((prevState) => ({
			pageInfo: {
				...prevState.pageInfo,
				areas: {
					...prevState.pageInfo.areas,
					[area || prevState.selectedArea]: {
						...prevState.pageInfo.areas[area || prevState.selectedArea],
						[key]: value,
					},
				},
			},
		}));

	_goBack = () => {
		this.props._refresh();
		this.props.history.push("/project/" + this.props.state.projectInfo.id);
	};

	_save = () => {
		API(
			"/project/" + this.props.match.params.projectId + "/page/" + this.props.match.params.page + "/save",
			{
				method: "POST",
				body: { pageInfo: this.state.pageInfo },
			},
			this.props
		).then(
			() => {},
			(reason) => alert("Saving page failed", new Error(reason))
		);
	};

	_addArea = () => {
		let id = Date.now().toString(16);

		this.setState((prevState) => ({
			pageInfo: {
				...prevState.pageInfo,
				areas: {
					...(prevState.pageInfo.areas || {}),
					[id]: { x: 0, y: 0, w: 0.1, h: 0.1, original: "", translated: "" },
				},
			},
			selectedArea: id,
		}));
	};

	_removeArea = () => {
		this.setState((prevState) => ({
			pageInfo: {
				...prevState.pageInfo,
				areas: {
					...Object.keys(prevState.pageInfo.areas)
						.filter((key) => key !== this.state.selectedArea)
						.reduce((result, current) => {
							result[current] = prevState.pageInfo.areas[current];
							return result;
						}, {}),
				},
			},
			selectedArea: false,
		}));
	};

	_ocr = () => {
		let area = this.state.selectedArea;

		API(
			"/project/" +
				this.props.match.params.projectId +
				"/page/" +
				this.props.match.params.page +
				"/ocr/google?" +
				new URLSearchParams(this.state.pageInfo.areas[area]) +
				(this.state.postProcessing.threshold >= 0
					? "&threshold=" + this.state.postProcessing.threshold.toString()
					: ""),
			{},
			this.props
		).then(
			(data) => this.setStateArea("original", data, area),
			(reason) => alert("Couldn't OCR", new Error(reason))
		);
	};

	_translate = () => {
		let area = this.state.selectedArea;

		["google", "deepl", "yandex", "bing"].map((service) =>
			API(
				"/project/" +
					this.props.match.params.projectId +
					"/page/" +
					this.props.match.params.page +
					"/translate/" +
					service,
				{
					method: "POST",
					body: { text: this.state.pageInfo.areas[area].original },
				},
				this.props
			).then(
				(result) => {
					this.setStateArea(service, result, area);
				},
				(reason) => alert("Translating with " + service + " failed", new Error(reason))
			)
		);
	};

	_update = () => {
		if (!this.state.pageInfo || this.state.pageInfo.id !== this.props.match.params.page) {
			let pageInfo = (this.props.state.projectInfo.pages || []).find(
				(p) => p.id === this.props.match.params.page
			);

			if (pageInfo)
				this.setState(() => ({
					pageInfo,
				}));
		}
	};

	_updateArea = () => {
		let pageViewB = this.pageView.current.getBoundingClientRect();
		let selectedAreaB = this.selectedArea.current.resizableElement.current.getBoundingClientRect();

		this.setState((prevState) => ({
			pageInfo: {
				...prevState.pageInfo,
				areas: {
					...prevState.pageInfo.areas,
					[prevState.selectedArea]: {
						...prevState.pageInfo.areas[prevState.selectedArea],
						x: (selectedAreaB.x - pageViewB.x) / pageViewB.width,
						y: (selectedAreaB.y - pageViewB.y) / pageViewB.height,
						w: selectedAreaB.width / pageViewB.width,
						h: selectedAreaB.height / pageViewB.height,
					},
				},
			},
		}));
	};

	componentDidMount = () => {
		if (!this.props.projectInfo) this.props._refresh();

		this._update();

		this.handwritingCanvas = new handwriting.Canvas(this.handwritingCanvasEl.current);
		this.handwritingCanvas.setOptions({ language: "ja" });
		this.handwritingCanvas.set_Undo_Redo(true, false);
		this.handwritingCanvas.setCallBack((data, err) => {
			if (err) alert(err);
			else if (data instanceof Array)
				this.setState(() => ({
					handwritingMatches: data,
				}));
		});
	};

	componentDidUpdate = () => {
		this._update();
	};

	render() {
		return (
			<div className="PageProjectPage container">
				<Header {...this.props} sub={"editing page " + ((this.state.pageInfo || {}).name || "")} />
				<div className="actions">
					<button onClick={this._goBack}>{"<<"} Go back</button>{" "}
					<button
						onClick={() =>
							this.props._openPage(
								this.props.state.projectInfo.pages[
									Math.max(
										0,
										this.props.state.projectInfo.pages.findIndex(
											(p) => p.id === this.props.match.params.page
										) - 1
									)
								]
							)
						}>
						{"<<"}
					</button>{" "}
					<button
						onClick={() =>
							this.props._openPage(
								this.props.state.projectInfo.pages[
									Math.min(
										this.props.state.projectInfo.pages.length,
										this.props.state.projectInfo.pages.findIndex(
											(p) => p.id === this.props.match.params.page
										) + 1
									)
								]
							)
						}>
						{">>"}
					</button>{" "}
					<button onClick={this._save}>Save</button>{" "}
				</div>
				<div className="page">
					<div className="page-view" ref={this.pageView}>
						<img
							src={
								(typeof window !== "undefined" ? window.env.PUBLIC_PATH : process.env.PUBLIC_PATH) +
								"api/project/" +
								this.props.match.params.projectId +
								"/page/" +
								this.props.match.params.page +
								(this.state.postProcessingPopup && (this.state.postProcessing.threshold >= 0)
									? "?threshold=" + this.state.postProcessing.threshold.toString()
									: "")
							}
							onLoad={() => this.setState(() => ({ imageLoaded: true }))}
							ref={(r) =>
								!this.state.imageLoaded && (r || {}).complete
									? this.setState(() => ({ imageLoaded: true }))
									: null
							}
						/>
						<div className="page-areas">
							{this.state.pageInfo && this.state.pageInfo.areas && this.state.imageLoaded
								? Object.entries(this.state.pageInfo.areas).map((a) => (
										<Rnd
											key={a[0]}
											ref={this.state.selectedArea === a[0] ? this.selectedArea : null}
											default={{
												width: a[1].w * 100 + "%",
												height: a[1].h * 100 + "%",
												x: this.pageView.current.clientWidth * a[1].x,
												y: this.pageView.current.clientHeight * a[1].y,
											}}
											bounds=".page-view"
											className={
												"page-area " + (this.state.selectedArea === a[0] ? "selected" : "")
											}
											onResizeStart={() => this.setState(() => ({ selectedArea: a[0] }))}
											onDragStart={() => this.setState(() => ({ selectedArea: a[0] }))}
											onDragStop={this._updateArea}
											onResizeStop={this._updateArea}>
											{a[1].translated}
										</Rnd>
								  ))
								: []}
						</div>
					</div>
					<div className="inspector">
						{this.state.pageInfo && this.state.pageInfo.areas && this.state.selectedArea ? (
							<>
								<div>
									<span>Text area #{this.state.selectedArea} selected</span>
									<div style={{ float: "right" }}>
										<button onClick={this._removeArea}>-</button>{" "}
										<button onClick={this._addArea}>+</button>
									</div>
								</div>
								<div>
									<div className="textarea-label">original</div>
									<div className="textarea-actions">
										<button
											onClick={() =>
												this.setState((prevState) => ({
													handwritingPopup: !prevState.handwritingPopup,
												}))
											}>
											Handwriting
										</button>
										<button
											onClick={() =>
												this.setState((prevState) => ({
													postProcessingPopup: !prevState.postProcessingPopup,
												}))
											}>
											Postprocessing
										</button>
										<button onClick={this._ocr}>OCR</button>
										{/* <select>
											<option>google</option>
											<option>yandex</option>
										</select> */}
										{this.state.postProcessingPopup ? (
											<div className="postprocessing">
												Threshold:{" "}
												<input
													type="range"
													min="-1"
													max="255"
													step="1"
													value={this.state.postProcessing.threshold}
													onChange={(e) => {
														let value = e.target.value;
														this.setState((prevState) => ({
															postProcessing: {
																...prevState.postProcessing,
																threshold: value,
															},
														}));
													}}
												/>{" "}
												<span className="value">
													(
													{this.state.postProcessing.threshold.toString().padStart(3, "\xa0")}
													)
												</span>
											</div>
										) : null}
									</div>
									<textarea
										value={this.state.pageInfo.areas[this.state.selectedArea].original || ""}
										onChange={(e) => this.setStateArea("original", e.target.value)}
										rows="4"
									/>
									<div className="textarea-transliteration">...</div>
									<div className="textarea-actions">
										<button onClick={this._translate}>Translate</button>
									</div>
								</div>
								<div>
									<div className="textarea-label">translated</div>
									<textarea
										value={this.state.pageInfo.areas[this.state.selectedArea].translated || ""}
										onChange={(e) => this.setStateArea("translated", e.target.value)}
										rows="4"
									/>
								</div>
								<div>
									<div className="textarea-label">google</div>
									<textarea
										value={this.state.pageInfo.areas[this.state.selectedArea].google || ""}
										onChange={(e) => this.setStateArea("google", e.target.value)}
										rows="4"
									/>
								</div>
								<div>
									<div className="textarea-label">deepl</div>
									<textarea
										value={this.state.pageInfo.areas[this.state.selectedArea].deepl || ""}
										onChange={(e) => this.setStateArea("deepl", e.target.value)}
										rows="4"
									/>
								</div>
								<div>
									<div className="textarea-label">yandex</div>
									<textarea
										value={this.state.pageInfo.areas[this.state.selectedArea].yandex || ""}
										onChange={(e) => this.setStateArea("yandex", e.target.value)}
										rows="4"
									/>
								</div>
								<div>
									<div className="textarea-label">bing</div>
									<textarea
										value={this.state.pageInfo.areas[this.state.selectedArea].bing || ""}
										onChange={(e) => this.setStateArea("bing", e.target.value)}
										rows="4"
									/>
								</div>
							</>
						) : (
							<div>
								<span>No text area selected</span>
								<div style={{ float: "right" }}>
									<button onClick={this._addArea}>+</button>
								</div>
							</div>
						)}
					</div>
					<Rnd
						className="handwritingPopup"
						style={{ visibility: this.state.handwritingPopup ? "visible" : "hidden" }}
						dragHandleClassName="handwritingPopup-title"
						enableResizing={false}
						maxWidth="200px">
						<div className="handwritingPopup-title">Handwriting - Japanese</div>
						<canvas
							ref={this.handwritingCanvasEl}
							width="200"
							height="200"
							style={{ cursor: "crosshair" }}></canvas>
						<div className="handwritingPopup-results">
							{this.state.handwritingMatches.map((match) => (
								<button
									key={match}
									onClick={() => {
										this.setStateArea(
											"original",
											this.state.pageInfo.areas[this.state.selectedArea].original + match
										);
										this.handwritingCanvas.erase();
									}}>
									{match}
								</button>
							))}
						</div>
						<div className="handwritingPopup-actions">
							<button onClick={() => this.handwritingCanvas.recognize()}>Detect</button>
							<button onClick={() => this.handwritingCanvas.undo()}>Undo</button>
							<button onClick={() => this.handwritingCanvas.erase()}>Erase</button>
						</div>
					</Rnd>
				</div>
			</div>
		);
	}
}

export default PageProjectPage;
