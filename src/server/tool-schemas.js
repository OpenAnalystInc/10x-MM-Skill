const { z } = require('zod');

const schemas = {
  site_deploy_inline: {
    description: 'Deploy a single-page HTML site to {handle}.10x.in using inline HTML. Returns deploymentId and preview URL. Requires CLIENT_ID (JWT).',
    input: z.object({
      html: z.string().describe('Full HTML content to deploy as the site'),
      commitMessage: z.string().optional().describe('Optional deployment commit message'),
    }),
  },

  site_deploy_multifile: {
    description: 'Deploy a multi-file site to {handle}.10x.in. Returns S3 pre-signed upload URLs for each file. Must include index.html. Requires CLIENT_ID (JWT).',
    input: z.object({
      files: z.array(z.object({
        path: z.string().describe('File path relative to root (must include index.html)'),
        contentType: z.string().describe('MIME type (e.g., text/html, text/css, application/javascript)'),
        sizeBytes: z.number().describe('File size in bytes'),
      })).describe('Array of file descriptors. Must include a root index.html.'),
      commitMessage: z.string().optional().describe('Optional deployment commit message'),
    }),
  },

  site_list_deployments: {
    description: 'List all site deployments for the current handle. Requires CLIENT_ID (JWT).',
    input: z.object({
      limit: z.number().optional().describe('Max results to return'),
      nextToken: z.string().optional().describe('Pagination token'),
    }),
  },

  site_preview_deployment: {
    description: 'Get a signed preview URL for a specific deployment. Requires CLIENT_ID (JWT).',
    input: z.object({
      deploymentId: z.string().describe('The deployment ID to preview'),
    }),
  },

  pages_list: {
    description: 'List all pages for the current handle. Requires CLIENT_ID (JWT).',
    input: z.object({
      limit: z.number().optional().describe('Max results to return'),
    }),
  },

  profile_update: {
    description: 'Update the profile for the current handle. Requires CLIENT_ID (JWT).',
    input: z.object({
      displayName: z.string().optional().describe('Display name'),
      bio: z.string().optional().describe('Profile bio'),
      avatarUrl: z.string().optional().describe('Avatar image URL'),
      theme: z.string().optional().describe('Profile theme'),
    }),
  },

  site_mode_update: {
    description: 'Change the site mode for the current handle (e.g., "profile", "site"). Requires CLIENT_ID (JWT).',
    input: z.object({
      mode: z.string().describe('New site mode'),
    }),
  },
};

module.exports = schemas;
