import React from "react";

export function Footer() {
  return (
    <footer className="mt-auto border-t border-white/[0.08] bg-black py-5 px-4 text-center">
      <p className="text-xs text-neutral-400">
        © {new Date().getFullYear()} White Card Wallet · Personal document wallet – not a government-issued ID. All documents self-declared.
      </p>
    </footer>
  );
}
