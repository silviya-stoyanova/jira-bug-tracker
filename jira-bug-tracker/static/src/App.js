import React, { useEffect, useState } from "react";
import { events, invoke } from "@forge/bridge";
import { priorityOrder } from "./utils/constants";

// TODO: convert to TS
const App = () => {
  const [isLoading, setIsLoading] = useState([]);
  const [linkedBugs, setLinkedBugs] = useState([]);
  const [sortColumn, setSortColumn] = useState(null);
  const [sortOrder, setSortOrder] = useState("asc");
  const [error, setError] = useState("");

  const handleFetchSuccess = (data) => {
    setLinkedBugs(data);
    setIsLoading(false);
    console.log(data);
  };

  const handleFetchError = () => {
    console.error("Failed to get related bugs");
    setIsLoading(false);
  };

  useEffect(() => {
    const fetchedBugs = async () => invoke("getLinkedBugs");
    fetchedBugs().then(handleFetchSuccess).catch(handleFetchError);

    const subscribeForIssueChangedEvent = () =>
      events.on("JIRA_ISSUE_CHANGED", () => {
        fetchedBugs().then(handleFetchSuccess).catch(handleFetchError);
      });

    const subscription = subscribeForIssueChangedEvent();

    return () => {
      subscription.then((subscription) => subscription.unsubscribe());
    };
  }, []);

  const getColumnValue = (bug, column) => {
    switch (column) {
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
        return priorityOrder[bug.fields.priority.name];
      default:
        return "";
    }
  };

  const handleSort = (column) => {
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

  const deleteLink = async (issueLinkId) => {
    try {
      const res = await invoke("deleteIssueLink", { issueLinkId });

      if (res.success) {
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
                <tr key={bug.id}>
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

export default App;
