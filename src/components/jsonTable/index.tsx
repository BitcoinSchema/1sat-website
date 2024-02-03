import React from "react";

type JsonTableProps = {
  data: any;
};

const JsonTable: React.FC<JsonTableProps> = ({ data }) => {
  const renderValue = (value: any) => {
    if (Array.isArray(value)) {
      return value.join(", ");
    } else if (typeof value === "object" && value !== null) {
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
              className={index % 2 === 0 ? "bg-[#111]" : "bg-[#333]"}
            >
              <td className="px-5 py-2 border-b border-[#222] bg-[#111] text-sm">
                <div className="flex items-center">
                  <div className="ml-3">
                    <p className="whitespace-no-wrap">{key}</p>
                  </div>
                </div>
              </td>
              <td className="px-5 py-2 border-b-[#222] bg-[#111] text-sm">
                <p className="whitespace-no-wrap">{renderValue(value)}</p>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default JsonTable;
