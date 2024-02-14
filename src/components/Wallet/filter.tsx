"use client";

import { Signal } from "@preact/signals-react";
import { useSignals } from "@preact/signals-react/runtime";
import toast from "react-hot-toast";
import { IoFilter } from "react-icons/io5";
import { ArtifactType, artifactTypeMap } from "../artifact";

const MenuItem = ({
	type,
	changeType,
}: { type: ArtifactType; changeType: (type: ArtifactType) => void }) => {
	return (
		<li>
			<button
        type="button"
				onClick={() => changeType(type)}
				className="hover:bg-primary-500 hover:text-white"
			>
				{Object.values(ArtifactType)[type]}
			</button>
		</li>
	);
};

const Filter = () => {
  useSignals();
	return (
		<div className="group dropdown dropdown-bottom dropdown-end dropdown-hover">
			<div tabIndex={0} role="button" className="btn btn-sm m-1">
      <IoFilter className="w-4 h-4 mr-2 group-hover:opacity-0 transition" />{selectedType.value || "All"}{" "}
				{/* <FaChevronDown className="group-hover:opacity-0" /> */}
			</div>
			<ul className="dropdown-content z-[1] menu p-2 shadow bg-base-100 rounded-box w-52">
        {Object.entries(ArtifactType).filter(([key, value]) => {
          return !Number.isNaN(Number(value));
        }).map(([key, value]) => {
          return <MenuItem key={key} type={value as ArtifactType} changeType={() => changeFilter(value as ArtifactType)} />
        })}
			</ul>
		</div>
	);
};

export default Filter;

export const selectedType = new Signal<ArtifactType | null>(null);
export const changeFilter = (type: ArtifactType) => {
  const str = artifactTypeMap.get(type);
  toast.success(`Filtering by ${Object.values(ArtifactType)[type]} ${str}`);
  selectedType.value = type;
}
