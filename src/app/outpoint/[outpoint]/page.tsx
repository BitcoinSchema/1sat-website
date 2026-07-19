import { notFound, redirect } from 'next/navigation';
import { isValidOutpoint } from "@/utils/validation";

const Outpoint = async ({ params }: { params: { outpoint: string } })  => {
  if (!isValidOutpoint(params.outpoint)) {
    notFound();
  }
  redirect(`/outpoint/${params.outpoint}/timeline`)
};

export default Outpoint;
