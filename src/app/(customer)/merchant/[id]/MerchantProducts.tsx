'use client'

import { useState } from 'react'
import Image from 'next/image'
import Link from 'next/link'

interface Product {
  id: string
  name: string
  name_ar: string | null
  price: number
  compare_at_price: number | null
  merchant_category_id: string | null
  images: any
  inventory_quantity: number
}

interface Category {
  id: string
  name: string
  name_ar: string
}

interface MerchantProductsProps {
  products: Product[]
  merchantCategories: Category[]
}

export default function MerchantProducts({ products, merchantCategories }: MerchantProductsProps) {
  const [selectedCategory, setSelectedCategory] = useState<string>('all')

  // Filter products by selected category
  const filteredProducts = selectedCategory === 'all'
    ? products
    : products.filter(p => p.merchant_category_id === selectedCategory)

  const getProductImage = (product: Product) => {
    if (product.images && Array.isArray(product.images) && product.images.length > 0) {
      return product.images[0]
    }
    return null
  }

  return (
    <div>
      {/* Section Header */}
      <div className="mb-8">
        <h2 className="text-4xl font-bold text-gray-800 mb-2 flex items-center gap-3">
          <span className="text-5xl">🛍️</span>
          Our Products
        </h2>
        <p className="text-gray-600 text-lg">Browse our collection</p>
      </div>

      {/* Category Tabs */}
      {merchantCategories.length > 0 && (
        <div className="mb-8">
          <div className="flex gap-3 flex-wrap">
            {/* All Products Tab */}
            <button
              onClick={() => setSelectedCategory('all')}
              className={`px-6 py-3 rounded-lg font-semibold transition transform hover:scale-105 ${
                selectedCategory === 'all'
                  ? 'bg-purple-600 text-white shadow-lg'
                  : 'bg-white text-gray-700 border-2 border-gray-200 hover:border-purple-300'
              }`}
            >
              All Products ({products.length})
            </button>

            {/* Category Tabs */}
            {merchantCategories.map((category) => {
              const categoryProductCount = products.filter(
                p => p.merchant_category_id === category.id
              ).length

              return (
                <button
                  key={category.id}
                  onClick={() => setSelectedCategory(category.id)}
                  className={`px-6 py-3 rounded-lg font-semibold transition transform hover:scale-105 ${
                    selectedCategory === category.id
                      ? 'bg-purple-600 text-white shadow-lg'
                      : 'bg-white text-gray-700 border-2 border-gray-200 hover:border-purple-300'
                  }`}
                >
                  {category.name_ar} ({categoryProductCount})
                </button>
              )
            })}
          </div>
        </div>
      )}

      {/* Products Grid */}
      {filteredProducts.length === 0 ? (
        <div className="bg-white rounded-xl shadow-lg p-12 text-center">
          <div className="text-6xl mb-4">📦</div>
          <h3 className="text-2xl font-bold text-gray-800 mb-2">No Products Found</h3>
          <p className="text-gray-600">
            {selectedCategory === 'all'
              ? 'This merchant has no products available at the moment.'
              : 'No products in this category.'}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {filteredProducts.map((product) => {
            const productImage = getProductImage(product)

            return (
              <Link
                key={product.id}
                href={`/product/${product.id}`}
                className="bg-white rounded-xl shadow-lg overflow-hidden hover:shadow-2xl transition transform hover:scale-105 group"
              >
                {/* Product Image */}
                <div className="relative h-56 bg-gradient-to-br from-purple-100 to-blue-100">
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
                        <div className="text-6xl mb-2">📦</div>
                        <div className="text-sm">No Image</div>
                      </div>
                    </div>
                  )}

                  {/* Out of Stock Badge */}
                  {product.inventory_quantity === 0 && (
                    <div className="absolute top-3 right-3">
                      <div className="bg-red-500 text-white px-3 py-1 rounded-full text-xs font-bold shadow-lg">
                        OUT OF STOCK
                      </div>
                    </div>
                  )}

                  {/* Sale Badge */}
                  {product.compare_at_price && product.compare_at_price > product.price && (
                    <div className="absolute top-3 left-3">
                      <div className="bg-green-500 text-white px-3 py-1 rounded-full text-xs font-bold shadow-lg">
                        SALE
                      </div>
                    </div>
                  )}
                </div>

                {/* Product Info */}
                <div className="p-5">
                  {/* Product Name */}
                  <h3 className="font-bold text-lg text-gray-800 group-hover:text-purple-600 transition mb-2 line-clamp-2">
                    {product.name}
                  </h3>

                  {product.name_ar && (
                    <p className="text-sm text-gray-600 mb-3 line-clamp-1" dir="rtl">
                      {product.name_ar}
                    </p>
                  )}

                  {/* Price */}
                  <div className="flex items-center gap-2 mb-3">
                    <span className="text-2xl font-bold text-gray-800">
                      {product.price.toFixed(2)} EGP
                    </span>
                    {product.compare_at_price && product.compare_at_price > product.price && (
                      <span className="text-sm text-gray-400 line-through">
                        {product.compare_at_price.toFixed(2)}
                      </span>
                    )}
                  </div>

                  {/* Stock Status */}
                  <div className="flex items-center justify-between text-sm pt-3 border-t border-gray-100">
                    {product.inventory_quantity > 0 ? (
                      <span className="text-green-600 font-semibold">
                        ✓ In Stock ({product.inventory_quantity})
                      </span>
                    ) : (
                      <span className="text-red-600 font-semibold">
                        ⨯ Out of Stock
                      </span>
                    )}
                    <span className="text-purple-600 font-semibold group-hover:underline">
                      View →
                    </span>
                  </div>
                </div>
              </Link>
            )
          })}
        </div>
      )}
    </div>
  )
}
