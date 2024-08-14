
"use client"

import type React from 'react';
import { useState } from 'react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';
import { Trash2, Copy } from 'lucide-react';
import type { CollectionItemSubTypeData, CollectionItemTrait, CollectionSubTypeData } from 'js-1sat-ord';

type CraftingItem = {
  id: string;
  name: string;
  mintNumber: number;
  rarity: string;
  traits: CollectionItemTrait[];
  recipe?: string[];
  isCraftingMaterial: boolean;
  prompt: string;
};

// Helper functions
const generateId = () => Math.random().toString(36).substr(2, 9);

const getWeightedRandomElement = (values: string[], percentages: string[]): string => {
  const random = Math.random() * 100;
  let sum = 0;
  for (let i = 0; i < values.length; i++) {
    sum += Number.parseFloat(percentages[i]);
    if (random <= sum) return values[i];
  }
  return values[values.length - 1];
};

// Descriptions mapping for prompt generation
const descriptionsMap: { [key: string]: { [key: string]: string } } = {
  itemType: {
    "Crafting Item": "a valuable crafting material",
    "Consumable": "a consumable item",
    "Tool": "a useful tool",
    "Potion": "a magical potion"
  },
  category: {
    "Ingredient": "raw ingredient",
    "Spell": "magical spell scroll",
    "Food": "edible item",
    "Drink": "drinkable concoction",
    "Utility": "utility item"
  },
  quality: {
    "Crude": "roughly made",
    "Standard": "well-crafted",
    "Fine": "finely crafted",
    "Exquisite": "exquisitely crafted",
    "Masterwork": "masterfully crafted"
  },
  rarity: {
    "common": "ordinary",
    "rare": "uncommon",
    "epic": "legendary",
    "legendary": "mythical"
  }
};

// Name generation components
const adjectives = ["Ancient", "Mystic", "Enchanted", "Radiant", "Shadowy", "Celestial", "Ethereal", "Arcane", "Pristine", "Runic"];
const nouns = {
  "Crafting Item": ["Essence", "Crystal", "Shard", "Ingot", "Dust", "Fragment", "Nugget"],
  "Consumable": ["Elixir", "Tincture", "Brew", "Concoction", "Mixture", "Infusion"],
  "Tool": ["Hammer", "Chisel", "Anvil", "Mortar", "Pestle", "Cauldron", "Furnace"],
  "Potion": ["Philter", "Draught", "Remedy", "Tonic", "Serum", "Solution"]
};

// Collection generation
const generateCraftingItemsData = (): CollectionSubTypeData => ({
  description: "A unique collection of crafting items and tools",
  quantity: 10,
  rarityLabels: [
    { common: "60%" },
    { rare: "25%" },
    { epic: "10%" },
    { legendary: "5%" }
  ],
  traits: {
    itemType: {
      values: ["Crafting Item", "Consumable", "Tool", "Potion"],
      occurancePercentages: ["40", "30", "20", "10"]
    },
    category: {
      values: ["Ingredient", "Spell", "Food", "Drink", "Utility"],
      occurancePercentages: ["30", "20", "20", "15", "15"]
    },
    quality: {
      values: ["Crude", "Standard", "Fine", "Exquisite", "Masterwork"],
      occurancePercentages: ["20", "30", "25", "15", "10"]
    }
  }
});

// Function to generate name
const generateName = (itemType: string): string => {
  const adjective = adjectives[Math.floor(Math.random() * adjectives.length)];
  const noun = nouns[itemType as keyof typeof nouns][Math.floor(Math.random() * nouns[itemType as keyof typeof nouns].length)];
  return `${adjective} ${noun}`;
};

// Function to generate prompt
const generatePrompt = (item: CraftingItem): string => {
  const itemTypeDesc = descriptionsMap.itemType[item.traits.find(t => t.name === 'itemType')?.value || ''];
  const categoryDesc = descriptionsMap.category[item.traits.find(t => t.name === 'category')?.value || ''];
  const qualityDesc = descriptionsMap.quality[item.traits.find(t => t.name === 'quality')?.value || ''];
  const rarityDesc = descriptionsMap.rarity[item.rarity];

  let prompt = `${item.name}: A ${rarityDesc} ${qualityDesc} ${itemTypeDesc}: ${categoryDesc}`;

  if (item.isCraftingMaterial) {
    prompt += ". This item is a crafting material, appearing as a valuable resource.";
  } else {
    prompt += ". The item appears as a fully crafted and usable object.";
  }

  return prompt;
};

// Item generation
const generateItem = (data: CollectionSubTypeData, index: number, forcedRarity?: string): CraftingItem => {
  const rarity = forcedRarity || getWeightedRandomElement(
    data.rarityLabels.map(label => Object.keys(label)[0]),
    data.rarityLabels.map(label => Object.values(label)[0].replace('%', ''))
  );

  const traits: CollectionItemTrait[] = [];
  for (const [traitName, traitData] of Object.entries(data.traits)) {
    const value = getWeightedRandomElement(traitData.values, traitData.occurancePercentages);
    traits.push({ 
      name: traitName, 
      value: value, 
      rarityLabel: rarity,
      occurancePercentrage: traitData.occurancePercentages[traitData.values.indexOf(value)]
    });
  }

  const itemType = traits.find(t => t.name === 'itemType')?.value || 'Crafting Item';
  const name = generateName(itemType);

  const item: CraftingItem = {
    id: generateId(),
    name,
    mintNumber: index + 1,
    rarity,
    traits,
    isCraftingMaterial: itemType === 'Crafting Item',
    prompt: ""
  };

  // Generate recipe for craftable items (except for legendary items)
  if (rarity !== 'legendary' && !item.isCraftingMaterial && Math.random() > 0.5) {
    item.recipe = generateRecipe(item);
  }

  // Generate prompt
  item.prompt = generatePrompt(item);

  return item;
};

const generateRecipe = (item: CraftingItem): string[] => {
  const baseIngredients = [
    "Clover", "Iron Ore", "Oak Log", "Lemon", "Wheat", "Corn", "Cherry",
    "White Sand", "Rain Water", "Coal Ore", "Quartz", "Moss", "Salt Water"
  ];
  const recipe = [];
  const ingredientCount = Math.floor(Math.random() * 3) + 2; // 2-4 ingredients
  for (let i = 0; i < ingredientCount; i++) {
    recipe.push(baseIngredients[Math.floor(Math.random() * baseIngredients.length)]);
  }
  return recipe;
};

// Updated function to format item as CollectionItemSubTypeData
const formatAsCollectionItem = (item: CraftingItem): CollectionItemSubTypeData => {
  return {
    collectionId: item.id,
    mintNumber: item.mintNumber,
    rank: Math.floor(Math.random() * 1000) + 1, // Random rank for demonstration
    rarityLabel: [{ [item.rarity]: "100%" }],
    traits: item.traits,
    attachments: [{
      name: "Image Prompt",
      description: "AI image generation prompt",
      "content-type": "text/plain",
      url: `data:text/plain,${encodeURIComponent(item.prompt)}`
    }]
  };
};

// Function to copy item to clipboard
const copyToClipboard = (item: CraftingItem) => {
  const collectionItemString = JSON.stringify(formatAsCollectionItem(item), null, 2);
  navigator.clipboard.writeText(collectionItemString)
    .then(() => alert('Item copied to clipboard!'))
    .catch(err => console.error('Failed to copy item: ', err));
};

const CraftingItemGenerator: React.FC = () => {
  const [itemsData, setItemsData] = useState<CollectionSubTypeData | null>(null);
  const [items, setItems] = useState<CraftingItem[]>([]);
  const [quantity, setQuantity] = useState(10);

  const generateNewCollection = () => {
    const newItemsData = generateCraftingItemsData();
    newItemsData.quantity = quantity;
    setItemsData(newItemsData);
    
    const newItems: CraftingItem[] = [];

    // Generate the user-specified quantity of items
    for (let i = 0; i < quantity; i++) {
      newItems.push(generateItem(newItemsData, i));
    }

    setItems(newItems);
  };

  const addItem = () => {
    if (itemsData) {
      const newItem = generateItem(itemsData, items.length);
      setItems([...items, newItem]);
    }
  };

  const removeItem = (id: string) => {
    const newItems = items.filter(item => item.id !== id);
    setItems(newItems);
  };

  const rarityData = items.reduce((acc, item) => {
    acc[item.rarity] = (acc[item.rarity] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  const chartData = Object.entries(rarityData).map(([name, value]) => ({ name, value }));

  return (
    <div className="p-4">
      <h1 className="text-2xl font-bold mb-4">Crafting Item Generator</h1>
      
      <div className="mb-4">
        <input
          type="number"
          value={quantity}
          onChange={(e) => setQuantity(Number.parseInt(e.target.value))}
          placeholder="Number of items"
          className="mr-2 p-2 border rounded"
        />
        <button type="button" onClick={generateNewCollection} className="p-2 bg-blue-500 text-white rounded">Generate Items</button>
      </div>

      {itemsData && (
        <div className="mb-4">
          <h2 className="text-xl font-semibold">Crafting Items Data</h2>
          <pre className="bg-gray-100 p-2 rounded overflow-auto max-h-60">{JSON.stringify(itemsData, null, 2)}</pre>
        </div>
      )}

      {items.length > 0 && (
        <div>
          <h2 className="text-xl font-semibold mb-2">Generated Items (Total: {items.length})</h2>
          <button type="button" onClick={addItem} className="mb-2 p-2 bg-green-500 text-white rounded">Add Item</button>
          <div className="overflow-x-auto">
            <table className="w-full border-collapse border">
              <thead>
                <tr>
                  <th className="border p-2">Mint Number</th>
                  <th className="border p-2">Name</th>
                  <th className="border p-2">Rarity</th>
                  <th className="border p-2">Item Type</th>
                  <th className="border p-2">Category</th>
                  <th className="border p-2">Quality</th>
                  <th className="border p-2">Crafting Material</th>
                  <th className="border p-2">Recipe</th>
                  <th className="border p-2">Prompt</th>
                  <th className="border p-2">Actions</th>
                </tr>
              </thead>
              <tbody>
                {items.map((item) => (
                  <tr key={item.id}>
                    <td className="border p-2">{item.mintNumber}</td>
                    <td className="border p-2">{item.name}</td>
                    <td className="border p-2">{item.rarity}</td>
                    <td className="border p-2">{item.traits.find(t => t.name === 'itemType')?.value}</td>
                    <td className="border p-2">{item.traits.find(t => t.name === 'category')?.value}</td>
                    <td className="border p-2">{item.traits.find(t => t.name === 'quality')?.value}</td>
                    <td className="border p-2">{item.isCraftingMaterial ? 'Yes' : 'No'}</td>
                    <td className="border p-2">{item.recipe ? item.recipe.join(', ') : 'N/A'}</td>
                    <td className="border p-2">{item.prompt}</td>
                    <td className="border p-2">
                      <button type="button" onClick={() => removeItem(item.id)} className="p-1 bg-red-500 text-white rounded mr-2">
                        <Trash2 size={16} />
                      </button>
                      <button type="button" onClick={() => copyToClipboard(item)} className="p-1 bg-blue-500 text-white rounded">
                        <Copy size={16} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          
          <h2 className="text-xl font-semibold mt-4 mb-2">Rarity Distribution</h2>
          <div style={{ width: '100%', height: 300 }}>
            <ResponsiveContainer>
              <BarChart data={chartData}>
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip />
                <Bar dataKey="value" fill="#8884d8" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}
    </div>
  );
};

export default CraftingItemGenerator;