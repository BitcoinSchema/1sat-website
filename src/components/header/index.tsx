import oneSatLogo from "@/assets/images/oneSatLogoDark.svg";
import Image from "next/image";
import Link from "next/link";
import SearchBar from "../SearchBar";
import Wallet from "../Wallet/menu";
import MarketMenu from "../marketMenu";

const Header = ({ ubuntu }: { ubuntu: { className: string } }) => {
  return (
    <header className="mb-12 z-10">
      <div className="navbar bg-base-100 relative">
        <div className="navbar-start">
          <div className="px-2 min-w-12">
            <Link
              className={`text-2xl flex items-center z-20 font-medium ${ubuntu.className}`}
              href="/"
            >
              <Image
                style={{
                  boxShadow: "0 0 0 0 rgba(0, 0, 0, 1)",
                  transform: "scale(1)",
                  animation: "pulse 2s infinite",
                }}
                src={oneSatLogo}
                alt={"1Sat Ordinals"}
                className="w-6 h-6 cursor-pointer rounded mr-2"
              />
              <span className="md:block hidden text-nowrap">
                1Sat Ordinals
              </span>
            </Link>
          </div>
        </div>
        <SearchBar />
        <div className="navbar-end">
          <MarketMenu />
          <Wallet />
        </div>
      </div>
    </header>
  );
};

export default Header;
