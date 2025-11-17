'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import Image from 'next/image'
import Link from 'next/link'
import toast from 'react-hot-toast'

interface Product {
  id: string
  name: string
  name_ar: string | null
  price: number
  compare_at_price: number | null
  category_id: string | null
  inventory_quantity: number
  images: any
  is_active: boolean
  created_at: string
  categories?: {
    name: string
    name_ar: string
  } | null
}

interface Category {
  id: string
  name: string
  name_ar: string
}

export default function ProductsPage() {
  const [products, setProducts] = useState<Product[]>([])
  const [categories, setCategories] = useState<Category[]>([])
  const [filteredProducts, setFilteredProducts] = useState<Product[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedCategory, setSelectedCategory] = useState<string>('all')
  const [selectedStatus, setSelectedStatus] = useState<string>('all')
  const [selectedStock, setSelectedStock] = useState<string>('all')
  const [merchantId, setMerchantId] = useState<string | null>(null)
  const router = useRouter()
  const supabase = createClient()

  useEffect(() => {
    checkAuthAndLoadData()
  }, [])

  useEffect(() => {
    filterProducts()
  }, [searchQuery, selectedCategory, selectedStatus, selectedStock, products])

  const checkAuthAndLoadData = async () => {
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      router.push('/login')
      return
    }

    // Get merchant record
    const { data: merchant } = await supabase
      .from('merchants')
      .select('id')
      .eq('user_id', user.id)
      .single()

    if (!merchant) {
      router.push('/dashboard/setup')
      return
    }

    setMerchantId(merchant.id)
    await loadData(merchant.id)
  }

  const loadData = async (merchantId: string) => {
    setLoading(true)

    // Load products
    const { data: productsData, error: productsError } = await supabase
      .from('products')
      .select(`
        *,
        categories(name, name_ar)
      `)
      .eq('merchant_id', merchantId)
      .order('created_at', { ascending: false })

    if (productsError) {
      toast.error('Failed to load products')
      console.error(productsError)
    } else {
      setProducts(productsData || [])
    }

    // Load categories
    const { data: categoriesData } = await supabase
      .from('categories')
      .select('*')
      .order('name')

    setCategories(categoriesData || [])
    setLoading(false)
  }

  const filterProducts = () => {
    let filtered = [...products]

    // Search filter
    if (searchQuery) {
      filtered = filtered.filter(product =>
        product.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (product.name_ar && product.name_ar.includes(searchQuery))
      )
    }

    // Category filter
    if (selectedCategory !== 'all') {
      filtered = filtered.filter(product => product.category_id === selectedCategory)
    }

    // Status filter
    if (selectedStatus !== 'all') {
      filtered = filtered.filter(product =>
        selectedStatus === 'active' ? product.is_active : !product.is_active
      )
    }

    // Stock filter
    if (selectedStock !== 'all') {
      filtered = filtered.filter(product =>
        selectedStock === 'in_stock'
          ? product.inventory_quantity > 0
          : product.inventory_quantity === 0
      )
    }

    setFilteredProducts(filtered)
  }

  const handleToggleStatus = async (productId: string, currentStatus: boolean) => {
    const { error } = await supabase
      .from('products')
      .update({ is_active: !currentStatus })
      .eq('id', productId)

    if (error) {
      toast.error('Failed to update product status')
      console.error(error)
    } else {
      toast.success('Product status updated')
      // Update local state
      setProducts(products.map(p =>
        p.id === productId ? { ...p, is_active: !currentStatus } : p
      ))
    }
  }

  const handleDelete = async (productId: string, productName: string) => {
    if (!confirm(`Are you sure you want to delete "${productName}"?`)) {
      return
    }

    const { error } = await supabase
      .from('products')
      .delete()
      .eq('id', productId)

    if (error) {
      toast.error('Failed to delete product')
      console.error(error)
    } else {
      toast.success('Product deleted successfully')
      setProducts(products.filter(p => p.id !== productId))
    }
  }

  const getProductImage = (product: Product) => {
    if (product.images && Array.isArray(product.images) && product.images.length > 0) {
      return product.images[0]
    }
    return null
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading products...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-8 flex-wrap gap-4">
          <div>
            <h1 className="text-4xl font-bold text-gray-800 mb-2">Products</h1>
            <p className="text-gray-600">Manage your product catalog</p>
          </div>
          <Link
            href="/dashboard/products/new"
            className="bg-gradient-to-r from-purple-600 to-indigo-600 text-white px-6 py-3 rounded-lg font-semibold hover:shadow-xl transition flex items-center gap-2"
          >
            <span className="text-xl">➕</span>
            Add New Product
          </Link>
        </div>

        {/* Search and Filters */}
        <div className="bg-white rounded-xl shadow-lg p-6 mb-8">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Search */}
            <div className="lg:col-span-2">
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Search Products
              </label>
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search by name..."
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              />
            </div>

            {/* Category Filter */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Category
              </label>
              <select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent bg-white"
              >
                <option value="all">All Categories</option>
                {categories.map(category => (
                  <option key={category.id} value={category.id}>
                    {category.name_ar}
                  </option>
                ))}
              </select>
            </div>

            {/* Status Filter */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Status
              </label>
              <select
                value={selectedStatus}
                onChange={(e) => setSelectedStatus(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent bg-white"
              >
                <option value="all">All Status</option>
                <option value="active">Active</option>
                <option value="inactive">Inactive</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mt-4">
            {/* Stock Filter */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Stock
              </label>
              <select
                value={selectedStock}
                onChange={(e) => setSelectedStock(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent bg-white"
              >
                <option value="all">All Stock</option>
                <option value="in_stock">In Stock</option>
                <option value="out_of_stock">Out of Stock</option>
              </select>
            </div>

            {/* Results Count */}
            <div className="lg:col-span-3 flex items-end">
              <div className="text-sm text-gray-600">
                Showing {filteredProducts.length} of {products.length} products
              </div>
            </div>
          </div>
        </div>

        {/* Products Grid */}
        {filteredProducts.length === 0 ? (
          <div className="bg-white rounded-xl shadow-lg p-12 text-center">
            <div className="text-6xl mb-4">📦</div>
            <h2 className="text-2xl font-bold text-gray-800 mb-2">
              {products.length === 0 ? 'No Products Yet' : 'No Products Found'}
            </h2>
            <p className="text-gray-600 mb-6">
              {products.length === 0
                ? 'Start adding products to your catalog'
                : 'Try adjusting your filters or search query'}
            </p>
            {products.length === 0 && (
              <Link
                href="/dashboard/products/new"
                className="inline-block bg-gradient-to-r from-purple-600 to-indigo-600 text-white px-8 py-3 rounded-lg font-semibold hover:shadow-xl transition"
              >
                Add Your First Product
              </Link>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredProducts.map((product) => {
              const productImage = getProductImage(product)

              return (
                <div
                  key={product.id}
                  className="bg-white rounded-xl shadow-lg overflow-hidden hover:shadow-xl transition"
                >
                  {/* Product Image */}
                  <div className="relative h-48 bg-gray-100">
                    {productImage ? (
                      <Image
                        src={productImage}
                        alt={product.name}
                        fill
                        className="object-cover"
                      />
                    ) : (
                      <div className="h-full flex items-center justify-center text-gray-400">
                        <div className="text-center">
                          <div className="text-5xl mb-2">📦</div>
                          <div className="text-sm">No Image</div>
                        </div>
                      </div>
                    )}
                    {/* Stock Badge */}
                    {product.inventory_quantity === 0 && (
                      <div className="absolute top-2 right-2 bg-red-500 text-white px-3 py-1 rounded-full text-xs font-bold">
                        Out of Stock
                      </div>
                    )}
                  </div>

                  {/* Product Info */}
                  <div className="p-6">
                    <div className="mb-4">
                      <h3 className="text-lg font-bold text-gray-800 mb-1">
                        {product.name}
                      </h3>
                      {product.name_ar && (
                        <div className="text-sm text-gray-500">{product.name_ar}</div>
                      )}
                      {product.categories && (
                        <div className="text-xs text-purple-600 mt-1">
                          {product.categories.name_ar}
                        </div>
                      )}
                    </div>

                    {/* Price */}
                    <div className="mb-4">
                      <div className="flex items-center gap-2">
                        <span className="text-2xl font-bold text-gray-800">
                          {product.price.toFixed(2)} EGP
                        </span>
                        {product.compare_at_price && product.compare_at_price > product.price && (
                          <span className="text-sm text-gray-400 line-through">
                            {product.compare_at_price.toFixed(2)} EGP
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Stock */}
                    <div className="mb-4 flex items-center justify-between text-sm">
                      <span className="text-gray-600">Stock:</span>
                      <span className={`font-semibold ${
                        product.inventory_quantity === 0
                          ? 'text-red-600'
                          : product.inventory_quantity < 10
                          ? 'text-orange-600'
                          : 'text-green-600'
                      }`}>
                        {product.inventory_quantity} units
                      </span>
                    </div>

                    {/* Status Toggle */}
                    <div className="mb-4 flex items-center justify-between">
                      <span className="text-sm text-gray-600">Status:</span>
                      <button
                        onClick={() => handleToggleStatus(product.id, product.is_active)}
                        className={`px-4 py-1 rounded-full text-xs font-bold transition ${
                          product.is_active
                            ? 'bg-green-100 text-green-700 hover:bg-green-200'
                            : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                        }`}
                      >
                        {product.is_active ? '✓ Active' : '⨯ Inactive'}
                      </button>
                    </div>

                    {/* Actions */}
                    <div className="flex gap-2">
                      <Link
                        href={`/dashboard/products/edit/${product.id}`}
                        className="flex-1 bg-purple-600 text-white px-4 py-2 rounded-lg text-center font-semibold hover:bg-purple-700 transition text-sm"
                      >
                        Edit
                      </Link>
                      <button
                        onClick={() => handleDelete(product.id, product.name)}
                        className="flex-1 bg-red-600 text-white px-4 py-2 rounded-lg font-semibold hover:bg-red-700 transition text-sm"
                      >
                        Delete
                      </button>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
