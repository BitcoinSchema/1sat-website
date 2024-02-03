import { redirect } from 'next/navigation';

const Outpoint = async ({ params }: { params: { outpoint: string } })  => {
  redirect(`/outpoint/${params.outpoint}/timeline`)
};

export default Outpoint;
