// // collection/rarityLabelForm.tsx
// import { IoMdClose } from "react-icons/io";
// import { removeBtnClass } from ".";
// import type { Rarity, RarityLabels } from "js-1sat-ord";
// import { useMemo } from "react";
// import Decimal from "decimal.js";

// interface RarityLabelFormProps {
//     collectionRarities: RarityLabels;
//     setCollectionRarities: (rarities: RarityLabels) => void;
//     totalItems?: number;
// }

// const RarityLabelForm: React.FC<RarityLabelFormProps> = ({
//     collectionRarities,
//     setCollectionRarities,
//     totalItems,
// }) => {
//     const addRarity = () => {
//         setCollectionRarities([
//             ...collectionRarities,
//             { label: "", percentage: "", items: "" },
//         ]);
//     };

//     const removeRarity = (index: number) => {
//         setCollectionRarities(collectionRarities.filter((_, i) => i !== index));
//     };

//     const updateRarity = (index: number, field: keyof Rarity, value: string) => {
//         if (value === "") {
//             setCollectionRarities(
//                 collectionRarities.map((rarity, i) =>
//                     i === index ? { ...rarity, [field]: "" } : rarity,
//                 ),
//             );
//             return;
//         }

//         let updatedRarities = [...collectionRarities];

//         if (field === "percentage" && !totalItems) {
//             const decimalValue = new Decimal(value).dividedBy(100);
//             updatedRarities[index] = { ...updatedRarities[index], percentage: decimalValue.toFixed(4) };
//         } else if (field === "items" && totalItems) {
//             const items = Number.parseInt(value);
//             if (!Number.isNaN(items)) {
//                 updatedRarities[index] = { ...updatedRarities[index], items: items.toString() };
                
//                 // Recalculate percentages for all items
//                 let totalPercentage = new Decimal(0);
//                 let maxItemsIndex = 0;
//                 let maxItems = 0;

//                 updatedRarities = updatedRarities.map((rarity, i) => {
//                     const itemCount = Number.parseInt(rarity.items || "0");
//                     if (itemCount > maxItems) {
//                         maxItems = itemCount;
//                         maxItemsIndex = i;
//                     }
//                     const percentage = new Decimal(itemCount).dividedBy(totalItems).toFixed(4);
//                     totalPercentage = totalPercentage.plus(percentage);
//                     return { ...rarity, percentage };
//                 });

//                 // Adjust the percentage of the most common item to make total 100%
//                 const adjustment = new Decimal(1).minus(totalPercentage);
//                 updatedRarities[maxItemsIndex].percentage = new Decimal(updatedRarities[maxItemsIndex].percentage)
//                     .plus(adjustment)
//                     .toFixed(4);
//             }
//         } else {
//             updatedRarities[index] = { ...updatedRarities[index], [field]: value };
//         }

//         setCollectionRarities(updatedRarities);
//     };

//     const totalPct = useMemo(() => {
//         const pct = collectionRarities.reduce((acc, curr) => {
//             return acc.plus(new Decimal(curr.percentage || "0").times(100));
//         }, new Decimal(0));
//         return `${pct.isNaN() ? '' : `${pct.toFixed(2)}%`}`;
//     }, [collectionRarities]);

//     const totalItemCount = useMemo(() => {
//         if (!totalItems) return null;
//         return collectionRarities.reduce((acc, curr) => {
//             return acc + (Number.parseInt(curr.items || "0") || 0);
//         }, 0);
//     }, [collectionRarities, totalItems]);

//     return (
//         <div className="mt-4">
//             <label className="block font-medium flex justify-between">
//                 <span>Collection Rarity Labels</span>
//                 {totalItems ? (
//                     <span className={`${totalItemCount === totalItems ? 'text-emerald-400' : 'text-red-400'}`}>
//                         {totalItemCount} / {totalItems}
//                     </span>
//                 ) : (
//                     <span className={`${totalPct === "100.00%" ? 'text-emerald-400' : 'text-red-400'}`}>{totalPct}</span>
//                 )}
//             </label>
//             {collectionRarities.map((rarity, index) => (
//                 <div
//                     key={`rarities-${// biome-ignore lint/suspicious/noArrayIndexKey: required to prevent re-render
// index}`}
//                     className="flex items-center mt-2 gap-2"
//                 >
//                     <input
//                         type="text"
//                         className="input input-bordered w-full"
//                         value={rarity.label}
//                         onChange={(e) => updateRarity(index, "label", e.target.value)}
//                         placeholder="Rarity Label"
//                     />
//                     {totalItems ? (
//                         <input
//                             type="number"
//                             className="input input-bordered w-full"
//                             value={rarity.items}
//                             onChange={(e) => updateRarity(index, "items", e.target.value)}
//                             placeholder="Number of Items"
//                             step="1"
//                         />
//                     ) : (
//                         <input
//                             type="number"
//                             className="input input-bordered w-full"
//                             value={rarity.percentage === "" ? "" : Number(new Decimal(rarity.percentage).times(100))}
//                             onChange={(e) => updateRarity(index, "percentage", e.target.value)}
//                             placeholder="Percentage"
//                             step="any"
//                         />
//                     )}
//                     <button
//                         type="button"
//                         className={removeBtnClass}
//                         onClick={() => removeRarity(index)}
//                     >
//                         <IoMdClose />
//                     </button>
//                 </div>
//             ))}
//             <button 
//                 disabled={totalItems ? totalItemCount === totalItems : totalPct === '100.00%'} 
//                 type="button" 
//                 className="btn btn-sm mt-2 disabled:bg-[#222] disabled:cursor-default" 
//                 onClick={addRarity}
//             >
//                 Add Rarity
//             </button>
//         </div>
//     );
// };

// export default RarityLabelForm;

// export const validateRarities = (collectionRarities: RarityLabels, totalItems?: number) => {
//     if (collectionRarities.length === 0) {
//         // none is okay
//         return null;
//     }
//     if (collectionRarities.length === 1) {
//         return "You must have at least two rarities.";
//     }
//     if (totalItems) {
//         const totalItemCount = collectionRarities.reduce((sum, rarity) => sum + (Number.parseInt(rarity.items || "0") || 0), 0);
//         if (totalItemCount !== totalItems) {
//             return `The total number of items must equal ${totalItems}. Currently at ${totalItemCount}.`;
//         }
//     } else {
//         if (collectionRarities.every((rarity) => rarity.percentage === "0" || rarity.percentage === "" || rarity.percentage === "1")) {
//             return "Rarities cannot have a percentage of 0, or 100";
//         }
//         const totalPercentage = collectionRarities.reduce(
//             (sum, rarity) => sum.plus(new Decimal(rarity.percentage || "0")),
//             new Decimal(0)
//         );
//         if (!totalPercentage.isZero() && !totalPercentage.equals(1)) {
//             return `The rarity percentages must total up to exactly 100. Currently at ${totalPercentage.times(100).toFixed(2)}.`;
//         }
//     }
//     return null;
// };

// collection/rarityLabelForm.tsx
import { IoMdClose } from "react-icons/io";
import { removeBtnClass } from ".";
import type { Rarity, RarityLabels } from "js-1sat-ord";
import { useMemo } from "react";
import Decimal from "decimal.js";

interface RarityLabelFormProps {
    collectionRarities: RarityLabels;
    setCollectionRarities: (rarities: RarityLabels) => void;
    totalItems?: number;
}

const RarityLabelForm: React.FC<RarityLabelFormProps> = ({
    collectionRarities,
    setCollectionRarities,
    totalItems,
}) => {
    const addRarity = () => {
        setCollectionRarities([
            ...collectionRarities,
            { label: "", percentage: "", items: "" },
        ]);
    };

    const removeRarity = (index: number) => {
        setCollectionRarities(collectionRarities.filter((_, i) => i !== index));
    };

    const updateRarity = (index: number, field: keyof Rarity, value: string) => {
      if (value === "") {
          setCollectionRarities(
              collectionRarities.map((rarity, i) =>
                  i === index ? { ...rarity, [field]: "" } : rarity,
              ),
          );
          return;
      }
  
      let updatedRarities = [...collectionRarities];
  
      if (field === "percentage" && !totalItems) {
          const decimalValue = new Decimal(value).dividedBy(100);
          updatedRarities[index] = { ...updatedRarities[index], percentage: decimalValue.toFixed(4) };
      } else if (field === "items" && totalItems) {
          const items = Number.parseInt(value);
          if (!Number.isNaN(items)) {
              updatedRarities[index] = { ...updatedRarities[index], items: items.toString() };
              
              // Calculate raw percentages
              let totalItems = 0;
              for (const rarity of updatedRarities) {
                  totalItems += Number.parseInt(rarity.items || "0");
              };
  
              let remainingPercentage = new Decimal(1);
              updatedRarities = updatedRarities.map((rarity, i) => {
                  if (rarity.items) {
                      let percentage = new Decimal(rarity.items).dividedBy(totalItems);
                      if (i === updatedRarities.length - 1) {
                          // Last item gets remaining percentage
                          percentage = remainingPercentage;
                      } else {
                          // Round down to 4 decimal places
                          percentage = percentage.toDecimalPlaces(4, Decimal.ROUND_DOWN);
                          remainingPercentage = remainingPercentage.minus(percentage);
                      }
                      return { ...rarity, percentage: percentage.toFixed(4) };
                  }
                  return rarity;
              });
          }
      } else {
          updatedRarities[index] = { ...updatedRarities[index], [field]: value };
      }
  
      setCollectionRarities(updatedRarities);
  };

    const totalPct = useMemo(() => {
        const pct = collectionRarities.reduce((acc, curr) => {
            return acc.plus(new Decimal(curr.percentage || "0").times(100));
        }, new Decimal(0));
        return `${pct.isNaN() ? '' : `${pct.toFixed(2)}%`}`;
    }, [collectionRarities]);

    const totalItemCount = useMemo(() => {
        if (!totalItems) return null;
        return collectionRarities.reduce((acc, curr) => {
            return acc + (Number.parseInt(curr.items || "0") || 0);
        }, 0);
    }, [collectionRarities, totalItems]);

    return (
        <div className="mt-4">
            <label className="block font-medium flex justify-between">
                <span>Collection Rarity Labels</span>
                {totalItems ? (
                    <span className={`${totalItemCount === totalItems ? 'text-emerald-400' : 'text-red-400'}`}>
                        {totalItemCount} / {totalItems}
                    </span>
                ) : (
                    <span className={`${totalPct === "100.00%" ? 'text-emerald-400' : 'text-red-400'}`}>{totalPct}</span>
                )}
            </label>
            {collectionRarities.map((rarity, index) => (
                <div
                    key={`rarities-${// biome-ignore lint/suspicious/noArrayIndexKey: required to prevent re-render
index}`}
                    className="flex items-center mt-2 gap-2"
                >
                    <input
                        type="text"
                        className="input input-bordered w-full"
                        value={rarity.label}
                        onChange={(e) => updateRarity(index, "label", e.target.value)}
                        placeholder="Rarity Label"
                    />
                    {totalItems ? (
                        <input
                            type="number"
                            className="input input-bordered w-full"
                            value={rarity.items}
                            onChange={(e) => updateRarity(index, "items", e.target.value)}
                            placeholder="Number of Items"
                            step="1"
                        />
                    ) : (
                        <input
                            type="number"
                            className="input input-bordered w-full"
                            value={rarity.percentage === "" ? "" : Number(new Decimal(rarity.percentage).times(100))}
                            onChange={(e) => updateRarity(index, "percentage", e.target.value)}
                            placeholder="Percentage"
                            step="any"
                        />
                    )}
                    <button
                        type="button"
                        className={removeBtnClass}
                        onClick={() => removeRarity(index)}
                    >
                        <IoMdClose />
                    </button>
                </div>
            ))}
            <button 
                disabled={totalItems ? totalItemCount === totalItems : totalPct === '100.00%'} 
                type="button" 
                className="btn btn-sm mt-2 disabled:bg-[#222] disabled:cursor-default" 
                onClick={addRarity}
            >
                Add Rarity
            </button>
        </div>
    );
};

export default RarityLabelForm;

export const validateRarities = (collectionRarities: RarityLabels, totalItems?: number) => {
    if (collectionRarities.length === 0) {
        // none is okay
        return null;
    }
    if (collectionRarities.length === 1) {
        return "You must have at least two rarities.";
    }
    if (collectionRarities.every((rarity) => rarity.percentage === "0" || rarity.percentage === "" || rarity.percentage === "1")) {
        return "Rarities cannot have a percentage of 0, or 100";
    }
    const totalPercentage = collectionRarities.reduce(
        (sum, rarity) => sum.plus(new Decimal(rarity.percentage || "0")),
        new Decimal(0)
    );
    if (!totalPercentage.isZero() && !totalPercentage.equals(1)) {
        return `The rarity percentages must total up to exactly 100. Currently at ${totalPercentage.times(100).toFixed(2)}.`;
    }
    if (totalItems) {
        const totalItemCount = collectionRarities.reduce((sum, rarity) => sum + (Number.parseInt(rarity.items || "0") || 0), 0);
        if (totalItemCount !== totalItems) {
            return `The total number of items must equal ${totalItems}. Currently at ${totalItemCount}.`;
        }
    }
    return null;
};