// jest.config.js
module.exports = {
	preset: "ts-jest",
	testEnvironment: "node",
	transform: {
		"^.+\\.tsx?$": "ts-jest",
	},
	testMatch: ["**/?(*.)+(spec|test).ts?(x)"],
};
