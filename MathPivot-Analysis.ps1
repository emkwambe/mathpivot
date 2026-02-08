# ============================================================================
# MathPivot TutorOS - Project Analysis PowerShell Script
# ============================================================================
# Purpose: Comprehensive project exploration and documentation for Claude Code
# Author: Claude (CTO/PM)
# Date: 2026-01-24
# ============================================================================

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "MathPivot TutorOS - Project Analysis" -ForegroundColor Cyan
Write-Host "========================================`n" -ForegroundColor Cyan

# Set project root (adjust if needed)
$ProjectRoot = "C:\Users\YOUR_USERNAME\Documents\mathpivot"

# Navigate to project
if (Test-Path $ProjectRoot) {
    Set-Location $ProjectRoot
    Write-Host "✓ Project found at: $ProjectRoot`n" -ForegroundColor Green
} else {
    Write-Host "✗ Project not found at: $ProjectRoot" -ForegroundColor Red
    Write-Host "Please update the `$ProjectRoot variable in this script`n" -ForegroundColor Yellow
    exit
}

# ============================================================================
# SECTION 1: Project Structure Analysis
# ============================================================================

Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Cyan
Write-Host "1. PROJECT STRUCTURE" -ForegroundColor Cyan
Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`n" -ForegroundColor Cyan

# Display tree structure
Write-Host "📁 Directory Tree (2 levels):`n" -ForegroundColor Yellow
tree /F /A | Select-Object -First 50

Write-Host "`n"

# Count files by type
Write-Host "📊 File Type Distribution:`n" -ForegroundColor Yellow
Get-ChildItem -Recurse -File | Group-Object Extension | 
    Sort-Object Count -Descending | 
    Select-Object @{Name='Extension';Expression={if($_.Name){"$($_.Name)"} else {"No Extension"}}}, Count |
    Format-Table -AutoSize

# ============================================================================
# SECTION 2: Dependencies Analysis
# ============================================================================

Write-Host "`n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Cyan
Write-Host "2. DEPENDENCIES & PACKAGES" -ForegroundColor Cyan
Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`n" -ForegroundColor Cyan

if (Test-Path "package.json") {
    Write-Host "📦 Installed NPM Packages:`n" -ForegroundColor Yellow
    
    # Parse package.json
    $packageJson = Get-Content "package.json" | ConvertFrom-Json
    
    Write-Host "Dependencies:" -ForegroundColor Green
    $packageJson.dependencies.PSObject.Properties | ForEach-Object {
        Write-Host "  • $($_.Name): $($_.Value)" -ForegroundColor White
    }
    
    Write-Host "`nDevDependencies:" -ForegroundColor Green
    $packageJson.devDependencies.PSObject.Properties | ForEach-Object {
        Write-Host "  • $($_.Name): $($_.Value)" -ForegroundColor White
    }
    
    # Check for missing react-markdown
    if (-not $packageJson.dependencies.'react-markdown') {
        Write-Host "`n⚠️  react-markdown NOT FOUND - needs installation!" -ForegroundColor Red
    }
} else {
    Write-Host "✗ package.json not found" -ForegroundColor Red
}

# ============================================================================
# SECTION 3: Code Analysis
# ============================================================================

Write-Host "`n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Cyan
Write-Host "3. CODE METRICS" -ForegroundColor Cyan
Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`n" -ForegroundColor Cyan

# Count TypeScript/JavaScript files
$tsFiles = Get-ChildItem -Recurse -Include *.ts,*.tsx -File
$jsFiles = Get-ChildItem -Recurse -Include *.js,*.jsx -File

Write-Host "📝 TypeScript Files: $($tsFiles.Count)" -ForegroundColor Yellow
Write-Host "📝 JavaScript Files: $($jsFiles.Count)" -ForegroundColor Yellow

# Total lines of code
$totalLines = 0
$tsFiles + $jsFiles | ForEach-Object {
    $totalLines += (Get-Content $_.FullName).Count
}
Write-Host "📏 Total Lines of Code: $totalLines`n" -ForegroundColor Yellow

# Key directories
Write-Host "🗂️  Key Directories:`n" -ForegroundColor Yellow
@("src/app", "src/components", "src/lib", "supabase", "public") | ForEach-Object {
    if (Test-Path $_) {
        $fileCount = (Get-ChildItem -Path $_ -Recurse -File).Count
        Write-Host "  • $_: $fileCount files" -ForegroundColor White
    }
}

# ============================================================================
# SECTION 4: Database Schema Discovery
# ============================================================================

Write-Host "`n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Cyan
Write-Host "4. DATABASE SCHEMA" -ForegroundColor Cyan
Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`n" -ForegroundColor Cyan

# Look for schema files
$schemaFiles = Get-ChildItem -Recurse -Include *schema*, *migration*, *.sql -File

if ($schemaFiles.Count -gt 0) {
    Write-Host "📊 Schema Files Found:`n" -ForegroundColor Yellow
    $schemaFiles | ForEach-Object {
        Write-Host "  • $($_.Name) - $($_.DirectoryName)" -ForegroundColor White
    }
} else {
    Write-Host "⚠️  No schema files found in standard locations" -ForegroundColor Yellow
}

# Search for type definitions that might indicate tables
Write-Host "`n🔍 Searching for database type definitions...`n" -ForegroundColor Yellow
Get-ChildItem -Recurse -Include *.ts,*.tsx -File | 
    Select-String -Pattern "interface.*Profile|type.*Table|Database\[" -Context 0,0 | 
    Select-Object -First 10 | 
    ForEach-Object {
        Write-Host "  Found: $($_.Line.Trim())" -ForegroundColor White
    }

# ============================================================================
# SECTION 5: Configuration Files
# ============================================================================

Write-Host "`n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Cyan
Write-Host "5. CONFIGURATION FILES" -ForegroundColor Cyan
Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`n" -ForegroundColor Cyan

$configFiles = @(
    "next.config.ts",
    "tsconfig.json",
    "tailwind.config.ts",
    ".env.local",
    ".env",
    "components.json"
)

foreach ($file in $configFiles) {
    if (Test-Path $file) {
        Write-Host "✓ $file" -ForegroundColor Green
    } else {
        Write-Host "✗ $file (missing)" -ForegroundColor Red
    }
}

# ============================================================================
# SECTION 6: API Routes & Pages
# ============================================================================

Write-Host "`n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Cyan
Write-Host "6. ROUTES & PAGES" -ForegroundColor Cyan
Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`n" -ForegroundColor Cyan

# Find all page.tsx files
$pages = Get-ChildItem -Recurse -Filter "page.tsx" -File

Write-Host "📄 App Router Pages ($($pages.Count)):`n" -ForegroundColor Yellow
$pages | ForEach-Object {
    $route = $_.DirectoryName -replace [regex]::Escape($ProjectRoot), "" -replace "\\src\\app", "" -replace "\\", "/"
    if ($route -eq "") { $route = "/" }
    Write-Host "  • $route" -ForegroundColor White
}

# Find API routes
Write-Host "`n🔌 API Routes:`n" -ForegroundColor Yellow
Get-ChildItem -Path "src/app/api" -Recurse -Filter "route.ts" -File -ErrorAction SilentlyContinue | ForEach-Object {
    $route = $_.DirectoryName -replace [regex]::Escape($ProjectRoot), "" -replace "\\src\\app\\api", "" -replace "\\", "/"
    Write-Host "  • /api$route" -ForegroundColor White
}

# ============================================================================
# SECTION 7: Environment Check
# ============================================================================

Write-Host "`n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Cyan
Write-Host "7. ENVIRONMENT & TOOLS" -ForegroundColor Cyan
Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`n" -ForegroundColor Cyan

# Check Node version
Write-Host "Node.js Version: " -NoNewline -ForegroundColor Yellow
node --version

# Check npm version
Write-Host "npm Version: " -NoNewline -ForegroundColor Yellow
npm --version

# Check if pnpm is installed
Write-Host "pnpm: " -NoNewline -ForegroundColor Yellow
if (Get-Command pnpm -ErrorAction SilentlyContinue) {
    pnpm --version
} else {
    Write-Host "Not installed (npm will be used)" -ForegroundColor Yellow
}

# Check git status
Write-Host "`n🔀 Git Status:`n" -ForegroundColor Yellow
git status --short

# ============================================================================
# SECTION 8: Build Status Check
# ============================================================================

Write-Host "`n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Cyan
Write-Host "8. BUILD STATUS (Quick Check)" -ForegroundColor Cyan
Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`n" -ForegroundColor Cyan

Write-Host "⚠️  To run full build, execute: npm run build" -ForegroundColor Yellow
Write-Host "⚠️  To start dev server, execute: npm run dev`n" -ForegroundColor Yellow

# ============================================================================
# SECTION 9: Recommendations
# ============================================================================

Write-Host "`n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Cyan
Write-Host "9. NEXT STEPS & RECOMMENDATIONS" -ForegroundColor Cyan
Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`n" -ForegroundColor Cyan

Write-Host "📋 Immediate Actions:`n" -ForegroundColor Yellow

# Check for missing dependencies
if (-not (Test-Path "node_modules")) {
    Write-Host "  1. ❌ Install dependencies: npm install" -ForegroundColor Red
} else {
    Write-Host "  1. ✓ Dependencies installed" -ForegroundColor Green
}

# Check for .claude folder
if (-not (Test-Path ".claude")) {
    Write-Host "  2. ❌ Create .claude/ folder for Claude Code context" -ForegroundColor Red
} else {
    Write-Host "  2. ✓ .claude/ folder exists" -ForegroundColor Green
}

# Check for missing react-markdown
$packageContent = Get-Content "package.json" | ConvertFrom-Json
if (-not $packageContent.dependencies.'react-markdown') {
    Write-Host "  3. ❌ Install react-markdown: npm install react-markdown" -ForegroundColor Red
} else {
    Write-Host "  3. ✓ react-markdown installed" -ForegroundColor Green
}

Write-Host "`n🚀 Ready to use Claude Code!`n" -ForegroundColor Cyan
Write-Host "Run: .\MathPivot-ClaudeCode-Setup.ps1" -ForegroundColor Green

Write-Host "`n========================================" -ForegroundColor Cyan
Write-Host "Analysis Complete!" -ForegroundColor Cyan
Write-Host "========================================`n" -ForegroundColor Cyan
