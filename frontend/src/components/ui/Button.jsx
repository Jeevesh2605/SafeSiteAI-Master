export default function Button({ children, className = "", ...props }) {
  return (
    <button
      {...props}
      className={`px-6 py-2 rounded-2xl font-semibold transition-all ${className}`}
    >
      {children}
    </button>
  );
}
