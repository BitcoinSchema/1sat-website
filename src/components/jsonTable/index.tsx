import React from "react";

type JsonTableProps = {
	data: any;
};

const JsonTable: React.FC<JsonTableProps> = ({ data }) => {
	const renderValue = (value: any) => {
		if (Array.isArray(value) && typeof value[0] !== "object") {
			return value.join(", ");
		}
		if (typeof value === "object" && value !== null) {
			return <JsonTable data={value} />;
		}
		return value.toString();
	};

	return (
		<div className="overflow-x-auto">
			<table className="min-w-full leading-normal">
				<tbody>
					{Object.entries(data).map(([key, value], index) => (
						<tr
							key={key}
							className={`${
								index % 2 === 0 ? "bg-[#101010]/50" : "bg-[#010101]/50"
							} rounded`}
						>
							{Number.isNaN(parseInt(key)) && (
								<td className="px-5 py-2 text-xs font-semibold tracking-wide text-[#555]">
									<div className="flex items-center">
										<div className="ml-3">
											<p className="whitespace-no-wrap font-mono">{key}</p>
										</div>
									</div>
								</td>
							)}
							{Number.isNaN(parseInt(key)) && (
								<td className="px-5 py-2 text-xs">
									<p className="whitespace-no-wrap font-mono text-[#aaa]">
										{renderValue(value)}
									</p>
								</td>
							)}
							{!Number.isNaN(parseInt(key)) && renderValue(value)}
						</tr>
					))}
				</tbody>
			</table>
		</div>
	);
};

export default JsonTable;
