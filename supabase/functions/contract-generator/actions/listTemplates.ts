// List Templates Action

import { AVAILABLE_TEMPLATES } from '../lib/storage.ts';

export interface ListTemplatesResult {
  success: boolean;
  templates?: Array<{
    id: string;
    name: string;
    description: string;
    action: string;
  }>;
  error?: string;
}

/**
 * List all available document templates
 */
export function handleListTemplates(): Promise<ListTemplatesResult> {
  return {
    success: true,
    templates: AVAILABLE_TEMPLATES.map(t => ({
      id: t.id,
      name: t.name,
      description: t.description,
      action: t.action
    }))
  };
}
