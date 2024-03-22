import { useSignal, effect, computed } from "@preact/signals-react";
import { Combobox, Transition } from "@headlessui/react";
import { Fragment, useRef } from "react";
import clsx from "clsx";

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
	const inputRef = useRef<HTMLInputElement>(null);
	const filteredItems = computed<string[]>(() =>
		items
			.filter((item) =>
				item.toLowerCase().startsWith(selectedItem.toLowerCase())
			)
			.slice(0, 5)
	);

	const onItemClicked = (item: string) => {
		onChange(item);
	};

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
				tabIndex={0}
				as="div"
				className="relative z-[1] menu p-2 shadow bg-base-100 rounded-box w-full max-h-48 flex-nowrap overflow-auto"
				onFocus={() => {
					if (inputRef.current) {
						inputRef.current.focus();
					}
				}}
			>
				<Combobox.Input
					className="input input-bordered block w-full mb-4 p-2 rounded bg-[#1a1a1a] text-yellow-500"
					placeholder={placeholder || "Select an item"}
					value={selectedItem}
					onInput={(e) => {
						onChange(e.currentTarget.value);
					}}
					onPaste={handlePaste}
				/>

				<Transition
					as={Fragment}
					leave="transition ease-in duration-100"
					leaveFrom="opacity-100"
					leaveTo="opacity-0"
				>
					<Combobox.Options
						className={
							"absolute bottom-0 mt-1 max-h-48 w-full overflow-auto rounded-md bg-white py-1 text-base shadow-lg ring-1 ring-black/5 focus:outline-none sm:text-sm"
						}
					>
						{selectedItem.length >= 2 &&
						filteredItems.value.length > 0 ? (
							filteredItems.value.map((item) => (
								<Combobox.Option
									key={item}
									as={"div"}
									value={item}
									className={`relative cursor-default select-none text-gray-900`}
								>
									{({ active }) => (
										<a
											className={clsx(
												"cursor-pointer select-none relative hover:bg-[#1a1a1a] rounded inline-block mx-1 my-2 px-2 text-yellow-500 w-full py-2 pl-10 pr-4",
												active
													? "text-yello-900 bg-yellow-100"
													: "text-yellow-100"
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
										</a>
									)}
								</Combobox.Option>
							))
						) : (
							<div>No results found</div>
						)}
					</Combobox.Options>
				</Transition>
			</Combobox>
		</div>
	);
};

export default Dropdown;
