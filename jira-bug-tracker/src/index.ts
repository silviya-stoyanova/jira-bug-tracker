import api, { APIResponse, route } from "@forge/api";
import Resolver from "@forge/resolver";

const resolver = new Resolver();

interface IssueLink {
  id: string;
  outwardIssue?: {
    key: string;
  };
  inwardIssue?: {
    key: string;
  };
}

interface IssueFields {
  summary: string;
  created: string;
  assignee: {
    displayName: string;
  } | null;
  status: {
    name: string;
  };
  priority: {
    name: string;
  };
  issuelinks: IssueLink[];
}

interface IssueData {
  fields: IssueFields;
}

interface LinkedBug {
  id: string;
  key: string;
  fields: IssueFields;
  issueLinkId: string;
}

interface Error {
  success: boolean;
  message: string;
}

resolver.define("getLinkedBugs", async (req): Promise<LinkedBug[] | Error> => {
  try {
    const issueKey: string = req.context.extension.issue.key;
    const response: APIResponse = await api
      .asApp()
      .requestJira(route`/rest/api/3/issue/${issueKey}?fields=issuelinks`);
    const data: IssueData = await response.json();

    const linkedIssues = data.fields.issuelinks.map((link) => ({
      issueKey: link.outwardIssue
        ? link.outwardIssue.key
        : link.inwardIssue?.key,
      issueLinkId: link.id,
    }));

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
