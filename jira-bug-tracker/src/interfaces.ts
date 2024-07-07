export interface Issue {
  key: string;
  fields?: {
    issuetype?: {
      name: string;
    };
  };
}

export interface IssueLink {
  id: string;
  outwardIssue?: Issue;
  inwardIssue?: Issue;
}

export interface IssueFields {
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

export interface IssueData {
  fields: IssueFields;
}

export interface LinkedBug {
  id: string;
  key: string;
  fields: IssueFields;
  issueLinkId: string;
}

export interface Error {
  success: boolean;
  message: string;
}
