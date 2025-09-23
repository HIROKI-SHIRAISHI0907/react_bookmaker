export default function LogoutButton() {
  return (
    <button
      onClick={async () => {
        await fetch("http://localhost:8080/api/auth/logout", { method: "POST", credentials: "include" });
        window.location.href = "/login";
      }}
    >
      ログアウト
    </button>
  );
}