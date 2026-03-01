export function formatDate(date: string) {
  return new Date(date).toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

export function formatYear(year: number, endYear?: number) {
  if (endYear && endYear !== year) {
    return `${year}\u2013${endYear}`;
  }
  return String(year);
}
