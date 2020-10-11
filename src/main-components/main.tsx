import { PageLoader } from "@common-components";
import { LoginStep, text } from "@core";
import * as core from "@core";
import { MessagesView, ModalsView } from "@main-components";
import * as utils from "@utils";
import { computed, observable } from "mobx";
import { observer } from "mobx-react";
import * as React from "react";
import * as loadable from "react-loadable";
import {
	MessageBar,
	PrimaryButton,
	Shimmer,
	Spinner,
	SpinnerSize,
} from "office-ui-fabric-react";

const MenuView = loadable({
	loader: async () => (await import("./menu")).MenuView,
	loading: () => <Shimmer />,
});

const HeaderView = loadable({
	loader: async () => (await import("./header")).HeaderView,
	loading: () => <Shimmer />,
});

const UserPanelView = loadable({
	loader: async () => (await import("./user")).UserPanelView,
	loading: () => <Shimmer />,
});

const ChooseUserComponent = loadable({
	loader: async () => (await import("./choose-user")).ChooseUserComponent,
	loading: () => <Shimmer />,
});

const LoginView = loadable({
	loader: async () => (await import("./login")).LoginView,
	loading: () => <Shimmer />,
});

@observer
export class ErrorBoundaryView extends React.Component<{}> {
	@observable hasError: boolean = false;
	@observable stackTrace: string = "";

	componentDidCatch(error: any, info: { componentStack: string }) {
		this.hasError = true;
		this.stackTrace = error.stack;
		utils.log(
			error,
			error.stack,
			error.toString(),
			JSON.stringify(error),
			error.message,
			info
		);
	}

	render() {
		if (this.hasError) {
			return (
				<MessageBar className="eb" messageBarType={1}>
					Error occurred
					<br /> send a screenshot of the following details
					<textarea value={this.stackTrace} readOnly />
					<PrimaryButton
						onClick={() => {
							location.href = location.href.split("#")[0];
							location.reload();
						}}
						text={text("reload").c}
					/>
				</MessageBar>
			);
		}
		return this.props.children;
	}
}

@observer
export class MainView extends React.Component {
	@computed get conditionalView() {
		if (core.status.step === LoginStep.allDone) {
			return (
				<div className="main-component">
					<div
						key="router"
						id="router-outlet"
						data-current-namespace={core.router.currentNamespace.toLowerCase()}
					>
						<PageLoader
							key={core.router.currentNamespace}
							pageComponent={async () => {
								await core.router.currentLoader();
								return await core.router.currentComponent();
							}}
						/>
					</div>
					<HeaderView />
					<UserPanelView />
					<MenuView />
				</div>
			);
		} else if (core.status.step === LoginStep.chooseUser) {
			return <ChooseUserComponent />;
		} else if (core.status.step === LoginStep.initial) {
			return <LoginView />;
		} else {
			return (
				<div className="spinner-container">
					<Spinner
						size={SpinnerSize.large}
						label={
							core.status.loadingIndicatorText
								? `Please wait: ${core.status.loadingIndicatorText}`
								: "Please wait"
						}
					/>
					<div className="loading-bar">
						<div
							className="inner-loading-bar"
							style={{
								width: `${Math.min(
									100,
									Math.round(
										(core.status.finishedTasks /
											core.status.totalTasks) *
											100
									)
								)}%`,
							}}
						></div>
					</div>
				</div>
			);
		}
	}

	componentDidCatch() {
		utils.log("Error");
	}

	componentDidMount() {
		setInterval(() => {
			if (document.querySelectorAll(".ms-Panel").length) {
				document.querySelectorAll("html")[0].classList.add("has-panel");
			} else {
				document
					.querySelectorAll("html")[0]
					.classList.remove("has-panel");
			}
		}, 100);
	}

	render() {
		return (
			<ErrorBoundaryView key={core.status.step}>
				<div>
					<ModalsView />
					<MessagesView />
				</div>
				{this.conditionalView}
			</ErrorBoundaryView>
		);
	}
}
