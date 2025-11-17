'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import toast from 'react-hot-toast'
import Image from 'next/image'

interface Category {
  id: string
  name: string
  name_ar: string
}

interface MerchantCategory {
  id: string
  name: string
  name_ar: string | null
}

interface Color {
  name: string
  hex: string
}

const AVAILABLE_SIZES = ['S', 'M', 'L', 'XL', 'XXL']

export default function NewProductPage() {
  const [merchantId, setMerchantId] = useState<string | null>(null)
  const [categories, setCategories] = useState<Category[]>([])
  const [merchantCategories, setMerchantCategories] = useState<MerchantCategory[]>([])
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)

  // Form state
  const [formData, setFormData] = useState({
    name: '',
    name_ar: '',
    description: '',
    description_ar: '',
    price: '',
    compare_at_price: '',
    category_id: '',
    merchant_category_id: '',
    sku: '',
    inventory_quantity: '',
  })

  const [selectedSizes, setSelectedSizes] = useState<string[]>([])
  const [colors, setColors] = useState<Color[]>([])
  const [colorInput, setColorInput] = useState({ name: '', hex: '#000000' })
  const [imageFiles, setImageFiles] = useState<File[]>([])
  const [imagePreviews, setImagePreviews] = useState<string[]>([])

  const router = useRouter()
  const supabase = createClient()

  useEffect(() => {
    checkAuthAndLoadData()
  }, [])

  const checkAuthAndLoadData = async () => {
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      router.push('/login')
      return
    }

    // Get merchant record
    const { data: merchant } = await supabase
      .from('merchants')
      .select('id, approval_status')
      .eq('user_id', user.id)
      .single()

    if (!merchant) {
      router.push('/dashboard/setup')
      return
    }

    if (merchant.approval_status === 'pending') {
      toast.error('Your account is pending approval')
      router.push('/dashboard')
      return
    }

    setMerchantId(merchant.id)
    await loadCategories(merchant.id)
    setLoading(false)
  }

  const loadCategories = async (merchantId: string) => {
    // Load main categories
    const { data: categoriesData } = await supabase
      .from('categories')
      .select('*')
      .order('name')

    setCategories(categoriesData || [])

    // Load merchant categories
    const { data: merchantCategoriesData } = await supabase
      .from('merchant_categories')
      .select('*')
      .eq('merchant_id', merchantId)
      .eq('is_active', true)
      .order('display_order')

    setMerchantCategories(merchantCategoriesData || [])
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    })
  }

  const handleSizeToggle = (size: string) => {
    if (selectedSizes.includes(size)) {
      setSelectedSizes(selectedSizes.filter(s => s !== size))
    } else {
      setSelectedSizes([...selectedSizes, size])
    }
  }

  const handleAddColor = () => {
    if (!colorInput.name.trim()) {
      toast.error('Please enter color name')
      return
    }

    if (colors.some(c => c.name.toLowerCase() === colorInput.name.toLowerCase())) {
      toast.error('Color already added')
      return
    }

    setColors([...colors, { ...colorInput }])
    setColorInput({ name: '', hex: '#000000' })
  }

  const handleRemoveColor = (colorName: string) => {
    setColors(colors.filter(c => c.name !== colorName))
  }

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || [])

    if (imageFiles.length + files.length > 5) {
      toast.error('Maximum 5 images allowed')
      return
    }

    // Create previews
    const newPreviews = files.map(file => URL.createObjectURL(file))

    setImageFiles([...imageFiles, ...files])
    setImagePreviews([...imagePreviews, ...newPreviews])
  }

  const handleRemoveImage = (index: number) => {
    const newFiles = imageFiles.filter((_, i) => i !== index)
    const newPreviews = imagePreviews.filter((_, i) => i !== index)

    setImageFiles(newFiles)
    setImagePreviews(newPreviews)
  }

  const validateForm = () => {
    if (!formData.name.trim()) {
      toast.error('Product name is required')
      return false
    }

    if (!formData.price || parseFloat(formData.price) <= 0) {
      toast.error('Price must be greater than 0')
      return false
    }

    if (formData.compare_at_price && parseFloat(formData.compare_at_price) < parseFloat(formData.price)) {
      toast.error('Compare at price must be greater than price')
      return false
    }

    if (!formData.inventory_quantity || parseInt(formData.inventory_quantity) < 0) {
      toast.error('Inventory quantity must be 0 or greater')
      return false
    }

    if (imageFiles.length === 0) {
      toast.error('At least one product image is required')
      return false
    }

    if (!formData.category_id) {
      toast.error('Please select a category')
      return false
    }

    return true
  }

  const uploadImages = async () => {
    const uploadedUrls: string[] = []

    for (const file of imageFiles) {
      const fileExt = file.name.split('.').pop()
      const fileName = `${merchantId}/${Date.now()}_${Math.random().toString(36).substring(7)}.${fileExt}`

      const { data, error } = await supabase.storage
        .from('products')
        .upload(fileName, file)

      if (error) {
        console.error('Upload error:', error)
        throw new Error('Failed to upload image')
      }

      const { data: { publicUrl } } = supabase.storage
        .from('products')
        .getPublicUrl(fileName)

      uploadedUrls.push(publicUrl)
    }

    return uploadedUrls
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!validateForm()) {
      return
    }

    setSubmitting(true)

    try {
      // Upload images
      const imageUrls = await uploadImages()

      // Prepare product data
      const productData = {
        merchant_id: merchantId,
        name: formData.name.trim(),
        name_ar: formData.name_ar.trim() || null,
        description: formData.description.trim() || null,
        description_ar: formData.description_ar.trim() || null,
        price: parseFloat(formData.price),
        compare_at_price: formData.compare_at_price ? parseFloat(formData.compare_at_price) : null,
        category_id: formData.category_id || null,
        merchant_category_id: formData.merchant_category_id || null,
        inventory_quantity: parseInt(formData.inventory_quantity),
        sku: formData.sku.trim() || null,
        images: imageUrls,
        sizes: selectedSizes.length > 0 ? selectedSizes : null,
        colors: colors.length > 0 ? colors : null,
        is_active: true,
      }

      const { error } = await supabase
        .from('products')
        .insert(productData)

      if (error) {
        toast.error('Failed to create product')
        console.error(error)
      } else {
        toast.success('Product created successfully!')
        router.push('/dashboard/products')
      }
    } catch (error) {
      toast.error('An error occurred')
      console.error(error)
    } finally {
      setSubmitting(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-gray-800 mb-2">Add New Product</h1>
          <p className="text-gray-600">Fill in the product details below</p>
        </div>

        <form onSubmit={handleSubmit} className="max-w-4xl">
          {/* Basic Information */}
          <div className="bg-white rounded-xl shadow-lg p-6 mb-6">
            <h2 className="text-2xl font-bold mb-6">Basic Information</h2>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Product Name (EN) */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Product Name (English) <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleInputChange}
                  required
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  placeholder="e.g., Cotton T-Shirt"
                />
              </div>

              {/* Product Name (AR) */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Product Name (Arabic)
                </label>
                <input
                  type="text"
                  name="name_ar"
                  value={formData.name_ar}
                  onChange={handleInputChange}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  placeholder="مثال: تيشيرت قطن"
                />
              </div>

              {/* Description (EN) */}
              <div className="md:col-span-2">
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Description (English)
                </label>
                <textarea
                  name="description"
                  value={formData.description}
                  onChange={handleInputChange}
                  rows={4}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  placeholder="Describe your product..."
                />
              </div>

              {/* Description (AR) */}
              <div className="md:col-span-2">
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Description (Arabic)
                </label>
                <textarea
                  name="description_ar"
                  value={formData.description_ar}
                  onChange={handleInputChange}
                  rows={4}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  placeholder="وصف المنتج..."
                />
              </div>
            </div>
          </div>

          {/* Pricing */}
          <div className="bg-white rounded-xl shadow-lg p-6 mb-6">
            <h2 className="text-2xl font-bold mb-6">Pricing</h2>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Price */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Price (EGP) <span className="text-red-500">*</span>
                </label>
                <input
                  type="number"
                  name="price"
                  value={formData.price}
                  onChange={handleInputChange}
                  required
                  min="0"
                  step="0.01"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  placeholder="299.99"
                />
              </div>

              {/* Compare at Price */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Compare at Price (EGP)
                </label>
                <input
                  type="number"
                  name="compare_at_price"
                  value={formData.compare_at_price}
                  onChange={handleInputChange}
                  min="0"
                  step="0.01"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  placeholder="399.99"
                />
                <p className="text-xs text-gray-500 mt-1">Original price before discount</p>
              </div>
            </div>
          </div>

          {/* Categories */}
          <div className="bg-white rounded-xl shadow-lg p-6 mb-6">
            <h2 className="text-2xl font-bold mb-6">Categories</h2>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Main Category */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Main Category <span className="text-red-500">*</span>
                </label>
                <select
                  name="category_id"
                  value={formData.category_id}
                  onChange={handleInputChange}
                  required
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent bg-white"
                >
                  <option value="">Select a category...</option>
                  {categories.map(category => (
                    <option key={category.id} value={category.id}>
                      {category.name_ar} ({category.name})
                    </option>
                  ))}
                </select>
              </div>

              {/* Merchant Category */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Merchant Category (Optional)
                </label>
                <select
                  name="merchant_category_id"
                  value={formData.merchant_category_id}
                  onChange={handleInputChange}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent bg-white"
                >
                  <option value="">Select a category...</option>
                  {merchantCategories.map(category => (
                    <option key={category.id} value={category.id}>
                      {category.name_ar || category.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          {/* Product Images */}
          <div className="bg-white rounded-xl shadow-lg p-6 mb-6">
            <h2 className="text-2xl font-bold mb-6">
              Product Images <span className="text-red-500">*</span>
            </h2>

            <div className="mb-4">
              <label className="block w-full cursor-pointer">
                <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center hover:border-purple-500 transition">
                  <div className="text-5xl mb-2">📸</div>
                  <div className="text-gray-600 mb-2">Click to upload images</div>
                  <div className="text-sm text-gray-500">Maximum 5 images (JPG, PNG)</div>
                </div>
                <input
                  type="file"
                  accept="image/*"
                  multiple
                  onChange={handleImageChange}
                  className="hidden"
                />
              </label>
            </div>

            {/* Image Previews */}
            {imagePreviews.length > 0 && (
              <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                {imagePreviews.map((preview, index) => (
                  <div key={index} className="relative">
                    <Image
                      src={preview}
                      alt={`Preview ${index + 1}`}
                      width={200}
                      height={200}
                      className="rounded-lg object-cover w-full h-32"
                    />
                    <button
                      type="button"
                      onClick={() => handleRemoveImage(index)}
                      className="absolute top-2 right-2 bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center hover:bg-red-600 transition"
                    >
                      ✕
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Sizes */}
          <div className="bg-white rounded-xl shadow-lg p-6 mb-6">
            <h2 className="text-2xl font-bold mb-6">Sizes</h2>

            <div className="flex flex-wrap gap-3">
              {AVAILABLE_SIZES.map(size => (
                <button
                  key={size}
                  type="button"
                  onClick={() => handleSizeToggle(size)}
                  className={`px-6 py-2 rounded-lg font-semibold transition ${
                    selectedSizes.includes(size)
                      ? 'bg-purple-600 text-white'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  {size}
                </button>
              ))}
            </div>
          </div>

          {/* Colors */}
          <div className="bg-white rounded-xl shadow-lg p-6 mb-6">
            <h2 className="text-2xl font-bold mb-6">Colors</h2>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
              <div className="md:col-span-2">
                <input
                  type="text"
                  value={colorInput.name}
                  onChange={(e) => setColorInput({ ...colorInput, name: e.target.value })}
                  placeholder="Color name (e.g., Red)"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                />
              </div>
              <div className="flex gap-2">
                <input
                  type="color"
                  value={colorInput.hex}
                  onChange={(e) => setColorInput({ ...colorInput, hex: e.target.value })}
                  className="w-20 h-10 rounded cursor-pointer"
                />
                <button
                  type="button"
                  onClick={handleAddColor}
                  className="flex-1 bg-purple-600 text-white px-4 py-2 rounded-lg font-semibold hover:bg-purple-700 transition"
                >
                  Add Color
                </button>
              </div>
            </div>

            {/* Added Colors */}
            {colors.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {colors.map((color, index) => (
                  <div
                    key={index}
                    className="flex items-center gap-2 bg-gray-100 rounded-lg px-3 py-2"
                  >
                    <div
                      className="w-6 h-6 rounded border border-gray-300"
                      style={{ backgroundColor: color.hex }}
                    />
                    <span className="text-sm font-semibold">{color.name}</span>
                    <button
                      type="button"
                      onClick={() => handleRemoveColor(color.name)}
                      className="text-red-500 hover:text-red-700 ml-2"
                    >
                      ✕
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Inventory */}
          <div className="bg-white rounded-xl shadow-lg p-6 mb-6">
            <h2 className="text-2xl font-bold mb-6">Inventory</h2>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* SKU */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  SKU (Stock Keeping Unit)
                </label>
                <input
                  type="text"
                  name="sku"
                  value={formData.sku}
                  onChange={handleInputChange}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  placeholder="e.g., TSH-BLK-001"
                />
              </div>

              {/* Inventory Quantity */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Inventory Quantity <span className="text-red-500">*</span>
                </label>
                <input
                  type="number"
                  name="inventory_quantity"
                  value={formData.inventory_quantity}
                  onChange={handleInputChange}
                  required
                  min="0"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  placeholder="100"
                />
              </div>
            </div>
          </div>

          {/* Submit Buttons */}
          <div className="flex gap-4">
            <button
              type="submit"
              disabled={submitting}
              className="flex-1 bg-gradient-to-r from-purple-600 to-indigo-600 text-white px-8 py-4 rounded-lg font-semibold hover:shadow-xl transition disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {submitting ? (
                <span className="flex items-center justify-center gap-2">
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                  Creating Product...
                </span>
              ) : (
                'Create Product'
              )}
            </button>
            <button
              type="button"
              onClick={() => router.push('/dashboard/products')}
              disabled={submitting}
              className="px-8 py-4 border-2 border-gray-300 rounded-lg font-semibold hover:bg-gray-50 transition disabled:opacity-50"
            >
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
