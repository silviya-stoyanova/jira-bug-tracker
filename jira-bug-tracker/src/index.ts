import api, { APIResponse, route } from "@forge/api";
import Resolver from "@forge/resolver";
import { IssueTypes } from "./constants";
import { Error, IssueData, LinkedBug } from "./interfaces";

const resolver = new Resolver();

resolver.define("getLinkedBugs", async (req): Promise<LinkedBug[] | Error> => {
  try {
    const issueKey: string = req.context.extension.issue.key;
    const response: APIResponse = await api
      .asApp()
      .requestJira(route`/rest/api/3/issue/${issueKey}?fields=issuelinks`);
    const data: IssueData = await response.json();

    const linkedIssues = data.fields.issuelinks
      .map((link) => ({
        issueKey: link.outwardIssue
          ? link.outwardIssue.key
          : link.inwardIssue?.key,
        issueLinkId: link.id,
        issueType:
          link.outwardIssue?.fields?.issuetype?.name ||
          link.inwardIssue?.fields?.issuetype?.name,
      }))
      .filter((link) => link.issueType === IssueTypes.Bug);

    const linkedBugs: LinkedBug[] = [];

    for (const { issueKey, issueLinkId } of linkedIssues) {
      if (issueKey) {
        const linkedBugResponse = await api
          .asApp()
          .requestJira(
            route`/rest/api/3/issue/${issueKey}?fields=summary,created,assignee,status,priority`
          );
        const linkedBugData: LinkedBug = await linkedBugResponse.json();

        linkedBugs.push({ ...linkedBugData, issueLinkId });
      }
    }

    return linkedBugs;
  } catch (err) {
    return { success: false, message: "Failed fetching linked issues." };
  }
});

resolver.define(
  "deleteIssueLink",
  async (req): Promise<APIResponse | Error> => {
    const { issueLinkId } = req.payload;

    try {
      const response: APIResponse = await api
        .asUser()
        .requestJira(route`/rest/api/3/issueLink/${issueLinkId}`, {
          method: "DELETE",
        });

      return response;
    } catch (err) {
      return { success: false, message: "Failed deleting issue link." };
    }
  }
);

export const handler = resolver.getDefinitions();
