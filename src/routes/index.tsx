import { createFileRoute } from "@tanstack/react-router";
import { Console } from "@/components/legio/console";

export const Route = createFileRoute("/")({
  component: Console,
});
