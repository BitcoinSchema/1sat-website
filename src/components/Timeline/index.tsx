import { default as JDenticon } from "@/components/JDenticon";
import { OrdUtxo } from "@/types/ordinals";
import Link from "next/link";
import { TbTag } from "react-icons/tb";
import { toBitcoin } from "satoshi-bitcoin-ts";

interface Props {
  history: OrdUtxo[];
  listing: OrdUtxo;
  spends: OrdUtxo[];
}

const Timeline = ({ history, listing, spends }: Props) => {
  return (
    <ul className="timeline timeline-vertical">
      {history.reverse().map((h, idx) => {
        let text;
        let positionClass = `${idx % 2 === 0 ? 'timeline-start' : 'timeline-end'} timeline-box`;
        let positionClass2 = `${idx % 2 === 1 ? 'timeline-start' : 'timeline-end'} timeline-box`;
        if (h.data?.list?.price) {
          text = (
            <Link
              href={`/outpoint/${h.outpoint}`}
              className="break-normal flex items-center gap-1"
            >
              <JDenticon
                hashOrValue={listing.owner!}
                className="w-4 h-4 inline-block"
              />
              <TbTag />
              {toBitcoin(h.data?.list?.price)} BSV
            </Link>
          );
        } else if (h.data?.insc?.file) {
          text = (
            <>
              Minted by{" "}
              <Link href={`/signer/${listing.owner}`}>
                <JDenticon
                  hashOrValue={listing.owner}
                  className="w-4 h-4 inline-block"
                />
              </Link>
            </>
          );
        } else if (h.spend) {
          const spentListing = spends.find((s) => s.txid === h.spend);
          console.log({ spentListing });
          text = (
            <Link
              href={`https://whatsonchain.com/tx/${h.spend}`}
              target="_blank"
            >{`Bought / cancelled`}</Link>
          );
        }
        const wocUrl = `https://whatsonchain.com/tx/${h.txid}`;
        const linkUrl = `/outpoint/${h.outpoint}`;
        return (
          <li key={`${h.txid}-${h.vout}-${h.height}`} className="text-sm">
            <div className={positionClass}>
              <Link href={linkUrl}>{h.height}</Link>
            </div>
            <div
              className={`timeline-middle ${
                listing.outpoint === h.outpoint ? "text-emerald-300" : ""
              }`}
            >
              {timelineSvg}
            </div>
            <div className={positionClass2}>{text}</div>
            <hr />
          </li>
        );
      })}
    </ul>
  );
};

export default Timeline;

const timelineSvg = (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    viewBox="0 0 20 20"
    fill="currentColor"
    className="w-5 h-5"
  >
    <path
      fillRule="evenodd"
      d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.857-9.809a.75.75 0 00-1.214-.882l-3.483 4.79-1.88-1.88a.75.75 0 10-1.06 1.061l2.5 2.5a.75.75 0 001.137-.089l4-5.5z"
      clipRule="evenodd"
    />
  </svg>
);
