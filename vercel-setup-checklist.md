
# Vercel Setup Checklist (exact clicks)

1. Sign in to Vercel: https://vercel.com
2. Click the "New Project" button.
3. Choose "Import Git Repository" and pick GitHub as the provider.
4. Authorize Vercel to access your GitHub account (one-time).
5. Select repository `personal-cloud` and click "Import".
6. In "Configure Project", scroll to Environment Variables → click "Add".
   - Add `JWT_SECRET` and other variables as described in the README.
7. Click "Deploy". Monitor the deployment logs. If build fails, open the logs and copy the error to paste into chat with the assistant.
8. After successful deploy, click the domain link to open the site.
9. To configure Vercel Blob: from Project Dashboard → Storage → Create Blob Store → follow prompts → copy any created tokens into Environment Variables.
