type Props = {
  label: string;
  value: string;
};

export function Metric({ label, value }: Props) {
  return (
    <div className="card" style={{ padding: 16 }}>
      <div className="muted" style={{ marginBottom: 6 }}>{label}</div>
      <div style={{ fontSize: 28, fontWeight: 700 }}>{value}</div>
    </div>
  );
}
