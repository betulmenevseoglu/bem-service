import { RolTuru } from '@/types'

export function isYonetici(rol: RolTuru | undefined): boolean {
  return rol === 'yonetici'
}

export function isSahaMuhendisi(rol: RolTuru | undefined): boolean {
  return rol === 'saha_muhendisi'
}

export function canManageUsers(rol: RolTuru | undefined): boolean {
  return isYonetici(rol)
}

export function canCreateIsEmri(rol: RolTuru | undefined): boolean {
  return isYonetici(rol)
}

export function canViewAllIsEmirleri(rol: RolTuru | undefined): boolean {
  return isYonetici(rol)
}

export function canViewReports(rol: RolTuru | undefined): boolean {
  return isYonetici(rol)
}

export function canApproveIzin(rol: RolTuru | undefined): boolean {
  return isYonetici(rol)
}

export function canManageIzinBakiye(rol: RolTuru | undefined): boolean {
  return isYonetici(rol)
}
