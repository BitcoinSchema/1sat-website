import SignMessagePage from "@/components/pages/sign";

const Prove = async ({ params }: { params: { message: string } }) => {
	return <SignMessagePage {...params} />;
};

export default Prove;