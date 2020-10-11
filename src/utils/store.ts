import { decrypt, encrypt } from "@utils";

export const dict = {
	LSL_hash: "", // when truly logging in
	LSL_TS: "", // when starting
	LSL_time: "",
	user_id: "", // current user ID
	server_location: "", // current server location
	lang: "",
	version: "",
};

export const store = {
	get(term: keyof typeof dict, non?: string) {
		return this.found(term)
			? decrypt(localStorage.getItem(term) || "")
			: non || "";
	},

	set(term: keyof typeof dict, value: string) {
		localStorage.setItem(term, encrypt(value));
	},

	found(term: keyof typeof dict) {
		return !!localStorage.getItem(term);
	},

	remove(term: keyof typeof dict) {
		localStorage.removeItem(term);
	},

	clear() {
		localStorage.clear();
	},
};
