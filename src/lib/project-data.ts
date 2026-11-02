import snapshot from "../data/project-data.json";
import { fetchProjectData, type ProjectData } from "./github.ts";

const snapshots = snapshot as Record<string, ProjectData>;

/**
 * Live data for one Project page. Any failed fetch falls back to the committed
 * snapshot so an outage never fails a deploy (ADR 0002). `PROJECT_DATA=snapshot`
 * skips the network, which keeps CI deterministic.
 */
export async function getProjectData(
  id: string,
  repo: string,
): Promise<ProjectData> {
  if (process.env.PROJECT_DATA !== "snapshot") {
    try {
      return await fetchProjectData(repo);
    } catch (error) {
      console.warn(`project data: using snapshot for ${id} (${error})`);
    }
  }
  const stored = snapshots[id];
  if (stored === undefined) {
    throw new Error(`No snapshot for ${id}; run pnpm refresh:snapshot`);
  }
  return stored;
}
