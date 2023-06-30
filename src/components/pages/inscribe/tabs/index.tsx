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
      <S.Tab
        partiallyactive={currentTab === InscriptionTab.Image ? "true" : "false"}
        href={`/inscribe?tab=image`}
        onClick={(e) =>
          currentTab === InscriptionTab.Image && onClickSelected
            ? onClickSelected(e)
            : () => {}
        }
      >
        Image
      </S.Tab>
      <S.Tab
        partiallyactive={currentTab === InscriptionTab.Text ? "true" : "false"}
        href={`/inscribe?tab=text`}
        onClick={(e) =>
          currentTab === InscriptionTab.Text && onClickSelected
            ? onClickSelected(e)
            : () => {}
        }
      >
        Text
      </S.Tab>
      <S.Tab
        partiallyactive={currentTab === InscriptionTab.HTML ? "true" : "false"}
        href={`/inscribe?tab=html`}
        onClick={(e) =>
          currentTab === InscriptionTab.HTML && onClickSelected
            ? onClickSelected(e)
            : () => {}
        }
      >
        HTML
      </S.Tab>
      <S.Tab
        partiallyactive={currentTab === InscriptionTab.BSV20 ? "true" : "false"}
        href={`/inscribe?tab=bsv20`}
        onClick={(e) =>
          currentTab === InscriptionTab.BSV20 && onClickSelected
            ? onClickSelected(e)
            : () => {}
        }
      >
        BSV-20
      </S.Tab>
      {/* <S.Tab
        partiallyactive={currentTab === InscriptionTab.Model ? "true" : "false"}
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
        partiallyactive={
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
        partiallyactive={currentTab === InscriptionTab.BSV20 ? "true" : "false"}
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
