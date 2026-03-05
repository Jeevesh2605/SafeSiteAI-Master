import Button from "./ui/Button";

export default function Navbar(){
  return (
    <header className="fixed top-0 left-0 right-0 z-50 px-8 py-5 flex items-center justify-between backdrop-blur bg-black/20 border-b border-white/6">
      <div className="flex items-center gap-3">
        <img src="/logo.svg" alt="SafeSite AI" className="w-10 h-10" />
        <span className="text-lg font-semibold">SafeSite AI</span>
      </div>

      <nav className="flex items-center gap-6 text-gray-200">
        <a href="#docs" className="hover:opacity-90">Docs</a>
        <a href="#demo" className="hover:opacity-90">Demo</a>
        <a href="#contact" onClick={() => setOpen(true)} className="hover:opacity-90">Contact</a>
        <Button className="border border-white/20 text-white hover:bg-white hover:text-black">Login</Button>
      </nav>
    </header>
  );
}
