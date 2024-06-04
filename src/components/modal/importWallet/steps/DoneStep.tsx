interface Props {
  onDone: () => void;
}

export function DoneStep({ onDone }: Props) {
  return (
    <>
      <div className="mt-2 mb-4">
        Your wallet has been successfully imported.
      </div>

      <div className="flex justify-end mt-4">
        <button type="button" className="btn btn-primary" onClick={onDone}>
          Done
        </button>
      </div>
    </>
  );
}
