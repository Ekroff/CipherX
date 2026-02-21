# Run install + frontend build. Use this when npm install emits stderr (e.g. EPERM
# on Windows) and PowerShell would otherwise treat it as a failure.
$ErrorActionPreference = 'Continue'
npm install
if ($LASTEXITCODE -ne 0) { exit $LASTEXITCODE }
npm run build --workspace=packages/frontend
exit $LASTEXITCODE
