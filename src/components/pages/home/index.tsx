import type { OrdUtxo } from "@/types/ordinals";
import type React from "react";
import { Suspense } from "react";
import { LoaderIcon } from "react-hot-toast";
import SlideshowLoader from "./loader";
import FlowLoader from "./flowLoader";

const HomePage: React.FC = async () => {
  return (
    <main className="px-4 flex items-center justify-center w-full min-h-[calc(100dvh-15rem+)]">
      <Suspense
        fallback={
          <div className="w-96 h-fit flex items-center justify-center">
            <LoaderIcon />
          </div>
        }
      >
        <FlowLoader />
      </Suspense>
    </main>
  );
};

export default HomePage;
