const DATE_ONLY_REGEX = /^(\d{4})-(\d{2})-(\d{2})$/;
const DATE_TIME_NO_TZ_REGEX =
  /^(\d{4})-(\d{2})-(\d{2})[T ](\d{2}):(\d{2})(?::(\d{2}))?/;
const HAS_TIMEZONE_REGEX = /(Z|[+-]\d{2}:\d{2})$/i;

const KST_DATE_FORMATTER = new Intl.DateTimeFormat("sv-SE", {
  timeZone: "Asia/Seoul",
});

const toEpochMs = (value: string): number => {
  if (HAS_TIMEZONE_REGEX.test(value)) {
    const parsed = Date.parse(value);
    return Number.isNaN(parsed) ? Number.NaN : parsed;
  }

  const match = DATE_TIME_NO_TZ_REGEX.exec(value);
  if (!match) {
    const parsed = Date.parse(value);
    return Number.isNaN(parsed) ? Number.NaN : parsed;
  }

  const [, year, month, day, hour, minute, second = "0"] = match;
  return Date.UTC(
    Number(year),
    Number(month) - 1,
    Number(day),
    Number(hour),
    Number(minute),
    Number(second),
  );
};

export const toDateTimeEpochMs = (
  value: string | null | undefined,
): number => {
  if (!value) return Number.NaN;
  return toEpochMs(value);
};

export const parseDateOnly = (value: string): Date => {
  const match = DATE_ONLY_REGEX.exec(value);
  if (!match) {
    return new Date(value);
  }

  const [, year, month, day] = match;
  return new Date(Number(year), Number(month) - 1, Number(day));
};

export const formatDateKey = (date: Date): string => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
};

export const getTodayDateKeyInKst = (): string => {
  return KST_DATE_FORMATTER.format(new Date());
};

export const getDatePart = (value: string | null | undefined): string => {
  if (!value) return "";
  return value.split(/[T ]/)[0] ?? "";
};

export const getTimePart = (value: string | null | undefined): string => {
  if (!value) return "";
  const parts = value.split(/[T ]/);
  if (parts.length < 2) return value.substring(0, 5);
  return parts[1]?.substring(0, 5) ?? "";
};

export const getHourFromDateTime = (
  value: string | null | undefined,
): number => {
  const time = getTimePart(value);
  const hour = Number(time.split(":")[0]);
  return Number.isNaN(hour) ? 0 : hour;
};

export const diffDateTimeMinutes = (
  start: string | null | undefined,
  end: string | null | undefined,
): number => {
  if (!start || !end) return 0;
  const startMs = toDateTimeEpochMs(start);
  const endMs = toDateTimeEpochMs(end);
  if (Number.isNaN(startMs) || Number.isNaN(endMs)) return 0;
  return Math.floor((endMs - startMs) / (1000 * 60));
};

export const compareDateTimes = (
  left: string | null | undefined,
  right: string | null | undefined,
): number => {
  if (!left && !right) return 0;
  if (!left) return -1;
  if (!right) return 1;

  const leftMs = toEpochMs(left);
  const rightMs = toEpochMs(right);

  if (!Number.isNaN(leftMs) && !Number.isNaN(rightMs)) {
    return leftMs - rightMs;
  }

  return left.localeCompare(right);
};

export const diffDateKeys = (startDate: string, endDate: string): number => {
  const start = parseDateOnly(startDate);
  const end = parseDateOnly(endDate);
  start.setHours(0, 0, 0, 0);
  end.setHours(0, 0, 0, 0);
  return Math.floor((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24));
};
