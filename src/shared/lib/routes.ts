import { useLocation } from "react-router-dom";

export interface ResourceViewConfig {
  resource: string;
  title: string;
  description: string;
  actionLabel?: string;
  readOnly?: boolean;
}

export function useResourceView(configs: Record<string, ResourceViewConfig>) {
  const location = useLocation();
  const scenario = new URLSearchParams(location.search).get("scenario") ?? "success";
  const config = configs[location.pathname] ?? Object.values(configs)[0];
  return { config, scenario };
}
