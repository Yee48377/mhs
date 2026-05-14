import clsx from "clsx";
import dayjs from "dayjs";
import { pinyin } from "pinyin-pro";

export function cn(...values: Array<string | false | null | undefined>) {
  return clsx(values);
}

export function formatDate(value: string | null) {
  if (!value) {
    return "未填写";
  }

  return dayjs(value).format("YYYY-MM-DD");
}

export function truncateUrl(value: string) {
  return value.length > 40 ? `${value.slice(0, 37)}...` : value;
}

export function slugifyFileName(value: string) {
  return value.replace(/[^a-zA-Z0-9._-]/g, "_");
}

export function serializeStoredEvidenceUrls(values: string[]) {
  const cleaned = values.map((value) => value.trim()).filter(Boolean);

  if (cleaned.length <= 1) {
    return cleaned[0] || "";
  }

  return JSON.stringify(cleaned);
}

export function parseStoredEvidenceUrls(value: string | null | undefined) {
  if (!value) {
    return [];
  }

  const trimmed = value.trim();

  if (!trimmed) {
    return [];
  }

  if (trimmed.startsWith("[")) {
    try {
      const parsed = JSON.parse(trimmed);

      if (Array.isArray(parsed)) {
        return parsed.filter((item): item is string => typeof item === "string" && item.trim().length > 0);
      }
    } catch {
      return [];
    }
  }

  return [trimmed];
}

export function getRecordIndexKey(value: string) {
  const trimmed = value.trim();

  if (!trimmed) {
    return "#";
  }

  const firstChar = trimmed[0];

  if (/[A-Za-z]/.test(firstChar)) {
    return firstChar.toUpperCase();
  }

  if (/[0-9]/.test(firstChar)) {
    return "#";
  }

  const py = pinyin(firstChar, { toneType: "none", type: "array" })[0];
  const initial = py?.[0]?.toUpperCase();

  if (initial && /[A-Z]/.test(initial)) {
    return initial;
  }

  return "#";
}
