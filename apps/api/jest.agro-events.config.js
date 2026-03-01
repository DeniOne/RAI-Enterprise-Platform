const path = require("path");

let tsJest;
try {
  tsJest = require.resolve("ts-jest");
} catch (error) {
  tsJest = require.resolve("ts-jest", {
    paths: [path.resolve(__dirname, "../../node_modules")],
  });
}

module.exports = {
  moduleFileExtensions: ["js", "json", "ts"],
  rootDir: ".",
  testEnvironment: "node",
  testMatch: [
    "<rootDir>/src/modules/agro-events/**/*.spec.ts",
  ],
  transform: {
    "^.+\\.(t|j)s$": [
      tsJest,
      {
        tsconfig: path.resolve(__dirname, "./tsconfig.agro-events.spec.json"),
        isolatedModules: true,
        diagnostics: false,
      },
    ],
  },
  collectCoverage: false,
  moduleNameMapper: {
    "^@rai/prisma-client$": path.resolve(
      __dirname,
      "../../packages/prisma-client",
    ),
  },
  moduleDirectories: [
    "node_modules",
    path.resolve(__dirname, "../../node_modules"),
  ],
};
