import React, { useEffect, useState } from "react";
import { view } from "@forge/bridge";

// TODO: convert to TS
const App = () => {
  const [linkedBugs, setLinkedBugs] = useState([]);
  const [sortColumn, setSortColumn] = useState(null);
  const [sortOrder, setSortOrder] = useState("asc");

  useEffect(() => {
    const fetchLinkedBugs = async () => {
      const context = await view.getContext();
      const issueKey = context.extension.issue.key;
      const res = await fetch(
        `/rest/api/3/issue/${issueKey}?fields=issuelinks`,
        {
          headers: {
            Authorization: `Bearer ${context.token}`,
          },
        }
      );
      const data = await res.json();
      const bugs = data.fields.issuelinks
        .filter(
          (link) =>
            link.outwardIssue &&
            link.outwardIssue.fields.issuetype.name === "Bug"
        )
        .map((link) => link.outwardIssue);
      setLinkedBugs(bugs);
    };

    fetchLinkedBugs();
  }, []);

  const handleSort = (column) => {
    const order = sortColumn === column && sortOrder === "asc" ? "desc" : "asc";
    const sortedBugs = [...linkedBugs].sort((a, b) => {
      if (a.fields[column] < b.fields[column]) return order === "asc" ? -1 : 1;
      if (a.fields[column] > b.fields[column]) return order === "asc" ? 1 : -1;
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
    <div>
      <h2>Related Bugs</h2>
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
              <td>{bug.fields.summary}</td>
              <td>{new Date(bug.fields.created).toLocaleDateString()}</td>
              <td>{bug.fields.assignee?.displayName || "Unassigned"}</td>
              <td>{bug.fields.status.name}</td>
              <td>{bug.fields.priority.name}</td>
              <td>
                <button onClick={() => deleteLink(bug.id)}>Delete Link</button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default App;
