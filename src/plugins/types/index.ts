export type ToolCategory = 'validation' | 'inspection' | 'conversion' | 'analysis';

export interface ToolPlugin {
  id: string;
  name: string;
  description: string;
  route: string;
  icon: string;
  category: ToolCategory;
  tags: string[];
  defaultInput?: string;
  persistenceKey: string;
  featured?: boolean;
  color: string;
  gradient: string;
}
