$ErrorActionPreference = "Stop"

$root = Split-Path -Parent $PSScriptRoot
$secrets = Join-Path $root "secrets"
New-Item -ItemType Directory -Force $secrets | Out-Null

$private = Join-Path $secrets "jwt_private.pem"
$public = Join-Path $secrets "jwt_public.pem"

if (Get-Command openssl -ErrorAction SilentlyContinue) {
  openssl genpkey -algorithm RSA -pkeyopt rsa_keygen_bits:2048 -out $private
  openssl rsa -pubout -in $private -out $public
}
elseif (Get-Command docker -ErrorAction SilentlyContinue) {
  docker run --rm -v "${secrets}:/keys" alpine/openssl genpkey -algorithm RSA -pkeyopt rsa_keygen_bits:2048 -out /keys/jwt_private.pem
  docker run --rm -v "${secrets}:/keys" alpine/openssl rsa -pubout -in /keys/jwt_private.pem -out /keys/jwt_public.pem
}
else {
  throw "Install OpenSSL or Docker to generate development JWT keys."
}

Write-Host "Generated development JWT keys in $secrets"
