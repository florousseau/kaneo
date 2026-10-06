import { createFileRoute, redirect } from "@tanstack/react-router";

export const Route = createFileRoute(
  "/_layout/_authenticated/dashboard/workspace/$workspaceId/all-projects/",
)({
  beforeLoad: () => {
    throw redirect({
      to: "/dashboard/workspace/$workspaceId/all-projects/board",
      replace: true,
    });
  },
});
