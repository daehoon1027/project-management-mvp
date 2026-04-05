$root = Split-Path -Parent $MyInvocation.MyCommand.Path
Set-Location $root
cmd /c run-app.cmd
