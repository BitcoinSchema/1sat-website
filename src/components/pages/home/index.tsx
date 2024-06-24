import type { OrdUtxo } from "@/types/ordinals";
import { Noto_Serif } from "next/font/google";
import type React from "react";
import { Suspense } from "react";
import { LoaderIcon } from "react-hot-toast";
import SlideshowLoader from "./loader";
import Menu from "./menu";
import FlowLoader from "./flowLoader";

const notoSerif = Noto_Serif({
  style: "italic",
  weight: ["400", "700"],
  subsets: ["latin"],
});

const HomePage: React.FC = async () => {
  return (
    <main className="px-4 flex items-center justify-center w-full min-h-[calc(100dvh-15rem+)]">
      <div className="flex flex-col items-center w-full h-full">
        <div className="w-full flex flex-col items-center justify-start h-full">
          <Menu />
          <div
            className={`divider divider-warning w-64 mx-auto text-warning/50 ${notoSerif.className}`}
          >
            BROWSE DEX
          </div>

          <Suspense
            fallback={
              <div className="w-96 h-fit flex items-center justify-center">
                <LoaderIcon />
              </div>
            }
          >
            <FlowLoader />
          </Suspense>
        </div>
      </div>
  
    </main>
  );
};

export default HomePage;
