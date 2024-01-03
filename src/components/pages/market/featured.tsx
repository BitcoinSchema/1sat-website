import Artifact from "@/components/artifact";
import { API_HOST, OrdUtxo } from "@/context/ordinals";
import { customFetch } from "@/utils/httpClient";
import { groupBy, map } from "lodash";
import React, { useEffect, useMemo, useState } from "react";
import { FetchStatus } from "..";
import CollectionItem from "../inscription/collectionItem";

// {
//   "txid": "be78096df9de705f0620daca549c063f4b293123dca919f8e9617de9f4b8b8cd",
//   "vout": 0,
//   "outpoint": "be78096df9de705f0620daca549c063f4b293123dca919f8e9617de9f4b8b8cd_0",
//   "origin": "be78096df9de705f0620daca549c063f4b293123dca919f8e9617de9f4b8b8cd_0",
//   "height": 794619,
//   "idx": 10456,
//   "lock": "d093514811af934493ca1caee52c508f42a92ce3fbeee6f3663a0307cc999326",
//   "SIGMA": [],
//   "listing": false,
//   "bsv20": false,
//   "id": 2588656,
//   "num": 2588656,
//   "file": {
//     "hash": "3573ffe31bd51911135caf2fbdbbc853635410d14b2eeb6b2b80bbd5108a95ef",
//     "size": 92331,
//     "type": "image/jpeg"
//   },
//   "MAP": {
//     "app": "takeit-testing",
//     "name": "cat collection test",
//     "type": "ord",
//     "subType": "collection",
//     "royalties": "[{\"type\":\"paymail\",\"destination\":\"foundrium@handcash.io\",\"percentage\":\"0.03\"}]",
//     "previewUrl": "https://www.alltheedge.com/wp-content/uploads/2018/01/pepe.jpg",
//     "subTypeData": {
//       "traits": "{}",
//       "quantity": "3",
//       "description": "meow meow hiss",
//       "rarityLabels": "{}"
//     }
//   }
// },

export enum KnownSubType {
  Collection = "collection",
}

export type Collection = {
  txid: string;
  vout: number;
  outpoint: string;
  origin: string;
  height: number;
  idx: number;
  lock: string;
  SIGMA: any[];
  listing: boolean;
  bsv20: boolean;
  id: number;
  num: number;
  items?: string[];
  file: {
    hash: string;
    size: number;
    type: string;
  };
  MAP: {
    app: string;
    name: string;
    type: string;
    subType?: KnownSubType;
    royalties?: string;
    previewUrl?: string;
    subTypeData?: CollectionItem;
    [key: string]: any;
  };
};

interface GroupedCollection {
  name: string;
  collections: OrdUtxo[];
}

const FeaturedCollections: React.FC = () => {
  const [fetchFeaturedStatus, setFetchFeaturedStatus] = useState<FetchStatus>(
    FetchStatus.Idle
  );

  const [collectionsNew, setCollectionsNew] = useState<OrdUtxo[]>([]);

  const groupedCollections: GroupedCollection[] = useMemo(() => {
    const grouped = groupBy(
      collectionsNew
        .filter((f) => {
          return (
            f.data?.map?.subType === KnownSubType.Collection &&
            !blacklist.some((o) => o === f.origin?.outpoint)
          );
        })
        .sort((a, b) => (a.height < b.height ? -1 : 1)),
      "data.map.name"
    ) as Record<string, OrdUtxo[]>;
    return map(grouped, (value, key) => ({ name: key, collections: value }));
  }, [collectionsNew]);

  useEffect(() => {
    const fire = async () => {
      try {
        setFetchFeaturedStatus(FetchStatus.Loading);
        const { promise } = customFetch<OrdUtxo[]>(
          `${API_HOST}/api/inscriptions/search?q=${Buffer.from(
            JSON.stringify({ map: { subType: "collection" } })
          ).toString("base64")}`
        );

        const collections = await promise;
        // setCollections(collections.concat(ancientCollections));
        setCollectionsNew(collections);
        setFetchFeaturedStatus(FetchStatus.Success);
      } catch (error) {
        console.log(error);
        setFetchFeaturedStatus(FetchStatus.Error);
      }
    };
    if (fetchFeaturedStatus === FetchStatus.Idle) {
      fire();
    }
  }, [fetchFeaturedStatus]);

  // useMemo to sort by height descending
  const featuredSorted = useMemo(() => {
    return featured.sort((a, b) => (a.height < b.height ? 1 : -1));
  }, []);

  return (
    <div className="p-4 grid w-full mx-auto justify-center sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
      {featuredSorted.map((item) => {
        return (
          <div key={item.name}>
            <h2 className="my-4 text-lg font-semibold">{item.name}</h2>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <Artifact
                key={item.origin}
                origin={item.origin}
                outPoint={item.origin}
                contentType={"image/jpeg"}
                to={`/collection/${item.origin}`}
                src={item.previewUrl}
                onClick={() => {}}
                txid={item.origin.split("_")[0]}
                height={item.height}
                showFooter={false}
              />
            </div>
          </div>
        );
      })}
    </div>
  );
};

export default FeaturedCollections;

type Featured = {
  origin: string;
  name: string;
  previewUrl: string;
  height: number;
  royalties?: {
    type: string;
    destination: string;
    percentage: string;
  }[];
}[];

const blacklist: string[] = [
  "8a3ab4c01498bef667f56e7b99fe24cadb33034257d96e245e6159d5aed75f8b_0",
  "c0ba0af258e0769a16232e002b2ac583f0aef403c4b3ac7e1b4344254ad423b6_0",
  "a94ff4a8fe3fa458f7a60d670af16d2c4abd2da098e4073a0953b0ff3ce8500a_0",
  "f74da8388df894f0c4d6d24ad43a71b80d27239588c6c03228c19b7df0bea1b6_0",
  "cbe5a33e9d1734bcd19a584d3322af4f37694f813cf7c059674bca5f6b749f48_0",
  "c60164eb39a33008dbe58108d39811159a48acc394a0dea9b9f0b7c36be9ab42_0",
  "4b42916c3395475ff13ed938ad6c224206c517796509dc77a1ea49bb3cbf9847_0",
  "5841c60743e22319eaba12e84525b3a425b3b4818cd026cf0d83d65515ffceaf_0",
  "15d73722f6e362106344af7fda987dcfd2b977464026175fd654671aaf9ec21d_0",
  "4c7d7b0f864aff615005721e6ec1fa09dcb25fd9330cdd739c24584f6bd5983e_0",
  "755c488bbd479f44d9f98eb5a4de494412100b4096b485651da0721bffb138dc_0",
  "17e8f2e32969353e622767032f93cc45e3df1ad596442e48317eba89cf8959c0_0",
  "fd8d5153bb8a316b3ef71ade37cca7c898e4d40ed3cb73c42b92638d094fd7a6_0",
  "9dcb5f3d4296b3ae1d399c76bbcea9d8178470a428cd003872a187490cfe3bd0_0",
  "4c6ea14e02ff121c1140784f728026abd3bd2d0930dcafee3d565fface8a79d7_0",
  "62dbb85bbe9f35a566e47481b71a5ec6af5b2f335014c91f7555a7e9a4dc05b7_0",
  "222a43c1c20c7dbdbb66990497db96b619b323d608b1d289553c34d1a1b1c9b5_0",
  "b3f51ed7fd85b0952be8899d52d27d44842af0b970bfe2dec6109f6511de221d_0",
  "7a4af8116d32d8eaf1bb808aabd3dbfd8a387af7de0337bd708dffe1d553e78f_0",
  "b9664a64c10888d64cacc40eacba17c4eac61b704b8a020c0fa115405d2b0716_0",
  "c002ab92ddc4d45d6122578ec29f9349e6a15b4f1edec5bd72b24520d15b643c_0",
  "ef0ed0e92d2853bbce4919150cd8cefafc5831e415519466bd2a8b1e96cda326_0",
  "bebb46ff6543779155a53b023ec18db950dcd16eaabf2621e1a052cf8d9cdeba_0",
  "fd914617f50106aa4ad7825bdc85b6971042e606573cbe8afbe3fd53b0246d18_0",
  "c9cfc1cdc56430bc7005a5ad3b7ab2a2b6832aa4fdaae2b8269e063254985e55_0",
  "63bd18d3668cc3a7f5f12f1243526ba3a4512c240c1ec3c6c6a88d1c2ecd6701_0",
  "2735324912cfa67384e47f547f1bb516cb7913d2e7dd46d948a24692627f0221_0",
  "f1f31f537a28aa68be509f98db884c95e3100c0ab71811806c5dc2c21be1ae4c_0",
  "d081542d09054b89d78cb713105b5719a8ebd2e282978fc1df37fb68e5aca282_0",
  "6cdc5e214510fd4554d954f93ad62ac55e5f6a94558ff712a93c8a27c0abe5f7_0",
  "ebe7ec6b6df57e2e916b88736259a9b27b31d1d2532c96c2b78fa1dde226c7b3_0",
  "b6aeee2231369f70a040edeaace70ca6e096a7dadb2436542ede395fe9cbcccc_0",
  "367d86b7596e090df337f4ed96a9004574cff1c57a27e1ccb6e1e7b7436d22eb_0",
  "a50b4ce53b750886e16feb85004be9360cbb2fce4e9b9f3cc7879476e63bd185_0",
  "3fad90b3913c7c3d0fe97e67ad69ecbe608dac9166ac1f6653fa6fe93a2dc45d_0",
  "4fdbcaac4b4ee0eb646487ba8c73263bb295c385abe82a1fc9c2f46efa723f45_0",
  "6e7ea874fd624c57ee2e401cca454f7699905a287c0f21f21895d124613c5873_0",
  "62a7f58b6692ec4593346ddd1bed46dbc1ce217fa1429683f4b2c15c7757b2e9_0",
  "f164c5e185c917a72043161c2f335bee128d92f2413310eb330675ad458690b1_0",
  "41e73e803fc7d4a2f96c4611dc58c8840bb3e39c84947ef8e54579e91b58845a_0",
  "2b561839c68668bdbc4563152c8c561c1b87cfacf5489e876561010be8afda80_0",
  "1ad05579d168c6778b43b52ffe4cecf16d874380fccd610db94b180c9b03bb1c_0",
  "be78096df9de705f0620daca549c063f4b293123dca919f8e9617de9f4b8b8cd_0",
  "53ed9b9969229d00372ac71469b019709cf84d0695f76638bef14d5e3af444e3_0",
  "5a35c47514edbb6866e48ad026da994da4fb49a91b7dc30750e7a13568a21c22_0",
  "95e7c2da5c95d10809276f35fccf77d647636c8fd6c391064e965938445ce2e0_0",
  "fa298c6d23048f10b942629b03fe53b2d0fea19ed7511b65218bde6130025975_0",
  "ddd3b156eb0e079ec55e34f50f804134797630c46540ed2195f12b03e1ddb847_0",
  "a0e622ccad9591ef390c8d3ff5f438cde8d47112fe8b018dff51bf0f2a55827f_0",
  "d0b65c7b207d3be22ea873737042b5e072be592c89af645ce39d252501e09d37_0",
  "cafd38ad3d0e0f44e6ea94b686b1d84da193c06dc687220b7d12b432fa6fc55a_0",
  "6fac840e1e4439d049a1664e1af6b3d8fa4fb3ad892601f807faccf7a8a1422c_0",
  "90d6903c721a6dbbc5ed24169dc41bd0b227bd9b88c3ae1d01ef58532e127798_0",
  "1d8d564538b0d1b40f91aa8a517779849954ccc52edff8a60921466526f56ed5_0",
  "5bce7e506c24afc314d4a71e2b3523b59757f2b7dce3f2174e045f5ac8f7cd52_0",
  "8100e76e119c41d2a807f3b855031ec4257b51eaf9c5400741dcb8cce7e1d7c1_0",
  "a262dea3cc2a982af48e8bf760aecbfe5445d6105de9b3c84f42ff88153a4825_0",
  "b4e8543f90cb3ffa323808d42ab63b09d178ec33eeb068a41241cdacbd1ea43f_0",
  "3dfaefc85da8f112181a119e1d4b1cee9faf52d731a8d31a27403f22947df657_0",
  "c771346b02a80eacb82b52c673f6c932cc21c975463df1be7e069b51cc69920d_0",
  "2090f28459755904af2d58da0bdb3837d6a13d3920e2503b868ac1445741953e_0",
  "23008c33c5a541d68ee8d09696f3b3eb480c1bfccb062d8f4d73e5d5de844aa8_0",
  "8a3fc7ef7f2acbe3084bd2811c1bf531e59f51364990c6efee218c0d55d4099f_0",
  "081364fb5c5f12dd79381f89fac8d164d5c748b9b4d71979f06fcd42cdf35589_0",
  "7a56561452cc570be4c3dea050bd1d4523c5707b4a130dcfa6406df0db58af73_0",
  "9181e4c1e3c3741410e3d265dfc8c51e9a06d273705662047f76f9f35a02b022_0",
  "d7081c8003f896d5cdb3285d02f4448f9185ccb735416c19431f0d3000b44a2c_0",
  "83931498283ab46907d95c1c71a19933117eb22a08c5821f989b16c19b299143_0",
  "9dfc24d868cb772826016113c2df5ffef28c4b5141740907bd01294f9c5f087f_0",
  "a666f791f14cd97920c482e44fec519e4a56081e69ff494c5cba73f20913ffb0_0",
  "b55bdb1a27ab975ef75b8902deeabb49980a3562e2aea646436adf6377a0fdb8_0",
  "6a446abc90176bf4b4c386002337a92d54972a85e4944523072917fc48cffbd9_0",
  "90f93224c2282ae22f30724e24ed40de48abfc3fbc157c9f4aede7162a7a3cbc_0",
  "c1799c44fda0fd38cad0fb0786440033d774f8baae24f0535702c458386d4b9b_0",
  "b4b3afaf5782ff4ebf457c023559fa890aaebbf3e22f72ac5f75331acfec14ad_0",
  "1906e12c53d496497045780c6446b73da4c2f0aa52737900bbbd0fa5f81a856e_0",
  "2ed4784e4216749920f350637fa4f072c17bd713cd3e5de7bd78cc57601f2d84_0",
  "412d2d65a5edc4ce8422d532243f4ac672f282a6c62f3c3d0c26fa6a03b28246_0",
  "b22f3ff7831ce48cac8e2f6e2566ada655a886c6513960bd7ea626e9b3d116e6_0",
  "6604730eab762cee7a89d60f917db65b7a2b1ecca38c0316e0a6a834dad4ad83_0",
  "c90b153e1743f7cdbd288f9219fd4a846d9cecc9fd5578fda174c730835ca6a5_0",
  "bf1c51799f93d0d98e92896a0079bf66b77b064a29d941d5ca85c73b3b6fb298_0",
  "89dd8721203563e773464de20404f20797c886c411aa34cda350950864d2df4f_0",
  "7712e129eefb55ccaad94f610d36dbe0a0f843377e3b8e3fd0921358a1e8217e_0",
  "304cdc23c524cbb123fbf4b80c8b5ecbbd27ab7caf91c51de33005427e8173f8_0",
  "15ac41a45bb0c1491c766226f9261182601d704fcbd6cbacc13213d4ccf55e9d_0",
  "c6d30236ee4cb38c24655db999ca3bd90df63ba0e303cec6ba5e646a62fa0c89_0",
  "12fffb968ab62f42983badc72ded2dff77752c377c51a7c46cffa0f5792004eb_0",
  "0acc9073141470041059a6a1b71f38fc42fa54f9987a6629588dd0277ccbe1ea_0",
  "06ea0be2adad77e6bd1f3b31355f18110247b591b3af17eb035d71a2cb209e60_0",
  "bb1bf9e594f2fca13588314920983a231f62faada542b88e4340f0a4d25bc046_0",
  "4fc805b89ab30a06f6af5db05bc4c79e510f961dfabaaf817217912d52cb2957_0",
  "546c22adf71fdef89faa3de2079e6a5bbde6e725308b2189482447e6d002bff2_0",
  "d433a9e03339592a17121f6951f262ce2c638003abb498ab37c74df2d3d962ff_0", // sun and sand empty
  "adab54b183fdf9bb4862030e2441380eaabaadbdf6dcafe2ed5f1f8966c2fe80_0",
  "4d9bbfb1596b1b6024433208dc062b0826648a45680830a7e0b4fa1327a7efee_0",
  "529b7e7b5c15a68031507beaa03a216ca8a72ac71ac7afc1ab04c9a4a507edce_0",
  "364969d1a6b5de389b80cb22686d2dbf1de79c5e26f8a64a3862e5e539c4f2b7_0",
  "47c159e4877464639188c4ca064686877fa67fbf2895d93501d43a3e0ac7efd6_0",
  "9cada86ce2c23a72c332162ab7a796c4824d7f2e3ef23e87cd3ae48078e74a24_0",
  "21533af883e9999978b198ac4529293bfc72f49501fb86b4ea669d649620daf5_0",
  "21533af883e9999978b198ac4529293bfc72f49501fb86b4ea669d649620daf5_0",
  "55835717f21cc1c5e7c8bac1ee0498424583477a915b3f7a44fa91005359ee70_0",
  "de8129406d718b3bd8c0db31690890e78c4c4478ec236e309ca8ef039b590227_0",
  "6e0ac1a1fa66812b2c035d104172207deeca31c92ce0bc7828c0d00963dc50b0_0",
  "0f3768c91a3666d5a719d00b73d66147e7527919738a6a407b8acaff293f7f61_0",
  "873878ab6d5f9feffab7d03026d79598ef5e878831371328623e3a9a0ca413df_0",
  "4491f55e0d2c17f1a8f3a60aaeff0bba3ca7156a40d73740318cd703afd3e3e0_0", // shua meme collection hide for now
  "11bae007d710362e002397356ada94ef103a8865298479b14a63e4e109e04197_0", // walter hide for now

  "c1f0555a62712683f9a7e4a5ed30e11895936edd6bab8337e85e8cb69e176e7c_0", // walter hide for now
  "8753b38382f9cb9db63a4a414d38568459c7a3aab2051b6d7a1331c38c65216e_0", //walt hide for now
  "c2ba59335f136b10f6f7123f791ee9b351af9e928b9dce318e50c6e26a4600e5_0", // vibes right empty
  "9615db73e39c564299dfeca2fd856450d3fa6efe30f8a1ddec85a51f1ef4fee6_0", // based machines empty
  "0e13559ffb8d466d70612ac3aa50ed35c908584737f15adf3995f8853fe5f0cb_0",
];

const featured: Featured = [
  {
    origin:
      "97ef55d928bf9101343aba2d2abef446d47c6502f032748c4b509cb7a44fbfe7_0",
    name: "Cyebr Skeleton Punks",
    previewUrl:
      "https://takeit-art-prod.s3.amazonaws.com/Cyebr_Skeleton_Punks/15ca772b-f7a8-42b0-a4f3-fcd8d2e16a99",
    height: 793171,
  },
  {
    origin:
      "2f3f22a5631a8634317757bd8a48982d476681307bf3cd71320d1240b3eeb9f5_0",
    name: "Free Pepe",
    previewUrl:
      "https://ordfs.network/2f3f22a5631a8634317757bd8a48982d476681307bf3cd71320d1240b3eeb9f5_0",
    height: 793360,
  },
  {
    origin:
      "11b33ee8b9b8ea37199dcdb8d5e653e61bd96804e291d71eae9b6c221a6408de_0",
    height: 795451,
    previewUrl:
      "https://ordfs.network/11b33ee8b9b8ea37199dcdb8d5e653e61bd96804e291d71eae9b6c221a6408de_0",
    name: "Dungeons of Deliverance",
  },
  {
    origin:
      "0d2b430030ab8480a430a300e0393d107b3754bce4d98bf919c39f0e752b6746_0",
    name: "Testy Pepes",
    previewUrl:
      "https://ordfs.network/0d2b430030ab8480a430a300e0393d107b3754bce4d98bf919c39f0e752b6746_0",
    height: 793348,
  },
  {
    origin:
      "52609820f2c020b9a6a9eaca44cae0f3972412710f5b76b52a723683a259100e_0",
    name: "coOM Test",
    previewUrl:
      "https://ordfs.network/52609820f2c020b9a6a9eaca44cae0f3972412710f5b76b52a723683a259100e_0",
    height: 792657,
  },
  {
    origin:
      "7b18fec9f75ba18a81a2527b119f84360d2defa1f1ed9a141cbd31a791b32f8a_0",
    name: "The Moto Club 2",
    previewUrl:
      "https://takeit-art-prod.s3.amazonaws.com/The_Moto_Club_2/c9ab6fc5-a9b1-43fe-b6b3-fb6dfcc77ab7",
    height: 792498,
  },
  {
    origin:
      "8cd5c67c79fd819d177f367bd5fa5a8ff8ceb801939ae39c82129164f9dc2788_0",
    name: "BitCoinDragons",
    previewUrl:
      "https://takeit-art-prod.s3.amazonaws.com/BitCoinDragons/a8b9bc7a-3156-4eea-83f7-777b83b11b67",
    height: 792227,
    royalties: [
      {
        type: "paymail",
        destination: "soysauce@handcash.io",
        percentage: "0.03",
      },
    ],
  },
  {
    origin:
      "5117338ee9885e867fbf51d7a36b09b786bc395c817f49fd91ab6f0cb0771f97_0",
    name: "Masks of Salvation",
    previewUrl:
      "https://ordfs.network/5117338ee9885e867fbf51d7a36b09b786bc395c817f49fd91ab6f0cb0771f97_0",
    height: 791882,
  },
  {
    origin:
      "80d224cdf1d6f6b5145a7f5ede14b357ea7c05f7f7f4aaab04d4cc36d707f806_0",
    name: "Bookworms",
    previewUrl:
      "https://ordfs.network/80d224cdf1d6f6b5145a7f5ede14b357ea7c05f7f7f4aaab04d4cc36d707f806_0",
    height: 794090,
  },
  {
    origin:
      "da3ee657f921c33f38d861b4a23358e61a14f0ace56746cc2df6fa16f22cc477_0",
    name: "Ordi Pixels",
    previewUrl:
      "https://takeit-art-prod.s3.amazonaws.com/OrdiPixels/3c71a743-8a70-4a7b-93c2-569b0248e88f",
    height: 792167,
  },
  {
    origin:
      "3f5400faf0f209fcf185e9409f6a361b8f64bcc84bab8007654b00101720cf05_0",
    name: "Sadness",
    previewUrl:
      "https://takeit-art-prod.s3.amazonaws.com/Sadness/f2a2ca1b-df66-4c76-8b18-7a226f060a4e",
    height: 794314,
  },
  {
    origin:
      "3ce9034e0763511446b4cfa0e3504a0602c5dbf2f6ab6497a7f7ab6d3ae058db_0",
    name: "1Zoide",
    previewUrl:
      "https://takeit-art-prod.s3.amazonaws.com/1Zoide/ae18bbd2-b322-48cd-8b3e-ba127121d7f5",
    height: 792196,
  },
  {
    origin:
      "d2901f73588a012e4d4b1a44354195f86c1f057c1ccf4b612bc20c6359b11248_0",
    name: "Uniqords",
    previewUrl:
      "https://ordfs.network/d2901f73588a012e4d4b1a44354195f86c1f057c1ccf4b612bc20c6359b11248_0",
    height: 783972,
  },
  {
    origin:
      "ac9c9f59ae63ae07bc5a25e20dc5635f233076ab18df8c43e2c16e4f3242c750_0",
    name: "CoOM Battles · Genesis Airdrop",
    previewUrl:
      "https://ordfs.network/d873901497a2743e8832668bad9b58c22706e08b20b6d0b574436c02b8b04d28_1",
    height: 795624,
  },
  {
    origin:
      "8c0fe025b4ef7f9242ceb724bb26a5163e05fbd114675fe42ef6fbb40cc61117_0",
    name: "Testy Bots",
    previewUrl:
      "https://ordfs.network/8c0fe025b4ef7f9242ceb724bb26a5163e05fbd114675fe42ef6fbb40cc61117_0",
    height: 797939,
  },
  {
    origin:
      "9ef343b39a0fe94d7a0558b5ad01e474e6354fa5158a7326953cba45bb6b645b_0",
    name: "Elephant",
    previewUrl:
      "https://ordfs.network/9ef343b39a0fe94d7a0558b5ad01e474e6354fa5158a7326953cba45bb6b645b_0",
    height: 797436,
  },
  {
    origin:
      "df8a277aa03b595f6e50b576093ef6fc039a83635b2325640fce6c8d27f9edb5_0",
    name: "Cyber Apes",
    previewUrl:
      "https://takeit-art-prod.s3.amazonaws.com/Cyber_Apes/e101fcfe-ed92-42c0-a8ee-e1355fa9852f",
    height: 796184,
  },
  {
    origin:
      "01a3f41c0469654b5a241f6b9851e26d945237120e47ddfe608a858233314385_0",
    name: "SATOSHI T-SHIRT",
    height: 822067,
    previewUrl:
      "https://ordfs.network/01a3f41c0469654b5a241f6b9851e26d945237120e47ddfe608a858233314385_0",
  },
  {
    origin:
      "e7675dfb0ab6699615c3a1a136b15967b1d91db6ccfdc33ec3c1e477b8db8dd3_0",
    name: "Apocalyptic Skulls",
    height: 822067,
    previewUrl:
      "https://ordfs.network/e7675dfb0ab6699615c3a1a136b15967b1d91db6ccfdc33ec3c1e477b8db8dd3_0",
  },
  {
    origin:
      "8b53a045593360ad6cf40eb5560a22569f81210adf4e8183b64c33fa10fd1c5f_0",
    name: "The Burning City",
    height: 822147,
    previewUrl:
      "https://ordfs.network/8b53a045593360ad6cf40eb5560a22569f81210adf4e8183b64c33fa10fd1c5f_0",
  },
  {
    origin:
      "eaf6d49b61709e2819106450d69aa07ca348518d5604ddde0d2ceb86b91b10c5_0",
    name: "Aurora Smoke Creations",
    height: 821186,
    previewUrl:
      "https://ordfs.network/eaf6d49b61709e2819106450d69aa07ca348518d5604ddde0d2ceb86b91b10c5_0",
  },
  {
    origin:
      "4a971c2b635c15020b4db94e8ee5335f24c31b3cca24217eba62dc33f5119924_0",
    name: "Queen Amina",
    height: 821186,
    previewUrl:
      "https://ordfs.network/4a971c2b635c15020b4db94e8ee5335f24c31b3cca24217eba62dc33f5119924_0",
  },
  {
    origin:
      "10348fea8e360dff673599653c6045c1481c7fc83fc5047f810fa4a0fc1c0a3a_0",
    name: "Satoshi Island",
    height: 820397,
    previewUrl:
      "https://ordfs.network/10348fea8e360dff673599653c6045c1481c7fc83fc5047f810fa4a0fc1c0a3a_0",
  },
  {
    origin:
      "d4d9f56ac42133771a01e116c99ea5f116a3f0fd07d1a616ebefec8b9cc67551_0",
    name: "Chromatic Orbits",
    height: 819673,
    previewUrl:
      "https://ordfs.network/d4d9f56ac42133771a01e116c99ea5f116a3f0fd07d1a616ebefec8b9cc67551_0",
  },
  {
    origin:
      "ba2faf2e161778e7eb43dca0d8cd4b1c634287b3f10823cf19b5d63dd4438579_0",
    name: "Pixel Zoide",
    height: 798748,
    previewUrl:
      "https://ordfs.network/ba2faf2e161778e7eb43dca0d8cd4b1c634287b3f10823cf19b5d63dd4438579_0",
  },
  {
    origin:
      "987ab3e622292c79500cb8f57d1a4cb78f767286ddc845c6fcede2d3da2c6465_0",
    name: "Quantum Entropy",
    height: 798626,
    previewUrl:
      "https://ordfs.network/987ab3e622292c79500cb8f57d1a4cb78f767286ddc845c6fcede2d3da2c6465_0",
  },
  {
    origin:
      "9c3306139873896cf8c34af1df30544fc6f25f1615406331ac398e758c47e120_0",
    name: "The missing Dryad Queens",
    height: 821186,
    previewUrl:
      "https://ordfs.network/9c3306139873896cf8c34af1df30544fc6f25f1615406331ac398e758c47e120_0",
  },
  {
    origin:
      "9fa0be6133b10632e45e231ef88448b2c48a821e08afaacc7ac7e6e12ea232b0_0",
    name: "The Frosty Village",
    height: 821248,
    previewUrl:
      "https://ordfs.network/9fa0be6133b10632e45e231ef88448b2c48a821e08afaacc7ac7e6e12ea232b0_0",
  },
  {
    origin:
      "777960410d05f101969c8d176a256bddcaa5e98528ee7e25193e358b3f60d139_0",
    name: "Hodlocker Season 2",
    height: 820397,
    previewUrl:
      "https://ordfs.network/777960410d05f101969c8d176a256bddcaa5e98528ee7e25193e358b3f60d139_0",
  },
  {
    origin:
      "806a98823f654f17268f61a0e04cfc70a55011a75108ec4427ca0779de922540_0",
    name: "Angels Of Darkness",
    height: 820397,
    previewUrl:
      "https://ordfs.network/806a98823f654f17268f61a0e04cfc70a55011a75108ec4427ca0779de922540_0",
  },
  {
    origin:
      "ba4984725557824eb46e6dd00b9461fd703beb6a1f69d4098266c969b7bfeec1_0",
    name: "Last Hope",
    height: 819573,
    previewUrl:
      "https://ordfs.network/ba4984725557824eb46e6dd00b9461fd703beb6a1f69d4098266c969b7bfeec1_0",
  },
  {
    origin:
      "153901edbc17c714bfaf1953e82032b02faa61296ca179ff1caf8e392ff18bab_0",
    name: "Hodlocker Season 1",
    height: 818432,
    previewUrl:
      "https://ordfs.network/153901edbc17c714bfaf1953e82032b02faa61296ca179ff1caf8e392ff18bab_0",
  },
  {
    origin:
      "6352cd99e4df66f727175b71da91f0bf0276cd4541ab6cb213126ea22c7f8f61_0",
    name: "Magic Mushrooms",
    height: 818426,
    previewUrl:
      "https://ordfs.network/6352cd99e4df66f727175b71da91f0bf0276cd4541ab6cb213126ea22c7f8f61_0",
  },
  {
    origin:
      "805d7173b4018228004f8655d994ea967851bdb1e15aebcf5936aeb4147fedf1_0",
    name: "Testing Burgers",
    height: 818298,
    previewUrl:
      "https://ordfs.network/805d7173b4018228004f8655d994ea967851bdb1e15aebcf5936aeb4147fedf1_0",
  },
  {
    origin:
      "d545e4218a92492d7129ffc2caa02c09a7e38505a775f65b919884417814b281_0",
    name: "Nakagon 2",
    height: 808506,
    previewUrl:
      "https://ordfs.network/d545e4218a92492d7129ffc2caa02c09a7e38505a775f65b919884417814b281_0",
  },
  {
    origin:
      "76e7af296d8c051775caa2a305cf99d13c870999eecedf6a453c02377e87814f_0",
    name: "1Zoide",
    height: 792196,
    previewUrl:
      "https://ordfs.network/76e7af296d8c051775caa2a305cf99d13c870999eecedf6a453c02377e87814f_0",
  },
];

export const ancientCollections: Collection[] = [
  {
    txid: "Uniqords",
    vout: 0,
    outpoint:
      "d2901f73588a012e4d4b1a44354195f86c1f057c1ccf4b612bc20c6359b11248_0",
    origin:
      "d2901f73588a012e4d4b1a44354195f86c1f057c1ccf4b612bc20c6359b11248_0",
    height: 783972,
    idx: 8008,
    lock: "",
    SIGMA: [{ valid: true }],
    listing: false,
    bsv20: false,
    num: 6310,
    id: 6310,
    file: {
      hash: "652643f3bc27987d765ee570cfea21b0b9e76f4610f3255963c025a72f679d97",
      size: 125303,
      type: "image/jpeg",
    },
    items: [],
    MAP: {
      name: "Uniqords",
      app: "pewnicornMinter",
      type: "ord",
      collectionID: "Uniqords",
      subType: KnownSubType.Collection,
    },
  },
  {
    txid: "sMonRobots",
    vout: 0,
    outpoint:
      "e17d7856c375640427943395d2341b6ed75f73afc8b22bb3681987278978a584_0",
    origin:
      "e17d7856c375640427943395d2341b6ed75f73afc8b22bb3681987278978a584_0",
    height: 783968,
    idx: 8008,
    lock: "",
    SIGMA: [{ valid: true }],
    listing: false,
    bsv20: false,
    num: 164,
    id: 164,
    file: {
      hash: "039da19e594aeceb0d3d24a2c7cc399d995f9a4a7de6e8b9a50dee0adc43fd78",
      size: 2646,
      type: "image/png",
    },
    items: [
      "e17d7856c375640427943395d2341b6ed75f73afc8b22bb3681987278978a584_0",
    ],
    MAP: {
      name: "sMon Robots",
      app: "taleofshua",
      guid: "bf2dc9f0-c6b6-11ed-9463-5923bba166ff",
      type: "ord",
      audio:
        "b://cae4e732ce76b1d9edcfa846a87689ec977bdea7e4602f73c9179a451744d32d",
      stats:
        '{"strength":8,"vitality":8,"agility":6,"intelligence":8,"luck":3,"spirit":3}',
      monType: "robot",
      collection: "sMon",
      subType: KnownSubType.Collection,
    },
  },
  {
    txid: "sMon Sinners",
    vout: 0,
    outpoint:
      "201d47a8f5cef33ef0d3321d98173b02955a74098ef7c1dc644e00b78525d773_0",
    origin:
      "201d47a8f5cef33ef0d3321d98173b02955a74098ef7c1dc644e00b78525d773_0",
    height: 786421,
    idx: 45394,
    lock: "8b902fbfe4e330c42901db23a5c05e329d404b70b79d7ae2c0d8145d3d6be263",
    SIGMA: [{ valid: true }],
    listing: false,
    bsv20: false,
    num: 276660,
    id: 276660,
    file: {
      hash: "2c5c0299e21264482927a03e5079da88f7240f9132d5ad5807e46911cb61ca1a",
      size: 3789,
      type: "image/png",
    },
    items: [
      "201d47a8f5cef33ef0d3321d98173b02955a74098ef7c1dc644e00b78525d773_0",
    ],
    MAP: {
      app: "taleofshua",
      name: "sMon Sinners",
      type: "ord",
      monType: "creature",
      collection: "sMon Sinners",
      subType: KnownSubType.Collection,
    },
  },
  {
    txid: "Masks of Salvation",
    vout: 0,
    outpoint:
      "edc77dd9c0be86093fd5b9ffab88eb4abcda2744026b97acb07fa25ff9bfd51c_0",
    origin:
      "edc77dd9c0be86093fd5b9ffab88eb4abcda2744026b97acb07fa25ff9bfd51c_0",
    height: 792029,
    idx: 1432,
    lock: "23f15624c08125aa327cef4401583489a0207f185605c85e6d345f8c9b9d61fc",
    SIGMA: [{ valid: true }],
    listing: false,
    bsv20: false,
    num: 286306,
    id: 286306,
    file: {
      hash: "a31e86675eb0a62ac539bba550baa7901d2fc8d8126b6777923072ccd4d8c215",
      size: 3697,
      type: "image/png",
    },
    items: [
      "edc77dd9c0be86093fd5b9ffab88eb4abcda2744026b97acb07fa25ff9bfd51c_0",
    ],
    MAP: {
      app: "taleofshua",
      name: "Masks of Salvation",
      type: "ord",
      monType: "mask",
      subType: KnownSubType.Collection,
    },
  },
];
