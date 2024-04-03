export const COOM_COLLECTIONS = [
  {
    outpoint: "4d9862845f9c2df18c6923b0fe3cda4c73df7be1bf28ea766423312bd9925bd6_0",
    name: "Generation 3 Packs",
    signerAddress: "1Coomwdo6NrEcjwPpbVjpgSLXxdMdMD92S",
    image: 'generation_3_packs.jpg'
  },
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
  {
    outpoint: "efce1385fde989252e931996f01811cf7ac52ab367f46b5e28c039ad7f5fa9fb_0",
    name: "Generation 1 Cards",
    signerAddress: "1Coomwdo6NrEcjwPpbVjpgSLXxdMdMD92S",
    image: 'generation_1_cards.png'
  },
];
	
export const COOM_SLUGS_AND_OUTPOINTS = [
  'generation-3-packs', "4d9862845f9c2df18c6923b0fe3cda4c73df7be1bf28ea766423312bd9925bd6_0",
  'generation-3-cards', "535a8ce1474b9af0008b0d89582381d2bba5fbb81901096fea2b5880d1987c16_0",
  'generation-2-cards', "27dcae1a06cffa782832f4d06591807b18531044cd146e8425d3467f487009e5_0",
  'generation-1-cards', "efce1385fde989252e931996f01811cf7ac52ab367f46b5e28c039ad7f5fa9fb_0",
]

export const COOM_OUTPOINTS_BY_SLUGS: Record<string, string> = {
  'generation-3-packs': "4d9862845f9c2df18c6923b0fe3cda4c73df7be1bf28ea766423312bd9925bd6_0",
  'generation-3-cards': "535a8ce1474b9af0008b0d89582381d2bba5fbb81901096fea2b5880d1987c16_0",
  'generation-2-cards': "27dcae1a06cffa782832f4d06591807b18531044cd146e8425d3467f487009e5_0",
  'generation-1-cards': "efce1385fde989252e931996f01811cf7ac52ab367f46b5e28c039ad7f5fa9fb_0",
}

export const COOM_BANNERS_BY_OUTPOINT: Record<string, string> = {
  "4d9862845f9c2df18c6923b0fe3cda4c73df7be1bf28ea766423312bd9925bd6_0": 'generation_3_packs.jpg',
  "535a8ce1474b9af0008b0d89582381d2bba5fbb81901096fea2b5880d1987c16_0": 'generation_3_cards.png',
  "27dcae1a06cffa782832f4d06591807b18531044cd146e8425d3467f487009e5_0": 'generation_2_cards.png',
  "efce1385fde989252e931996f01811cf7ac52ab367f46b5e28c039ad7f5fa9fb_0": 'generation_1_cards.png'
}