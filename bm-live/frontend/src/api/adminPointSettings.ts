export type PointSettingEntity = {
  id?: string;
  country: string;
  league: string;
  win: number | null;
  lose: number | null;
  draw: number | null;
  remarks: string;
  delFlg?: string;
};

export type PointSettingItem = {
  country: string;
  league: string;
  win: number | null;
  lose: number | null;
  draw: number | null;
  remarks: string;
  delFlg?: string;
};

export type PointSettingsSaveRequest = {
  items: PointSettingItem[];
};

const BASE_URL = "/v1/api/admin/point-settings";

export const REMARKS_PATTERN = /^PK勝ち\s*=\s*\d+\s*,\s*PK負け\s*=\s*\d+$/;

export function normalizeRemarks(value: string | null | undefined): string {
  return (value ?? "").trim();
}

export function isValidRemarks(value: string | null | undefined): boolean {
  const text = normalizeRemarks(value);
  if (!text) return true;
  return REMARKS_PATTERN.test(text);
}

export async function fetchPointSettings(): Promise<PointSettingEntity[]> {
  const response = await fetch(BASE_URL, {
    method: "GET",
    headers: {
      Accept: "application/json",
    },
    credentials: "include",
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(`point settings fetch failed: ${response.status} ${text}`);
  }

  return response.json();
}

export async function savePointSettings(request: PointSettingsSaveRequest): Promise<PointSettingEntity[]> {
  const response = await fetch(BASE_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Accept: "application/json",
    },
    credentials: "include",
    body: JSON.stringify(request),
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(`point settings save failed: ${response.status} ${text}`);
  }

  return response.json();
}
