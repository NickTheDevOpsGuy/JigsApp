/** @type {import('@lhci/cli').LHConfig} */
module.exports = {
  ci: {
    collect: {
      staticDistDir: "./dist",
      numberOfRuns: 2,
      settings: {
        preset: "desktop",
      },
    },
    assert: {
      assertions: {
        "categories:performance": ["error", { minScore: 0.6 }],
        "categories:accessibility": ["error", { minScore: 0.85 }],
        "categories:best-practices": ["warn", { minScore: 0.85 }],
        // PWA category deprecated in Lighthouse 12+; installability covered by best-practices
      },
    },
    upload: {
      target: "filesystem",
      outputDir: "./lhci-reports",
    },
  },
};
