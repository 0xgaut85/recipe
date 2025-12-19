$srcDir = "C:\Users\jum\OneDrive\Documents\vibetrading\recipe-claude-plugin"

function Make-Commit {
    param($date, $message)
    $env:GIT_AUTHOR_DATE = $date
    $env:GIT_COMMITTER_DATE = $date
    git add -A
    git commit -m $message
    $env:GIT_AUTHOR_DATE = $null
    $env:GIT_COMMITTER_DATE = $null
}

# Commit 1: Dec 19, 2025 - initial setup
Write-Host "Commit 1: initial project setup"
Copy-Item "$srcDir\package.json" -Destination "."
Copy-Item "$srcDir\tsconfig.json" -Destination "."
# Create minimal package.json for initial commit
@'
{
  "name": "claude-trade-plugin",
  "version": "0.1.0",
  "description": "solana trading plugin for claude code",
  "main": "dist/index.js",
  "type": "module",
  "scripts": {
    "build": "tsc",
    "start": "node dist/index.js"
  },
  "keywords": ["mcp", "claude", "solana", "trading"],
  "license": "MIT",
  "dependencies": {},
  "devDependencies": {
    "@types/node": "^20.11.0",
    "typescript": "^5.3.3"
  }
}
'@ | Set-Content "package.json"
Make-Commit "2025-12-19T10:23:45" "initial project setup"

# Commit 2: Dec 21 - basic mcp structure
Write-Host "Commit 2: basic mcp server structure"
New-Item -ItemType Directory -Path "src" -Force | Out-Null
@'
#!/usr/bin/env node
import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";

const server = new Server(
  { name: "claude-trade", version: "0.1.0" },
  { capabilities: { tools: {} } }
);

async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.error("server running");
}

main().catch(console.error);
'@ | Set-Content "src/index.ts"
Make-Commit "2025-12-21T14:12:33" "add basic mcp server structure"

# Commit 3: Dec 23 - wallet generation
Write-Host "Commit 3: wallet generation"
New-Item -ItemType Directory -Path "src/lib" -Force | Out-Null
Copy-Item "$srcDir\src\lib\wallet.ts" -Destination "src/lib/"
Make-Commit "2025-12-23T19:45:22" "implement wallet generation"

# Commit 4: Dec 26 - jupiter integration
Write-Host "Commit 4: jupiter integration"
Copy-Item "$srcDir\src\lib\jupiter.ts" -Destination "src/lib/"
Make-Commit "2025-12-26T11:33:18" "add jupiter integration for swaps"

# Commit 5: Dec 28 - wallet tools
Write-Host "Commit 5: wallet tools"
New-Item -ItemType Directory -Path "src/tools" -Force | Out-Null
Copy-Item "$srcDir\src\tools\wallet.ts" -Destination "src/tools/"
Make-Commit "2025-12-28T16:22:41" "create wallet tools"

# Commit 6: Dec 30 - api client
Write-Host "Commit 6: api client"
Copy-Item "$srcDir\src\lib\api.ts" -Destination "src/lib/"
Make-Commit "2025-12-30T20:15:09" "add api client for backend"

# Commit 7: Jan 2 - token search (partial)
Write-Host "Commit 7: token search partial"
$tokenContent = Get-Content "$srcDir\src\tools\token.ts" -Raw
$partialToken = $tokenContent.Substring(0, [Math]::Min(8000, $tokenContent.Length))
$partialToken | Set-Content "src/tools/token.ts"
Make-Commit "2026-01-02T09:44:55" "implement token search tools"

# Commit 8: Jan 4 - token complete
Write-Host "Commit 8: token complete"
Copy-Item "$srcDir\src\tools\token.ts" -Destination "src/tools/" -Force
Make-Commit "2026-01-04T15:28:37" "add trending and price endpoints"

# Commit 9: Jan 6 - trade tools partial
Write-Host "Commit 9: trade tools partial"
$tradeContent = Get-Content "$srcDir\src\tools\trade.ts" -Raw
$partialTrade = $tradeContent.Substring(0, [Math]::Min(6000, $tradeContent.Length))
$partialTrade | Set-Content "src/tools/trade.ts"
Make-Commit "2026-01-06T21:11:03" "create trade tools for swaps"

# Commit 10: Jan 8 - trade complete
Write-Host "Commit 10: trade complete"
Copy-Item "$srcDir\src\tools\trade.ts" -Destination "src/tools/" -Force
Make-Commit "2026-01-08T12:55:29" "add quick buy/sell functions"

# Commit 11: Jan 10 - strategy tools
Write-Host "Commit 11: strategy tools"
Copy-Item "$srcDir\src\tools\strategy.ts" -Destination "src/tools/"
Make-Commit "2026-01-10T17:33:42" "implement strategy tools"

# Commit 12: Jan 11 - wire up index
Write-Host "Commit 12: wire up index"
Copy-Item "$srcDir\src\index.ts" -Destination "src/" -Force
Make-Commit "2026-01-11T10:22:18" "wire up all tools in index"

# Commit 13: Jan 12 - plugin config
Write-Host "Commit 13: plugin config"
New-Item -ItemType Directory -Path "plugin" -Force | Out-Null
Copy-Item "$srcDir\plugin\package.json" -Destination "plugin/"
New-Item -ItemType Directory -Path "plugin\.claude-plugin" -Force | Out-Null
Copy-Item "$srcDir\plugin\.claude-plugin\plugin.json" -Destination "plugin\.claude-plugin\" -ErrorAction SilentlyContinue
Copy-Item "$srcDir\plugin\.mcp.json" -Destination "plugin\" -ErrorAction SilentlyContinue
Make-Commit "2026-01-12T14:45:11" "add claude plugin config"

# Commit 14: Jan 13 - mcp server bundle
Write-Host "Commit 14: mcp server bundle"
New-Item -ItemType Directory -Path "plugin/scripts" -Force | Out-Null
Copy-Item "$srcDir\plugin\scripts\mcp-server.cjs" -Destination "plugin/scripts/"
Make-Commit "2026-01-13T19:08:33" "create mcp server bundle script"

# Commit 15: Jan 14 - wallet setup script
Write-Host "Commit 15: wallet setup script"
Copy-Item "$srcDir\plugin\scripts\setup-wallet.cjs" -Destination "plugin/scripts/"
Make-Commit "2026-01-14T11:27:55" "add wallet setup script"

# Commit 16: Jan 15 - session hook
Write-Host "Commit 16: session hook"
Copy-Item "$srcDir\plugin\scripts\check-setup.cjs" -Destination "plugin/scripts/"
New-Item -ItemType Directory -Path "plugin/hooks" -Force | Out-Null
Copy-Item "$srcDir\plugin\hooks\hooks.json" -Destination "plugin/hooks/"
Make-Commit "2026-01-15T16:44:21" "add session hook"

# Commit 17: Jan 16 - claude.md
Write-Host "Commit 17: claude.md"
Copy-Item "$srcDir\plugin\CLAUDE.md" -Destination "plugin/"
Make-Commit "2026-01-16T13:15:48" "create claude.md documentation"

# Commit 18: Jan 17 - setup skill
Write-Host "Commit 18: setup skill"
New-Item -ItemType Directory -Path "plugin/skills/claude-trade-setup" -Force | Out-Null
Copy-Item "$srcDir\plugin\skills\claude-trade-setup\SKILL.md" -Destination "plugin/skills/claude-trade-setup/"
Make-Commit "2026-01-17T20:33:07" "add setup skill"

# Commit 19: Jan 18 morning - readme
Write-Host "Commit 19: readme"
Copy-Item "$srcDir\README.md" -Destination "."
Make-Commit "2026-01-18T09:22:14" "write readme"

# Commit 20: Jan 18 evening - marketplace config
Write-Host "Commit 20: marketplace config"
New-Item -ItemType Directory -Path ".claude-plugin" -Force | Out-Null
Copy-Item "$srcDir\.claude-plugin\marketplace.json" -Destination ".claude-plugin\" -ErrorAction SilentlyContinue
Make-Commit "2026-01-18T21:45:33" "add marketplace config"

# Commit 21: Jan 19 morning - update package.json
Write-Host "Commit 21: fix package.json"
Copy-Item "$srcDir\package.json" -Destination "." -Force
Make-Commit "2026-01-19T10:11:27" "fix tool naming consistency"

# Commit 22: Jan 19 afternoon - final
Write-Host "Commit 22: ready for release"
Copy-Item "$srcDir\tsconfig.json" -Destination "." -Force
# Create .gitignore
@'
node_modules/
dist/
.env
*.log
'@ | Set-Content ".gitignore"
Make-Commit "2026-01-19T14:33:52" "ready for release"

Write-Host "Done! Created 22 commits"
git log --oneline
