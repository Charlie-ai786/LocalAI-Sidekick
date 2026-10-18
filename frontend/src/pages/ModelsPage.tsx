import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { OllamaStatusCard } from '../components/models/OllamaStatusCard';
import { ModelCatalog } from '../components/models/ModelCatalog';
import { SetupGuideModal } from '../components/models/SetupGuideModal';

export const ModelsPage: React.FC = () => {
  const { modelStatus } = useApp();
  const [isGuideOpen, setIsGuideOpen] = useState(false);

  return (
    <div className="space-y-6">
      {/* Status Card */}
      <OllamaStatusCard status={modelStatus} />

      {/* Model Catalog */}
      <ModelCatalog
        catalog={modelStatus?.compatible_catalog || []}
        currentModel={modelStatus?.current_model || 'qwen2.5:3b'}
        onOpenSetupGuide={() => setIsGuideOpen(true)}
      />

      {/* Installation and Setup Guide Modal */}
      <SetupGuideModal
        isOpen={isGuideOpen}
        onClose={() => setIsGuideOpen(false)}
      />
    </div>
  );
};
