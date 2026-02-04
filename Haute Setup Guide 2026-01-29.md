# Haute Setup Guide

**Created by:** Donato Cabal  
**Last update:** 2026-01-29

> Complete setup guide for Claude Code CLI with Obsidian integration for enterprise knowledge management. 

---

Welcome to the wonderful world of HAUTE. HAUTE stands for - **Human-Augmented Unified Team Environment**

## 📋 Prerequisites

### Required Access & Permissions

- **In lieu of local admin rights, enrollment in Haute install group to enable installs via Intune**
  - Otherwise, will need ability to elevate to local admin
- **Anthropic Claude account**
  - See Mark or Donato for new account setup if available
  - Otherwise setup personal Pro account on monthly service (you will submit to expense report) and will transition to team/enterprise account
  - Will require manager budgetary approval
  - Provide ongoing justification of expense
Here
### Required Files

Available to download from the Haute Setup Channel
- `claude-code-expert.md` - Claude Code configuration agent
- `mcp-settings.md` - MCP server configurations
- `enterprise-memory-architecture.tex` - Memory tier documentation

---

## Part 1: Install Base Software

### 🪟 Windows Installation

#### Option A: Using Intune Company Portal

This is the lowest friction option for setup.

1. **In the Intune Company Portal app on your WIndows laptop:**
   - Navigate to the Apps section
   - Install Node.js, Git, Claude Code, Visual Studio Code, Obsidian
   - 
#### Option B: Quick Installation Using Installation Script

> **Requirements:** Local administrator access (if you do not have WinGet this will faiL)

1. **Extract** `Win11DevSetup` package to your home folder

2. **Open PowerShell as Administrator**

3. **Execute installation:**
   ```powershell
   Set-ExecutionPolicy -ExecutionPolicy Bypass -Scope Process
   # Enter 'A' for Yes to All
   
   cd Win11DevSetup
   .\INSTALL.ps1
   ```

#### Option C: Full Manual Installation

1. **Install VSCode** (Required)
   - Download from: https://code.visualstudio.com
   - Run installer with default settings
   - Pin to taskbar for easy access

2. **Install Obsidian** (Required)
   - Download from: https://obsidian.md
   - Choose installer for your system architecture
   - Run installer with default settings

3. **Install Node.js** (Requires local admin)
   - Download from: https://nodejs.org
   - Choose LTS version (recommended)
   - During installation, ensure "Add to PATH" is checked
   - Verify: `node --version`

4. **Install Git Bash** (Requires local admin)
   - Download from: https://git-scm.com/downloads/win
   - Select "Git from the command line and also from 3rd-party software"

5. **Configure Environment Variables**
   - Press `Windows + X` → System → Advanced System Settings
   - Click Environment Variables
   - Under "System variables", edit `Path`
   - Add if not present:
     - `C:\Program Files\Git\bin\`
     - `C:\Users\%USERNAME%\.local\bin`
   - Click OK to save all dialogs
   - Restart any open terminals

#### Verify Installation

Launch apps installed on your PC from the Start Menu:
- VSCode
- Obsidian

Open up a command prompt (start menu, command). Confirm command-line tools are installed by typing:
```bash
node -v 

git --v
```

If you have issues, check the troubleshooting section.

### 🍎 Mac Installation

1. Open up Terminal
2. **Install Homebrew** (Package Manager)
   ```bash
   /bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"
   ```

2. **Configure PATH** (if needed)
   ```bash
   # Add npm global binaries to PATH
   export PATH="$(npm bin -g):$PATH"
   
   # Make permanent
   echo 'export PATH="$(npm prefix -g)/bin:$PATH"' >> ~/.zshrc && source ~/.zshrc
   ```

3. **Install Node.js**
   ```bash
   brew install node
   ```

4. **Install VSCode and Obsidian**
   ```bash
   brew install --cask visual-studio-code
   brew install --cask obsidian
   ```

---

## Part 2: Create Project Structure

### Step 1: Set Up Obsidian Vault

1. Launch Obsidian
2. Click **"Create new vault"**
3. Name your vault: `Knowledge Base` (or preferred name)
4. Choose location: `Documents/Obsidian/` (or any location is fine)
5. Click **"Create"**

### Step 2: Set Up VSCode Project Structure

1. **Create main directory:**
   - Windows: `C:\Users\%USERNAME%\Code`
   - Mac: `~/**Code`**

2. **Create project folder:**
   - Inside `Code`, create: `Claude-01`

3. **Open in VSCode:**
   - File → Open Folder
   - Select `Code/Claude-01`
   - Click **Select Folder**

---

## Part 3: Install Claude Code CLI

### 🍎 Mac Installation

```bash
curl -fsSL https://claude.ai/install.sh | bash
```

### 🪟 Windows Installation

**Option 1: Command Prompt**
```cmd
curl -fsSL https://claude.ai/install.cmd -o install.cmd && install.cmd && del install.cmd
```

**Option 2: PowerShell**
```powershell
# Stable version (recommended)
irm https://claude.ai/install.ps1 | iex
```

### ✅ Verify Installation

```bash
claude --version
```

**Expected output:** `claude-code version 1.0.58` (or newer)

> **Troubleshooting:**
> - Windows: Restart computer or log out/in to refresh PATH
> - Mac: Run `source ~/.zshrc` or open new terminal

---

## Part 4: Configure VSCode and Claude

### Step 1: Authenticate Claude

1. Open VSCode with your `Claude-01` project
2. Open Terminal: View → Terminal (or `` Ctrl+` ``)
3. Run authentication:
   ```bash
   claude
   ```
4. Browser opens → Log in → Authorize → Return to VSCode

### Step 2: Enable IDE Integration
If the orange Claude splay icon appears in your upper right in VSCode, skip to Step 3

**If the Claude splat icon doesn't appear**:

1. In Claude chat, type:
   ```
   /ide
   ```
2. Select **VSCode**
3. Verify sparkle (✨) icon appears in toolbar

### Step 3: Create Claude Configuration

1. **Show hidden files:**
   - Windows: File Explorer → View → Check "Hidden items"
   - Mac: Finder → Press `Cmd+Shift+.`

2. **Create directory structure:**
   ```
   Code
	└── Claude-01/
		   └── .claude/
		       └── agents/
   ```

3. Copy `claude-code-expert.md` to `.claude/agents/`

### Step 4: Configure Claude Code Expert

1. Reload VSCode: `Ctrl+Shift+P` → "Developer: Reload Window"
2. Configure agent:
   ```
   /agents
   ```
   - Select `claude-code-expert`
   - Choose **Edit**
   - Select model: **Opus**
   - Save and close
   - You can hit ESC to back out and can close terminal

3. Initialize project:
   ```
   /init
   ```


---

**From this point onward, you can complete the installation guide on your own if you want.  You can instruct Claude to read the Haute setup document and help you through the rest of the setup starting at Part 5 to completion through Part 8**

---

## Part 5: Install MCP Servers

### Step 1: Check Status

```
/mcp status
```

**Expected:** "No MCP servers configured"

### Step 2: Install Servers

Ask Claude:
> "Using the mcp add command, please install all MCP servers listed in the mcp-settings.md file"

**Essential servers:**
- `obsidian` - Obsidian vault integration
- `brave-search` - Web search
- `tavily` - Advanced research
- `exa` - Documentation search

### Step 3: Verify Installation

1. Reload VSCode: `Ctrl+Shift+P` → "Developer: Reload Window"
2. Check status:
   ```
   /mcp status
   ```

### 🔧 Troubleshooting

If servers show "Failed":
- Just ask claude to fix the MCPs that are failed
	- Check `~/.claude.json` configuration
	- Verify API keys in `env` section
	- Manual addition: `claude mcp add [server-name]`

---

## Part 6: Install SpecKit
SpecKit (Specification Kit) is a toolkit to help with your project definition through implementation.  It includes steps to specify, plan, define tasks, and implement your project, all with the assistance of AI. You will be primarily responsible for the specifying your business/project requirements and Claude can take you through the rest of the process.

### Option 1: Agent Installation

Ask Claude:
> "Using your agents, please do a native install of SpecKit CLI"

### Option 2: Manual Installation

```bash
npm install -g @letuscode/spec-kit
speckit
```

### Continue with Setup

- In Claude, run the command `/init`
- Do a Reload Window

### ✅ Verify Installation

Type `/` and confirm these commands are available:
- `/speckit.constitution` - Set project principles
- `/speckit.specify` - Create specifications
- `/speckit.plan` - Generate implementation plans
- `/speckit.tasks` - Break down into tasks
- `/speckit.implement` - Execute implementation

If the commands do not appear, you can ask Claude to convert  speckit skills into commands.

---

## Part 7: Configure Obsidian

### Install Community Plugins

1. Open Settings: Gear icon (⚙️) or `Ctrl+,`
2. Navigate to: Community plugins
3. Click "Browse" and install the plugins below.  Also enable each plugin after install

**Essential Plugins:**
- **Local REST API** - Required for Claude integration
- **Dataview** - Query vault data
- **Templater** - Advanced templating
- **Git** - Version control
- **Excalidraw** - Visual diagramming (deprecated?)
- **Mermaid Tools** - Diagram generation
- **Smart Connections** - AI-powered linking
- **MCP Tools** - Additional MCP integration

### Configure Critical Settings

**Local REST API:**
1. Settings → Local REST API
2. Enable: **"Enable Unencrypted HTTP"**
3. Note API key (if needed)
4. Verify port: 27123

**MCP Tools:**
1. Settings → MCP Tools
2. Click "Test Connection"
3. Verify all indicators show green ✓
4. Click "Install MCP Server"

---

## Part 8: Set Up Obsidian Digital Twin
For our first "project" with speckit, we will be using the tool to implement the connectivity between claude code and obsidian to set up your digital twin.

### Step 1: Create Project Constitution

```
/speckit.constitution
```

Provide principles like (whatever is important to you)
- "Maintain single source of truth"
- "Document all decisions"
- "Prioritize clarity over brevity"

### Step 2: Specify Integration

```
/speckit.specify
```

When prompted enter:
> "Create a round-trip connection between Claude Code and Obsidian using jacksteamdev's MCP tools for bidirectional knowledge management with PARA methodology"

Note: PARA methodology is a digital twin organizational standard - Projects, Areas, Resources, Archive
### Step 3: Generate Plan

```
/speckit.plan
```

### Step 4: Create Tasks

```
/speckit.tasks
```

### Step 5: Implement

```
/speckit.implement
```

### Step 6: Configure Memory Architecture

Ask Claude:
> "Read the enterprise-memory-architecture.tex file and implement the 4-tier memory system"

### 📊 Memory Tier Architecture

- **Level 0 (Constitutional)**: Defines what agents are allowed to do, including specific rules for Outlook (e.g., never send automatically, always save drafts, include AI disclaimers).   
- **Level 1 (Context)**: Local session context that is lost when the session ends; agents do not retain memory across sessions unless designed to do so. 
-  **Level 2 (Explicit Knowledge)**: Includes documents, PDFs, and files that are close to the system, such as department or company-wide resources stored in Obsidian
- **Level 4 (Controlled Knowledge)**: Gated, company-wide knowledge like SharePoint lists and business glossaries, which require approval for changes and are not writable by default. 

---

## Part 9: Optional Enhancements

### Advanced Agents

- **LaTeX Expert** - Scientific documentation
- **TikZ Flowchart** - Technical diagrams

### Task Management

- **Beads**: https://github.com/steveyegge/beads
- **Perles**: https://github.com/zjrosen/perles

### Development Tools

- **Codebak**: https://github.com/jmcdonald/codebak
- **Magnitude**: Performance testing


---

## ✅ Verification Checklist

### Claude Code

- [ ] `claude --version` shows version
- [ ] `/ide` shows VSCode integration
- [ ] `/model` shows Opus selected
- [ ] `/agents` shows claude-code-expert

### MCP Servers

- [ ] `/mcp status` shows all connected
- [ ] Obsidian server connected
- [ ] Web search operational

### Obsidian

- [ ] Local REST API enabled
- [ ] All plugins activated
- [ ] MCP Tools green connections
- [ ] PARA folders created

### SpecKit

- [ ] `/speckit.constitution` available
- [ ] Can create specifications
- [ ] Workflow commands accessible

---

## 🔧 Troubleshooting Guide

### "Claude command not found"

- Confirm installation in `$username\.local\bin`
- Confirm environmental variable System path. If not, manually add to PATH

### MCP servers won't connect

Ask Claude to fix. Can tell Claude to use `mcp add [server-name]`

### Obsidian integration failing

- First check `/mcp status` in Claude Code. If Obsidian is in Failed state, see "MCP Servers won't connect"
- - Verify "Unencrypted HTTP" enabled in Local REST API in Obsidian
- Ensure Local REST API running in MCP Tools in Obsidian
- Confirm Obsidian plugin is installed, enabled, shows 3 green checkmarks and MCP server is installed

### SpecKit commands missing

- If you know the speckit package installed on your machine, but isn't showing up in a / command, then just ask claude code to "convert the speckit skills into commands"  (Note: there can be a bit of delay before the commands show up when claude code is reloading)
- Other things to try:
	  Try running `/init` again
	- Reload VSCode window
	- Check `.claude/commands/` exists
- 

---

## 🚀 Next Steps

### Immediate Actions

1. Create first specification: `/speckit.specify`
2. Test Obsidian: `/capture`
3. Explore capabilities with `/help`

### Building Your Knowledge Base

1. Use `/capture` to save learnings
2. Use `/promote` for permanent resources
3. Organize with PARA structure
4. Build knowledge systematically

---

## 💬 Support

- **Issues**: https://github.com/anthropics/claude-code/issues
- **Community**: Anthropic Discord
- **Help**: Type `/help` in Claude Code

---

> 🎉 **Congratulations!** You now have a fully configured knowledge-augmented AI development environment.