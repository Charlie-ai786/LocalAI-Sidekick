import React, { useEffect, useState } from 'react';
import { api } from '../api/client';
import { StudioTemplate } from '../types';
import { useApp } from '../context/AppContext';
import { TemplateSelector } from '../components/studio/TemplateSelector';
import { GenerationControls } from '../components/studio/GenerationControls';
import { ContentEditor } from '../components/studio/ContentEditor';

export const StudioPage: React.FC = () => {
  const { showToast } = useApp();
  const [templates, setTemplates] = useState<StudioTemplate[]>([]);
  const [selectedTemplate, setSelectedTemplate] = useState<StudioTemplate | null>(null);

  // Form states
  const [topic, setTopic] = useState('');
  const [audience, setAudience] = useState('Tech leads and modern freelancers');
  const [tone, setTone] = useState('Professional');
  const [language, setLanguage] = useState('English');
  const [length, setLength] = useState('Medium');
  const [keyPoints, setKeyPoints] = useState('');

  // Result state
  const [content, setContent] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [latencySec, setLatencySec] = useState<number | undefined>();

  useEffect(() => {
    const fetchTemplates = async () => {
      try {
        const tpls = await api.getStudioTemplates();
        setTemplates(tpls);
        if (tpls.length > 0) {
          const first = tpls[0];
          setSelectedTemplate(first);
          setTopic(first.default_topic);
          setKeyPoints(first.default_points);
        }
      } catch (err) {
        console.error('Failed to load templates:', err);
      }
    };
    fetchTemplates();
  }, []);

  const handleSelectTemplate = (tpl: StudioTemplate) => {
    setSelectedTemplate(tpl);
    setTopic(tpl.default_topic);
    setKeyPoints(tpl.default_points);
  };

  const handleGenerate = async () => {
    if (!selectedTemplate || !topic.trim()) return;

    setIsGenerating(true);
    try {
      const res = await api.generateContent({
        template: selectedTemplate.id,
        topic,
        target_audience: audience,
        tone,
        language,
        length,
        key_points: keyPoints,
      });
      setContent(res.content);
      setLatencySec(res.latency_sec);
      showToast('Generated commercial copy using local AI', 'success');
    } catch (err: any) {
      showToast(err.message || 'Generation failed', 'error');
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Template selector pills */}
      <TemplateSelector
        templates={templates}
        selectedTemplateId={selectedTemplate?.id || ''}
        onSelectTemplate={handleSelectTemplate}
      />

      {/* Editor & Controls split */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 h-[calc(100vh-250px)]">
        {/* Left: Controls (5 cols) */}
        <div className="lg:col-span-5 h-full overflow-y-auto">
          <GenerationControls
            topic={topic}
            setTopic={setTopic}
            audience={audience}
            setAudience={setAudience}
            tone={tone}
            setTone={setTone}
            language={language}
            setLanguage={setLanguage}
            length={length}
            setLength={setLength}
            keyPoints={keyPoints}
            setKeyPoints={setKeyPoints}
            onGenerate={handleGenerate}
            isGenerating={isGenerating}
            selectedTemplateTitle={selectedTemplate?.title || 'Template'}
          />
        </div>

        {/* Right: Output editor (7 cols) */}
        <div className="lg:col-span-7 h-full overflow-hidden">
          <ContentEditor
            content={content}
            setContent={setContent}
            templateTitle={selectedTemplate?.title || 'Business Copy'}
            latencySec={latencySec}
          />
        </div>
      </div>
    </div>
  );
};
