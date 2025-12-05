import Link from "next/link";
import type React from "react";
interface Props {
  currentTab: InscriptionTab | undefined;
  showIndicator?: boolean;
  onClickSelected?: (
    e: React.MouseEvent<HTMLAnchorElement, MouseEvent>
  ) => void;
}

export enum InscriptionTab {
  Image = "image",
  BSV20 = "bsv20",
  BSV21 = "bsv21",
  SNS = "sns",
  Text = "text",
  HTML = "html",
  Video = "video",
  Model = "model",
  Collection = "collection",
}

const InscriptionTabs: React.FC<Props> = ({
  currentTab,
  showIndicator,
  onClickSelected,
}) => {
  return (
    <div role="tablist" className="tabs tabs-bordered max-w-7xl mx-auto my-8">
      <Link href={`/inscribe`} role={'tab'} className={`tab ${currentTab === InscriptionTab.Image ? 'tab-active' : ''}`}>
        <div
      
          onClick={(e: any) =>
            currentTab === InscriptionTab.Image && onClickSelected
              ? onClickSelected(e)
              : () => {}
          }
        >
          Image
        </div>
      </Link>
      <Link href={`/inscribe?tab=text`} role={'tab'} className={`tab ${currentTab === InscriptionTab.Text ? 'tab-active' : ''}`}>
        <div
     
          onClick={(e: any) =>
            currentTab === InscriptionTab.Text && onClickSelected
              ? onClickSelected(e)
              : () => {}
          }
        >
          Text
        </div>
      </Link>
      <Link href={`/inscribe?tab=html`} role={'tab'} className={`tab ${currentTab === InscriptionTab.HTML ? 'tab-active' : ''}`}>
        <div
  
          onClick={(e: any) =>
            currentTab === InscriptionTab.HTML && onClickSelected
              ? onClickSelected(e)
              : () => {}
          }
        >
          HTML
        </div>
      </Link>
      <Link href={`/inscribe?tab=bsv20`} role={'tab'} className={`tab ${currentTab === InscriptionTab.BSV20 ? 'tab-active' : ''}`}>
        <div
      
          onClick={(e: any) =>
            currentTab === InscriptionTab.BSV20 && onClickSelected
              ? onClickSelected(e)
              : () => {}
          }
        >
          BSV-20
        </div>
      </Link>
      <Link href={`/inscribe?tab=bsv21`} role={'tab'} className={`tab ${currentTab === InscriptionTab.BSV21 ? 'tab-active' : ''}`}>
        <div
          onClick={(e: any) =>
            currentTab === InscriptionTab.BSV21 && onClickSelected
              ? onClickSelected(e)
              : () => {}
          }
        >
          BSV-21
        </div>
      </Link>
      {/* <div
        $partiallyactive={currentTab === InscriptionTab.Model ? "true" : "false"}
        href={`/inscribe?tab=model`}
        onClick={(e) =>
          currentTab === InscriptionTab.Model && onClickSelected
            ? onClickSelected(e)
            : () => {}
        }
      >
        3D Model
      </div> */}
      {/* <div
        $partiallyactive={
          currentTab === InscriptionTab.Collection ? "true" : "false"
        }
        href={`/inscribe?tab=collection`}
        onClick={(e) =>
          currentTab === InscriptionTab.Collection && onClickSelected
            ? onClickSelected(e)
            : () => {}
        }
      >
        Collection
      </div> */}
      {/* <div
        $partiallyactive={currentTab === InscriptionTab.BSV20 ? "true" : "false"}
        href={`/inscribe?tab=video`}
        onClick={(e) =>
          currentTab === InscriptionTab.Video && onClickSelected
            ? onClickSelected(e)
            : () => {}
        }
      >
        Video
      </div> */}
    </div>
  );
};

export default InscriptionTabs;
