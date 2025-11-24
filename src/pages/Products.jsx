import React, { useState, useEffect } from 'react';
import { Search, Plus, MoreHorizontal, Filter, Package } from 'lucide-react';
import { database } from '../firebase';
import { ref, onValue } from "firebase/database";

const Products = () => {
    const [products, setProducts] = useState([]);
    const [filter, setFilter] = useState('All');
    const [categories, setCategories] = useState(['All']);

    useEffect(() => {
        const productsRef = ref(database, 'cakes');
        const unsubscribe = onValue(productsRef, (snapshot) => {
            const data = snapshot.val();
            if (data) {
                const productsList = Object.keys(data).map(key => ({
                    id: key,
                    ...data[key]
                }));
                setProducts(productsList);

                // Extract unique categories
                const uniqueCategories = ['All', ...new Set(productsList.map(p => p.type).filter(Boolean))];
                setCategories(uniqueCategories);
            } else {
                setProducts([]);
                setCategories(['All']);
            }
        });

        return () => unsubscribe();
    }, []);

    const filteredProducts = filter === 'All'
        ? products
        : products.filter(product => product.type === filter);

    // Group products by type for the grid view
    const productsByType = filter === 'All' 
        ? categories.filter(c => c !== 'All').reduce((acc, category) => {
            acc[category] = products.filter(p => p.type === category);
            return acc;
        }, {})
        : { [filter]: filteredProducts };

    const getPlaceholderImage = (type) => {
        const lowerType = (type || '').toLowerCase();
        if (lowerType.includes('canele') || lowerType.includes('canelé')) return '/assets/icons/canele.png';
        if (lowerType.includes('shiopan') || lowerType.includes('salt bread') || lowerType.includes('muối')) return '/assets/icons/shiopan.png';
        if (lowerType.includes('roll') || lowerType.includes('quế')) return '/assets/icons/cinnamon_roll.png';
        if (lowerType.includes('cheeseburn') || lowerType.includes('basque') || lowerType.includes('burnt')) return '/assets/icons/cheese_burn_cake.png';
        if (lowerType.includes('cake') || lowerType.includes('bánh kem') || lowerType.includes('sinh nhật')) return '/assets/icons/cake.png';
        if (lowerType.includes('brownie') || lowerType.includes('socola')) return '/assets/icons/brownie.png';
        if (lowerType.includes('banana') || lowerType.includes('chuối')) return '/assets/icons/banana.png';
        if (lowerType.includes('pastry') || lowerType.includes('croissant') || lowerType.includes('ngàn lớp')) return '/assets/icons/pastry.png';
        if (lowerType.includes('bread') || lowerType.includes('mì') || lowerType.includes('loaf') || lowerType.includes('pão') || lowerType.includes('cheese bread')) return '/assets/icons/bread.png';
        if (lowerType.includes('cookie') || lowerType.includes('quy')) return '/assets/icons/cookie.png';
        if (lowerType.includes('cupcake') || lowerType.includes('muffin')) return '/assets/icons/cupcake.png';
        return '/assets/icons/default.png';
    };

    return (
        <div>
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">Products</h1>
                    <p className="text-gray-500 mt-1">Manage your bakery inventory</p>
                </div>
                <button className="flex items-center gap-2 bg-primary hover:bg-primary-light text-white px-4 py-2 rounded-lg font-medium transition-colors">
                    <Plus size={20} />
                    Add Product
                </button>
            </div>

            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden mb-6">
                <div className="p-4 border-b border-gray-100 flex flex-col sm:flex-row gap-4 justify-between items-center">
                    <div className="relative flex-1 max-w-md w-full">
                        <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                        <input
                            type="text"
                            placeholder="Search products..."
                            className="w-full pl-10 pr-4 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
                        />
                    </div>
                    <div className="flex gap-2 overflow-x-auto pb-2 sm:pb-0 w-full sm:w-auto no-scrollbar" style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}>
                        <style>{`
                            .no-scrollbar::-webkit-scrollbar {
                                display: none;
                            }
                        `}</style>
                        {categories.map(category => (
                            <button
                                key={category}
                                onClick={() => setFilter(category)}
                                className={`px-3 py-1.5 text-sm font-medium rounded-lg transition-colors whitespace-nowrap ${filter === category
                                        ? 'bg-primary text-white'
                                        : 'bg-gray-50 text-gray-600 hover:bg-gray-100'
                                    }`}
                            >
                                {category}
                            </button>
                        ))}
                    </div>
                </div>
            </div>

            <div className="space-y-8">
                {Object.entries(productsByType).map(([category, categoryProducts]) => (
                    categoryProducts.length > 0 && (
                        <div key={category}>
                            <h2 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
                                <span className="w-2 h-6 bg-primary rounded-full"></span>
                                {category}
                                <span className="text-sm font-normal text-gray-500 ml-2">({categoryProducts.length})</span>
                            </h2>
                            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6 gap-4">
                                {categoryProducts.map((product) => (
                                    <div key={product.id} className="bg-white rounded-lg border border-gray-100 shadow-sm hover:shadow-md transition-all group">
                                        <div className="aspect-square w-full overflow-hidden rounded-t-lg bg-gray-50 relative">
                                            <img 
                                                src={product.image || getPlaceholderImage(product.type)} 
                                                alt={product.name} 
                                                className={`w-full h-full object-cover transition-transform duration-300 ${product.image ? 'group-hover:scale-105' : 'p-4 object-contain'}`}
                                            />
                                            <div className="absolute top-1 right-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                                <button className="p-1.5 bg-white/90 backdrop-blur-sm rounded-full shadow-sm hover:bg-white text-gray-600 hover:text-primary transition-colors">
                                                    <MoreHorizontal size={14} />
                                                </button>
                                            </div>
                                        </div>
                                        <div className="p-3">
                                            <div className="mb-1">
                                                <h3 className="font-bold text-gray-900 text-sm line-clamp-1" title={product.name}>{product.name}</h3>
                                            </div>
                                            <div className="flex items-center justify-between mt-2">
                                                <span className="text-sm font-bold text-primary">
                                                    {new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(product.price)}
                                                </span>
                                                <div className="flex items-center gap-1 text-xs text-gray-500">
                                                    <Package size={12} />
                                                    <span>{product.stock || 0}</span>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )
                ))}
                
                {Object.keys(productsByType).length === 0 && (
                    <div className="text-center py-12 bg-white rounded-2xl border border-gray-100 border-dashed">
                        <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-4">
                            <Package size={24} className="text-gray-400" />
                        </div>
                        <h3 className="text-lg font-medium text-gray-900">No products found</h3>
                        <p className="text-gray-500 mt-1">Try adjusting your search or filters</p>
                    </div>
                )}
            </div>
        </div>
    );
};

export default Products;
