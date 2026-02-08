# ============================================================================
# MathPivot Command Center - PowerShell Script
# ============================================================================
# Purpose: Quick access to common development commands and Claude Code prompts
# Author: Claude (CTO/PM)
# Date: 2026-01-24
# ============================================================================

function Show-Banner {
    Clear-Host
    Write-Host @"

╔═══════════════════════════════════════════════════════════════╗
║                                                               ║
║        🚀 MATHPIVOT TUTOROS - COMMAND CENTER 🚀               ║
║                                                               ║
║              Your Development Control Panel                   ║
║                                                               ║
╚═══════════════════════════════════════════════════════════════╝

"@ -ForegroundColor Cyan
}

function Show-Menu {
    Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Cyan
    Write-Host "📋 MAIN MENU" -ForegroundColor Yellow
    Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`n" -ForegroundColor Cyan
    
    Write-Host "  1. 🔍 Run Project Analysis" -ForegroundColor Green
    Write-Host "  2. 🤖 Start Claude Code Session" -ForegroundColor Green
    Write-Host "  3. 📦 Install Dependencies" -ForegroundColor Green
    Write-Host "  4. 🏗️  Run Build" -ForegroundColor Green
    Write-Host "  5. 🚀 Start Dev Server" -ForegroundColor Green
    Write-Host "  6. 📊 View Project Status" -ForegroundColor Green
    Write-Host "  7. 📝 View Claude Code Prompts" -ForegroundColor Green
    Write-Host "  8. 🔧 Quick Fixes Menu" -ForegroundColor Green
    Write-Host "  9. 📚 Open Documentation" -ForegroundColor Green
    Write-Host " 10. 🎯 View Roadmap & Features" -ForegroundColor Green
    Write-Host "  0. ❌ Exit`n" -ForegroundColor Red
    
    Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Cyan
}

function Run-ProjectAnalysis {
    Write-Host "`n📊 Running Project Analysis...`n" -ForegroundColor Cyan
    if (Test-Path ".\MathPivot-Analysis.ps1") {
        & ".\MathPivot-Analysis.ps1"
    } else {
        Write-Host "⚠️  Analysis script not found. Please run MathPivot-ClaudeCode-Setup.ps1 first." -ForegroundColor Yellow
    }
    Pause
}

function Start-ClaudeCodeSession {
    Write-Host "`n🤖 Starting Claude Code Session...`n" -ForegroundColor Cyan
    
    # Check if .claude folder exists
    if (-not (Test-Path ".\.claude")) {
        Write-Host "⚠️  .claude folder not found!" -ForegroundColor Yellow
        Write-Host "   Run option 8 to set up Claude Code first.`n" -ForegroundColor Yellow
        Pause
        return
    }
    
    Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Cyan
    Write-Host "🎯 QUICK START PROMPTS" -ForegroundColor Yellow
    Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`n" -ForegroundColor Cyan
    
    Write-Host "Choose a prompt to copy:`n" -ForegroundColor Green
    Write-Host "  1. Session Start (Read context + check status)" -ForegroundColor White
    Write-Host "  2. Fix Build Error" -ForegroundColor White
    Write-Host "  3. Install Missing Dependencies" -ForegroundColor White
    Write-Host "  4. Implement New Feature" -ForegroundColor White
    Write-Host "  5. Session End (Update docs + verify build)" -ForegroundColor White
    Write-Host "  0. Back to Main Menu`n" -ForegroundColor Gray
    
    $promptChoice = Read-Host "Enter choice"
    
    switch ($promptChoice) {
        "1" {
            $prompt = @"
Read .claude/CLAUDE.md for full project context, then .claude/HANDOFF.md for last session notes.

Summarize:
1. Project state (what works, what doesn't)
2. What was done last session
3. What should be prioritized this session

Then run: npm run build

Report status with any errors found.
"@
        }
        "2" {
            $prompt = @"
Read .claude/CLAUDE.md for context.

Build error detected: [DESCRIBE ERROR HERE]

Steps:
1. Identify root cause of the error
2. Check if it's a missing dependency (check package.json)
3. If dependency is missing, install it
4. Verify fix by running: npm run build
5. Test in dev mode: npm run dev
6. Commit with: "fix: [description]"
"@
        }
        "3" {
            $prompt = @"
Read .claude/CLAUDE.md.

Install the following package(s):
- react-markdown
- remark-gfm
- remark-math
- rehype-katex

Steps:
1. Run: npm install react-markdown remark-gfm remark-math rehype-katex
2. Verify installation in package.json
3. Run: npm run build
4. Test: npm run dev
5. Commit with: "chore: add markdown rendering dependencies"
"@
        }
        "4" {
            $prompt = @"
Read .claude/CLAUDE.md and .claude/CURRENT.md.

Implement feature: [FEATURE NAME]

Requirements:
- [Requirement 1]
- [Requirement 2]

Files to modify:
- [File 1]
- [File 2]

Follow existing patterns in similar files.
Test by [METHOD].
Commit with: "feat: [description]"
Update .claude/CURRENT.md with progress.
"@
        }
        "5" {
            $prompt = @"
Session complete. Perform final checks:

1. Run: npm run build (verify passing)
2. Run: npm run lint (check for issues)
3. Review git status: git status
4. Update .claude/CURRENT.md:
   - Mark completed tasks as 🟢 Complete
   - Update progress log with today's date
5. Update .claude/HANDOFF.md:
   - Summarize what was accomplished
   - Note any blockers or issues
   - List next priority tasks
6. Commit documentation updates: "docs: end of session 2026-[DATE]"
7. Report final status
"@
        }
        "0" { return }
        default {
            Write-Host "Invalid choice" -ForegroundColor Red
            Pause
            return
        }
    }
    
    # Copy to clipboard
    Set-Clipboard -Value $prompt
    Write-Host "`n✅ Prompt copied to clipboard!" -ForegroundColor Green
    Write-Host "`n📋 Now:`n" -ForegroundColor Yellow
    Write-Host "  1. Open a new terminal window" -ForegroundColor White
    Write-Host "  2. Navigate to mathpivot directory" -ForegroundColor White
    Write-Host "  3. Run: claude" -ForegroundColor Cyan
    Write-Host "  4. Paste the prompt (Ctrl+V)" -ForegroundColor White
    Write-Host "  5. Share results back in Claude chat`n" -ForegroundColor White
    
    Pause
}

function Install-Dependencies {
    Write-Host "`n📦 Installing Dependencies...`n" -ForegroundColor Cyan
    
    Write-Host "Choose an option:`n" -ForegroundColor Yellow
    Write-Host "  1. Install all dependencies (npm install)" -ForegroundColor White
    Write-Host "  2. Install react-markdown only" -ForegroundColor White
    Write-Host "  3. Install markdown plugins (remark-gfm, etc.)" -ForegroundColor White
    Write-Host "  4. Install everything (dependencies + markdown)" -ForegroundColor White
    Write-Host "  0. Back to Main Menu`n" -ForegroundColor Gray
    
    $choice = Read-Host "Enter choice"
    
    switch ($choice) {
        "1" {
            Write-Host "`n⏳ Running: npm install...`n" -ForegroundColor Yellow
            npm install
        }
        "2" {
            Write-Host "`n⏳ Running: npm install react-markdown...`n" -ForegroundColor Yellow
            npm install react-markdown
        }
        "3" {
            Write-Host "`n⏳ Running: npm install remark-gfm remark-math rehype-katex...`n" -ForegroundColor Yellow
            npm install remark-gfm remark-math rehype-katex
        }
        "4" {
            Write-Host "`n⏳ Running: npm install (all) + markdown packages...`n" -ForegroundColor Yellow
            npm install
            npm install react-markdown remark-gfm remark-math rehype-katex
        }
        "0" { return }
        default {
            Write-Host "Invalid choice" -ForegroundColor Red
        }
    }
    
    Write-Host "`n✅ Installation complete!`n" -ForegroundColor Green
    Pause
}

function Run-Build {
    Write-Host "`n🏗️  Running Build...`n" -ForegroundColor Cyan
    Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Gray
    
    npm run build
    
    if ($LASTEXITCODE -eq 0) {
        Write-Host "`n✅ Build successful!`n" -ForegroundColor Green
    } else {
        Write-Host "`n❌ Build failed. Check errors above.`n" -ForegroundColor Red
    }
    
    Pause
}

function Start-DevServer {
    Write-Host "`n🚀 Starting Development Server...`n" -ForegroundColor Cyan
    Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Gray
    Write-Host "Server will start on: http://localhost:3000" -ForegroundColor Yellow
    Write-Host "Press Ctrl+C to stop the server`n" -ForegroundColor Yellow
    Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`n" -ForegroundColor Gray
    
    npm run dev
}

function View-ProjectStatus {
    Write-Host "`n📊 Project Status Overview`n" -ForegroundColor Cyan
    Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Cyan
    
    # Check Node version
    Write-Host "`n📌 Environment:" -ForegroundColor Yellow
    Write-Host "  Node.js: " -NoNewline; node --version
    Write-Host "  npm: " -NoNewline; npm --version
    
    # Check dependencies
    Write-Host "`n📦 Dependencies:" -ForegroundColor Yellow
    if (Test-Path "node_modules") {
        $moduleCount = (Get-ChildItem -Path "node_modules" -Directory).Count
        Write-Host "  ✓ node_modules exists ($moduleCount packages)" -ForegroundColor Green
    } else {
        Write-Host "  ✗ node_modules not found (run npm install)" -ForegroundColor Red
    }
    
    # Check .claude folder
    Write-Host "`n🤖 Claude Code:" -ForegroundColor Yellow
    if (Test-Path ".claude") {
        Write-Host "  ✓ .claude folder exists" -ForegroundColor Green
        
        $files = @("CLAUDE.md", "CURRENT.md", "BACKLOG.md", "PROMPTS.md", "HANDOFF.md")
        foreach ($file in $files) {
            if (Test-Path ".claude\$file") {
                Write-Host "  ✓ $file" -ForegroundColor Green
            } else {
                Write-Host "  ✗ $file (missing)" -ForegroundColor Red
            }
        }
    } else {
        Write-Host "  ✗ .claude folder not found" -ForegroundColor Red
    }
    
    # Check react-markdown
    Write-Host "`n🔧 Critical Dependencies:" -ForegroundColor Yellow
    if (Test-Path "package.json") {
        $packageJson = Get-Content "package.json" | ConvertFrom-Json
        
        if ($packageJson.dependencies.'react-markdown') {
            Write-Host "  ✓ react-markdown installed" -ForegroundColor Green
        } else {
            Write-Host "  ✗ react-markdown NOT installed" -ForegroundColor Red
        }
    }
    
    # Git status
    Write-Host "`n🔀 Git Status:" -ForegroundColor Yellow
    git status --short
    
    Write-Host "`n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`n" -ForegroundColor Cyan
    Pause
}

function View-ClaudePrompts {
    Write-Host "`n📝 Claude Code Prompts`n" -ForegroundColor Cyan
    
    if (-not (Test-Path ".claude\PROMPTS.md")) {
        Write-Host "⚠️  PROMPTS.md not found. Run setup first.`n" -ForegroundColor Yellow
        Pause
        return
    }
    
    Write-Host "Opening PROMPTS.md in default editor...`n" -ForegroundColor Yellow
    Start-Process ".claude\PROMPTS.md"
    
    Pause
}

function Quick-Fixes {
    Write-Host "`n🔧 Quick Fixes Menu`n" -ForegroundColor Cyan
    Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Cyan
    
    Write-Host "`nCommon issues and quick fixes:`n" -ForegroundColor Yellow
    Write-Host "  1. Fix: Module not found 'react-markdown'" -ForegroundColor White
    Write-Host "  2. Fix: Build errors" -ForegroundColor White
    Write-Host "  3. Fix: Port already in use (kill process)" -ForegroundColor White
    Write-Host "  4. Fix: Clear node_modules and reinstall" -ForegroundColor White
    Write-Host "  5. Fix: Reset Git to last commit" -ForegroundColor White
    Write-Host "  0. Back to Main Menu`n" -ForegroundColor Gray
    
    $choice = Read-Host "Enter choice"
    
    switch ($choice) {
        "1" {
            Write-Host "`n📦 Installing react-markdown...`n" -ForegroundColor Yellow
            npm install react-markdown remark-gfm remark-math rehype-katex
            Write-Host "`n✅ Done! Run build to verify.`n" -ForegroundColor Green
        }
        "2" {
            Write-Host "`n🏗️  Attempting to fix build...`n" -ForegroundColor Yellow
            Write-Host "Running: npm run build`n" -ForegroundColor Gray
            npm run build
        }
        "3" {
            Write-Host "`n🔪 Killing processes on port 3000...`n" -ForegroundColor Yellow
            Get-Process -Name "node" -ErrorAction SilentlyContinue | Stop-Process -Force
            Write-Host "`n✅ Done! Try starting dev server again.`n" -ForegroundColor Green
        }
        "4" {
            Write-Host "`n⚠️  This will delete node_modules and reinstall. Continue? (Y/N)" -ForegroundColor Yellow
            $confirm = Read-Host
            if ($confirm -eq "Y" -or $confirm -eq "y") {
                Write-Host "`n🗑️  Removing node_modules...`n" -ForegroundColor Yellow
                Remove-Item -Path "node_modules" -Recurse -Force -ErrorAction SilentlyContinue
                Write-Host "📦 Running npm install...`n" -ForegroundColor Yellow
                npm install
                Write-Host "`n✅ Done!`n" -ForegroundColor Green
            }
        }
        "5" {
            Write-Host "`n⚠️  This will reset to last commit. Continue? (Y/N)" -ForegroundColor Yellow
            $confirm = Read-Host
            if ($confirm -eq "Y" -or $confirm -eq "y") {
                Write-Host "`n🔄 Resetting...`n" -ForegroundColor Yellow
                git reset --hard HEAD
                Write-Host "`n✅ Done!`n" -ForegroundColor Green
            }
        }
        "0" { return }
        default {
            Write-Host "Invalid choice" -ForegroundColor Red
        }
    }
    
    Pause
}

function Open-Documentation {
    Write-Host "`n📚 Opening Documentation...`n" -ForegroundColor Cyan
    
    Write-Host "Choose a document:`n" -ForegroundColor Yellow
    Write-Host "  1. CLAUDE.md (Project overview)" -ForegroundColor White
    Write-Host "  2. CURRENT.md (Active tasks)" -ForegroundColor White
    Write-Host "  3. BACKLOG.md (Future work)" -ForegroundColor White
    Write-Host "  4. PROMPTS.md (Reusable prompts)" -ForegroundColor White
    Write-Host "  5. HANDOFF.md (Session notes)" -ForegroundColor White
    Write-Host "  6. DECISIONS.md (Architecture decisions)" -ForegroundColor White
    Write-Host "  7. Game-Changing Features Roadmap" -ForegroundColor White
    Write-Host "  0. Back to Main Menu`n" -ForegroundColor Gray
    
    $choice = Read-Host "Enter choice"
    
    $file = switch ($choice) {
        "1" { ".claude\CLAUDE.md" }
        "2" { ".claude\CURRENT.md" }
        "3" { ".claude\BACKLOG.md" }
        "4" { ".claude\PROMPTS.md" }
        "5" { ".claude\HANDOFF.md" }
        "6" { ".claude\DECISIONS.md" }
        "7" { "MathPivot-GameChanging-Features.md" }
        "0" { return }
        default { 
            Write-Host "Invalid choice" -ForegroundColor Red
            Pause
            return
        }
    }
    
    if (Test-Path $file) {
        Start-Process $file
    } else {
        Write-Host "`n⚠️  File not found: $file`n" -ForegroundColor Yellow
    }
    
    Pause
}

function View-Roadmap {
    Write-Host "`n🎯 Opening MathPivot Feature Roadmap...`n" -ForegroundColor Cyan
    
    if (Test-Path "MathPivot-GameChanging-Features.md") {
        Start-Process "MathPivot-GameChanging-Features.md"
    } else {
        Write-Host "⚠️  Roadmap document not found.`n" -ForegroundColor Yellow
        Write-Host "It should be in your outputs folder.`n" -ForegroundColor Yellow
    }
    
    Pause
}

# Main Loop
while ($true) {
    Show-Banner
    Show-Menu
    
    $choice = Read-Host "Enter your choice"
    
    switch ($choice) {
        "1" { Run-ProjectAnalysis }
        "2" { Start-ClaudeCodeSession }
        "3" { Install-Dependencies }
        "4" { Run-Build }
        "5" { Start-DevServer }
        "6" { View-ProjectStatus }
        "7" { View-ClaudePrompts }
        "8" { Quick-Fixes }
        "9" { Open-Documentation }
        "10" { View-Roadmap }
        "0" {
            Write-Host "`n👋 Goodbye! Happy coding!`n" -ForegroundColor Cyan
            exit
        }
        default {
            Write-Host "`n❌ Invalid choice. Please try again.`n" -ForegroundColor Red
            Start-Sleep -Seconds 2
        }
    }
}
