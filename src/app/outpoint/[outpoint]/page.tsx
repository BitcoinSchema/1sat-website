import { notFound, redirect } from "next/navigation";
import { isValidOutpoint } from "@/utils/validation";

const Outpoint = async ({
	params,
}: {
	params: Promise<{ outpoint: string }>;
}) => {
	const { outpoint } = await params;
	if (!isValidOutpoint(outpoint)) {
		notFound();
	}
	redirect(`/outpoint/${outpoint}/timeline`);
};

export default Outpoint;
