import cppBankingRoadmap from "./cpp-banking-roadmap.json";

// Add a domainId key here once you've authored a roadmap for that domain,
// following ROADMAP_SCHEMA.md. Domains without an entry show "coming soon"
// in the picker instead of a broken Build button.
export const roadmaps = {
  "cpp-banking": cppBankingRoadmap
};

export function hasRoadmap(domainId) {
  return Boolean(roadmaps[domainId]);
}
