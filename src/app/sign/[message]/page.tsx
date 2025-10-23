import SignMessagePage from "@/components/pages/sign";

const Prove = async ({
	params,
	searchParams,
}: {
	params: { message: string };
	searchParams: { callback?: string; state?: string };
}) => {
	return (
		<SignMessagePage
			message={params.message}
			callback={searchParams.callback}
			state={searchParams.state}
		/>
	);
};

export default Prove;