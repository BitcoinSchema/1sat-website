import type React from "react";

interface TooltipProps {
	message: string | React.ReactNode;
	children: React.ReactNode;
	className?: string;
}

const Tooltip: React.FC<TooltipProps> = ({ message, children, className }) => {
	return (
		<div className={`group relative flex ${className ? className : ""}`}>
			{children}
			<span className="z-20 absolute top-10 scale-0 transition-all rounded bg-gray-800 p-2 text-xs text-white group-hover:scale-100">
				{message}
			</span>
		</div>
	);
};

export default Tooltip;
