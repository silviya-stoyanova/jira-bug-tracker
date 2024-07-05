import api, { route } from "@forge/api";
import Resolver from "@forge/resolver";
const resolver = new Resolver();

resolver.define("getLinkedBugs", async (req) => {
  const issueKey = req.context.extension.issue.key;
  const response = await api
    .asApp()
    .requestJira(route`/rest/api/3/issue/${issueKey}?fields=issuelinks`);
  const data = await response.json();

  const linkedIssues = data.fields.issuelinks.map((link) =>
    link.outwardIssue ? link.outwardIssue.key : link.inwardIssue.key
  );

  console.log(linkedIssues);

  const linkedBugs = [];

  for (const key of linkedIssues) {
    const linkedBugResponse = await api
      .asApp()
      .requestJira(
        route`/rest/api/3/issue/${key}?fields=summary,created,assignee,status,priority`
      );
    const linkedBugData = await linkedBugResponse.json();

    linkedBugs.push(linkedBugData);
  }

  console.log(linkedBugs);
  return linkedBugs;
});

export const handler = resolver.getDefinitions();
