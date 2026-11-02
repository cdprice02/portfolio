export interface ProjectData {
  /** ISO date this entry was fetched. */
  asOf: string;
  /** Commit date on the default branch, ISO timestamp. */
  lastCommit: string;
  release?: { tag: string; url: string };
}

// Overridable so a test can point the fetch at a dead host.
const api = process.env.GITHUB_API_URL ?? "https://api.github.com";

async function get(path: string): Promise<Response> {
  return fetch(`${api}${path}`, {
    headers: { accept: "application/vnd.github+json" },
    signal: AbortSignal.timeout(10_000),
  });
}

/** `repo` is `owner/name`. Throws on any failure; the caller owns the fallback. */
export async function fetchProjectData(repo: string): Promise<ProjectData> {
  const commits = await get(`/repos/${repo}/commits?per_page=1`);
  if (!commits.ok) throw new Error(`${repo}: commits ${commits.status}`);
  const [latest] = (await commits.json()) as {
    commit: { committer: { date: string } };
  }[];
  if (latest === undefined) throw new Error(`${repo}: no commits`);

  const data: ProjectData = {
    asOf: new Date().toISOString().slice(0, 10),
    lastCommit: latest.commit.committer.date,
  };

  const release = await get(`/repos/${repo}/releases/latest`);
  // 404 is the API's answer for "no release yet", not a failure.
  if (release.ok) {
    const { tag_name, html_url } = (await release.json()) as {
      tag_name: string;
      html_url: string;
    };
    data.release = { tag: tag_name, url: html_url };
  } else if (release.status !== 404) {
    throw new Error(`${repo}: releases ${release.status}`);
  }
  return data;
}
