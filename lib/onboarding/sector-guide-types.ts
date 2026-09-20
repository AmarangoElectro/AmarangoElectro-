export type SectorGuideRole = "cliente" | "asesor" | "admin";

export interface SectorGuideStep {
  id: string;
  title: string;
  description: string;
  /** Optional `data-guide-target` value of the real control being explained. */
  target?: string;
  actionLabel?: string;
}

export interface SectorGuideDefinition {
  role: SectorGuideRole;
  sectorId: string;
  /** Bump this to re-show an updated guide even to users who already completed a previous version. */
  guideVersion: number;
  title: string;
  intro: string;
  steps: SectorGuideStep[];
}
