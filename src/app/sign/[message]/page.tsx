import SignMessagePage from "@/components/pages/sign";

const Prove = async ({
	params,
	searchParams,
}: {
	params: Promise<{ message: string }>;
	searchParams: Promise<{ callback?: string; state?: string }>;
}) => {
	const { message } = await params;
	const { callback, state } = await searchParams;
	return (
		<SignMessagePage
			message={message}
			callback={callback}
			state={state}
		/>
	);
};

export default Prove;