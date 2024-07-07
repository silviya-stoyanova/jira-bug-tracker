import React, { useEffect, useState } from "react";
import { invoke } from "@forge/bridge";
import { Columns, ERROR_MESSAGES, Order } from "../utils/constants";
import { compareIssueKeys, getColumnValue } from "../utils/utils";

export interface Bug {
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

interface SuccessfulDeleteIssueLinkResponse {
  size?: number;
  timeout?: number;
}

interface ErrorDeleteIssueLinkResponse {
  success?: boolean;
  message?: string;
}

type DeleteIssueLinkResponse =
  | SuccessfulDeleteIssueLinkResponse
  | ErrorDeleteIssueLinkResponse;

const BugTracker: React.FC = () => {
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [linkedBugs, setLinkedBugs] = useState<Bug[]>([]);
  const [sortColumn, setSortColumn] = useState<string | null>(null);
  const [sortOrder, setSortOrder] = useState<Order>(Order.Asc);
  const [error, setError] = useState<string>("");

  const fetchedBugs = async (): Promise<Bug[]> => {
    return await invoke("getLinkedBugs");
  };

  useEffect(() => {
    fetchedBugs()
      .then((data: Bug[]): void => {
        setLinkedBugs(data);
        setIsLoading(false);
      })
      .catch((error: Error): void => {
        console.error(ERROR_MESSAGES.failedToGetRelatedBugs, error);
        setIsLoading(false);
      });
  }, []);

  const handleSort = (column: Columns) => {
    const order =
      sortColumn === column && sortOrder === Order.Asc ? Order.Desc : Order.Asc;

    const sortedBugs = [...linkedBugs].sort((a, b) => {
      const aValue = getColumnValue(a, column);
      const bValue = getColumnValue(b, column);

      if (column === Columns.Key) {
        return order === Order.Asc
          ? compareIssueKeys(aValue as string, bValue as string)
          : compareIssueKeys(bValue as string, aValue as string);
      } else {
        if (aValue < bValue) return order === Order.Asc ? -1 : 1;
        if (aValue > bValue) return order === Order.Asc ? 1 : -1;
        return 0;
      }
    });

    setSortColumn(column);
    setSortOrder(order);
    setLinkedBugs(sortedBugs);
  };

  const deleteLink = async (issueLinkId: string) => {
    try {
      const response: DeleteIssueLinkResponse = await invoke(
        "deleteIssueLink",
        { issueLinkId }
      );

      if ("message" in response) {
        setError(response.message || ERROR_MESSAGES.failedToDeleteLink);
      } else {
        setLinkedBugs(
          linkedBugs.filter((bug) => bug.issueLinkId !== issueLinkId)
        );
        setError("");
      }
    } catch (err) {
      console.error(`${ERROR_MESSAGES.errorDeletingLink}: ${err}`);
      setError(ERROR_MESSAGES.errorDeletingLink);
    }
  };

  return (
    <>
      {isLoading ? (
        "Loading.."
      ) : !!linkedBugs.length ? (
        <>
          {error && <p className="error">{error}</p>}
          <table>
            <thead>
              <tr>
                <th onClick={() => handleSort(Columns.Key)}>Key</th>
                <th onClick={() => handleSort(Columns.Summary)}>Summary</th>
                <th onClick={() => handleSort(Columns.Created)}>Create Date</th>
                <th onClick={() => handleSort(Columns.Assignee)}>Assignee</th>
                <th onClick={() => handleSort(Columns.Status)}>Status</th>
                <th onClick={() => handleSort(Columns.Priority)}>Priority</th>
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
