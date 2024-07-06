import api, { route } from "@forge/api";
import Resolver from "@forge/resolver";

const resolver = new Resolver();

resolver.define("getLinkedBugs", async (req) => {
  const issueKey = req.context.extension.issue.key;
  const response = await api
    .asApp()
    .requestJira(route`/rest/api/3/issue/${issueKey}?fields=issuelinks`);
  const data = await response.json();

  const linkedIssues = data.fields.issuelinks.map((link) => ({
    issueKey: link.outwardIssue ? link.outwardIssue.key : link.inwardIssue.key,
    issueLinkId: link.id,
  }));

  const linkedBugs = [];

  for (const { issueKey, issueLinkId } of linkedIssues) {
    const linkedBugResponse = await api
      .asApp()
      .requestJira(
        route`/rest/api/3/issue/${issueKey}?fields=summary,created,assignee,status,priority`
      );
    const linkedBugData = await linkedBugResponse.json();

    linkedBugs.push({ ...linkedBugData, issueLinkId });
  }

  return linkedBugs;
});

resolver.define("deleteIssueLink", async (req) => {
  const { issueLinkId } = req.payload;

  try {
    const response = await api
      .asUser()
      .requestJira(route`/rest/api/3/issueLink/${issueLinkId}`, {
        method: "DELETE",
      });

    return response;
  } catch (err) {
    return { success: false, message: "Error deleting issue link" };
  }
});

export const handler = resolver.getDefinitions();
