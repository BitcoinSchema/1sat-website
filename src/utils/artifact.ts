import { ArtifactType, artifactTypeMap } from "@/components/artifact";
import { API_HOST, ORDFS, resultsPerPage } from "@/constants";
import { type Inscription, type OpNSData, OpNsStatus, type OrdUtxo } from "@/types/ordinals";
import { Hash, Utils } from "@bsv/sdk";

export const fillContentType = async (artifact: OrdUtxo): Promise<OrdUtxo> => {
  const origin =
    artifact.origin?.outpoint || `${artifact.txid}_${artifact.vout}`;
  const url = `${ORDFS}/${origin}`;

  try {
    const response = await fetch(url);
    if (response.status !== 404) {
      const blob = await response.blob();
      const buff = await response.arrayBuffer();
      const f = {
        hash: Utils.toHex(Hash.sha256(Buffer.from(buff).toString('hex'), 'hex')),
        size: blob.size,
        type: blob.type,
      };
      if (artifact.origin?.data?.insc?.file) {
        artifact.origin.data.insc.file = f;
      }
    }
    return artifact;
  } catch (e) {
    console.error(e);
    // dont fail if we cant find an image
    return artifact;
  }
};

export const getArtifactType = (
  txo: OrdUtxo,
  latest: boolean,
): ArtifactType => {
  let artifactType: ArtifactType = ArtifactType.Unknown;
  const t = latest
    ? txo?.data?.insc?.file.type
    : txo?.origin?.data?.insc?.file.type || undefined;
  // console.log("TYPE", t);
  const protocol = txo.origin?.data?.insc?.json?.p;
  if (!t) {
    return artifactType;
  }
  if (t?.startsWith("audio")) {
    artifactType = ArtifactType.Audio;
  } else if (t === "application/vnd.apple.mpegurl") {
    artifactType = ArtifactType.Audio2;
  } else if (t.startsWith("video")) {
    artifactType = ArtifactType.Video;
  } else if (t.startsWith("model")) {
    artifactType = ArtifactType.Model;
  } else if (t === "application/pdf") {
    artifactType = ArtifactType.Model;
  } else if (t === "application/javascript") {
    artifactType = ArtifactType.Javascript;
  } else if (t === "text/plain") {
    artifactType = ArtifactType.Text;
  } else if (t === "text/markdown") {
    artifactType = ArtifactType.MarkDown;
  } else if (t === "text/html") {
    artifactType = ArtifactType.HTML;
  } else if (t.startsWith("text/")) {
    artifactType = ArtifactType.Text;
  } else if (t === "application/bsv-20") {
    artifactType = ArtifactType.BSV20;
  } else if (t === "application/lrc-20" || protocol === "lrc-20") {
    artifactType = ArtifactType.LRC20;
  } else if (t === "application/op-ns") {
    artifactType = ArtifactType.OPNS;
  } else if (t === "application/json") {
    artifactType = ArtifactType.JSON;
  } else if (t.startsWith("image/svg")) {
    artifactType = ArtifactType.SVG;
  } else if (t.startsWith("image")) {
    artifactType = ArtifactType.Image;
  }
  return artifactType;
};

export const displayName = (
  txo: OrdUtxo,
  latest: boolean,
): string | undefined => {
  if (!txo.origin) {
    return txo.outpoint;
  }
  const type = getArtifactType(txo, latest);

  switch (type) {
    case ArtifactType.Audio:
    case ArtifactType.Video:
    case ArtifactType.Model:
    case ArtifactType.Image:
      return latest
        ? txo.data?.map?.name ||
        txo.data?.map?.subTypeData?.name ||
        txo.data?.map?.app ||
        "Unknown Name"
        : txo.origin?.data?.map?.name ||
        txo.origin?.data?.map?.subTypeData?.name ||
        txo.origin?.data?.map?.app ||
        "Unknown Name";
    case ArtifactType.Text:
    case ArtifactType.MarkDown:
    case ArtifactType.HTML: {
      const nameFromMeta = (txo.origin?.data?.map?.name ||
        txo.origin?.data?.map?.subTypeData?.name);
      if (nameFromMeta) {
        return nameFromMeta
      }
      const html = !latest
        ? txo.origin?.data?.insc?.text
        : txo.data?.insc?.text;
      const title = html?.match(/<title>(.*)<\/title>/)?.[1];
      return title || txo.origin?.num;
    }
    case ArtifactType.JSON:
      return latest
        ? txo.data?.insc?.text || txo.origin?.num
        : txo.origin?.data?.insc?.text || txo.origin?.num;
    case ArtifactType.BSV20:
      return latest ? txo.data?.bsv20?.tick || txo?.data?.insc?.json?.sym : txo.origin?.data?.bsv20?.tick || txo.origin?.data?.insc?.json?.sym;
    case ArtifactType.LRC20: {
      const data = latest ? txo.data?.insc as Inscription : txo.origin?.data?.insc as Inscription;
      return `${data.json.p} ${data.json.op} ${data.json.amt}`;
    }
    case ArtifactType.OPNS: {
      const data = latest ? txo.data?.opns as OpNSData : txo.origin?.data?.opns as OpNSData;
      return `${data.domain} ${data.status === OpNsStatus.Valid ? "(Valid)" : data.status === OpNsStatus.Pending ? "(Pending)" : "(Invalid)"}`;
    }
    case ArtifactType.Javascript:
      return latest
        ? txo.data?.insc?.text || txo.origin?.num
        : txo.origin?.data?.insc?.text || txo.origin?.num;
    default:
      return latest
        ? txo.data?.insc?.text || txo.origin?.num
        : txo.origin?.data?.insc?.text || txo.origin?.num;
  }
};

export const getMarketListings = async ({
  pageParam,
  selectedType,
  term,
}: {
  pageParam: number;
  selectedType: ArtifactType | null;
  term?: string;
}) => {
  console.log("get market listings called", pageParam, selectedType, term);
  const offset = resultsPerPage * pageParam;
  let url = `${API_HOST}/api/market?limit=${resultsPerPage}&offset=${offset}&dir=DESC`;

  if (term) {
    url += `&text=${term}`;
  }

  if (selectedType && selectedType !== ArtifactType.All) {
    url += `&type=${artifactTypeMap.get(selectedType)}`;
  }
  console.log("Using url", url);
  const res = await fetch(url);
  // filter for the selected type
  const json = res.json() as Promise<OrdUtxo[]>;

  const result = await json;
  const final =
    selectedType !== ArtifactType.All
      ? result.filter((o) => {
        return o.origin?.data?.insc?.file.type?.startsWith(
          artifactTypeMap.get(selectedType as ArtifactType) as string,
        );
      })
      : result;
  return final;
};
