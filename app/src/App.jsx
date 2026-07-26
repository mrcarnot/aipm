import { useState } from "react";
import DomainPicker from "./components/DomainPicker.jsx";
import ConceptTree from "./components/ConceptTree.jsx";
import RoadmapScreen from "./components/RoadmapScreen.jsx";
import IntakeWizard from "./components/IntakeWizard.jsx";
import { domains } from "./data/domains.js";
import { roadmaps, hasRoadmap } from "./data/roadmaps.js";

export default function App() {
  // view.screen is one of: "picker" | "wizard" | "tree" | "roadmap"
  const [view, setView] = useState({ screen: "picker" });

  if (view.screen === "wizard") {
    return (
      <div className="app">
        <IntakeWizard
          domainId={view.domainId}
          onAbort={() => setView({ screen: "picker" })}
          onFinish={(domainId, result) =>
            setView({ screen: result.screen, domainId, showAdvanced: result.showAdvanced })
          }
        />
      </div>
    );
  }

  if (view.screen === "tree") {
    const domain = domains.find(d => d.domainId === view.domainId);
    return (
      <div className="app">
        <ConceptTree
          domain={domain}
          initialShowAdvanced={Boolean(view.showAdvanced)}
          onBack={() => setView({ screen: "picker" })}
        />
      </div>
    );
  }

  if (view.screen === "roadmap") {
    const roadmap = roadmaps[view.domainId];
    return (
      <div className="app">
        <RoadmapScreen roadmap={roadmap} onBack={() => setView({ screen: "picker" })} />
      </div>
    );
  }

  return (
    <div className="app">
      <DomainPicker
        onSelectTree={domainId => setView({ screen: "tree", domainId })}
        onSelectRoadmap={domainId => setView({ screen: "roadmap", domainId })}
        onStartWizard={domainId => setView({ screen: "wizard", domainId })}
        hasRoadmap={hasRoadmap}
      />
    </div>
  );
}
