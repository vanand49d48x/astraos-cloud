export default function Loading() {
  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="relative">
        <div className="w-12 h-12 rounded-full border-2 border-white/10 border-t-primary animate-spin" />
        <div className="absolute inset-0 w-12 h-12 rounded-full border-2 border-transparent border-b-primary/30 animate-spin" style={{ animationDuration: "1.5s", animationDirection: "reverse" }} />
      </div>
    </div>
  );
}
