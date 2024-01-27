# Directories to remove from PATH
$directoriesToRemove = @("C:\Path\To\Directory1", "C:\Path\To\Directory2")

# Get current PATH variable
$currentPath = [System.Environment]::GetEnvironmentVariable("PATH", [System.EnvironmentVariableTarget]::Machine)

# Split PATH variable into individual directories
$pathDirectories = $currentPath -split ';'

# Remove specified directories from the list
foreach ($directory in $directoriesToRemove) {
    $pathDirectories = $pathDirectories | Where-Object { $_ -ne $directory }
}

# Join the remaining directories back into a single string
$newPath = $pathDirectories -join ';'

# Set the modified PATH variable
[System.Environment]::SetEnvironmentVariable("PATH", $newPath, [System.EnvironmentVariableTarget]::Machine)

Write-Output "Directories removed from PATH variable."
