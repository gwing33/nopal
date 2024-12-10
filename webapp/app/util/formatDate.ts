// Function that formats a date to a string.
// If the date is the current year, it won't show the year.
export function formatDate(date: Date) {
  const now = new Date();
  const year = date.getFullYear();
  const month = date.toLocaleString("en-US", { month: "short" });
  const day = date.toLocaleString("en-US", { day: "numeric" });

  if (year === now.getFullYear()) {
    return `${month} ${day}`;
  }

  return `${month} ${day}, ${year}`;
}
