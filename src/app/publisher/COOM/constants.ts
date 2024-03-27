export const COOM_COLLECTIONS = [
  {
    outpoint: "535a8ce1474b9af0008b0d89582381d2bba5fbb81901096fea2b5880d1987c16_0",
    name: "Generation 3 Cards",
    signerAddress: "1Coomwdo6NrEcjwPpbVjpgSLXxdMdMD92S",
    image: 'generation_3_cards.png'
  },
  {
    outpoint: "27dcae1a06cffa782832f4d06591807b18531044cd146e8425d3467f487009e5_0",
    name: "Generation 2 Cards",
    signerAddress: "1Coomwdo6NrEcjwPpbVjpgSLXxdMdMD92S",        
    image: 'generation_2_cards.png'
  },
];
	
export const COOM_SLUGS_AND_OUTPOINTS = [
  'generation-3-cards', "535a8ce1474b9af0008b0d89582381d2bba5fbb81901096fea2b5880d1987c16_0" ,
  'generation-2-cards', "27dcae1a06cffa782832f4d06591807b18531044cd146e8425d3467f487009e5_0"
]

export const COOM_OUTPOINTS_BY_SLUGS: Record<string, string> = {
  'generation-3-cards': "535a8ce1474b9af0008b0d89582381d2bba5fbb81901096fea2b5880d1987c16_0",
  'generation-2-cards': "27dcae1a06cffa782832f4d06591807b18531044cd146e8425d3467f487009e5_0"
}

export const COOM_BANNERS_BY_OUTPOINT: Record<string, string> = {
  "535a8ce1474b9af0008b0d89582381d2bba5fbb81901096fea2b5880d1987c16_0": 'generation_3_cards.png',
  "27dcae1a06cffa782832f4d06591807b18531044cd146e8425d3467f487009e5_0": 'generation_2_cards.png'
}