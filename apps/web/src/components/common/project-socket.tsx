import { useProjectWebSocket } from "@/hooks/use-project-websocket";

/** Keeps one project's cached board live; renders nothing. */
export default function ProjectSocket({ projectId }: { projectId: string }) {
  useProjectWebSocket(projectId);
  return null;
}
