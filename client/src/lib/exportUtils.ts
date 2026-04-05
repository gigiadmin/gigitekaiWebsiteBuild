/**
 * Export utilities for admin dashboard
 * Provides functions to export tickets, chats, and user data
 */

export function exportToCSV(data: any[], filename: string) {
  if (!data || data.length === 0) {
    alert("No data to export");
    return;
  }

  // Get headers from first object
  const headers = Object.keys(data[0]);

  // Create CSV content
  const csvContent = [
    headers.join(","),
    ...data.map((row) =>
      headers
        .map((header) => {
          const value = row[header];
          // Escape quotes and wrap in quotes if contains comma
          if (typeof value === "string" && (value.includes(",") || value.includes('"'))) {
            return `"${value.replace(/"/g, '""')}"`;
          }
          return value;
        })
        .join(",")
    ),
  ].join("\n");

  // Create blob and download
  const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
  const link = document.createElement("a");
  const url = URL.createObjectURL(blob);
  link.setAttribute("href", url);
  link.setAttribute("download", `${filename}-${new Date().toISOString().split("T")[0]}.csv`);
  link.style.visibility = "hidden";
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

export function exportTicketsToCSV(tickets: any[]) {
  const exportData = tickets.map((ticket) => ({
    ID: ticket.id,
    Title: ticket.title,
    Status: ticket.status,
    Priority: ticket.priority,
    Category: ticket.category,
    "Created Date": new Date(ticket.createdAt).toLocaleDateString(),
    "Updated Date": new Date(ticket.updatedAt).toLocaleDateString(),
    Description: ticket.description || "",
  }));

  exportToCSV(exportData, "tickets");
}

export function exportUsersToCSV(users: any[]) {
  const exportData = users.map((user) => ({
    ID: user.id,
    Name: user.name,
    Email: user.email,
    Role: user.role,
    Status: user.approved ? "Approved" : "Pending",
    "Created Date": new Date(user.createdAt).toLocaleDateString(),
    "Last Sign-in": user.lastSignedIn ? new Date(user.lastSignedIn).toLocaleDateString() : "Never",
  }));

  exportToCSV(exportData, "users");
}

export function exportChatsToJSON(chats: any[]) {
  const exportData = chats.map((chat) => ({
    sessionId: chat.sessionId,
    userId: chat.userId,
    userName: chat.userName,
    userEmail: chat.userEmail,
    messages: chat.messages || [],
    createdAt: chat.createdAt,
    closedAt: chat.closedAt,
  }));

  const jsonContent = JSON.stringify(exportData, null, 2);
  const blob = new Blob([jsonContent], { type: "application/json;charset=utf-8;" });
  const link = document.createElement("a");
  const url = URL.createObjectURL(blob);
  link.setAttribute("href", url);
  link.setAttribute("download", `chats-${new Date().toISOString().split("T")[0]}.json`);
  link.style.visibility = "hidden";
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}
