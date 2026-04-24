"use client"

import { useState } from "react"
import { Button } from "./ui/button"
import { Input } from "./ui/input"
import { Card } from "./ui/card"
import { Badge } from "./ui/badge"
import {
  SearchIcon,
  UserPlusIcon,
  EditIcon,
  TrashIcon,
  MailIcon,
  PhoneIcon,
  ShieldIcon,
  ShieldCheckIcon,
  UserIcon,
  UsersIcon,
  KeyIcon,
  CheckIcon,
  XIcon,
  EyeIcon,
  EyeOffIcon,
  CrownIcon,
} from "lucide-react"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter } from "./ui/dialog"
import { Label } from "./ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "./ui/select"
import { Pagination } from "./pagination"
import { useAuth, type Employee, type EmployeeRole, type PermissionKey, ALL_PERMISSIONS, DEFAULT_PERMISSIONS } from "@/contexts/auth-context"

const roleOptions: { value: EmployeeRole; label: string; color: string; icon: any }[] = [
  { value: "super_admin", label: "Super Admin", color: "bg-purple-100 text-purple-700 border-purple-300", icon: CrownIcon },
  { value: "admin", label: "Administrateur", color: "bg-red-100 text-red-700 border-red-300", icon: ShieldCheckIcon },
  { value: "manager", label: "Manager", color: "bg-blue-100 text-blue-700 border-blue-300", icon: ShieldIcon },
  { value: "employee", label: "Employe", color: "bg-green-100 text-green-700 border-green-300", icon: UserIcon },
]

export function EmployeesManagement() {
  const { employees, addEmployee, updateEmployee, deleteEmployee, user } = useAuth()
  const [searchTerm, setSearchTerm] = useState("")
  const [selectedRole, setSelectedRole] = useState<string>("all")
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false)
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false)
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)
  const [isViewDialogOpen, setIsViewDialogOpen] = useState(false)
  const [selectedEmployee, setSelectedEmployee] = useState<Employee | null>(null)
  const [currentPage, setCurrentPage] = useState(1)
  const [itemsPerPage, setItemsPerPage] = useState(12)
  const [showPassword, setShowPassword] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)

  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    password: "",
    role: "employee" as EmployeeRole,
    permissions: [] as PermissionKey[],
    isActive: true,
  })

  const isSuperAdmin = user?.employeeRole === "super_admin" || (user?.role === "admin" && !user?.employeeRole)

  const resetForm = () => {
    setFormData({
      name: "",
      email: "",
      phone: "",
      password: "",
      role: "employee",
      permissions: DEFAULT_PERMISSIONS.employee,
      isActive: true,
    })
    setShowPassword(false)
  }

  const handleRoleChange = (role: EmployeeRole) => {
    setFormData({
      ...formData,
      role,
      permissions: DEFAULT_PERMISSIONS[role],
    })
  }

  const togglePermission = (permission: PermissionKey) => {
    if (formData.permissions.includes(permission)) {
      setFormData({
        ...formData,
        permissions: formData.permissions.filter(p => p !== permission),
      })
    } else {
      setFormData({
        ...formData,
        permissions: [...formData.permissions, permission],
      })
    }
  }

  const handleAdd = async () => {
    if (!formData.name || !formData.email || !formData.password) {
      return
    }

    const existingEmployee = employees.find((e) => e.email === formData.email)
    if (existingEmployee) {
      return
    }

    setIsSubmitting(true)
    const success = await addEmployee({
      name: formData.name,
      email: formData.email,
      phone: formData.phone || undefined,
      password: formData.password,
      role: formData.role,
      permissions: formData.permissions,
      isActive: formData.isActive,
    })

    setIsSubmitting(false)
    if (!success) {
      return
    }

    setIsAddDialogOpen(false)
    resetForm()
  }

  const handleEdit = async () => {
    if (!selectedEmployee || !formData.name || !formData.email) {
      return
    }

    setIsSubmitting(true)
    const success = await updateEmployee(selectedEmployee.id, {
      name: formData.name,
      email: formData.email,
      phone: formData.phone || undefined,
      role: formData.role,
      permissions: formData.permissions,
      isActive: formData.isActive,
      ...(formData.password ? { password: formData.password } : {}),
    })

    setIsSubmitting(false)
    if (!success) {
      return
    }

    setIsEditDialogOpen(false)
    setSelectedEmployee(null)
    resetForm()
  }

  const handleDelete = async () => {
    if (!selectedEmployee) return

    setIsSubmitting(true)
    const success = await deleteEmployee(selectedEmployee.id)
    setIsSubmitting(false)
    if (!success) {
      return
    }

    setIsDeleteDialogOpen(false)
    setSelectedEmployee(null)
  }

  const openEditDialog = (employee: Employee) => {
    setSelectedEmployee(employee)
    setFormData({
      name: employee.name,
      email: employee.email,
      phone: employee.phone || "",
      password: "",
      role: employee.role,
      permissions: employee.permissions,
      isActive: employee.isActive,
    })
    setIsEditDialogOpen(true)
  }

  const openViewDialog = (employee: Employee) => {
    setSelectedEmployee(employee)
    setIsViewDialogOpen(true)
  }

  const filteredEmployees = employees.filter((employee) => {
    const matchesSearch =
      employee.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      employee.email.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesRole = selectedRole === "all" || employee.role === selectedRole
    return matchesSearch && matchesRole
  })

  const totalPages = Math.ceil(filteredEmployees.length / itemsPerPage)
  const paginatedEmployees = filteredEmployees.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage)

  const getRoleConfig = (role: EmployeeRole) => {
    return roleOptions.find(r => r.value === role) || roleOptions[3]
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("fr-TN", {
      year: "numeric",
      month: "short",
      day: "numeric",
    })
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-2xl font-bold text-foreground">Gestion des Employes</h2>
          <p className="text-muted-foreground">Gerez les comptes employes et leurs droits d&apos;acces</p>
        </div>
        {isSuperAdmin && (
          <Button onClick={() => { resetForm(); setIsAddDialogOpen(true) }} className="bg-purple-600 hover:bg-purple-700">
            <UserPlusIcon className="mr-2 h-4 w-4" />
            Ajouter un employe
          </Button>
        )}
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card className="p-4 border-l-4 border-l-purple-500">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-full bg-purple-100 flex items-center justify-center">
              <CrownIcon className="h-5 w-5 text-purple-600" />
            </div>
            <div>
              <p className="text-2xl font-bold">{employees.filter(e => e.role === "super_admin").length}</p>
              <p className="text-sm text-muted-foreground">Super Admins</p>
            </div>
          </div>
        </Card>
        <Card className="p-4 border-l-4 border-l-red-500">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-full bg-red-100 flex items-center justify-center">
              <ShieldCheckIcon className="h-5 w-5 text-red-600" />
            </div>
            <div>
              <p className="text-2xl font-bold">{employees.filter(e => e.role === "admin").length}</p>
              <p className="text-sm text-muted-foreground">Administrateurs</p>
            </div>
          </div>
        </Card>
        <Card className="p-4 border-l-4 border-l-blue-500">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-full bg-blue-100 flex items-center justify-center">
              <ShieldIcon className="h-5 w-5 text-blue-600" />
            </div>
            <div>
              <p className="text-2xl font-bold">{employees.filter(e => e.role === "manager").length}</p>
              <p className="text-sm text-muted-foreground">Managers</p>
            </div>
          </div>
        </Card>
        <Card className="p-4 border-l-4 border-l-green-500">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-full bg-green-100 flex items-center justify-center">
              <UsersIcon className="h-5 w-5 text-green-600" />
            </div>
            <div>
              <p className="text-2xl font-bold">{employees.filter(e => e.role === "employee").length}</p>
              <p className="text-sm text-muted-foreground">Employes</p>
            </div>
          </div>
        </Card>
      </div>

      {/* Filters */}
      <div className="flex flex-col gap-4 sm:flex-row">
        <div className="relative flex-1">
          <SearchIcon className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Rechercher un employe..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
        <Select value={selectedRole} onValueChange={setSelectedRole}>
          <SelectTrigger className="w-full sm:w-[200px]">
            <SelectValue placeholder="Filtrer par role" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Tous les roles</SelectItem>
            {roleOptions.map((role) => (
              <SelectItem key={role.value} value={role.value}>
                {role.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Employees Grid */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {paginatedEmployees.map((employee) => {
          const roleConfig = getRoleConfig(employee.role)
          const RoleIcon = roleConfig.icon
          const isCurrentUser = user?.id === employee.id
          
          return (
            <Card key={employee.id} className={`p-4 relative ${!employee.isActive ? 'opacity-60' : ''}`}>
              {isCurrentUser && (
                <div className="absolute top-2 right-2">
                  <Badge variant="outline" className="bg-amber-50 text-amber-700 border-amber-300 text-xs">
                    Vous
                  </Badge>
                </div>
              )}
              
              <div className="flex items-start gap-4">
                <div className={`h-12 w-12 rounded-full flex items-center justify-center ${roleConfig.color.split(' ')[0]}`}>
                  <RoleIcon className={`h-6 w-6 ${roleConfig.color.split(' ')[1]}`} />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <h3 className="font-semibold text-foreground truncate">{employee.name}</h3>
                    {!employee.isActive && (
                      <Badge variant="outline" className="bg-gray-100 text-gray-500 text-xs">
                        Inactif
                      </Badge>
                    )}
                  </div>
                  <Badge className={`mt-1 ${roleConfig.color} border`}>
                    {roleConfig.label}
                  </Badge>
                </div>
              </div>

              <div className="mt-4 space-y-2 text-sm">
                <div className="flex items-center gap-2 text-muted-foreground">
                  <MailIcon className="h-4 w-4" />
                  <span className="truncate">{employee.email}</span>
                </div>
                {employee.phone && (
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <PhoneIcon className="h-4 w-4" />
                    <span>{employee.phone}</span>
                  </div>
                )}
                <div className="flex items-center gap-2 text-muted-foreground">
                  <KeyIcon className="h-4 w-4" />
                  <span>{employee.permissions.length} permissions</span>
                </div>
              </div>

              <div className="mt-4 flex items-center justify-between border-t pt-4">
                <span className="text-xs text-muted-foreground">
                  Cree le {formatDate(employee.createdAt)}
                </span>
                <div className="flex gap-1">
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8"
                    onClick={() => openViewDialog(employee)}
                  >
                    <EyeIcon className="h-4 w-4" />
                  </Button>
                  {isSuperAdmin && !isCurrentUser && (
                    <>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8"
                        onClick={() => openEditDialog(employee)}
                      >
                        <EditIcon className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-red-500 hover:text-red-600 hover:bg-red-50"
                        onClick={() => {
                          setSelectedEmployee(employee)
                          setIsDeleteDialogOpen(true)
                        }}
                      >
                        <TrashIcon className="h-4 w-4" />
                      </Button>
                    </>
                  )}
                </div>
              </div>
            </Card>
          )
        })}
      </div>

      {filteredEmployees.length === 0 && (
        <div className="text-center py-12">
          <UsersIcon className="mx-auto h-12 w-12 text-muted-foreground/50" />
          <h3 className="mt-4 text-lg font-medium text-foreground">Aucun employe trouve</h3>
          <p className="text-muted-foreground">Ajoutez votre premier employe pour commencer</p>
        </div>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <Pagination
          currentPage={currentPage}
          totalPages={totalPages}
          onPageChange={setCurrentPage}
          itemsPerPage={itemsPerPage}
          onItemsPerPageChange={setItemsPerPage}
          totalItems={filteredEmployees.length}
        />
      )}

      {/* Add Dialog */}
      <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Ajouter un employe</DialogTitle>
            <DialogDescription>Creez un nouveau compte employe avec des droits d&apos;acces personnalises</DialogDescription>
          </DialogHeader>
          <div className="space-y-6 py-4">
            {/* Basic Info */}
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="name">Nom complet *</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="Ahmed Ben Ali"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="email">Email *</Label>
                <Input
                  id="email"
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  placeholder="ahmed@patisserie.tn"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="phone">Telephone</Label>
                <Input
                  id="phone"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  placeholder="+216 XX XXX XXX"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="password">Mot de passe *</Label>
                <div className="relative">
                  <Input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    value={formData.password}
                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                    placeholder="••••••••"
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="absolute right-0 top-0 h-full"
                    onClick={() => setShowPassword(!showPassword)}
                  >
                    {showPassword ? <EyeOffIcon className="h-4 w-4" /> : <EyeIcon className="h-4 w-4" />}
                  </Button>
                </div>
              </div>
            </div>

            {/* Role Selection */}
            <div className="space-y-3">
              <Label>Role *</Label>
              <div className="grid gap-2 sm:grid-cols-2">
                {roleOptions.map((role) => {
                  const RoleIcon = role.icon
                  return (
                    <button
                      key={role.value}
                      type="button"
                      onClick={() => handleRoleChange(role.value)}
                      className={`flex items-center gap-3 p-3 rounded-lg border-2 transition-all ${
                        formData.role === role.value
                          ? `${role.color} border-current`
                          : 'border-muted hover:border-muted-foreground/30'
                      }`}
                    >
                      <RoleIcon className="h-5 w-5" />
                      <div className="text-left">
                        <p className="font-medium">{role.label}</p>
                        <p className="text-xs text-muted-foreground">
                          {DEFAULT_PERMISSIONS[role.value].length} permissions par defaut
                        </p>
                      </div>
                    </button>
                  )
                })}
              </div>
            </div>

            {/* Permissions */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <Label>Permissions</Label>
                <span className="text-sm text-muted-foreground">
                  {formData.permissions.length}/{ALL_PERMISSIONS.length} selectionnees
                </span>
              </div>
              <div className="grid gap-2 sm:grid-cols-2 max-h-[300px] overflow-y-auto rounded-lg border p-3">
                {ALL_PERMISSIONS.map((permission) => {
                  const isSelected = formData.permissions.includes(permission.key)
                  return (
                    <button
                      key={permission.key}
                      type="button"
                      onClick={() => togglePermission(permission.key)}
                      className={`flex items-start gap-3 p-3 rounded-lg border transition-all text-left ${
                        isSelected
                          ? 'bg-purple-50 border-purple-300'
                          : 'border-muted hover:border-muted-foreground/30'
                      }`}
                    >
                      <div className={`h-5 w-5 rounded border-2 flex items-center justify-center shrink-0 mt-0.5 ${
                        isSelected ? 'bg-purple-600 border-purple-600' : 'border-muted-foreground/30'
                      }`}>
                        {isSelected && <CheckIcon className="h-3 w-3 text-white" />}
                      </div>
                      <div>
                        <p className="font-medium text-sm">{permission.label}</p>
                        <p className="text-xs text-muted-foreground">{permission.description}</p>
                      </div>
                    </button>
                  )
                })}
              </div>
            </div>

            {/* Active Status */}
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={() => setFormData({ ...formData, isActive: !formData.isActive })}
                className={`h-6 w-11 rounded-full transition-colors ${
                  formData.isActive ? 'bg-green-500' : 'bg-muted'
                }`}
              >
                <div className={`h-5 w-5 rounded-full bg-white shadow transition-transform ${
                  formData.isActive ? 'translate-x-5' : 'translate-x-0.5'
                }`} />
              </button>
              <Label>Compte actif</Label>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsAddDialogOpen(false)}>
              Annuler
            </Button>
            <Button onClick={() => void handleAdd()} className="bg-purple-600 hover:bg-purple-700" disabled={isSubmitting}>
              Ajouter l&apos;employe
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Modifier l&apos;employe</DialogTitle>
            <DialogDescription>Modifiez les informations et les droits d&apos;acces de l&apos;employe</DialogDescription>
          </DialogHeader>
          <div className="space-y-6 py-4">
            {/* Basic Info */}
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="edit-name">Nom complet *</Label>
                <Input
                  id="edit-name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-email">Email *</Label>
                <Input
                  id="edit-email"
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-phone">Telephone</Label>
                <Input
                  id="edit-phone"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-password">Nouveau mot de passe</Label>
                <div className="relative">
                  <Input
                    id="edit-password"
                    type={showPassword ? "text" : "password"}
                    value={formData.password}
                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                    placeholder="Laisser vide pour garder l'actuel"
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="absolute right-0 top-0 h-full"
                    onClick={() => setShowPassword(!showPassword)}
                  >
                    {showPassword ? <EyeOffIcon className="h-4 w-4" /> : <EyeIcon className="h-4 w-4" />}
                  </Button>
                </div>
              </div>
            </div>

            {/* Role Selection */}
            <div className="space-y-3">
              <Label>Role *</Label>
              <div className="grid gap-2 sm:grid-cols-2">
                {roleOptions.map((role) => {
                  const RoleIcon = role.icon
                  return (
                    <button
                      key={role.value}
                      type="button"
                      onClick={() => handleRoleChange(role.value)}
                      className={`flex items-center gap-3 p-3 rounded-lg border-2 transition-all ${
                        formData.role === role.value
                          ? `${role.color} border-current`
                          : 'border-muted hover:border-muted-foreground/30'
                      }`}
                    >
                      <RoleIcon className="h-5 w-5" />
                      <div className="text-left">
                        <p className="font-medium">{role.label}</p>
                        <p className="text-xs text-muted-foreground">
                          {DEFAULT_PERMISSIONS[role.value].length} permissions par defaut
                        </p>
                      </div>
                    </button>
                  )
                })}
              </div>
            </div>

            {/* Permissions */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <Label>Permissions</Label>
                <span className="text-sm text-muted-foreground">
                  {formData.permissions.length}/{ALL_PERMISSIONS.length} selectionnees
                </span>
              </div>
              <div className="grid gap-2 sm:grid-cols-2 max-h-[300px] overflow-y-auto rounded-lg border p-3">
                {ALL_PERMISSIONS.map((permission) => {
                  const isSelected = formData.permissions.includes(permission.key)
                  return (
                    <button
                      key={permission.key}
                      type="button"
                      onClick={() => togglePermission(permission.key)}
                      className={`flex items-start gap-3 p-3 rounded-lg border transition-all text-left ${
                        isSelected
                          ? 'bg-purple-50 border-purple-300'
                          : 'border-muted hover:border-muted-foreground/30'
                      }`}
                    >
                      <div className={`h-5 w-5 rounded border-2 flex items-center justify-center shrink-0 mt-0.5 ${
                        isSelected ? 'bg-purple-600 border-purple-600' : 'border-muted-foreground/30'
                      }`}>
                        {isSelected && <CheckIcon className="h-3 w-3 text-white" />}
                      </div>
                      <div>
                        <p className="font-medium text-sm">{permission.label}</p>
                        <p className="text-xs text-muted-foreground">{permission.description}</p>
                      </div>
                    </button>
                  )
                })}
              </div>
            </div>

            {/* Active Status */}
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={() => setFormData({ ...formData, isActive: !formData.isActive })}
                className={`h-6 w-11 rounded-full transition-colors ${
                  formData.isActive ? 'bg-green-500' : 'bg-muted'
                }`}
              >
                <div className={`h-5 w-5 rounded-full bg-white shadow transition-transform ${
                  formData.isActive ? 'translate-x-5' : 'translate-x-0.5'
                }`} />
              </button>
              <Label>Compte actif</Label>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsEditDialogOpen(false)}>
              Annuler
            </Button>
            <Button onClick={() => void handleEdit()} className="bg-purple-600 hover:bg-purple-700" disabled={isSubmitting}>
              Enregistrer
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* View Dialog */}
      <Dialog open={isViewDialogOpen} onOpenChange={setIsViewDialogOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Details de l&apos;employe</DialogTitle>
          </DialogHeader>
          {selectedEmployee && (
            <div className="space-y-4 py-4">
              <div className="flex items-center gap-4">
                {(() => {
                  const roleConfig = getRoleConfig(selectedEmployee.role)
                  const RoleIcon = roleConfig.icon
                  return (
                    <>
                      <div className={`h-16 w-16 rounded-full flex items-center justify-center ${roleConfig.color.split(' ')[0]}`}>
                        <RoleIcon className={`h-8 w-8 ${roleConfig.color.split(' ')[1]}`} />
                      </div>
                      <div>
                        <h3 className="text-xl font-semibold">{selectedEmployee.name}</h3>
                        <Badge className={`${roleConfig.color} border`}>{roleConfig.label}</Badge>
                      </div>
                    </>
                  )
                })()}
              </div>

              <div className="grid gap-3 text-sm">
                <div className="flex items-center gap-3 p-3 bg-muted/50 rounded-lg">
                  <MailIcon className="h-4 w-4 text-muted-foreground" />
                  <span>{selectedEmployee.email}</span>
                </div>
                {selectedEmployee.phone && (
                  <div className="flex items-center gap-3 p-3 bg-muted/50 rounded-lg">
                    <PhoneIcon className="h-4 w-4 text-muted-foreground" />
                    <span>{selectedEmployee.phone}</span>
                  </div>
                )}
              </div>

              <div>
                <h4 className="font-medium mb-2">Permissions ({selectedEmployee.permissions.length})</h4>
                <div className="flex flex-wrap gap-2">
                  {selectedEmployee.permissions.map((permKey) => {
                    const perm = ALL_PERMISSIONS.find(p => p.key === permKey)
                    return (
                      <Badge key={permKey} variant="outline" className="bg-purple-50 text-purple-700 border-purple-200">
                        {perm?.label || permKey}
                      </Badge>
                    )
                  })}
                </div>
              </div>

              <div className="text-xs text-muted-foreground border-t pt-4">
                <p>Cree le: {formatDate(selectedEmployee.createdAt)}</p>
                {selectedEmployee.lastLogin && (
                  <p>Derniere connexion: {formatDate(selectedEmployee.lastLogin)}</p>
                )}
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Delete Dialog */}
      <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Supprimer l&apos;employe</DialogTitle>
            <DialogDescription>
              Etes-vous sur de vouloir supprimer le compte de {selectedEmployee?.name}? Cette action est irreversible.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDeleteDialogOpen(false)}>
              Annuler
            </Button>
            <Button variant="destructive" onClick={() => void handleDelete()} disabled={isSubmitting}>
              Supprimer
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
