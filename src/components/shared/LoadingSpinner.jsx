export default function LoadingSpinner({
  size = "md",
  label = "Loading",
  className = "",
}) {
  const sizes = { sm: "h-4 w-4", md: "h-8 w-8", lg: "h-12 w-12" };

  return (
    <div
      className={`flex min-h-[40vh] w-full items-center justify-center px-4 py-10 ${className}`}
    >
      <div className="flex items-center gap-3 rounded-2xl border border-white/70 bg-white/85 px-5 py-4 shadow-sm backdrop-blur">
        <div
          className={`${sizes[size]} animate-spin rounded-full border-4 border-primary border-t-transparent`}
        />
        <div className="space-y-0.5">
          <p className="text-sm font-medium text-slate-700">{label}</p>
          <p className="text-xs text-slate-500">Please wait a moment.</p>
        </div>
      </div>
    </div>
  );
}
