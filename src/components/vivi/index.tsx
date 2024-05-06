import ViviButton from "./button";

type ViviProps = {};

const Vivi: React.FC<ViviProps> = ({ }) => {
  return (
    <div className="fixed bottom-0 right-0 mr-12 mb-12">
      <ViviButton className="p-2" />
    </div>
  );
};

export default Vivi;