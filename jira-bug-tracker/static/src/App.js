import React, { useEffect, useState } from "react";
import { view, events, invoke } from "@forge/bridge";

// TODO: convert to TS
const App = () => {
  const [isLoading, setIsLoading] = useState([]);
  const [linkedBugs, setLinkedBugs] = useState([]);
  const [sortColumn, setSortColumn] = useState(null);
  const [sortOrder, setSortOrder] = useState("asc");

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
    const fetchLabels = async () => invoke("getLinkedBugs");
    fetchLabels().then(handleFetchSuccess).catch(handleFetchError);

    const subscribeForIssueChangedEvent = () =>
      events.on("JIRA_ISSUE_CHANGED", () => {
        fetchLabels().then(handleFetchSuccess).catch(handleFetchError);
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
        return bug.fields.priority.name;
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

  const deleteLink = async (issueId) => {
    const context = await view.getContext();
    const issueKey = context.extension.issue.key;
    const res = await fetch(`/rest/api/3/issue/${issueKey}`, {
      method: "PUT",
      headers: {
        Authorization: `Bearer ${context.token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        update: {
          issuelinks: [
            {
              remove: { id: issueId },
            },
          ],
        },
      }),
    });
    if (res.ok) {
      setLinkedBugs(linkedBugs.filter((bug) => bug.id !== issueId));
    }
  };

  return (
    <>
      {isLoading ? (
        "Loading.."
      ) : !!linkedBugs.length ? (
        <table>
          <thead>
            <tr>
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
                <td>{`${bug.key} ${bug.fields.summary}`}</td>
                <td>{new Date().toLocaleDateString()}</td>
                {/* <td>{new Date(bug.fields.created).toLocaleDateString()}</td> */}
                <td>{bug.fields.assignee?.displayName || "Unassigned"}</td>
                <td>{bug.fields.status.name}</td>
                <td>{bug.fields.priority.name}</td>
                <td>
                  <button onClick={() => deleteLink(bug.id)}>
                    Delete Link
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      ) : (
        <p>No linked bugs found.</p>
      )}
    </>
  );

};

export default App;

