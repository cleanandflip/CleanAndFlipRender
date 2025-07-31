// This file is deprecated - using new dynamic error system
import { ErrorPage } from "@/components/error-boundary";

export default function NotFound() {
  return <ErrorPage status={404} />;
}
