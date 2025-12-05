import { redirect } from "next/navigation";

const Outpoint = async ({
	params,
}: {
	params: Promise<{ outpoint: string }>;
}) => {
	const { outpoint } = await params;
	redirect(`/outpoint/${outpoint}/timeline`);
};

export default Outpoint;
