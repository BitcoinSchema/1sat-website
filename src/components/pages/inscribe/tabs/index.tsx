import Link from "next/link";
import React from "react";
import * as S from "./styles";
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
    <S.Tabs className="max-w-7xl mx-auto my-8">
      <Link href={`/inscribe`}>
        <S.Tab
          $partiallyactive={
            currentTab === InscriptionTab.Image ? "true" : "false"
          }
          onClick={(e: any) =>
            currentTab === InscriptionTab.Image && onClickSelected
              ? onClickSelected(e)
              : () => {}
          }
        >
          Image
        </S.Tab>
      </Link>
      <Link href={`/inscribe?tab=text`}>
        <S.Tab
          $partiallyactive={
            currentTab === InscriptionTab.Text ? "true" : "false"
          }
          onClick={(e: any) =>
            currentTab === InscriptionTab.Text && onClickSelected
              ? onClickSelected(e)
              : () => {}
          }
        >
          Text
        </S.Tab>
      </Link>
      <Link href={`/inscribe?tab=html`}>
        <S.Tab
          $partiallyactive={
            currentTab === InscriptionTab.HTML ? "true" : "false"
          }
          onClick={(e: any) =>
            currentTab === InscriptionTab.HTML && onClickSelected
              ? onClickSelected(e)
              : () => {}
          }
        >
          HTML
        </S.Tab>
      </Link>
      <Link href={`/inscribe?tab=bsv20`}>
        <S.Tab
          $partiallyactive={
            currentTab === InscriptionTab.BSV20 ? "true" : "false"
          }
          onClick={(e: any) =>
            currentTab === InscriptionTab.BSV20 && onClickSelected
              ? onClickSelected(e)
              : () => {}
          }
        >
          BSV-20
        </S.Tab>
      </Link>
      {/* <S.Tab
        $partiallyactive={currentTab === InscriptionTab.Model ? "true" : "false"}
        href={`/inscribe?tab=model`}
        onClick={(e) =>
          currentTab === InscriptionTab.Model && onClickSelected
            ? onClickSelected(e)
            : () => {}
        }
      >
        3D Model
      </S.Tab> */}
      {/* <S.Tab
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
      </S.Tab> */}
      {/* <S.Tab
        $partiallyactive={currentTab === InscriptionTab.BSV20 ? "true" : "false"}
        href={`/inscribe?tab=video`}
        onClick={(e) =>
          currentTab === InscriptionTab.Video && onClickSelected
            ? onClickSelected(e)
            : () => {}
        }
      >
        Video
      </S.Tab> */}
    </S.Tabs>
  );
};

export default InscriptionTabs;
