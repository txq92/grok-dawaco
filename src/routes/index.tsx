import { createFileRoute } from "@tanstack/react-router";
import { WaterDesk } from "@/components/water-desk";

export const Route = createFileRoute("/")({ component: Home });

function Home() {
  return <WaterDesk />;
}
