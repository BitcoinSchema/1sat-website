import Link from "next/link";
import { BsGpuCard } from "react-icons/bs";
import { FaBook, FaDiscord } from "react-icons/fa6";

const Footer = () => {
  const linkClass =
    "flex items-center text-xs text-muted-foreground hover:text-primary transition-colors font-mono uppercase tracking-wider";

  return (
    <footer className="fixed bottom-0 left-0 z-50 w-full border-t border-border bg-background/80 backdrop-blur-md py-3 sm:py-4 mt-auto transition-all duration-300">
      <div className="flex flex-wrap justify-center items-center gap-x-3 sm:gap-x-4 gap-y-1 px-3 sm:px-4">
        <Link
          href="https://docs.1satordinals.com"
          target="_blank"
          className={linkClass}
        >
          <FaBook className="mr-1.5 w-3 h-3" /> Protocol
        </Link>
        <span className="text-border">/</span>
        <Link href="/mine" className={linkClass}>
          <BsGpuCard className="mr-1.5 w-3 h-3" /> Mine
        </Link>
        <span className="text-border">/</span>
        <Link
          href="https://discord.gg/t5AsAsQxGT"
          target="_blank"
          className={linkClass}
        >
          <FaDiscord className="mr-1.5 w-3 h-3" /> Discord
        </Link>
        <span className="text-border">/</span>
        <Link
          href="https://x.com/1SatMarket"
          target="_blank"
          className={linkClass}
        >
          <svg
            className="w-3 h-3 mr-1.5"
            viewBox="0 0 24 24"
            fill="currentColor"
          >
            <title>X</title>
            <path d="M17.1761 4H19.9362L13.9061 10.7774L21 20H15.4456L11.0951 14.4066L6.11723 20H3.35544L9.80517 12.7508L3 4H8.69545L12.6279 9.11262L17.1761 4ZM16.2073 18.3754H17.7368L7.86441 5.53928H6.2232L16.2073 18.3754Z" />
          </svg>
          @1SatMarket
        </Link>
      </div>
    </footer>
  );
};

export default Footer;
