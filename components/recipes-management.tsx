"use client"

import { useState } from "react"
import { useProduction } from "@/contexts/production-context"
import { useStock } from "@/contexts/stock-context"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { Switch } from "@/components/ui/switch"
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion"
import { 
  PlusIcon, 
  PencilIcon, 
  TrashIcon, 
  SearchIcon, 
  ChefHatIcon,
  ClockIcon,
  CookingPotIcon,
  CoinsIcon,
  PercentIcon,
  PackageIcon,
  ScaleIcon,
  XIcon,
  BookOpenIcon,
  Layers3Icon,
  SparklesIcon,
  TrendingUpIcon,
  TargetIcon,
  ZapIcon,
  CheckIcon,
  AlertCircleIcon,
  InfoIcon,
  WalletIcon,
  CalculatorIcon,
  BadgePercentIcon,
} from "lucide-react"
import type { Recipe, RecipeIngredient, RecipeCategory } from "@/contexts/production-context"

export function RecipesManagement() {
  const { 
    recipes, 
    recipeCategories, 
    addRecipe, 
    updateRecipe, 
    deleteRecipe,
    addRecipeCategory,
    updateRecipeCategory,
    deleteRecipeCategory,
    getRecipeCost,
    getRecipeMargin,
    getSuggestedPrice,
    getRecipeTotalIngredientCost
  } = useProduction()
  
  const { products, subCategories, stockCategories } = useStock()
  
  const [searchTerm, setSearchTerm] = useState("")
  const [selectedCategory, setSelectedCategory] = useState<string>("all")
  const [isRecipeDialogOpen, setIsRecipeDialogOpen] = useState(false)
  const [isCategoryDialogOpen, setIsCategoryDialogOpen] = useState(false)
  const [editingRecipe, setEditingRecipe] = useState<Recipe | null>(null)
  const [editingCategory, setEditingCategory] = useState<RecipeCategory | null>(null)
  
  const [recipeForm, setRecipeForm] = useState({
    name: "",
    description: "",
    categoryId: "",
    ingredients: [] as RecipeIngredient[],
    yield: 1,
    yieldUnit: "pieces",
    preparationTime: 30,
    cookingTime: 20,
    shelfLife: 24,
    sellingPrice: 0,
    instructions: "",
    isActive: true,
  })
  
  const [categoryForm, setCategoryForm] = useState({
    name: "",
    icon: "🎂",
    color: "bg-amber-100 text-amber-800",
    isActive: true,
  })
  
  const [ingredientForm, setIngredientForm] = useState({
    productId: "",
    quantity: 1,
    unit: "kg",
  })
  
  // Filter recipes
  const filteredRecipes = (recipes || []).filter(recipe => {
    const matchesSearch = recipe.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         recipe.description?.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesCategory = selectedCategory === "all" || recipe.categoryId === selectedCategory
    return matchesSearch && matchesCategory
  })
  
  // Stats
  const totalRecipes = recipes?.length || 0
  const activeRecipes = recipes?.filter(r => r.isActive).length || 0
  const avgMargin = recipes?.length 
    ? recipes.reduce((sum, r) => sum + getRecipeMargin(r.id), 0) / recipes.length 
    : 0
  
  // CRUD functions
  const resetRecipeForm = () => {
    setRecipeForm({
      name: "",
      description: "",
      categoryId: recipeCategories[0]?.id || "",
      ingredients: [],
      yield: 1,
      yieldUnit: "pieces",
      preparationTime: 30,
      cookingTime: 20,
      shelfLife: 24,
      sellingPrice: 0,
      instructions: "",
      isActive: true,
    })
    setEditingRecipe(null)
  }
  
  const openRecipeDialog = (recipe?: Recipe) => {
    if (recipe) {
      setEditingRecipe(recipe)
      setRecipeForm({
        name: recipe.name,
        description: recipe.description || "",
        categoryId: recipe.categoryId,
        ingredients: recipe.ingredients,
        yield: recipe.yield,
        yieldUnit: recipe.yieldUnit,
        preparationTime: recipe.preparationTime,
        cookingTime: recipe.cookingTime,
        shelfLife: recipe.shelfLife,
        sellingPrice: recipe.sellingPrice,
        instructions: recipe.instructions || "",
        isActive: recipe.isActive,
      })
    } else {
      resetRecipeForm()
    }
    setIsRecipeDialogOpen(true)
  }
  
  const handleRecipeSubmit = () => {
    if (!recipeForm.name.trim()) return
    if (!recipeForm.categoryId) return
    
    if (editingRecipe) {
      updateRecipe(editingRecipe.id, recipeForm)
    } else {
      addRecipe(recipeForm)
    }
    
    setIsRecipeDialogOpen(false)
    resetRecipeForm()
  }
  
  const handleDeleteRecipe = (id: string) => {
    if (confirm("Supprimer cette fiche technique?")) {
      deleteRecipe(id)
    }
  }
  
  // Ingredients management
  const addIngredient = () => {
    if (!ingredientForm.productId) return
    
    const existing = recipeForm.ingredients.find(i => i.productId === ingredientForm.productId)
    if (existing) {
      setRecipeForm(prev => ({
        ...prev,
        ingredients: prev.ingredients.map(i => 
          i.productId === ingredientForm.productId 
            ? { ...i, quantity: i.quantity + ingredientForm.quantity }
            : i
        )
      }))
    } else {
      setRecipeForm(prev => ({
        ...prev,
        ingredients: [...prev.ingredients, { ...ingredientForm }]
      }))
    }
    
    setIngredientForm({ productId: "", quantity: 1, unit: "kg" })
  }
  
  const removeIngredient = (productId: string) => {
    setRecipeForm(prev => ({
      ...prev,
      ingredients: prev.ingredients.filter(i => i.productId !== productId)
    }))
  }
  
  // Calculate costs
  const calculateIngredientCost = () => {
    let total = 0
    for (const ing of recipeForm.ingredients) {
      const product = products?.find(p => p.id === ing.productId)
      if (product) {
        total += product.unitPrice * ing.quantity
      }
    }
    return total
  }
  
  const costPerUnit = recipeForm.yield > 0 ? calculateIngredientCost() / recipeForm.yield : 0
  const margin = recipeForm.sellingPrice > 0 
    ? ((recipeForm.sellingPrice - costPerUnit) / recipeForm.sellingPrice) * 100 
    : 0
  
  // Category CRUD
  const openCategoryDialog = (cat?: RecipeCategory) => {
    if (cat) {
      setEditingCategory(cat)
      setCategoryForm({
        name: cat.name,
        icon: cat.icon,
        color: cat.color,
        isActive: cat.isActive,
      })
    } else {
      setEditingCategory(null)
      setCategoryForm({ name: "", icon: "🎂", color: "bg-amber-100 text-amber-800", isActive: true })
    }
    setIsCategoryDialogOpen(true)
  }
  
  const handleCategorySubmit = () => {
    if (!categoryForm.name.trim()) return
    
    if (editingCategory) {
      updateRecipeCategory(editingCategory.id, categoryForm)
    } else {
      addRecipeCategory(categoryForm)
    }
    
    setIsCategoryDialogOpen(false)
  }
  
  const getProductName = (productId: string) => {
    const product = products?.find(p => p.id === productId)
    return product?.name || "Inconnu"
  }
  
  const getProductUnit = (productId: string) => {
    const product = products?.find(p => p.id === productId)
    return product?.unit || "kg"
  }
  
  const getCategoryName = (categoryId: string) => {
    const cat = recipeCategories?.find(c => c.id === categoryId)
    return cat ? `${cat.icon} ${cat.name}` : "Non categorise"
  }
  
  const colorOptions = [
    { label: "Ambre", value: "bg-amber-100 text-amber-800" },
    { label: "Rose", value: "bg-pink-100 text-pink-800" },
    { label: "Vert", value: "bg-green-100 text-green-800" },
    { label: "Bleu", value: "bg-blue-100 text-blue-800" },
    { label: "Violet", value: "bg-purple-100 text-purple-800" },
    { label: "Rouge", value: "bg-red-100 text-red-800" },
    { label: "Jaune", value: "bg-yellow-100 text-yellow-800" },
    { label: "Pierre", value: "bg-stone-100 text-stone-800" },
  ]
  
  const iconOptions = ["🎂", "🥐", "🥖", "☕", "🥪", "🍰", "🧁", "🍪", "🍩", "🥧", "🍮", "🧇"]
  
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-semibold text-foreground flex items-center gap-2">
            <BookOpenIcon className="h-8 w-8 text-amber-600" />
            Fiches Techniques
          </h1>
          <p className="text-muted-foreground">Gerez vos recettes et calculez les couts de revient</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => openCategoryDialog()}>
            <Layers3Icon className="h-4 w-4 mr-2" />
            Categories
          </Button>
          <Button onClick={() => openRecipeDialog()} className="bg-amber-600 hover:bg-amber-700">
            <PlusIcon className="h-4 w-4 mr-2" />
            Nouvelle Recette
          </Button>
        </div>
      </div>
      
      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-amber-100">
                <BookOpenIcon className="h-5 w-5 text-amber-600" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Total Recettes</p>
                <p className="text-2xl font-bold">{totalRecipes}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-green-100">
                <ChefHatIcon className="h-5 w-5 text-green-600" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Recettes Actives</p>
                <p className="text-2xl font-bold">{activeRecipes}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-blue-100">
                <Layers3Icon className="h-5 w-5 text-blue-600" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Categories</p>
                <p className="text-2xl font-bold">{recipeCategories?.length || 0}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-emerald-100">
                <PercentIcon className="h-5 w-5 text-emerald-600" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Marge Moyenne</p>
                <p className="text-2xl font-bold">{avgMargin.toFixed(0)}%</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
      
      {/* Filters */}
      <div className="flex flex-col gap-3 sm:flex-row">
        <div className="relative flex-1">
          <SearchIcon className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Rechercher une recette..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-9"
          />
        </div>
        <Select value={selectedCategory} onValueChange={setSelectedCategory}>
          <SelectTrigger className="w-full sm:w-48">
            <SelectValue placeholder="Categorie" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Toutes les categories</SelectItem>
            {(recipeCategories || []).map(cat => (
              <SelectItem key={cat.id} value={cat.id}>{cat.icon} {cat.name}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      
      {/* Recipe Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {filteredRecipes.map(recipe => {
          const cost = getRecipeCost(recipe.id)
          const recipeMargin = getRecipeMargin(recipe.id)
          const cat = recipeCategories?.find(c => c.id === recipe.categoryId)
          
          return (
            <Card key={recipe.id} className={`overflow-hidden ${!recipe.isActive ? 'opacity-60' : ''}`}>
              <div className={`h-2 ${cat?.color?.split(' ')[0] || 'bg-amber-500'}`} />
              <CardHeader className="pb-2">
                <div className="flex items-start justify-between">
                  <div>
                    <CardTitle className="text-lg">{recipe.name}</CardTitle>
                    <p className="text-sm text-muted-foreground">{recipe.description}</p>
                  </div>
                  <Badge className={cat?.color || ""}>{cat?.icon} {cat?.name}</Badge>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Timing */}
                <div className="flex items-center gap-4 text-sm">
                  <div className="flex items-center gap-1 text-muted-foreground">
                    <ClockIcon className="h-4 w-4" />
                    <span>Prep: {recipe.preparationTime} min</span>
                  </div>
                  <div className="flex items-center gap-1 text-muted-foreground">
                    <CookingPotIcon className="h-4 w-4" />
                    <span>Cuisson: {recipe.cookingTime} min</span>
                  </div>
                </div>
                
                {/* Yield and shelf life */}
                <div className="flex items-center gap-4 text-sm">
                  <div className="flex items-center gap-1">
                    <ScaleIcon className="h-4 w-4 text-blue-600" />
                    <span>{recipe.yield} {recipe.yieldUnit}</span>
                  </div>
                  <div className="flex items-center gap-1 text-orange-600">
                    <ClockIcon className="h-4 w-4" />
                    <span>DLC: {recipe.shelfLife}h</span>
                  </div>
                </div>
                
                {/* Pricing */}
                <div className="grid grid-cols-4 gap-2 rounded-lg bg-muted/50 p-3">
                  <div className="text-center">
                    <p className="text-xs text-muted-foreground">Cout</p>
                    <p className="font-semibold text-red-600">{cost.toFixed(2)} TND</p>
                  </div>
                  <div className="text-center">
                    <p className="text-xs text-muted-foreground">Prix</p>
                    <p className="font-semibold text-blue-600">{recipe.sellingPrice.toFixed(2)} TND</p>
                  </div>
                  <div className="text-center">
                    <p className="text-xs text-muted-foreground">Benefice</p>
                    <p className="font-semibold text-emerald-600">{(recipe.sellingPrice - cost).toFixed(2)} TND</p>
                  </div>
                  <div className="text-center">
                    <p className="text-xs text-muted-foreground">Marge</p>
                    <p className={`font-semibold ${recipeMargin >= 50 ? 'text-emerald-600' : recipeMargin >= 30 ? 'text-amber-600' : 'text-red-600'}`}>
                      {recipeMargin.toFixed(0)}%
                    </p>
                  </div>
                </div>
                
                {/* Ingredients count */}
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">
                    <PackageIcon className="h-4 w-4 inline mr-1" />
                    {recipe.ingredients.length} ingredients
                  </span>
                  {!recipe.isActive && <Badge variant="secondary">Inactif</Badge>}
                </div>
                
                {/* Actions */}
                <div className="flex gap-2">
                  <Button variant="outline" size="sm" className="flex-1" onClick={() => openRecipeDialog(recipe)}>
                    <PencilIcon className="h-4 w-4 mr-1" />
                    Modifier
                  </Button>
                  <Button variant="outline" size="sm" onClick={() => handleDeleteRecipe(recipe.id)}>
                    <TrashIcon className="h-4 w-4 text-red-600" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          )
        })}
      </div>
      
      {filteredRecipes.length === 0 && (
        <div className="text-center py-12">
          <BookOpenIcon className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
          <p className="text-muted-foreground">Aucune recette trouvee</p>
          <Button variant="link" onClick={() => openRecipeDialog()}>Creer une recette</Button>
        </div>
      )}
      
      {/* Recipe Fullscreen Modal */}
      {isRecipeDialogOpen && (
        <div className="fixed inset-0 z-50 bg-background">
          <div className="h-full flex flex-col p-6">
            {/* Header */}
            <div className="flex items-center justify-between pb-4 border-b">
              <div className="flex items-center gap-3">
                <div className="h-12 w-12 rounded-xl bg-amber-100 flex items-center justify-center">
                  <ChefHatIcon className="h-6 w-6 text-amber-600" />
                </div>
                <div>
                  <h2 className="text-2xl font-semibold">{editingRecipe ? "Modifier la Recette" : "Nouvelle Recette"}</h2>
                  <p className="text-sm text-muted-foreground">Fiche technique complete avec calcul automatique des couts</p>
                </div>
              </div>
              <Button variant="outline" size="icon" onClick={() => setIsRecipeDialogOpen(false)}>
                <XIcon className="h-5 w-5" />
              </Button>
            </div>
            
            {/* Main Content - 3 columns */}
            <div className="flex-1 grid grid-cols-3 gap-8 py-6">
              {/* Column 1: Basic Info */}
              <div className="space-y-5">
                <h3 className="text-sm font-semibold text-amber-700 uppercase tracking-wide flex items-center gap-2">
                  <span className="h-6 w-6 rounded-full bg-amber-100 flex items-center justify-center text-xs font-bold">1</span>
                  Informations de base
                </h3>
                
                <div className="space-y-2">
                  <Label>Nom de la recette *</Label>
                  <Input
                    value={recipeForm.name}
                    onChange={(e) => setRecipeForm({ ...recipeForm, name: e.target.value })}
                    placeholder="Ex: Croissant au beurre"
                    className="h-11"
                  />
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Categorie *</Label>
                    <Select 
                      value={recipeForm.categoryId || undefined} 
                      onValueChange={(v) => setRecipeForm({ ...recipeForm, categoryId: v })}
                    >
                      <SelectTrigger className="h-11">
                        <SelectValue placeholder="Selectionner" />
                      </SelectTrigger>
                      <SelectContent>
                        {(recipeCategories || []).map(cat => (
                          <SelectItem key={cat.id} value={cat.id}>{cat.icon} {cat.name}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>Prix de vente (TND) *</Label>
                    <Input
                      type="number"
                      min="0"
                      step="0.1"
                      value={recipeForm.sellingPrice}
                      onChange={(e) => setRecipeForm({ ...recipeForm, sellingPrice: parseFloat(e.target.value) || 0 })}
                      className="h-11"
                    />
                  </div>
                </div>
                
                <div className="space-y-2">
                  <Label>Description</Label>
                  <Textarea
                    value={recipeForm.description}
                    onChange={(e) => setRecipeForm({ ...recipeForm, description: e.target.value })}
                    placeholder="Description de la recette..."
                    rows={3}
                    className="resize-none"
                  />
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Rendement *</Label>
                    <Input
                      type="number"
                      min="1"
                      value={recipeForm.yield}
                      onChange={(e) => setRecipeForm({ ...recipeForm, yield: parseInt(e.target.value) || 1 })}
                      className="h-11"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Unite</Label>
                    <Select value={recipeForm.yieldUnit} onValueChange={(v) => setRecipeForm({ ...recipeForm, yieldUnit: v })}>
                      <SelectTrigger className="h-11">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="pieces">Pieces</SelectItem>
                        <SelectItem value="kg">Kilogrammes</SelectItem>
                        <SelectItem value="portions">Portions</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                
                <div className="grid grid-cols-3 gap-3">
                  <div className="space-y-2">
                    <Label>Prep (min)</Label>
                    <Input
                      type="number"
                      min="0"
                      value={recipeForm.preparationTime}
                      onChange={(e) => setRecipeForm({ ...recipeForm, preparationTime: parseInt(e.target.value) || 0 })}
                      className="h-11"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Cuisson (min)</Label>
                    <Input
                      type="number"
                      min="0"
                      value={recipeForm.cookingTime}
                      onChange={(e) => setRecipeForm({ ...recipeForm, cookingTime: parseInt(e.target.value) || 0 })}
                      className="h-11"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>DLC (heures)</Label>
                    <Input
                      type="number"
                      min="0"
                      value={recipeForm.shelfLife}
                      onChange={(e) => setRecipeForm({ ...recipeForm, shelfLife: parseInt(e.target.value) || 0 })}
                      className="h-11"
                    />
                  </div>
                </div>
                
                <div className="flex items-center gap-3 p-4 rounded-xl bg-muted/50 border">
                  <Switch
                    checked={recipeForm.isActive}
                    onCheckedChange={(v) => setRecipeForm({ ...recipeForm, isActive: v })}
                  />
                  <div>
                    <Label className="text-sm font-medium">{recipeForm.isActive ? "Recette active" : "Recette inactive"}</Label>
                    <p className="text-xs text-muted-foreground">Visible dans la production</p>
                  </div>
                </div>
              </div>
              
              {/* Column 2: Ingredients */}
              <div className="border-x px-8 flex flex-col">
                <h3 className="text-sm font-semibold text-amber-700 uppercase tracking-wide flex items-center gap-2 mb-5">
                  <span className="h-6 w-6 rounded-full bg-amber-100 flex items-center justify-center text-xs font-bold">2</span>
                  Ingredients
                  <Badge variant="secondary" className="ml-auto">{recipeForm.ingredients.length}</Badge>
                </h3>
                
                {/* Add Ingredient */}
                <div className="space-y-3 mb-4">
                  <Select 
                    value={ingredientForm.productId || undefined} 
                    onValueChange={(v) => {
                      const product = products?.find(p => p.id === v)
                      setIngredientForm({ ...ingredientForm, productId: v, unit: product?.unit || "kg" })
                    }}
                  >
                    <SelectTrigger className="h-11">
                      <SelectValue placeholder="Selectionner un produit du stock" />
                    </SelectTrigger>
                    <SelectContent>
                      {(products || []).filter(p => p.isActive).map(product => {
                        const sub = subCategories?.find(s => s.id === product.subCategoryId)
                        const cat = stockCategories?.find(c => c.id === sub?.categoryId)
                        return (
                          <SelectItem key={product.id} value={product.id}>
                            {cat?.icon} {product.name} ({product.unit})
                          </SelectItem>
                        )
                      })}
                    </SelectContent>
                  </Select>
                  <div className="flex gap-3">
                    <Input
                      type="number"
                      min="0.01"
                      step="0.01"
                      placeholder="Quantite"
                      className="flex-1 h-11"
                      value={ingredientForm.quantity || ""}
                      onChange={(e) => setIngredientForm({ ...ingredientForm, quantity: parseFloat(e.target.value) || 0 })}
                    />
                    <span className="flex items-center text-sm text-muted-foreground min-w-[50px]">
                      {ingredientForm.productId ? getProductUnit(ingredientForm.productId) : ""}
                    </span>
                    <Button 
                      type="button"
                      onClick={addIngredient}
                      disabled={!ingredientForm.productId || ingredientForm.quantity <= 0}
                      className="bg-amber-600 hover:bg-amber-700 h-11 px-6"
                    >
                      <PlusIcon className="h-4 w-4 mr-2" />
                      Ajouter
                    </Button>
                  </div>
                </div>
                
                {/* Ingredients List */}
                <div className="flex-1 overflow-y-auto space-y-2">
                  {recipeForm.ingredients.length === 0 ? (
                    <div className="text-center py-12 text-muted-foreground">
                      <PackageIcon className="h-12 w-12 mx-auto mb-3 opacity-40" />
                      <p className="font-medium">Aucun ingredient</p>
                      <p className="text-sm">Ajoutez des produits du stock</p>
                    </div>
                  ) : (
                    <>
                      {recipeForm.ingredients.map((ing, idx) => {
                        const product = products?.find(p => p.id === ing.productId)
                        const ingCost = (product?.unitPrice || 0) * ing.quantity
                        const percentOfTotal = calculateIngredientCost() > 0 
                          ? (ingCost / calculateIngredientCost()) * 100 
                          : 0
                        return (
                          <div key={idx} className="flex items-center gap-3 p-3 rounded-xl bg-muted/50 border group hover:border-amber-300 transition-colors">
                            <div className="flex-1 min-w-0">
                              <div className="font-medium truncate">{getProductName(ing.productId)}</div>
                              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                <span>{ing.quantity} {getProductUnit(ing.productId)}</span>
                                <span className="text-stone-300">x</span>
                                <span>{product?.unitPrice?.toFixed(2) || "0.00"} TND/{product?.unit}</span>
                              </div>
                            </div>
                            <div className="text-right">
                              <span className="text-lg font-semibold text-amber-600">{ingCost.toFixed(2)} TND</span>
                              <div className="text-xs text-muted-foreground">{percentOfTotal.toFixed(0)}% du cout</div>
                            </div>
                            <Button 
                              type="button" 
                              variant="ghost" 
                              size="icon" 
                              className="h-8 w-8 opacity-0 group-hover:opacity-100 text-red-500 hover:text-red-600 hover:bg-red-50"
                              onClick={() => removeIngredient(ing.productId)}
                            >
                              <XIcon className="h-4 w-4" />
                            </Button>
                          </div>
                        )
                      })}
                      
                      {/* Total line */}
                      <div className="flex items-center justify-between p-3 rounded-xl bg-amber-100 border-2 border-amber-300 mt-2">
                        <span className="font-semibold text-amber-800">Total ingredients ({recipeForm.ingredients.length})</span>
                        <span className="text-xl font-bold text-amber-700">{calculateIngredientCost().toFixed(2)} TND</span>
                      </div>
                    </>
                  )}
                </div>
              </div>
              
              {/* Column 3: Costs & Instructions */}
              <div className="flex flex-col overflow-y-auto">
                <h3 className="text-sm font-semibold text-amber-700 uppercase tracking-wide flex items-center gap-2 mb-5">
                  <span className="h-6 w-6 rounded-full bg-amber-100 flex items-center justify-center text-xs font-bold">3</span>
                  Analyse des couts
                </h3>
                
                {/* Cost Card */}
                <div className="rounded-2xl border-2 border-amber-200 bg-gradient-to-br from-amber-50 to-orange-50 p-5 space-y-4 mb-5">
                  <div className="space-y-3">
                    <div className="flex justify-between items-center">
                      <span className="text-muted-foreground">Cout total ingredients</span>
                      <span className="font-semibold text-lg">{calculateIngredientCost().toFixed(2)} TND</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-muted-foreground">Rendement</span>
                      <span className="font-medium">{recipeForm.yield} {recipeForm.yieldUnit}</span>
                    </div>
                    <div className="h-px bg-amber-200" />
                    <div className="flex justify-between items-center">
                      <span className="font-medium">Cout par unite</span>
                      <span className="text-xl font-bold text-red-600">{costPerUnit.toFixed(2)} TND</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="font-medium">Prix de vente</span>
                      <span className="text-xl font-bold text-green-600">{recipeForm.sellingPrice.toFixed(2)} TND</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="font-medium flex items-center gap-1">
                        <WalletIcon className="h-4 w-4" />
                        Benefice par unite
                      </span>
                      <span className={`text-lg font-bold ${(recipeForm.sellingPrice - costPerUnit) > 0 ? 'text-emerald-600' : 'text-red-600'}`}>
                        {(recipeForm.sellingPrice - costPerUnit).toFixed(2)} TND
                      </span>
                    </div>
                  </div>
                  
                  <div className={`rounded-xl p-4 text-center ${
                    margin >= 50 ? 'bg-emerald-100 border-2 border-emerald-200' : margin >= 30 ? 'bg-amber-100 border-2 border-amber-300' : 'bg-red-100 border-2 border-red-200'
                  }`}>
                    <div className="text-xs uppercase tracking-wide opacity-70 mb-1">Marge beneficiaire</div>
                    <div className={`text-4xl font-bold ${
                      margin >= 50 ? 'text-emerald-700' : margin >= 30 ? 'text-amber-700' : 'text-red-700'
                    }`}>
                      {margin.toFixed(1)}%
                    </div>
                    <div className="text-sm mt-1 opacity-70">
                      {margin >= 50 ? 'Excellente marge' : margin >= 30 ? 'Marge acceptable' : 'Marge faible'}
                    </div>
                  </div>
                </div>

                {/* Smart Price Suggestions */}
                {costPerUnit > 0 && (
                  <div className="rounded-2xl border-2 border-blue-200 bg-gradient-to-br from-blue-50 to-indigo-50 p-5 space-y-4 mb-5">
                    <div className="flex items-center gap-2 text-blue-700">
                      <SparklesIcon className="h-5 w-5" />
                      <span className="font-semibold">Prix suggeres intelligents</span>
                    </div>
                    
                    <div className="grid grid-cols-3 gap-2">
                      {[
                        { margin: 30, label: "Minimum", color: "border-amber-300 bg-amber-50 hover:bg-amber-100", textColor: "text-amber-700" },
                        { margin: 50, label: "Recommande", color: "border-emerald-300 bg-emerald-50 hover:bg-emerald-100 ring-2 ring-emerald-300", textColor: "text-emerald-700" },
                        { margin: 70, label: "Premium", color: "border-purple-300 bg-purple-50 hover:bg-purple-100", textColor: "text-purple-700" },
                      ].map(({ margin: targetMargin, label, color, textColor }) => {
                        // Calculate suggested price: price = cost / (1 - margin)
                        const suggestedPrice = costPerUnit / (1 - targetMargin / 100)
                        const roundedPrice = Math.ceil(suggestedPrice * 2) / 2
                        
                        return (
                          <button
                            key={targetMargin}
                            type="button"
                            onClick={() => setRecipeForm({ ...recipeForm, sellingPrice: roundedPrice })}
                            className={`p-3 rounded-xl border-2 transition-all ${color} ${recipeForm.sellingPrice === roundedPrice ? 'ring-2 ring-offset-1' : ''}`}
                          >
                            <div className="text-xs font-medium opacity-70">{label}</div>
                            <div className={`text-lg font-bold ${textColor}`}>{roundedPrice.toFixed(2)} TND</div>
                            <div className="flex items-center justify-center gap-1 text-xs opacity-70">
                              <BadgePercentIcon className="h-3 w-3" />
                              {targetMargin}% marge
                            </div>
                          </button>
                        )
                      })}
                    </div>
                    
                    <p className="text-xs text-blue-600 flex items-center gap-1">
                      <InfoIcon className="h-3 w-3" />
                      Cliquez sur un prix pour l&apos;appliquer automatiquement
                    </p>
                  </div>
                )}

                {costPerUnit === 0 && recipeForm.ingredients.length === 0 && (
                  <div className="rounded-xl border-2 border-dashed border-stone-200 p-4 text-center mb-5">
                    <AlertCircleIcon className="h-8 w-8 mx-auto text-stone-400 mb-2" />
                    <p className="text-sm text-muted-foreground">
                      Ajoutez des ingredients pour calculer<br/>les prix suggeres automatiquement
                    </p>
                  </div>
                )}
                
                {/* Instructions */}
                <div className="flex-1 flex flex-col space-y-2">
                  <Label>Instructions de preparation (optionnel)</Label>
                  <Textarea
                    value={recipeForm.instructions}
                    onChange={(e) => setRecipeForm({ ...recipeForm, instructions: e.target.value })}
                    placeholder="1. Peser les ingredients&#10;2. Melanger la farine et le sel&#10;3. Ajouter le beurre..."
                    className="flex-1 resize-none min-h-[100px]"
                  />
                </div>
              </div>
            </div>
            
            {/* Footer */}
            <div className="flex justify-end gap-4 pt-4 border-t">
              <Button variant="outline" size="lg" onClick={() => setIsRecipeDialogOpen(false)}>
                Annuler
              </Button>
              <Button size="lg" onClick={handleRecipeSubmit} className="bg-amber-600 hover:bg-amber-700 min-w-48">
                {editingRecipe ? "Enregistrer les modifications" : "Creer la Recette"}
              </Button>
            </div>
          </div>
        </div>
      )}
      
      {/* Category Dialog */}
      <Dialog open={isCategoryDialogOpen} onOpenChange={setIsCategoryDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {editingCategory ? "Modifier la Categorie" : "Nouvelle Categorie"}
            </DialogTitle>
          </DialogHeader>
          
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Nom *</Label>
              <Input
                value={categoryForm.name}
                onChange={(e) => setCategoryForm({ ...categoryForm, name: e.target.value })}
                placeholder="Ex: Patisseries"
              />
            </div>
            
            <div className="space-y-2">
              <Label>Icone</Label>
              <div className="flex flex-wrap gap-2">
                {iconOptions.map(icon => (
                  <Button
                    key={icon}
                    type="button"
                    variant={categoryForm.icon === icon ? "default" : "outline"}
                    size="sm"
                    onClick={() => setCategoryForm({ ...categoryForm, icon })}
                  >
                    {icon}
                  </Button>
                ))}
              </div>
            </div>
            
            <div className="space-y-2">
              <Label>Couleur</Label>
              <div className="flex flex-wrap gap-2">
                {colorOptions.map(opt => (
                  <Button
                    key={opt.value}
                    type="button"
                    variant="outline"
                    size="sm"
                    className={`${categoryForm.color === opt.value ? 'ring-2 ring-amber-600' : ''} ${opt.value}`}
                    onClick={() => setCategoryForm({ ...categoryForm, color: opt.value })}
                  >
                    {opt.label}
                  </Button>
                ))}
              </div>
            </div>
            
            <div className="flex items-center gap-3">
              <Switch
                checked={categoryForm.isActive}
                onCheckedChange={(v) => setCategoryForm({ ...categoryForm, isActive: v })}
              />
              <Label>Categorie active</Label>
            </div>
            
            {/* Existing categories list */}
            <div className="rounded-lg border p-3 space-y-2">
              <h4 className="text-sm font-medium">Categories existantes</h4>
              <div className="flex flex-wrap gap-2">
                {(recipeCategories || []).map(cat => (
                  <Badge 
                    key={cat.id} 
                    className={`${cat.color} cursor-pointer`}
                    onClick={() => openCategoryDialog(cat)}
                  >
                    {cat.icon} {cat.name}
                  </Badge>
                ))}
              </div>
            </div>
          </div>
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsCategoryDialogOpen(false)}>Annuler</Button>
            <Button onClick={handleCategorySubmit} className="bg-amber-600 hover:bg-amber-700">
              {editingCategory ? "Enregistrer" : "Creer"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
