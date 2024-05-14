import ViviButton from "./button";

type ViviProps = {};

const Vivi: React.FC<ViviProps> = ({ }) => {
  return (
    <div className="h-full w-full flex flex-col justify-end items-center">
      <ViviButton className="p-2" />
    </div>
  );
};

export default Vivi;