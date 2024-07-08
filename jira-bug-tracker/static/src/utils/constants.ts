export enum PriorityOrder {
  Lowest = 1,
  Low = 2,
  Medium = 3,
  High = 4,
  Highest = 5,
}

export enum Columns {
  Key = "key",
  Summary = "summary",
  Created = "created",
  Assignee = "assignee",
  Status = "status",
  Priority = "priority",
}

export enum Order {
  Asc = "asc",
  Desc = "desc",
}

export const StatusOrder = {
  "To Do": 1,
  "In Progress": 2,
  "In Testing": 3,
  "Ready For Release": 4,
  Done: 5,
};

export const ERROR_MESSAGES = {
  failedToDeleteLink: "Failed to delete link",
  failedDeletingLink: "Failed to delete link",
  failedFetchingRelatedBugs: "Failed fetching related bugs",
};
