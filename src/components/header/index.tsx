import oneSatLogo from "@/assets/images/oneSatLogoDark.svg";
import Image from "next/image";
import Router, { useRouter } from "next/router";

const Header: React.FC = () => {
  const router = useRouter();
  return (
    <div className="mx-auto">
      <div
        className="text-2xl md:opacity-25 md:hover:opacity-100 duration-700 transition mt-6 text-white cursor-pointer"
        onClick={() => Router.push("/")}
      >
        {router.pathname !== "/" && (
          <Image
            src={oneSatLogo}
            // onClick={() => Router?.push("/wallet")}
            alt={"1Sat Ordinals"}
            className="w-8 h-8 cursor-pointer mx-auto rounded"
            style={{
              animation: "opulcity 8s infinite",
            }}
          />
        )}
      </div>
    </div>
  );
};

export default Header;
