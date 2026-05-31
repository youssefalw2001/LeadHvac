export function AdminLauncher() {
  return (
    <button
      className="admin-launcher"
      onClick={() => {
        window.location.hash = '#admin';
        window.dispatchEvent(new HashChangeEvent('hashchange'));
      }}
      aria-label="Open JobLeak admin inbox"
    >
      Admin Inbox
    </button>
  );
}
