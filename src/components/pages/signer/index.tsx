import Timeline from "@/components/Timeline";
import type { OrdUtxo } from "@/types/ordinals";
import { uniqBy } from "lodash";
import Link from "next/link";
import SlideShow from "../home/slideshow";

interface Props {
  history: OrdUtxo[];
  address: string;
}
const SignerPage = ({ address, history }: Props) => {
  // console.log({ history });

  const inscriptions = uniqBy(
    history.filter((h) => h.origin?.data?.insc?.file),
    (h) => h.origin?.outpoint
  );

  return (
    <div className="mx-auto">
      <h1 className="xl">{address}</h1>
      <div className="flex gap-4">
        <div className="w-1/2">
          <SlideShow artifacts={inscriptions} />
        </div>
        <div className="w-1/2">
          <Timeline
            history={history.sort((a, b) => {
              return a.height > b.height ? -1 : 1;
            })}
            listing={history[0]}
            spends={[]}
          />
        </div>
      </div>
      <ul>
        {history.reverse().map((h) => {
          let text;
          if (h.data?.list?.price) {
            console.log(h);
            text = `${h.height}: Listed by ${h.owner} for ${h.data?.list?.price} BSV`;
          } else if (h.data?.insc?.file) {
            if (!h.height) {
              console.log("MINT?", { insc: h.data.insc });
            }
            text = `${h.height}: Minted by ${h.owner}`;
          } else if (h.spend) {
            text = (
              <Link
                href={`/outpoint/${h.outpoint}`}
              >{`${h?.height}: Sold ${h.origin?.outpoint}`}</Link>
            );
          }
          return (
            <li key={`${h.txid}-${h.vout}-${h.height}`} className="text-sm">
              {text}
            </li>
          );
        })}
      </ul>
    </div>
  );
};

export default SignerPage;
