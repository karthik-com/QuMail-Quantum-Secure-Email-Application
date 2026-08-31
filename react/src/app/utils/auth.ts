const API_BASE = "http://127.0.0.1:8000";

type LogoutResult = {
  ok: boolean;
  message?: string;
};

export function clearAuth() {
  localStorage.removeItem("access");
  localStorage.removeItem("refresh");
}

export async function logout(): Promise<LogoutResult> {
  const accessToken = localStorage.getItem("access");
  const refreshToken = localStorage.getItem("refresh");
  const result: LogoutResult = { ok: true };

  if (!accessToken) {
    clearAuth();
    return result;
  }

  try {
    const response = await fetch(`${API_BASE}/logout/`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${accessToken}`,
      },
      body: JSON.stringify({ refresh: refreshToken || null }),
    });

    if (!response.ok) {
      result.ok = false;
      result.message = `Logout failed with status ${response.status}`;
    }
  } catch (error) {
    result.ok = false;
    result.message = "Network error during logout.";
  }

  clearAuth();
  return result;
}
