# Create a new feature specification from templates
# Usage: .\new-spec.ps1 -FeatureNum "002" -FeatureName "user-authentication"

param(
    [Parameter(Mandatory=$true)]
    [string]$FeatureNum,

    [Parameter(Mandatory=$true)]
    [string]$FeatureName
)

$SpecDir = ".specify/specs/${FeatureNum}-${FeatureName}"
$TemplateDir = ".specify/templates"
$Date = Get-Date -Format "yyyy-MM-dd"
$Author = git config user.name 2>$null
if (-not $Author) { $Author = "Author" }

# Create spec directory
New-Item -ItemType Directory -Path $SpecDir -Force | Out-Null

# Copy and customize templates
foreach ($template in @("spec", "plan", "tasks")) {
    $templatePath = "$TemplateDir/${template}-template.md"
    if (Test-Path $templatePath) {
        $content = Get-Content $templatePath -Raw
        $content = $content -replace '\{\{FEATURE_NAME\}\}', $FeatureName
        $content = $content -replace '\{\{AUTHOR\}\}', $Author
        $content = $content -replace '\{\{DATE\}\}', $Date
        $content | Set-Content "$SpecDir/${template}.md" -NoNewline
        Write-Host "Created: $SpecDir/${template}.md"
    }
}

Write-Host ""
Write-Host "Specification created at: $SpecDir/"
Write-Host "Next steps:"
Write-Host "  1. Edit $SpecDir/spec.md to define the feature"
Write-Host "  2. Edit $SpecDir/plan.md to design the implementation"
Write-Host "  3. Edit $SpecDir/tasks.md to break down the work"
