export default function Loading() {
  return (
    <main
      className="min-h-[60vh] flex items-center justify-center px-6"
      aria-busy="true"
      aria-live="polite"
    >
      <div
        className="w-8 h-8 border-2 border-fg/20 border-t-fg rounded-full animate-spin"
        role="status"
        aria-label="Loading"
      />
    </main>
  );
}
