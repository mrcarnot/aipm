import { useState } from "react";
import DomainPicker from "./components/DomainPicker.jsx";
import ConceptTree from "./components/ConceptTree.jsx";
import RoadmapScreen from "./components/RoadmapScreen.jsx";
import IntakeWizard from "./components/IntakeWizard.jsx";
import { domains } from "./data/domains.js";
import { roadmaps, hasRoadmap } from "./data/roadmaps.js";
import { createProject } from "./data/projects.js";
import { useAuth } from "./hooks/useAuth.jsx";

export default function App() {
  const { session } = useAuth();
  const userId = session?.user?.id;

  // view.screen is one of: "picker" | "wizard" | "tree" | "roadmap"
  const [view, setView] = useState({ screen: "picker" });

  if (view.screen === "wizard") {
    return (
      <div className="app">
        <IntakeWizard
          domainId={view.domainId}
          title={view.query}
          onAbort={() => setView({ screen: "picker" })}
          onFinish={async (domainId, projectTitle, answers, dynamicAnswers, generatedContent, result) => {
            const project = await createProject({
              userId,
              title: projectTitle,
              domainId,
              comfort: answers.comfort,
              days: answers.days,
              depth: answers.depth,
              dynamicAnswers,
              treeJson: generatedContent.tree,
              roadmapJson: generatedContent.roadmap
            });
            setView({
              screen: result.screen,
              domainId,
              progressKey: project.id,
              title: project.title,
              treeContent: generatedContent.tree,
              roadmapContent: generatedContent.roadmap,
              showAdvanced: result.showAdvanced
            });
          }}
        />
      </div>
    );
  }

  if (view.screen === "tree") {
    // Your Projects cards carry their own AI-generated tree; Explore Topics
    // cards fall back to the shared static domain content.
    const domain = view.treeContent || domains.find(d => d.domainId === view.domainId);
    return (
      <div className="app">
        <ConceptTree
          domain={domain}
          progressKey={view.progressKey}
          title={view.title}
          initialShowAdvanced={Boolean(view.showAdvanced)}
          onBack={() => setView({ screen: "picker" })}
        />
      </div>
    );
  }

  if (view.screen === "roadmap") {
    const roadmap = view.roadmapContent || roadmaps[view.domainId];
    return (
      <div className="app">
        <RoadmapScreen
          roadmap={roadmap}
          progressKey={view.progressKey}
          title={view.title}
          onBack={() => setView({ screen: "picker" })}
        />
      </div>
    );
  }

  return (
    <div className="app">
      <DomainPicker
        onSelectTree={(domainId, progressKey, title, treeContent) =>
          setView({ screen: "tree", domainId, progressKey, title, treeContent })
        }
        onSelectRoadmap={(domainId, progressKey, title, roadmapContent) =>
          setView({ screen: "roadmap", domainId, progressKey, title, roadmapContent })
        }
        onStartWizard={(domainId, query) => setView({ screen: "wizard", domainId, query })}
        hasRoadmap={hasRoadmap}
      />
    </div>
  );
}
