import React, { useEffect, useState } from "react";

import { events, invoke } from "@forge/bridge";
import { PriorityOrder } from "../utils/constants";

interface Bug {
  id: string;
  key: string;
  fields: {
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
  };
  issueLinkId: string;
}

interface DeleteIssueLinkResponse {
  size?: number;
  timeout?: number;
  success?: boolean;
  message?: string;
}

const BugTracker: React.FC = () => {
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [linkedBugs, setLinkedBugs] = useState<Bug[]>([]);
  const [sortColumn, setSortColumn] = useState<string | null>(null);
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("asc");
  const [error, setError] = useState<string>("");

  const handleFetchSuccess = (data: Bug[]): void => {
    setLinkedBugs(data);
    setIsLoading(false);
  };

  const handleFetchError = (error: Error): void => {
    console.error("Failed to get related bugs", error);
    setIsLoading(false);
  };

  const fetchedBugs = async (): Promise<Bug[]> => {
    return await invoke("getLinkedBugs");
  };

  useEffect(() => {
    fetchedBugs().then(handleFetchSuccess).catch(handleFetchError);
  }, []);

  const getColumnValue = (bug: Bug, column: string) => {
    switch (column) {
      case "key":
        return bug.key;
      case "summary":
        return bug.fields.summary;
      case "created":
        return new Date(bug.fields.created);
      case "assignee":
        return bug.fields.assignee
          ? bug.fields.assignee.displayName
          : "Unassigned";
      case "status":
        return bug.fields.status.name;
      case "priority":
        const priorityOrder =
          PriorityOrder[bug.fields.priority.name as keyof typeof PriorityOrder];
        return priorityOrder;
      default:
        return "";
    }
  };

  const handleSort = (column: string) => {
    const order = sortColumn === column && sortOrder === "asc" ? "desc" : "asc";
    const sortedBugs = [...linkedBugs].sort((a, b) => {
      const aValue = getColumnValue(a, column);
      const bValue = getColumnValue(b, column);
      if (aValue < bValue) return order === "asc" ? -1 : 1;
      if (aValue > bValue) return order === "asc" ? 1 : -1;
      return 0;
    });
    setSortColumn(column);
    setSortOrder(order);
    setLinkedBugs(sortedBugs);
  };

  const deleteLink = async (issueLinkId: string) => {
    try {
      const res: DeleteIssueLinkResponse = await invoke("deleteIssueLink", {
        issueLinkId,
      });

      if (!res.message) {
        setLinkedBugs(
          linkedBugs.filter((bug) => bug.issueLinkId !== issueLinkId)
        );
        setError("");
      } else {
        setError(res.message || "Failed to delete link");
      }
    } catch (err) {
      console.error("Error deleting link:", err);
      setError("Error deleting link");
    }
  };

  return (
    <>
      {isLoading ? (
        "Loading.."
      ) : !!linkedBugs.length ? (
        <>
          {error && <div className="error">{error}</div>}
          <table>
            <thead>
              <tr>
                <th onClick={() => handleSort("key")}>Key</th>
                <th onClick={() => handleSort("summary")}>Summary</th>
                <th onClick={() => handleSort("created")}>Create Date</th>
                <th onClick={() => handleSort("assignee")}>Assignee</th>
                <th onClick={() => handleSort("status")}>Status</th>
                <th onClick={() => handleSort("priority")}>Priority</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {linkedBugs.map((bug) => (
                <tr key={bug.issueLinkId}>
                  <td>{`${bug.key}`}</td>
                  <td>{`${bug.fields.summary}`}</td>
                  <td>{new Date(bug.fields.created).toLocaleDateString()}</td>
                  <td>{bug.fields.assignee?.displayName || "Unassigned"}</td>
                  <td>{bug.fields.status.name}</td>
                  <td>{bug.fields.priority.name}</td>
                  <td>
                    <button onClick={() => deleteLink(bug.issueLinkId)}>
                      Delete Link
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </>
      ) : (
        <p>No linked bugs found.</p>
      )}
    </>
  );
};

export default BugTracker;
