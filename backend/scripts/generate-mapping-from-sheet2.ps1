$ErrorActionPreference = 'Stop'

$xmlPath = Join-Path $PSScriptRoot '../../.tmp_xlsx_extract/xl/worksheets/sheet2.xml'
$outPath = Join-Path $PSScriptRoot '../src/risk-assessment/data/template-parent-child-mapping.json'

[xml]$doc = Get-Content -Raw $xmlPath
$nsmgr = New-Object System.Xml.XmlNamespaceManager($doc.NameTable)
$nsmgr.AddNamespace('x', 'http://schemas.openxmlformats.org/spreadsheetml/2006/main')
$rows = $doc.SelectNodes('//x:sheetData/x:row', $nsmgr)

function Get-CellText {
  param(
    [Parameter(Mandatory = $true)] $Row,
    [Parameter(Mandatory = $true)] [string] $Col,
    [Parameter(Mandatory = $true)] $NsMgr
  )

  $cell = $Row.SelectSingleNode("x:c[starts-with(@r,'$Col')]", $NsMgr)
  if (-not $cell) {
    return ''
  }

  if ($cell.t -eq 'inlineStr') {
    $nodes = $cell.SelectNodes('x:is/x:t', $NsMgr)
    if ($nodes -and $nodes.Count -gt 0) {
      return (($nodes | ForEach-Object { $_.InnerText }) -join '')
    }
  }

  $v = $cell.SelectSingleNode('x:v', $NsMgr)
  if ($v) {
    return [string]$v.InnerText
  }

  return ''
}

$items = @()
foreach ($row in $rows) {
  $r = [int]$row.r
  if ($r -lt 4 -or $r -gt 73) {
    continue
  }

  $templateName = (Get-CellText -Row $row -Col 'D' -NsMgr $nsmgr).Trim()
  if (-not $templateName) {
    continue
  }

  $parentCategory = (Get-CellText -Row $row -Col 'E' -NsMgr $nsmgr).Trim()
  $low = ((Get-CellText -Row $row -Col 'N' -NsMgr $nsmgr).Trim().ToLower() -eq 'yes')
  $medium = ((Get-CellText -Row $row -Col 'O' -NsMgr $nsmgr).Trim().ToLower() -eq 'yes')
  $high = ((Get-CellText -Row $row -Col 'P' -NsMgr $nsmgr).Trim().ToLower() -eq 'yes')
  $notes = (Get-CellText -Row $row -Col 'Q' -NsMgr $nsmgr).Trim()

  $artifactId = ($templateName.ToUpper() -replace '[^A-Z0-9]+', '_').Trim('_')
  $applicable = @()
  if ($low) { $applicable += 'BASIC' }
  if ($medium) { $applicable += 'MODERATE' }
  if ($high) { $applicable += 'HIGH' }

  $items += [PSCustomObject]@{
    rowNumber = $r
    parentCategory = $parentCategory
    artifactId = $artifactId
    name = $templateName
    description = if ($notes) { $notes } else { "Mapped from matrix row $r" }
    lowRiskMandatory = $low
    mediumRiskMandatory = $medium
    highRiskMandatory = $high
    applicableRiskTiers = $applicable
  }
}

$data = [ordered]@{
  version = (Get-Date -Format 'yyyy-MM-dd')
  source = 'DPDPA_Template_Cross_Reference_Matrix_Mapped.xlsx'
  totalTemplates = $items.Count
  items = $items
}

$json = $data | ConvertTo-Json -Depth 8
Set-Content -Path $outPath -Value $json -Encoding UTF8

$parentCount = ($items.parentCategory | Sort-Object -Unique).Count
Write-Host "WROTE=$outPath COUNT=$($items.Count) PARENTS=$parentCount"
