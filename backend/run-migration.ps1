#!/usr/bin/env pwsh
# Script para ejecutar la migración pendiente
# Debido a limitaciones de && en PowerShell 5.1, usamos un script separado

Write-Host "Ejecutando migración: 20260926103000_add_user_business_access"
Write-Host ""

# Usar npx prisma migrate deploy con el filtro
& npx prisma migrate deploy --filter=20260926103000_add_user_business_access

Write-Host ""
Write-Host "Migración completada."