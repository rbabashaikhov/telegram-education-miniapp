export function DemoFinish({
  finish,
  showAdmin,
  onAdmin,
  onContinue,
}: {
  finish: { title: string; lead: string; bullets: string[]; adminLabel: string; continueLabel: string };
  showAdmin: boolean;
  onAdmin: () => void;
  onContinue: () => void;
}) {
  return (
    <div className="demo-modal-layer">
      <div className="demo-modal">
        <h2>{finish.title}</h2>
        <p>{finish.lead}</p>
        <div className="finish-grid">
          {finish.bullets.map((item) => (
            <div key={item} className="finish-tile">
              {item}
            </div>
          ))}
        </div>
        <div className="row-actions">
          <button type="button" className="btn btn-secondary" onClick={onContinue}>
            {finish.continueLabel}
          </button>
          {showAdmin && (
            <button type="button" className="btn btn-primary" onClick={onAdmin}>
              {finish.adminLabel}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
