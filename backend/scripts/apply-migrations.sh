#!/usr/bin/env bash
set -euo pipefail

: "${DATABASE_URL:?Set DATABASE_URL before applying migrations}"
export DOTNET_CLI_HOME="${DOTNET_CLI_HOME:-$HOME}"

dotnet ef database update \
  --project backend/MadaAcademy.Api/MadaAcademy.Api.csproj \
  --startup-project backend/MadaAcademy.Api/MadaAcademy.Api.csproj
