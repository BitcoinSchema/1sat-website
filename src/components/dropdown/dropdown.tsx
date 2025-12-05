"use client";

import { Combobox } from "@headlessui/react";
import { computed, useSignal } from "@preact/signals-react";
import { useSignals } from "@preact/signals-react/runtime";
import clsx from "clsx";
import { useEffect } from "react";

interface DropdownProps {
	placeholder?: string;
	items: string[];
	selectedItem: string;
	onChange: (item: string | null) => void;
	renderItem?: (item: string) => JSX.Element;
	allowClear?: boolean;
	onPaste?: (pastedData: string) => void;
}

const Dropdown: React.FC<DropdownProps> = ({
	placeholder,
	items,
	selectedItem,
	onChange,
	renderItem,
	onPaste,
}) => {
	useSignals();
	const hasFocus = useSignal(false);
	const isSelected = computed(() => items.includes(selectedItem));
	const filteredItems = computed<string[]>(() =>
		items
			.filter((item) =>
				item.toLowerCase().startsWith(selectedItem.toLowerCase()),
			)
			.slice(0, 3),
	);

	const onItemClicked = (item: string) => {
		onChange(item);
	};

	useEffect(() => {
		console.log({ selectedItem });
	}, [selectedItem]);

	const handlePaste = (event: React.ClipboardEvent) => {
		event.preventDefault();
		const pastedData = event.clipboardData.getData("text");
		if (onPaste) {
			onPaste(pastedData);
		}
	};

	return (
		<div className="">
			<Combobox
				as="div"
				className={clsx("relative w-full z-[10] flex-nowrap overflow-visible", {
					"z-[10]": hasFocus.value,
					"z-[1]": !hasFocus.value,
				})}
				nullable
				onChange={onItemClicked}
				onFocus={() => {
					console.log("has focus");
					hasFocus.value = true;
				}}
				onBlur={() => {
					hasFocus.value = false;
				}}
			>
				{({ open }) => (
					<>
						<Combobox.Input
							className="input input-bordered block w-full p-2 rounded bg-[#1a1a1a] text-yellow-500"
							placeholder={placeholder || "Select an item"}
							value={selectedItem || undefined}
							onInput={(e) => {
								onChange(e.currentTarget.value);
							}}
							onPaste={handlePaste}
						/>

						{!isSelected.value &&
							open &&
							selectedItem.length >= 2 &&
							filteredItems.value.length > 0 && (
								<Combobox.Options
									static
									className={
										"absolute z-[10] mt-1 max-h-48 w-full overflow-auto rounded-md bg-[#222] py-1 text-base shadow-lg ring-1 ring-black/5 focus:outline-none sm:text-sm"
									}
								>
									{filteredItems.value.map((item) => (
										<Combobox.Option
											key={item}
											as={"div"}
											value={item}
											className={
												"relative cursor-default select-none text-gray-900"
											}
										>
											{({ active }) => (
												<button
													type="button"
													className={clsx(
														"cursor-pointer select-none relative rounded inline-block text-yellow-500 w-full py-2 pl-4 pr-4",
														active
															? "text-yellow-900 bg-yellow-500"
															: "text-yellow-100",
													)}
													onClick={(e) => {
														e.preventDefault();
														onItemClicked(item);
														e.currentTarget.blur();
													}}
												>
													{renderItem ? (
														renderItem(item)
													) : (
														<div className="">{item}</div>
													)}
												</button>
											)}
										</Combobox.Option>
									))}
								</Combobox.Options>
							)}
					</>
				)}
			</Combobox>
		</div>
	);
};

export default Dropdown;
