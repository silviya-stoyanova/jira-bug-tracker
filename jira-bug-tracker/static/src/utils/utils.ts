import { Bug } from "../components/BugTracker";
import { Columns, PriorityOrder, StatusOrder } from "./constants";

export const getColumnValue = (bug: Bug, column: Columns) => {
  switch (column) {
    case Columns.Key:
      return bug.key;
    case Columns.Summary:
      return bug.fields.summary;
    case Columns.Created:
      return new Date(bug.fields.created);
    case Columns.Assignee:
      return bug.fields.assignee
        ? bug.fields.assignee.displayName
        : "Unassigned";
    case Columns.Status:
      return StatusOrder[bug.fields.status.name as keyof typeof StatusOrder];
    case Columns.Priority:
      const priorityOrder =
        PriorityOrder[bug.fields.priority.name as keyof typeof PriorityOrder];
      return priorityOrder;
    default:
      return "";
  }
};

export const compareIssueKeys = (keyA: string, keyB: string): number => {
  const numberA = parseInt(keyA.split("-")[1]);
  const numberB = parseInt(keyB.split("-")[1]);

  return numberA - numberB;
};
