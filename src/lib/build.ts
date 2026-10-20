// Workers Builds sets WORKERS_CI_BRANCH; local and GitHub CI builds leave it unset.
const branch = process.env.WORKERS_CI_BRANCH;

export const isProduction = branch === "main";
export const isPreview = branch !== undefined && branch !== "main";
