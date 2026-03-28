import { createBrowserRouter } from 'react-router-dom';
import { AppLayout } from '../../components/layout/AppLayout';
import { DashboardPage } from '../../features/dashboard/DashboardPage';
import { YamlValidatorPage } from '../../features/tools/yaml-validator/YamlValidatorPage';
import { JsonFormatterPage } from '../../features/tools/json-formatter/JsonFormatterPage';
import { JwtDecoderPage } from '../../features/tools/jwt-decoder/JwtDecoderPage';
import { CronTesterPage } from '../../features/tools/cron-tester/CronTesterPage';
import { Base64ToolPage } from '../../features/tools/base64-tool/Base64ToolPage';
import { DockerComposePage } from '../../features/tools/docker-compose/DockerComposePage';
import { K8sInspectorPage } from '../../features/tools/k8s-inspector/K8sInspectorPage';
import { EnvDiffPage } from '../../features/tools/env-diff/EnvDiffPage';
import { LogAnalyzerPage } from '../../features/tools/log-analyzer/LogAnalyzerPage';
import { CurlConverterPage } from '../../features/tools/curl-converter/CurlConverterPage';
import { SnippetsPage } from '../../features/snippets/SnippetsPage';
import { SettingsPage } from '../../features/settings/SettingsPage';

export const router = createBrowserRouter([
  {
    path: '/',
    element: <AppLayout />,
    children: [
      { index: true, element: <DashboardPage /> },
      { path: 'tools/yaml-validator', element: <YamlValidatorPage /> },
      { path: 'tools/json-formatter', element: <JsonFormatterPage /> },
      { path: 'tools/jwt-decoder', element: <JwtDecoderPage /> },
      { path: 'tools/cron-tester', element: <CronTesterPage /> },
      { path: 'tools/base64', element: <Base64ToolPage /> },
      { path: 'tools/docker-compose', element: <DockerComposePage /> },
      { path: 'tools/k8s-inspector', element: <K8sInspectorPage /> },
      { path: 'tools/env-diff', element: <EnvDiffPage /> },
      { path: 'tools/curl-converter', element: <CurlConverterPage /> },
      { path: 'tools/log-analyzer', element: <LogAnalyzerPage /> },
      { path: 'snippets', element: <SnippetsPage /> },
      { path: 'settings', element: <SettingsPage /> },
    ],
  },
]);
