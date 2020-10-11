import { dbAction, files, localDBRefs, loginService } from "@core";
import { registerModules, staff } from "@modules";
import * as modules from "@modules";
import { checkServer, day, num, second, store } from "@utils";
import * as utils from "@utils";
import { observable } from "mobx";

const demoHosts: string[] = ["demo.apexo.app"];

export enum LoginStep {
	loadingData,
	allDone,
	chooseUser,
	initial,
}

export enum LoginType {
	initialActiveSession = "initial-active-session",
	initialLSLHashTS = "initial-lsl-hash-ts",
	loginCredentialsOnline = "login-credentials-online",
	loginCredentialsOffline = "login-credentials-offline",
	cypress = "no-server",
}

export class Status {
	private currentlyValidating: string | null = null;
	totalTasks = 18;
	@observable finishedTasks = 0;
	@observable dbActionProgress: string[] = [];
	@observable loadingIndicatorText = "";
	@observable initialLoadingIndicatorText = "";
	@observable server: string = "";
	@observable invalidLogin: boolean = false;
	@observable currentUserID: string = "";

	@observable keepServerOffline = false;

	@observable step: LoginStep = LoginStep.initial;

	@observable isOnline = {
		files: false,
		server: false,
		client: false,
	};
	@observable loginType: LoginType | "" = "";

	@observable version: "community" | "supported" | "offline" =
		(store.get("version") as any) || "community";

	constructor() {
		this.validateOnlineStatus().then(() => {
			setInterval(() => this.validateOnlineStatus(), second * 2);
		});
	}

	async initialCheck(server: string) {
		this.initialLoadingIndicatorText = "running initial check";
		// If we're on a demo host
		if (demoHosts.indexOf(location.host) !== -1) {
			utils.log("Login: Demo mode");
			store.set("version", "offline");
			this.version = "offline";
			this.server = "http://cypress";
			store.set("server_location", this.server);
			return await this.startDemoServer();
		}

		this.initialLoadingIndicatorText = "checking online status";
		this.server = server;
		await this.validateOnlineStatus();

		this.initialLoadingIndicatorText = "checking active session";

		if (this.version === "offline") {
			this.startNoServer();
		}

		if (this.isOnline.server) {
			if (await loginService().activeSession(this.server)) {
				this.loginType = LoginType.initialActiveSession;
				await this.start({ server });
				store.set("LSL_TS", new Date().getTime().toString());
				return;
			}
		} else if (store.found("LSL_hash")) {
			const now = new Date().getTime();
			const then = new Date(num(store.get("LSL_TS"))).getTime();
			if (now - then < 7 * day) {
				this.loginType = LoginType.initialLSLHashTS;
				this.start({ server });
			}
		}
	}

	async startNoServer() {
		this.keepServerOffline = true;
		this.loginType = LoginType.cypress;
		await this.start({
			server: "http://cypress",
		});
	}

	async startDemoServer() {
		await (window as any).hardResetApp;
		await this.start({ server: "" });
		setTimeout(async () => {
			(await import("core/demo")).loadDemoData();
		}, 1000);
	}

	async start({ server }: { server: string }) {
		utils.log("Login Type:", this.loginType);
		this.server = server;
		store.set("server_location", server);
		this.step = LoginStep.loadingData;
		try {
			this.loadingIndicatorText = "Registering modules";
			await registerModules();
			this.loadingIndicatorText = "Checking and setting user";
			if (!this.checkAndSetUserID()) {
				this.step = LoginStep.chooseUser;
			}
			this.finishedTasks++;
		} catch (e) {
			utils.log("Registering modules failed", e);
			utils.log("possible DB corruption, deleting local databases");
			for (let i = 0; i < localDBRefs.length; i++) {
				store.clear();
				await localDBRefs[i].destroy({});
			}
			location.reload();
		}
	}

	async removeCookies() {
		if (this.version === "community") {
			const PouchDB: PouchDB.Static =
				((await import("pouchdb-browser")) as any).default ||
				((await import("pouchdb-browser")) as any);
			const auth: PouchDB.Plugin =
				((await import("pouchdb-authentication")) as any).default ||
				((await import("pouchdb-authentication")) as any);
			PouchDB.plugin(auth);
			await new PouchDB(this.server, {
				skip_setup: true,
			}).logOut();
		}
	}

	checkAndSetUserID() {
		const userID = store.get("user_id");
		if (userID && staff!.docs.find((x) => x._id === userID)) {
			this.setUser(userID);
			return true;
		} else {
			return false;
		}
	}
	resetUser() {
		this.step = LoginStep.chooseUser;
		this.currentUserID = "";
		store.remove("user_id");
	}
	setUser(id: string) {
		this.currentUserID = id;
		this.step = LoginStep.allDone;
		store.set("user_id", id);
	}

	async validateOnlineStatus() {
		// TODO: check JWT expiration time
		// refresh token when it's halfway into expiring
		// BLOCKED BY: https://github.com/usefulteam/jwt-auth/issues/1
		if (this.currentlyValidating === this.server) {
			return;
		} else {
			this.currentlyValidating = this.server;
		}
		try {
			if (this.keepServerOffline) {
				this.isOnline.server = false;
			} else {
				this.initialLoadingIndicatorText =
					"checking server connectivity";
				const serverConnectivityResult = await checkServer(this.server);
				if (!this.isOnline.server && !!serverConnectivityResult) {
					// we were offline, and we're now online
					// resync on online status change
					dbAction("resync");
				}
				this.isOnline.server = !!serverConnectivityResult;
				if (
					serverConnectivityResult &&
					!serverConnectivityResult.name
				) {
					// when server is online but user is invalid
					this.invalidLogin = true;
				} else if (
					serverConnectivityResult &&
					serverConnectivityResult.name
				) {
					this.invalidLogin = false;
				}
			}
			this.initialLoadingIndicatorText =
				"checking files server connectivity";
			if (modules.setting) {
				this.isOnline.files =
					modules.setting.getSetting("dropbox_accessToken") === "demo"
						? true
						: await files().status();
			}
		} catch (e) {}
		this.currentlyValidating = null;
	}
	reset() {
		this.server = "";
		this.currentUserID = "";
		this.keepServerOffline = false;
		this.step = LoginStep.initial;
		this.isOnline = {
			server: false,
			client: false,
			files: false,
		};
		this.loginType = "";
	}
}

export const status = new Status();
