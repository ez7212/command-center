import { formatDistanceToNow } from "date-fns";

export function relativeTime(value: string | null | undefined) {
  if (!value) {
    return "Not yet";
  }

  return `${formatDistanceToNow(new Date(value))} ago`;
}

export function shortDate(value: string | null | undefined) {
  if (!value) {
    return "Not set";
  }

  return new Intl.DateTimeFormat("en", {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  }).format(new Date(value));
}

export function labelize(value: string) {
  return value.replace(/[-_]+/g, " ");
}
