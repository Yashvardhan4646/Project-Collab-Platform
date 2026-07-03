import { DeskLoader } from "@/components/desk-loader";

// Full-screen loader for cold app entry, before the shell layout resolves.
export default function Loading() {
  return (
    <div style={{ height: "100dvh", display: "flex" }}>
      <DeskLoader />
    </div>
  );
}
